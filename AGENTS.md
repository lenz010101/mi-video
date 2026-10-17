# Instrucciones del proyecto

## Preferencias del usuario

- **Entrega de vídeos (regla permanente):** cada vez que se renderice un vídeo
  (local o vía GitHub Actions), copiar el archivo final a
  `C:\Users\Admin\Desktop\` automáticamente. No hace falta que lo pida cada vez.
- **No hacer esperar:** un vídeo corto no puede costar una hora. Si algo va a
  tardar más de ~3 minutos, avisar de cuánto y por qué **antes** de lanzarlo.

## Flujo de vídeo (obligatorio)

**Todo el render va por la nube.** En local solo se mide, nunca se renderiza
para entregar:

1. **Render (final o de revisión): la nube.** GitHub Actions tarda 3,5-4,6 min
   (varía ~50% según la máquina que toque). El render local completo tarda
   ~11,5 min (1 worker y sin GPU) y no aporta nada: no se usa.
2. **Para revisar, mirar el vídeo ya entregado.** Los fotogramas se sacan del
   MP4 descargado con ffmpeg (instantáneo). No hace falta un render aparte.
3. **La entrega se verifica en la misma sesión.** Un trabajo en segundo plano
   **no** es una entrega: hay que confirmar que el run terminó, descargar el
   artifact y comprobar que el MP4 está en el Escritorio, y decirlo. Los
   artifacts exigen autenticación: el token es el de las credenciales de git
   (`git credential fill`, vía API de GitHub).
4. **No hacer esperar:** si algo va a tardar más de ~3 minutos, avisar de cuánto
   y por qué **antes** de lanzarlo.
5. **Al matar procesos por línea de comandos, excluir el propio `$PID`.**

### Lo que ya está medido (no repetir)

- El runner varía ~50% entre ejecuciones: el mismo trabajo tardó 145,7 s y
  215,2 s de captura. Por eso el total baila entre 3,5 y 4,6 min.
- 4 workers sale peor que 1: se pierde el "streaming encode" (los fotogramas
  van a ffmpeg según se capturan) y hay que codificar aparte (+55 s).
- En la nube no hay GPU, y `--experimental-fast-capture` (2x) es solo macOS.
- HyperFrames no renderiza rangos de tiempo, así que el render no se puede
  trocear entre varios runners.
- El coste por fotograma se reparte así (medido en local): captura de pantalla
  base 38%, los 11 vídeos 20%, los gráficos (SVG + glow) 42%.

## Contexto

- Proyecto HyperFrames en este directorio: `index.html` es la composición.
- Repositorio remoto: https://github.com/lenz010101/mi-video (público).
- El render se ejecuta en la nube con GitHub Actions
  (`.github/workflows/render.yml`), que publica el MP4 como artifact.
- La salida local de trabajo vive en `renders/`.
