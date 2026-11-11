type GpuNavigator = Navigator & { gpu?: { requestAdapter(): Promise<unknown> } };

let cached: Promise<boolean> | undefined;
let resolved: boolean | undefined;

/** The answer once known, so callers can render synchronously on later visits. */
export const webgpuKnownResult = (): boolean | undefined => resolved;

// `navigator.gpu` exists even where no adapter does (VMs, blocklisted GPUs), and
// a failed WebGPU init poisons the later WASM load, so ask for an adapter first.
// Firefox's WebGPU runs the HD model but returns garbage samples, and spends ~15s
// compiling first, so it is treated as unusable; the worker's warm-up check still
// guards every other browser.
export const webgpuUsable = (): Promise<boolean> => {
  cached ??= (async () => {
    if (navigator.userAgent.includes('Firefox')) return false;
    try {
      return Boolean(await (navigator as GpuNavigator).gpu?.requestAdapter());
    } catch {
      return false;
    }
  })().then((usable) => {
    resolved = usable;
    return usable;
  });
  return cached;
};
