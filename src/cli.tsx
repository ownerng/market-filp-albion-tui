#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import meow from "meow";
import { App } from "./app.js";
import { ErrorBoundary } from "./components/ErrorBoundary.js";
import { ensureAppDirs } from "./lib/paths.js";

const cli = meow(
  `
  Uso
    $ market-flip

  Opciones
    --reset-db    Recrear la base de datos local (pierde inversiones)
    --version     Ver versión

  Ejemplos
    $ market-flip
`,
  {
    importMeta: import.meta,
    flags: {
      resetDb: { type: "boolean", default: false },
    },
  },
);

void cli.flags;

ensureAppDirs();

const { waitUntilExit } = render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);

await waitUntilExit();
