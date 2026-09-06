# Peques: instrucciones para agentes

- Trabajar en español. Commits en inglés con Conventional Commits.
- Proyecto independiente en `/home/rafa/dev/peques-app`. No modificar el repositorio de referencia Irati.
- IndexedDB mediante Dexie es la única persistencia familiar. Sin backend, cuentas, telemetría ni sincronización remota.
- Mantener Next.js estático, React, TypeScript, pnpm y Serwist.
- Separar dominio, aplicación, infraestructura y UI. Los componentes reciben casos de uso; no importan Dexie.
- Toda entidad específica de un hijo lleva `childId`; comprobar pertenencia dentro de transacciones de escritura.
- No copiar datos familiares, entornos, backups ni historial del proyecto original. Usar únicamente fixtures ficticios.
- Mantener la UX móvil y los componentes visuales heredados siempre que encajen.
- Validar typecheck, lint, format, test y build. Probar navegador y offline para cambios de PWA o flujos de datos.
- Antes de cada commit inspeccionar estado, diff y rutas en staging. No publicar sin autorización del usuario.
- No añadir dependencias sin necesidad técnica e informar al usuario.
- Actualizar documentación cuando cambien arquitectura, uso o decisiones estables.
