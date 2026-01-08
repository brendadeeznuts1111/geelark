// Compile-time feature constants for ServiceFactory testing
// Simplified version that works with bun:bundle constraints


export const COMPILE_TIME_CONFIG = {
  API: {
    TIMEOUT_MS: 5000,
    RETRY_ATTEMPTS: 3,
  },
  LOGGING: {
    LEVEL: "info",
    EXTERNAL_LOGGING: false,
  },
  PERFORMANCE: {
    CACHE_SIZE_MB: 100,
  },
  PHONE: {
    MAX_ACCOUNTS: 5,
  },
};

export const COMPILE_TIME_FEATURES = {
  ENVIRONMENT: "test",
  TIER: "test",
};
