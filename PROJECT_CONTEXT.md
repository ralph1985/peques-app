# Contexto de Peques

Peques es una PWA mobile-first multihijo, derivada de los componentes visuales y reglas de dominio del proyecto Irati. Repositorio independiente `ralph1985/peques-app`, público por decisión del propietario. No contiene datos reales ni historial del proyecto original.

## Decisiones vigentes

- Privacidad, integridad e aislamiento por hijo tienen prioridad sobre nuevas funciones.
- `out/` es el producto desplegable. Next se usa como compilador y router del frontend, no como backend familiar.
- Dexie abre `peques-local`, versión 1, y es la única fuente de verdad. No hay sincronización ni persistencia remota.
- El punto de composición `create-peques-app.ts` conecta repositorios y suscripciones `liveQuery`. UI recibe operaciones y datos, no consultas Dexie.
- El hijo activo se guarda en settings. Los componentes específicos se reinician al cambiarlo para no conservar formularios o datos del hijo anterior.
- Crear hijo, planificación y selección es atómico. El borrado confirmado elimina sus cuatro colecciones y conserva Viaje.
- Una dosis aplicada solo puede enlazar con una planificación del mismo hijo, y una planificación solo admite una aplicación. Se permiten vacunas aplicadas independientes.
- Cada hijo tiene como máximo un cronómetro activo, incluso entre pestañas. La duración se reconstruye desde timestamps, no desde un contador en memoria.
- Viaje es global, con ubicación jerárquica y dos órdenes independientes. No se multiplica por número de hijos.
- Calendario es una vista derivada, sin tabla de eventos ni feed externo.
- Las copias son JSON versionado y restauración por sustitución transaccional. No se implementa mezcla entre dispositivos.
- No hay PIN ni cifrado propio en esta versión. El almacenamiento local no implica protección frente a alguien con acceso al dispositivo.
- Referencias OMS heredadas solo femeninas. Campañas de vacunas sin fecha concreta permanecen sin fecha hasta que la familia las confirme con su centro.
- Al editar el nacimiento se conservan citas y aplicaciones existentes y se pide revisar las fechas: no se sobreescribe información manual.

## Desarrollo

Usar los scripts de package.json. Typecheck y build se ejecutan secuencialmente para evitar carreras de `.next/types`. Para offline usar el build de producción, no `next dev`. Los artefactos de Playwright, exportaciones y service worker generado no forman parte del repositorio.

Mantener todas las capas libres de datos reales, transporte familiar y dependencias remotas. Las comprobaciones estáticas de privacidad complementan, pero no reemplazan, las pruebas de tráfico del navegador. Más detalles en README y docs.
