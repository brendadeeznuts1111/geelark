/**
 * ConfigLoader - Efficient configuration loading using Bun.file
 *
 * https://bun.sh/docs/runtime/global-configuration#bunfilepath
 */

/**
 * Load a JSON configuration file using Bun.file
 * More efficient than fs.readFile due to Bun's optimized file handling
 */
export async function loadConfig<T = unknown>(path: string): Promise<T> {
  const file = Bun.file(path);
  const exists = await file.exists();

  if (!exists) {
    throw new Error(`Configuration file not found: ${path}`);
  }

  try {
    return await file.json<T>();
  } catch (error) {
    throw new Error(`Failed to parse configuration file ${path}: ${error}`);
  }
}

/**
 * Load a configuration file synchronously
 */
export function loadConfigSync<T = unknown>(path: string): T {
  const file = Bun.file(path);

  if (!file.exists()) {
    throw new Error(`Configuration file not found: ${path}`);
  }

  try {
    return file.json<T>() as T;
  } catch (error) {
    throw new Error(`Failed to parse configuration file ${path}: ${error}`);
  }
}

/**
 * Load a text configuration file
 */
export async function loadTextConfig(path: string): Promise<string> {
  const file = Bun.file(path);
  const exists = await file.exists();

  if (!exists) {
    throw new Error(`Configuration file not found: ${path}`);
  }

  return await file.text();
}

/**
 * Get file stats efficiently
 */
export async function getConfigStats(path: string) {
  const file = Bun.file(path);
  const stat = await file.stat();

  return {
    size: stat.size,
    modified: stat.mtime,
    isFile: stat.isFile(),
    isDirectory: stat.isDirectory(),
  };
}

/**
 * Watch a configuration file for changes
 * Returns a cleanup function to stop watching
 */
export function watchConfig<T>(
  path: string,
  onChange: (config: T) => void | Promise<void>
): () => void {
  const watcher = new AbortController();
  let currentConfig: T | null = null;

  (async () => {
    try {
      const file = Bun.file(path);

      // Initial load
      currentConfig = await file.json<T>();
      await onChange(currentConfig);

      // Watch for changes
      const watcher = Bun.watch(path, {
        signal: watcher.signal,
        async onEvent(event) {
          if (event.type === "create" || event.type === "modify") {
            try {
              const newConfig = await loadConfig<T>(path);
              if (JSON.stringify(newConfig) !== JSON.stringify(currentConfig)) {
                currentConfig = newConfig;
                await onChange(newConfig);
              }
            } catch (error) {
              console.error(`Error reloading config: ${error}`);
            }
          }
        },
      });

      // Store ref for cleanup
      (watcher as any).close = () => watcher.close();
    } catch (error) {
      console.error(`Error watching config file ${path}:`, error);
    }
  })();

  return () => watcher.abort();
}

/**
 * Configuration cache with TTL
 */
export class ConfigCache<T> {
  private cache = new Map<string, { data: T; expires: number }>();
  private defaultTTL: number;

  constructor(ttl = 60000) {
    this.defaultTTL = ttl;
  }

  async get(path: string, ttl = this.defaultTTL): Promise<T> {
    const cached = this.cache.get(path);

    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    const config = await loadConfig<T>(path);
    this.cache.set(path, {
      data: config,
      expires: Date.now() + ttl,
    });

    return config;
  }

  invalidate(path?: string): void {
    if (path) {
      this.cache.delete(path);
    } else {
      this.cache.clear();
    }
  }
}

/**
 * Preload common config paths
 */
export async function preloadConfigs(paths: string[]): Promise<Map<string, unknown>> {
  const configs = new Map<string, unknown>();

  await Promise.all(
    paths.map(async (path) => {
      try {
        const config = await loadConfig(path);
        configs.set(path, config);
      } catch {
        // Skip missing configs
      }
    })
  );

  return configs;
}
