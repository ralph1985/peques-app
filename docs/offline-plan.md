# Arquitectura offline implementada

No existe una versión online distinta: todas las operaciones familiares son locales. El mismo repositorio Dexie se usa con y sin red. No hay snapshots, cola de sincronización ni conflictos remotos.

## Compilación y caché

1. `build-icons.mjs` genera los iconos PNG desde el SVG mediante el compilador de imágenes ya incluido en Next.
2. Next exporta rutas estáticas. Serwist compila `src/app/sw.ts` y precachea JS, CSS, manifest, iconos y recursos públicos.
3. `complete-precache.mjs` incorpora el HTML y los payloads RSC generados por esa misma exportación. Se comprueba la existencia de las siete rutas; no se reutiliza HTML del build anterior.
4. El navegador registra `/sw.js` y muestra que está listo cuando lo controla el worker. La instalación fallida no elimina los datos locales.

No hay caché de peticiones arbitrarias en ejecución. No hay acceso a IndexedDB desde el worker, ni serialización familiar a Cache Storage. Los parámetros estáticos del router no alteran los datos guardados. GET y HEAD propios del frontend solo solicitan recursos; no transportan formularios.

## Actualizaciones y almacenamiento

El worker nuevo espera y ofrece actualización explícita. No recarga automáticamente formularios abiertos. Serwist limpia sus precachés antiguas; no modifica las tablas de Dexie. Los cambios futuros de esquema deben usar versiones Dexie y migraciones transaccionales, nunca borrar la base para «repararla».

El almacenamiento puede fallar por permisos, modo privado, cuota o políticas del navegador. Se muestra un error y no se declara éxito si la transacción falla. Exportar copias sigue siendo necesario: cachear el frontend no respalda la información familiar.

## Validación reproducible

`pnpm build && pnpm test:e2e` sirve exclusivamente `out/` en loopback y usa datos ficticios. La prueba crea dos hijos, guarda registros, cierra Chromium, lo abre con el mismo perfil y la red desactivada, modifica y borra pesos, recorre las siete secciones, cambia de hijo y vuelve a cerrar/reabrir. Comprueba el sueño activo y el contenido de Cache Storage y del tráfico observado. Otro flujo comprueba aplicación/reapertura de vacunas, checklist, borrado de hijo e importación/exportación offline.

Esta aproximación prueba reinicio real del proceso del navegador y persistencia del perfil, no solo un refresh. No certifica el comportamiento del sistema operativo al instalar en cada teléfono; debe complementarse con pruebas físicas de «Añadir a pantalla de inicio» en los dispositivos de uso.
