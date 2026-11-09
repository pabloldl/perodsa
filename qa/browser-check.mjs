import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import net from 'node:net';
import {randomBytes} from 'node:crypto';
import {EventEmitter} from 'node:events';

async function connectCDP(url){
  const u=new URL(url),events=new EventEmitter();
  const connection=net.connect(Number(u.port),u.hostname);
  let buffer=Buffer.alloc(0),upgraded=false;
  const ready=new Promise((resolve,reject)=>{
    connection.once('error',reject);
    connection.once('connect',()=>connection.write('GET '+u.pathname+' HTTP/1.1\r\nHost: '+u.host+'\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: '+randomBytes(16).toString('base64')+'\r\nSec-WebSocket-Version: 13\r\n\r\n'));
    connection.on('data',chunk=>{
      buffer=Buffer.concat([buffer,chunk]);
      if(!upgraded){const end=buffer.indexOf('\r\n\r\n');if(end<0)return;const header=buffer.subarray(0,end).toString();if(!header.startsWith('HTTP/1.1 101')){reject(new Error(header));return;}buffer=buffer.subarray(end+4);upgraded=true;resolve();}
      while(buffer.length>=2){
        const opcode=buffer[0]&15;let length=buffer[1]&127,offset=2;
        if(length===126){if(buffer.length<4)return;length=buffer.readUInt16BE(2);offset=4;}
        else if(length===127){if(buffer.length<10)return;length=Number(buffer.readBigUInt64BE(2));offset=10;}
        if(buffer.length<offset+length)return;
        const payload=buffer.subarray(offset,offset+length);buffer=buffer.subarray(offset+length);
        if(opcode===1)events.emit('message',{data:payload.toString()});
      }
    });
  });
  await ready;
  return {readyState:1,addEventListener:(name,callback)=>events.on(name,callback),send:text=>{
    const payload=Buffer.from(text),mask=randomBytes(4);let header;
    if(payload.length<126){header=Buffer.from([129,128|payload.length]);}
    else if(payload.length<65536){header=Buffer.alloc(4);header[0]=129;header[1]=254;header.writeUInt16BE(payload.length,2);}
    else {header=Buffer.alloc(10);header[0]=129;header[1]=255;header.writeBigUInt64BE(BigInt(payload.length),2);}
    const masked=Buffer.from(payload);for(let i=0;i<masked.length;i++)masked[i]^=mask[i%4];
    connection.write(Buffer.concat([header,mask,masked]));
  },close:()=>connection.destroy()};
}

const root=process.cwd(),slug='perod-sa',out=path.join(root,slug,'qa');
const browser=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-sandbox','--disable-gpu','--disable-software-rasterizer','--disable-background-networking','--disable-component-update','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--remote-allow-origins=*','--user-data-dir='+path.join(out,'.browser-profile'),'about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
const endpointPromise=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Browser endpoint timeout')),20000);browser.stderr.on('data',chunk=>{const m=String(chunk).match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m){clearTimeout(timer);resolve(m[1]);}});browser.once('error',reject);});
let socket,seq=0;const pending=new Map();let errors=[];
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method));},20000);pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v);},reject:e=>{clearTimeout(timer);reject(e);}});socket.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function key(value,code,number,modifiers=0){await send('Input.dispatchKeyEvent',{type:'keyDown',key:value,code,windowsVirtualKeyCode:number,modifiers});await send('Input.dispatchKeyEvent',{type:'keyUp',key:value,code,windowsVirtualKeyCode:number,modifiers});}
const url=pathToFileURL(path.join(root,slug,'index.html')).href;
async function load(){await send('Page.navigate',{url});await evaluate('new Promise(resolve=>{if(document.readyState==="complete")resolve();else addEventListener("load",resolve,{once:true});})');await evaluate('document.fonts.ready.then(()=>true)');}
async function pause(ms){await evaluate('new Promise(r=>setTimeout(r,'+ms+'))');}
async function snapshot(name,width,height){const s=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height,scale:1}});fs.writeFileSync(path.join(out,name),Buffer.from(s.data,'base64'));}
try{
 const endpoint=await endpointPromise,port=new URL(endpoint).port;
 const pages=await fetch('http://127.0.0.1:'+port+'/json/list').then(r=>r.json());
 socket=await connectCDP(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 socket.addEventListener('message',event=>{const d=JSON.parse(event.data);if(d.id){const p=pending.get(d.id);pending.delete(d.id);if(p){if(d.error)p.reject(Error(JSON.stringify(d.error)));else p.resolve(d.result);}}if(d.method==='Runtime.exceptionThrown')errors.push(d.params.exceptionDetails.text);});
 await send('Page.enable');await send('Runtime.enable');await send('Page.bringToFront');
 const report=[];
 for(const width of [375,390,768,1440,1920]){
  errors=[];await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<500});await load();
  await evaluate('(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=650){scrollTo({top:y,behavior:"instant"});await new Promise(r=>setTimeout(r,140));}await new Promise(r=>setTimeout(r,900));scrollTo({top:0,behavior:"instant"});})()');await pause(400);
  const stats=await evaluate('({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,h1:document.querySelectorAll("h1").length,robots:[...document.querySelectorAll("head meta[name=robots]")].map(e=>e.content),images:[...document.images].filter(i=>i.getAttribute("src")).map(i=>({src:i.getAttribute("src"),loaded:i.complete&&i.naturalWidth>0})),font:document.fonts.check("600 20px Manrope"),revealHidden:[...document.querySelectorAll(".reveal")].filter(e=>getComputedStyle(e).opacity!=="1").length,overflow:[...document.querySelectorAll("body *")].filter(e=>{if(e.closest("dialog"))return false;const r=e.getBoundingClientRect();return r.right>innerWidth+1||r.left<-1;}).map(e=>e.tagName+"."+e.className).slice(0,20)})');
  await snapshot('preview-'+width+'.png',width,stats.height);
  await snapshot('hero-'+width+'.png',width,Math.min(1000,stats.height));

  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  const interactions=[];
  await evaluate('document.querySelector(".skip").focus()');
  await key('Tab','Tab',9);
  interactions.push({case:'keyboard-tab',ok:await evaluate('document.activeElement.classList.contains("brand")')});
  for(const id of ['identidad','territorio']){
    await evaluate('document.querySelector("nav a[href=\\"#'+id+'\\"]").click()');await pause(150);
    interactions.push({case:'navigation-'+id,ok:await evaluate('location.hash==="#'+id+'"&&document.activeElement.id==="'+id+'"&&Math.abs(document.getElementById("'+id+'").getBoundingClientRect().top-24)<3')});
  }
  const anchors=await evaluate('[...document.links].filter(a=>a.getAttribute("href").startsWith("#")).map(a=>({href:a.hash,ok:!!document.getElementById(a.hash.slice(1))}))');
  const links=await evaluate('[...document.links].map(a=>({href:a.getAttribute("href"),external:a.protocol==="https:",target:a.target,rel:a.rel}))');
  const targets=await evaluate('[...document.querySelectorAll(".button,.phone,.back-top,.discover,nav a")].map(a=>({text:a.textContent.trim(),height:a.getBoundingClientRect().height}))');
  await evaluate('document.querySelector("nav a[href=\\"#ubicacion\\"]").click()');await pause(1200);
  interactions.push({case:'contact-navigation',ok:await evaluate('location.hash==="#ubicacion"&&document.getElementById("ubicacion").getBoundingClientRect().top>=0&&document.getElementById("ubicacion").getBoundingClientRect().top<innerHeight'),top:await evaluate('document.getElementById("ubicacion").getBoundingClientRect().top')});
  await send('Emulation.setEmulatedMedia',{features:[]});
  const row={viewport:width,...stats,interactions,anchors,links,targets,errors:[...errors]};report.push(row);
  console.log(width+': '+(stats.width===width&&stats.scrollWidth<=width&&stats.font&&!stats.revealHidden&&stats.images.every(i=>i.loaded)&&interactions.every(i=>i.ok)&&!errors.length?'PASS':'REVIEW')+' scrollWidth='+stats.scrollWidth);
 }
 await send('Emulation.setDeviceMetricsOverride',{width:375,height:1000,deviceScaleFactor:1,mobile:true});await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await load();await pause(100);
 const reducedMotion=await evaluate('({scroll:getComputedStyle(document.documentElement).scrollBehavior,animations:document.getAnimations().filter(a=>a.playState==="running").length,revealVisible:[...document.querySelectorAll(".reveal")].every(e=>getComputedStyle(e).opacity==="1")})');
 await send('Emulation.setEmulatedMedia',{features:[]});await send('Emulation.setScriptExecutionDisabled',{value:true});await send('Page.navigate',{url});await new Promise(r=>setTimeout(r,500));
 await send('Emulation.setScriptExecutionDisabled',{value:false});
 const noJs=await evaluate('({h1:document.querySelectorAll("h1").length,revealVisible:[...document.querySelectorAll(".reveal")].every(e=>getComputedStyle(e).opacity==="1"),anchors:[...document.querySelectorAll("nav a")].every(a=>!!document.getElementById(a.hash.slice(1)))})');
 fs.writeFileSync(path.join(out,'browser-report.json'),JSON.stringify({report,reducedMotion,noJs},null,2));
 fs.writeFileSync(path.join(out,'all-browser-reports.json'),JSON.stringify({report,reducedMotion,noJs},null,2));
 console.log('Reduced motion: '+JSON.stringify(reducedMotion));console.log('JS-disabled readability: '+JSON.stringify(noJs));
}finally{if(socket?.readyState===1)socket.close();browser.kill();}




