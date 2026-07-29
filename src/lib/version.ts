/* Hallmark · locked system applied (Taller) · src/lib/version.ts
 * Single source of truth for the app version. Read from package.json at
 * build time via the JSON import (tsconfig has resolveJsonModule: true).
 *
 * Use:
 *   import { APP_VERSION } from "@/lib/version";
 *   <span>v{APP_VERSION}</span>
 *
 * Bumping the version: edit `"version"` in package.json. pnpm install
 * (run automatically on Vercel) refreshes pnpm-lock.yaml. No other file
 * needs to change — this module is the only consumer.
 */

import pkg from "../../package.json";

export const APP_NAME: string = pkg.name;
export const APP_VERSION: string = pkg.version;
