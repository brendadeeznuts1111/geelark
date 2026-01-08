#!/usr/bin/env bun

/**
 * Global test setup and teardown configuration
 * This file runs before all tests and provides common utilities
 */

// Global test utilities
declare global {
  var testUtils: {
    mockPort: number;
    getRandomPort: () => number;
    createTempDir: () => string;
    cleanupTempDir: (dir: string) => void;
  };
}

// Mock port for testing (use 0 to get random available port)
const mockPort = 0;

// Utility functions
const utilities = {
  mockPort,

  getRandomPort: (): number => {
    return 0; // Let OS assign random port
  },

  createTempDir: (): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `/tmp/test-${timestamp}-${random}`;
  },

  cleanupTempDir: (dir: string): void => {
    // Cleanup logic for temp directories
    try {
      // Use Bun's file system API or Node's fs
      console.log(`Cleaning up temp directory: ${dir}`);
    } catch (error) {
      console.warn(`Failed to cleanup temp directory ${dir}:`, error);
    }
  }
};

// Set global utilities
globalThis.testUtils = utilities;

// Global test setup - these will be available when running with Bun test
// Note: beforeAll and afterAll are global functions provided by Bun test runner
// They are conditionally checked to avoid TypeScript errors when not available

try {
  if (typeof globalThis.beforeAll === 'function') {
    globalThis.beforeAll(() => {
      // Set test environment
      process.env.NODE_ENV = "test";
      process.env.TEST_MODE = "true";

      // Suppress console logs in tests unless explicitly needed
      if (!process.env.DEBUG) {
        console.debug = () => {};
      }
    });
  }
} catch (e) {
  // Hooks not available, running outside test context
}

// Global test cleanup
try {
  if (typeof globalThis.afterAll === 'function') {
    globalThis.afterAll(() => {
      // Reset environment
      delete process.env.TEST_MODE;
    });
  }
} catch (e) {
  // Hooks not available, running outside test context
}

// Error handling for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Export for use in test files
export { utilities as testUtils };
