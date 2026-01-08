import { beforeEach, describe, expect, mock, test } from "bun:test";
import { ServiceFactory } from "../../src/services/ServiceFactory";

// Create a global mock features object that persists across module loads
global.mockFeatures = {};

// Mock the bun:bundle module for feature flag testing
mock.module("bun:bundle", () => ({
  feature: (flag: string) => {
    return global.mockFeatures[flag] || false;
  },
}));

// Mock compile-time constants
mock.module("../../src/constants/features/compile-time.js", () => ({
  COMPILE_TIME_CONFIG: {
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
  },
  COMPILE_TIME_FEATURES: {
    ENVIRONMENT: "test",
    TIER: "test",
  },
}));

// Mock fetch for API testing
global.fetch = mock(() => Promise.resolve({
  ok: true,
  status: 200,
  statusText: "OK",
  json: () => Promise.resolve({ success: true, data: "test" }),
}));

beforeEach(() => {
  // Reset mock features before each test
  global.mockFeatures = {};
  console.log = mock(() => {}); // Suppress factory logs during tests
});

describe("ServiceFactory - API Service", () => {
  test("should create mock API service when FEAT_MOCK_API is enabled", () => {
    global.mockFeatures.FEAT_MOCK_API = true;

    const apiService = ServiceFactory.createApiService();

    expect(apiService).toBeDefined();
    expect(typeof apiService.request).toBe("function");
    expect(typeof apiService.simulateError).toBe("function");
    expect(typeof apiService.setMockData).toBe("function");
  });

  test("should create production API service when FEAT_MOCK_API is disabled", () => {
    global.mockFeatures.FEAT_MOCK_API = false;

    const apiService = ServiceFactory.createApiService();

    expect(apiService).toBeDefined();
    expect(typeof apiService.request).toBe("function");
    expect(typeof apiService.healthCheck).toBe("function");
    expect(apiService.simulateError).toBeUndefined();
  });
});

describe("ServiceFactory - Quick Tests", () => {
  test("should handle feature flag switching", () => {
    // Test with feature enabled
    global.mockFeatures.FEAT_EXTENDED_LOGGING = true;
    const loggingService1 = ServiceFactory.createLoggingService();
    expect(loggingService1.audit).toBeDefined();

    // Reset and test with feature disabled
    global.mockFeatures.FEAT_EXTENDED_LOGGING = false;
    const loggingService2 = ServiceFactory.createLoggingService();
    expect(loggingService2.audit).toBeUndefined();
  });

  test("should create phone manager with correct features", () => {
    global.mockFeatures.PHONE_MULTI_ACCOUNT = true;
    global.mockFeatures.PHONE_AUTOMATION_ENABLED = true;

    const phoneManager = ServiceFactory.createPhoneManager();
    expect(phoneManager.maxAccounts).toBe(5);
    expect(phoneManager.automationEnabled).toBe(true);
  });

  test("should create optimized cache when enabled", () => {
    global.mockFeatures.FEAT_CACHE_OPTIMIZED = true;

    const cacheService = ServiceFactory.createCacheService();
    expect(typeof cacheService.calculateSize).toBe("function");
    expect(cacheService.maxSize).toBe(100 * 1024 * 1024);
  });

  test("should create notification service when enabled", () => {
    global.mockFeatures.FEAT_NOTIFICATIONS = true;

    const notificationService = ServiceFactory.createNotificationService();
    expect(typeof notificationService.sendEmail).toBe("function");
    expect(typeof notificationService.sendSMS).toBe("function");
  });

  test("should create monitoring service with advanced features", () => {
    global.mockFeatures.FEAT_ADVANCED_MONITORING = true;
    global.mockFeatures.FEAT_PREMIUM = true;

    const monitoringService = ServiceFactory.createMonitoringService();
    expect(typeof monitoringService.calculateTrends).toBe("function");
    expect(monitoringService.metrics).toBeInstanceOf(Map);
  });
});
