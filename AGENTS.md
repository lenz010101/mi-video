# Instrucciones del proyecto

## Preferencias del usuario

- **Entrega de vídeos (regla permanente):** cada vez que se renderice un vídeo
  (local o vía GitHub Actions), copiar el archivo final a
  `C:\Users\Admin\Desktop\` automáticamente. No hace falta que lo pida cada vez.
- **No hacer esperar:** un vídeo corto no puede costar una hora. Si algo va a
  tardar más de ~3 minutos, avisar de cuánto y por qué **antes** de lanzarlo.

## Flujo de vídeo (obligatorio)

Orden pensado para que revisar un cambio no cueste una hora:

1. **Revisar sin renderizar entero.** Para comprobar maquetación, textos o
   animaciones: renderizar a **6 fps** (`--fps 6`, ~2 min) o medir en el
   navegador. Nunca un render local completo solo para revisar.
2. **El render completo lo hace la nube.** GitHub Actions tarda ~3,5 min (4
   núcleos). El render local completo tarda ~11,5 min (HyperFrames se autolimita
   a 1 worker y va sin GPU); solo si el usuario lo pide expresamente.
3. **La entrega se verifica en la misma sesión.** Un trabajo en segundo plano
   **no** es una entrega: hay que confirmar que el run terminó, descargar el
   artifact y comprobar que el MP4 está en el Escritorio, y decirlo. Los
   artifacts exigen autenticación: el token es el de las credenciales de git
   (`git credential fill`, vía API de GitHub).
4. **Al matar procesos por línea de comandos, excluir el propio `$PID`:** un
   filtro por nombre de script coincide con el comando que lo ejecuta y puede
   matarse a sí mismo antes de terminar.

## Contexto

- Proyecto HyperFrames en este directorio: `index.html` es la composición.
- Repositorio remoto: https://github.com/lenz010101/mi-video (público).
- El render se ejecuta en la nube con GitHub Actions
  (`.github/workflows/render.yml`), que publica el MP4 como artifact.
- La salida local de trabajo vive en `renders/`.
