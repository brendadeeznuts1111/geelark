/**
 * Test setup preload script
 * Loaded automatically by Bun when running tests
 *
 * Configured in bun.toml: [test] preload = "./src/preload/test-setup.ts"
 */

import { beforeAll, afterEach, afterAll } from "bun:test";

// Track test state
const testState = {
  startTime: Date.now(),
  testCount: 0,
  passCount: 0,
  failCount: 0,
};

// Global test utilities
globalThis.testUtils = {
  getTestState: () => ({ ...testState }),

  resetTestState: () => {
    testState.testCount = 0;
    testState.passCount = 0;
    testState.failCount = 0;
  },

  // Create temp file helper
  tempFile: async (content: string, extension = ".ts"): Promise<string> => {
    const tempDir = `/tmp/bun-test-${Date.now()}`;
    await Bun.write(`${tempDir}${extension}`, content);
    return tempDir;
  },

  // Wait for condition helper
  waitFor: async (
    condition: () => boolean,
    timeout = 5000
  ): Promise<void> => {
    const start = Date.now();
    while (!condition() && Date.now() - start < timeout) {
      await Bun.sleep(50);
    }
    if (!condition()) {
      throw new Error(`Timeout waiting for condition after ${timeout}ms`);
    }
  },
};

// Setup before all tests
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = "test";
  process.env.BUN_TEST = "true";

  // Configure console for tests
  if (!process.env.VERBOSE_TESTS) {
    // Suppress some logs in non-verbose mode
    // console.debug = () => {};
  }
});

// Cleanup after each test
afterEach(() => {
  testState.testCount++;
});

// Teardown after all tests
afterAll(() => {
  const duration = Date.now() - testState.startTime;

  if (process.env.VERBOSE_TESTS) {
    console.log(`\n📊 Test Summary:`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Tests: ${testState.testCount}`);
    console.log(`   Passed: ${testState.passCount}`);
    console.log(`   Failed: ${testState.failCount}`);
  }
});

// Export for use in tests
export { testState };
