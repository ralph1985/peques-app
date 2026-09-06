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

## Estado

Base estática inicial. La persistencia multihijo, los módulos y los backups se incorporan en hitos posteriores antes de la entrega completa.
