# Peques

PWA multihijo de seguimiento familiar, derivada del diseño y dominio de Irati, con repositorio e historial independientes.

Los datos familiares se almacenan exclusivamente en IndexedDB en el dispositivo. Peques no dispone de backend ni base de datos remota.

Borrar los datos del navegador, eliminar el almacenamiento del sitio o perder el dispositivo puede eliminar la información si no existe una copia exportada.

## Desarrollo

Node.js 22 y pnpm 10.25.0. No se requieren secretos ni archivos de entorno.

```sh
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm format
pnpm test
pnpm build
pnpm start
```

`pnpm build` exporta archivos estáticos en `out/`. `pnpm start` los sirve localmente para validación; no acepta escrituras ni gestiona datos familiares.

## Funcionalidades

- Hijos: alta, edición, selector rápido y borrado confirmado con resumen y cascada transaccional.
- Peso: historial, diferencias, promedio diario, filtros y gráfica ampliable. Las referencias OMS heredadas solo se muestran para niñas; no se inventan referencias masculinas.
- Vacunas: planificación independiente según nacimiento, estados, edición, aplicación y reapertura. También se admiten aplicaciones fuera del plan. Calendario orientativo de Madrid 2026, con campañas por confirmar.
- Sueño: noche, siesta, registro manual, historial, resumen y cronómetro reconstruido desde timestamps persistidos.
- Viaje familiar: categorías, ubicaciones y compartimentos, marcado, edición, borrado, reinicio y órdenes independientes por categoría y ubicación.
- Calendario: agenda y mes con eventos derivados del hijo activo o de todos, siempre identificados.
- Ajustes: gestión de hijos y copias completas exportables/restaurables sin subir archivos.

## Instalar y usar sin conexión

Sirve `out/` desde la raíz de un dominio HTTPS. No requiere un servidor Next, secretos ni API. El servidor incluido es solo una herramienta local de archivos estáticos, enlazada a `127.0.0.1`.

Abre la aplicación con conexión y espera a **Lista para abrir sin conexión**. Instálala desde la opción del navegador «Instalar aplicación» o «Añadir a pantalla de inicio» (en iOS, desde Compartir en Safari). Después puedes abrir las secciones, crear y modificar datos sin Internet. La instalación exacta depende del navegador; el modo de desarrollo no instala el service worker.

El build genera iconos a partir del SVG y Serwist cachea los archivos de la aplicación. Un paso posterior incorpora el HTML y los archivos RSC de la exportación actual. Cache Storage nunca recibe datos familiares. Las nuevas versiones requieren conexión para descargarse y ofrecen una recarga explícita, sin interrumpir formularios automáticamente.

El atajo `/sueno/atajo/` inicia o termina la siesta del hijo activo. `?type=noche` inicia sueño nocturno si no existe un cronómetro; si ya existe uno, termina ese descanso. Tras guardar vuelve a Sueño para que un refresh no repita la acción.

## Copias, privacidad y límites

En Ajustes, **Exportar copia** descarga un JSON versionado con todas las tablas. **Importar copia** valida el archivo, muestra cantidades y exige escribir RESTAURAR. La restauración sustituye todos los datos dentro de una transacción: no combina dispositivos y no deja una base parcial si falla.

Conserva copias periódicas fuera del almacenamiento de la aplicación. La fecha de «copia preparada» no demuestra que el archivo esté guardado a salvo. Las copias y IndexedDB no están cifradas por Peques: usa el bloqueo del dispositivo y protege los archivos. Esta versión limita los archivos de copia a 25 MiB por memoria móvil.

No hay cuentas, backend familiar, sincronización, analítica, trackers ni logging remoto. El hosting recibe únicamente solicitudes de archivos estáticos; como cualquier hosting, puede registrar metadatos de acceso como la IP, pero Peques no le envía nombres, identificadores sanitarios ni registros familiares. No añadas scripts de analítica o inyección del proveedor al desplegar.

El almacenamiento depende del navegador, del origen y del perfil. Otro navegador, dispositivo o dominio no verá estos datos. El navegador puede denegar almacenamiento o desalojarlo; ninguna PWA puede garantizar recuperación sin copia. No uses navegación privada para guardar información duradera. Las reglas de vacunas y referencias de crecimiento son orientativas, no una prescripción ni diagnóstico.

## Arquitectura y validación

Next.js 16, React 19 y TypeScript con módulos `domain`, `application`, `infrastructure` y `ui`. Las pantallas consumen repositorios; Dexie/IndexedDB es la única fuente de verdad, no una caché. UUID e índices `childId` separan los datos. [Esquema](docs/database-schema.md), [especificación](docs/spec.md), [copias](docs/backup.md), [offline](docs/offline-plan.md) y [vacunas](docs/vaccine-calendar.md).

```sh
pnpm exec playwright install chromium
pnpm build
pnpm test:e2e
```

Vitest usa IndexedDB simulado para integridad, aislamiento, cascadas y rollback. Playwright usa Chromium con datos ficticios, perfiles persistentes, cierres completos y red desactivada; también comprueba que el tráfico y la caché no contienen los datos de prueba. No sustituye una comprobación física de instalación en todos los modelos de móvil.

Peques es una aplicación independiente: no accede a la base, los datos, los backups ni el historial Git del proyecto de referencia. Las copias del proyecto original no son compatibles con este formato.
