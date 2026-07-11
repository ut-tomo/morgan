// Browser loader for RDKit.js. Injects the RDKit_minimal.js script (copied into
// public/rdkit at build time) and initialises the WASM module, pointing
// locateFile at the correct base-path-aware URL so it works under a GitHub
// Pages subpath.

import type { RDKitModule } from './types';

// The RDKit.js script assigns window.initRDKitModule once loaded. We access it
// loosely and narrow the returned module to the small structural subset we use.
type InitRDKit = (opts?: { locateFile?: () => string }) => Promise<unknown>;

let modulePromise: Promise<RDKitModule> | null = null;

/** Base-path-aware URL for a static asset under public/. */
function assetUrl(relative: string): string {
  // import.meta.env.BASE_URL is "/" locally and "/<repo>/" on GitHub Pages.
  const base = import.meta.env.BASE_URL;
  return `${base}${relative}`.replace(/\/{2,}/g, '/');
}

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-rdkit]`,
    );
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.rdkit = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load RDKit from ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Load + initialise RDKit.js exactly once. Subsequent calls return the same
 * module promise.
 */
export function loadRDKit(): Promise<RDKitModule> {
  if (modulePromise) return modulePromise;
  modulePromise = (async () => {
    await injectScript(assetUrl('rdkit/RDKit_minimal.js'));
    const init = (window as unknown as { initRDKitModule?: InitRDKit })
      .initRDKitModule;
    if (!init) {
      throw new Error('initRDKitModule was not defined after loading RDKit.js');
    }
    const rdkit = (await init({
      locateFile: () => assetUrl('rdkit/RDKit_minimal.wasm'),
    })) as RDKitModule;
    // Nicer 2D layouts for rings.
    rdkit.prefer_coordgen(true);
    return rdkit;
  })();
  return modulePromise;
}

/** Testing helper — resets the cached module so tests can re-load. */
export function __resetRDKitForTests(): void {
  modulePromise = null;
}
