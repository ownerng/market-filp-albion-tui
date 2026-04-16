# market-flip-albion-tui

TUI para detectar oportunidades de market flip en Albion Online (servidor Americas).

## Requisitos

- Node.js >= 20.11
- Terminal compatible (Windows Terminal recomendado; cmd.exe puede no renderizar algunos glyphs)
- Para `better-sqlite3` en Windows: Visual Studio Build Tools con C++ workload, o Node con prebuilt binaries (se descargan automáticamente en mayoría de casos)

## Instalación

```bash
npm install
npm run db:generate
npm run dev
```

## Comandos

- `npm run dev` — ejecuta con `tsx` (desarrollo)
- `npm run build` — compila a `dist/`
- `npm start` — corre build de producción
- `npm test` — tests con vitest
- `npm run reseed` — re-descarga catálogo items.json
- `npm run db:generate` — genera migraciones drizzle

## Rutas locales

- DB: `%USERPROFILE%\.market-flip\market-flip.db`
- Logs: `%USERPROFILE%\.market-flip\app.log`

## Keybinds

Ver `?` dentro de la app.

## Licencia

MIT
