# Instrucciones del proyecto

## Preferencias del usuario

- **Entrega de vídeos (regla permanente):** cada vez que se renderice un vídeo
  (local o vía GitHub Actions), copiar el archivo final a
  `C:\Users\Admin\Desktop\` automáticamente. No hace falta que lo pida cada vez.

## Contexto

- Proyecto HyperFrames en este directorio: `index.html` es la composición.
- Repositorio remoto: https://github.com/lenz010101/mi-video (público).
- El render se ejecuta en la nube con GitHub Actions
  (`.github/workflows/render.yml`), que publica el MP4 como artifact.
- La salida local de trabajo vive en `renders/`.
