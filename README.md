# DarkOps — Twitch Frontend

Panel React/Vite para operar Twitch, TTS Bot y Risitas Bot desde una sola sesión autenticada.

## Desarrollo

```bash
npm install
npm run dev
```

Variables del navegador:

```env
VITE_API_URL=http://localhost:3000
VITE_CHANNEL_NAME=darkar1419
```

`VITE_API_URL` siempre apunta al backend de Twitch. No configures aquí `PANEL_API_TOKEN`, `ADMIN_TOKEN` ni la API key de Risitas: toda conexión con los bots se realiza servidor-a-servidor desde `twitch-backend`.

## Paneles de bots

- **TTS Bot:** estado del servicio y de OBS, compositor autenticado, selección dinámica de voz, preguntas a IA, cola y controles administrativos.
- **Risitas Bot:** estado de Discord, latencia, servidores, comandos activables, sincronización y vista previa del embed de cumpleaños.
- Los paneles hacen polling moderado mientras la pestaña está visible y muestran estados de carga, caída, reintento y confirmación.
- Los moderadores solo ven cada apartado cuando el admin habilita los permisos `tts` o `risitas`.

## Verificación

```bash
npm run lint
npm run build
```
