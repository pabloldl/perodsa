# Perod S. A. — Tierra & Origen

## Datos del encargo

Nombre Perod S. A. Actividad indicada de vaquería según el registro facilitado por el usuario. Referencia geográfica Parque Natural Sierra de Grazalema, Cádiz. Dirección exacta y teléfono pendientes de confirmación. La dirección parcial recibida es incompleta y no se utiliza como localización precisa. No se han añadido otros canales de contacto, productos, servicios comerciales, procesos de producción, instalaciones ni datos de trayectoria.

Esta versión sustituye la anterior propuesta institucional neutra a partir de la nueva clasificación expresamente facilitada. Las antiguas referencias documentales a una sociedad homónima no se convierten en datos comerciales ni de ubicación de la vaquería. Permanecen en el historial del repositorio.

## Diseño

HTML5, CSS3, JavaScript vanilla y SVG. Sin compilador ni dependencias de ejecución. Paleta verde bosque #263F32, crema natural #F4F0E6, marrón tierra #82654C, verde pradera #8B9C78 y carbón #242724. Newsreader normal e italic para titulares y Manrope para textos, alojadas localmente con sus licencias OFL.

Portada panorámica de ganado, identidad, territorio, actividad ganadera y ubicación de referencia. Composición fotográfica asimétrica y trazado topográfico abstracto creado para el proyecto. El trazado es decorativo. Revelados y entrada de fotografías de una sola ejecución, con soporte para prefers-reduced-motion. Contenido visible con JavaScript desactivado.

## Recursos visuales y procedencia

ganado-pradera y retrato-bovino son imágenes ilustrativas de estilo documental generadas con la herramienta integrada de imágenes para este proyecto. Se identifican como generadas con IA en la página. Los prompts completos están en qa/image-generation-prompts.json. No se presentan como fotografías de animales, instalaciones ni terrenos de Perod. Originales conservados en assets/images/originals y versiones WebP optimizadas en assets/images. Los originales quedan excluidos del repositorio mediante .gitignore.

Fotografía real del paisaje de Grazalema, VistaDesdeBoyar.jpg, vista del Salto del Cabrero desde el Puerto del Boyar, por El Pantera, 30 de diciembre de 2007. Fuente https://commons.wikimedia.org/wiki/File:VistaDesdeBoyar.jpg. Original https://upload.wikimedia.org/wikipedia/commons/4/42/VistaDesdeBoyar.jpg. Licencia elegida CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/. Versiones sierra-grazalema-960.webp y sierra-grazalema-1536.webp convertidas, redimensionadas y comprimidas. Encuadre de visualización adaptado con object-fit. Estas adaptaciones conservan CC BY-SA 4.0. El pie de foto enlaza al autor, fuente y licencia e indica los cambios. Se utiliza como referencia del entorno.

Favicon y topografía SVG originales. El tratamiento tipográfico del nombre forma parte de este diseño y no procede de un logotipo oficial facilitado.

## Comprobaciones

Sintaxis JavaScript, referencias locales, un H1 y una sola etiqueta noindex, nofollow dentro de head. Enlaces internos, enlaces de atribución y formatos de los recursos revisados. Sin enlaces telefónicos, formularios ni ubicación exacta inventada.

Chrome para Windows a 375, 390, 768, 1440 y 1920 px. Comprobados desbordamiento, fuentes, carga de imágenes, navegación, foco de teclado, movimiento reducido y lectura sin JavaScript. Revisión visual de capturas de móvil, tablet y escritorio. Informes y capturas en qa. Safari e iPhone físico pendientes de comprobación.

Se verificó el estado Git limpio inicial, origin https://github.com/pabloldl/perodsa.git, rama main y sincronización con origin/main. Se comprobaron las huellas de archivos de los otros 13 proyectos antes y después del rediseño. La actualización del repositorio está autorizada en este encargo. El resultado concreto de commit y push se entrega en el informe final.

## Uso local

Abrir index.html mediante Live Server. Alternativamente, desde Landing webs, ejecutar node perod-sa/qa/preview-server.mjs y abrir http://127.0.0.1:8799/index.html. Ejecutar las comprobaciones con node perod-sa/qa/browser-check.mjs. La vista previa local se detiene al terminar.
