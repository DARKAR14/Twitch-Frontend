# Risitas: editor de cumpleaños

## Alcance y modo de uso

Esta superficie trabaja en modo **Operate**: permite revisar el funcionamiento de Risitas y configurar sus felicitaciones de Discord. Conserva el mundo visual de DarkOps descrito en `PRODUCT.md` y `DESIGN.md`, «The Black Optical Command Deck». Este documento registra comportamiento y decisiones locales; no redefine el sistema global.

`Risitas · Discord` aparece en la navegación de moderadores y administradores. La visibilidad facilita descubrir la herramienta, pero el permiso `risitas` sigue siendo obligatorio tanto para montar el panel como para acceder a sus endpoints. Sin permiso, la página explica que el administrador puede habilitarlo en **Panel permisos → Risitas Bot**. El permiso `birthdays`, correspondiente a la lista de cumpleaños, es independiente.

## Las dos vistas

- **Comandos y estado** es la vista inicial. Presenta conexión, latencia, servidores, comandos, búsqueda, activación individual, sincronización e identidad del bot, además de un resumen del embed guardado. Actualiza datos cada 30 segundos mientras el documento está visible. Si pierde conexión, identifica los datos anteriores como no verificados y bloquea activación y sincronización.
- **Cumpleaños · Editor de embed** carga la configuración al abrirse por primera vez. Organiza entrega, contenido y campos adicionales junto a una vista previa. Cambiar entre las dos vistas conserva los componentes montados: el borrador del editor permanece disponible al regresar.

## Configuración y persistencia

El editor consulta `GET /bots/risitas/birthday` para obtener ajustes, revisión, canales, roles y ejemplo inicial. El guardado usa `PUT /bots/risitas/birthday` con `{ settings, revision }`; el backend autentica y comprueba permisos antes de consultar la API de Risitas. La configuración persiste en MongoDB, en `botdb.settings`, documento `birthday`, y el bot la lee para sus próximos envíos.

Los controles incluyen activación automática, canal, rol opcional, hora, zona horaria y permisos de mención. Los canales proceden de Discord y requieren que el bot pueda verlos, enviar mensajes y publicar embeds. Los roles se filtran por el servidor del canal; cambiar de canal borra la selección del rol. Un canal o rol guardado que ya no figure en las opciones se identifica mediante su ID. El servidor vuelve a validar canal y rol al guardar.

La hora representa una franja horaria: el bot revisa una vez por hora. El rol se menciona; no se asigna al cumpleañero. Las opciones de notificación controlan las menciones permitidas.

El contenido editable comprende mensaje externo, título, descripción, color, autor, imagen principal, miniatura, pie y hasta 25 campos adicionales. Cada campo permite nombre, contenido y disposición en la misma fila. Los controles limitan longitudes y el servidor valida la configuración. Se documentan las variables `{user_mention}`, `{role_id}` y `{avatar_url}` junto a los textos.

## Vista previa y fidelidad

Tras 400 ms sin cambios, el borrador se envía a `POST /bots/risitas/birthday/preview`. Las respuestas obsoletas se descartan. La API construye el contenido con `birthday_announcement_payload`, el mismo renderizador que prepara el mensaje del envío real. Previsualizar y guardar no envían mensajes a Discord.

La identidad **@Usuario** y el avatar de ejemplo son sintéticos y están identificados como ejemplo. El frontend representa el payload con una aproximación visual de Discord, incluyendo negrita, cursiva, código, enlaces HTTPS, menciones legibles, imágenes y campos. No reproduce todo el motor Markdown de Discord. Discord puede distribuir el texto, imágenes y campos de manera distinta según la pantalla; la equivalencia corresponde al contenido y sustitución de variables del servidor, no a píxeles idénticos.

## Estados y protección del trabajo

- **Carga:** se anuncia la consulta inicial; si falla sin disponer de ajustes, se muestra una explicación y **Volver a cargar**. Durante una recarga con borrador existente, el formulario queda deshabilitado.
- **Edición:** el encabezado comunica **Cambios sin guardar** o **Configuración guardada**. El pie explica cuándo se aplicarán los cambios o muestra la revisión persistida.
- **Guardado:** solo se habilita cuando hay cambios. Mientras espera respuesta, muestra **Guardando…** y bloquea campos, guardado y recarga. El éxito actualiza ajustes, revisión y ejemplo desde la respuesta, y confirma su uso en próximos cumpleaños.
- **Conflicto:** una revisión desactualizada recibe HTTP 409 y el mensaje que indica que otra persona modificó la configuración. El borrador permanece; el operador debe recargar y volver a aplicar los cambios pertinentes. No hay sobrescritura automática ni mezcla de versiones.
- **Errores:** los mensajes del servidor se muestran como alertas. Un 404 explica que falta desplegar la versión de Risitas con el editor. Si falla la previsualización, conserva el último ejemplo válido y lo advierte junto a **Revisa los campos**.
- **Salida con cambios:** `beforeunload` activa la advertencia del navegador; la navegación del shell mediante `darkops:before-navigate` solicita confirmación antes de descartar. **Recargar configuración** también confirma si el borrador está modificado. Cambiar entre las dos vistas de Risitas conserva el borrador y no lo descarta. Esta protección no equivale a persistencia local ni garantiza recuperación tras cerrar el navegador.

## Diseño y adaptación

El editor hereda Manrope, texto blanco y plata, bordes discretos, acciones plateadas y campos negros de 10 px de radio. Las secciones se separan mediante espacio y líneas finas. El color de Discord, su insignia APP y el color elegido para el embed se limitan al ejemplo del mensaje; no cambian la identidad de DarkOps.

En escritorio, formulario y vista previa ocupan columnas `1.15fr / .85fr` con 36 px de separación. La vista previa permanece a 24 px del borde superior durante el desplazamiento y el pie de guardado queda fijo dentro del flujo mediante `position: sticky`, a 12 px del borde inferior.

A 1000 px o menos, las columnas se apilan, la vista previa deja de ser sticky y encabezado y pie se organizan verticalmente. A 560 px, las parejas de campos pasan a una columna, los botones se acomodan con altura mínima de 44 px, el ejemplo reduce su padding y los campos inline del embed se apilan.

Los controles conservan etiquetas nativas, estados deshabilitados y foco visible de 2 px con separación de 3 px. La navegación identifica la vista activa con `aria-current`; cargas, confirmaciones y actualizaciones usan `role="status"`, y los errores usan `role="alert"`.

## Fuentes de implementación

- `src/pages/RisitasPanel.jsx`: vistas, conservación del estado y operación de comandos.
- `src/pages/RisitasBirthdays.jsx`: edición, API, vista previa y protecciones del borrador.
- `src/pages/Dashboard.jsx`: descubrimiento, navegación y acceso por permiso.
- `src/styles/dashboard.css`: estilos locales de Risitas y cumpleaños.
- Backend: `src/routes/bots.js`; Risitas: `utils/api_server.py`, `utils/birthday_settings.py`, `utils/embed_templates.py` y `commands/public/birthday.py`.
