// Bun test configuration
// Note: This configuration works with Bun's built-in test runner
// Type definitions are available when running with Bun

const config = {
  // Test environment configuration
  environment: "node",

  // Test file patterns
  testMatch: [
    "**/*.test.ts",
    "**/*.test.js",
    "**/*.spec.ts",
    "**/*.spec.js"
  ],

  // Files to ignore
  testIgnore: [
    "node_modules/**",
    "dist/**",
    "**/*.d.ts"
  ],

  // Global setup and teardown
  globalSetup: "./config/test-setup.ts",

  // Coverage configuration
  coverage: {
    enabled: true,
    include: ["src/**/*.{ts,js}"],
    exclude: [
      "src/**/*.test.{ts,js}",
      "src/**/*.spec.{ts,js}",
      "src/**/*.d.ts",
      "node_modules/**",
      "dist/**"
    ],
    reporter: ["text", "json", "html"],
    threshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  },

  // Timeout configuration
  testTimeout: 10000,

  // Concurrency
  concurrency: true,

  // Snapshot configuration
  snapshotFormat: {
    printBasicPrototype: false,
    escapeString: true,
    escapeRegex: false,
    highlightCode: true,
    indent: "  "
  },

  // Hooks configuration
  setupFiles: ["./config/test-setup.ts"],

  // Reporter configuration
  reporters: ["default", "verbose"],

  // Watch mode configuration
  watch: {
    ignore: ["node_modules/**", "dist/**", "**/*.snap"]
  },

  // HTTP configuration for integration tests
  http: {
    userAgent: "geelark-test-runner/1.0 (Bun Test Integration)"
  }
};

export default config;
