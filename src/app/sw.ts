/// <reference lib="webworker" />
import { Serwist, type PrecacheEntry, type SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    __PEQUES_EXPORT_MANIFEST: PrecacheEntry[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

// Build-time files only. No runtime caching, IndexedDB access, family data or remote API.
const serwist = new Serwist({
  cacheId: "peques-static",
  clientsClaim: true,
  skipWaiting: false,
  disableDevLogs: true,
  precacheEntries: (self.__SW_MANIFEST ?? []).concat(self.__PEQUES_EXPORT_MANIFEST ?? []),
  precacheOptions: {
    cleanupOutdatedCaches: true,
    ignoreURLParametersMatching: [/^_rsc$/, /^utm_/, /^type$/],
  },
});
serwist.addEventListeners();
