import pino from "pino";
import fs from "node:fs";
import { PATHS, ensureAppDirs } from "./paths.js";

ensureAppDirs();

const stream = fs.createWriteStream(PATHS.log, { flags: "a" });

export const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? "info",
    base: { pid: process.pid },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  stream,
);
