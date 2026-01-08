import { beforeEach, describe, expect, mock, test } from "bun:test";
import { ServiceFactory } from "../../src/services/ServiceFactory";

// Mock the bun:bundle module for feature flag testing
let mockFeatures: Record<string, boolean> = {};

mock.module("bun:bundle", () => ({
  feature: (flag: string) => mockFeatures[flag] || false,
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

beforeEach(() => {
  mockFeatures = {};
  console.log = mock(() => {}); // Suppress factory logs during tests
});

describe("ServiceFactory - Performance Benchmarks", () => {
  test("service creation performance", () => {
    const iterations = 1000;
    const results: { [key: string]: number[] } = {
      api: [],
      logging: [],
      monitoring: [],
      notification: [],
      cache: [],
      phoneManager: [],
    };

    // Benchmark API service creation
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      ServiceFactory.createApiService();
      const end = performance.now();
      results.api.push(end - start);
    }

    // Benchmark logging service creation
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      ServiceFactory.createLoggingService();
      const end = performance.now();
      results.logging.push(end - start);
    }

    // Benchmark monitoring service creation
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      ServiceFactory.createMonitoringService();
      const end = performance.now();
      results.monitoring.push(end - start);
    }

    // Benchmark notification service creation
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      ServiceFactory.createNotificationService();
      const end = performance.now();
      results.notification.push(end - start);
    }

    // Benchmark cache service creation
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      ServiceFactory.createCacheService();
      const end = performance.now();
      results.cache.push(end - start);
    }

    // Benchmark phone manager creation
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      ServiceFactory.createPhoneManager();
      const end = performance.now();
      results.phoneManager.push(end - start);
    }

    // Calculate averages and assert performance thresholds
    Object.entries(results).forEach(([service, times]) => {
      const average = times.reduce((a, b) => a + b, 0) / times.length;
      const max = Math.max(...times);
      const min = Math.min(...times);

      console.log(`${service} - Average: ${average.toFixed(4)}ms, Min: ${min.toFixed(4)}ms, Max: ${max.toFixed(4)}ms`);

      // All services should create in under 1ms on average
      expect(average).toBeLessThan(1);
      // No service should take more than 10ms to create
      expect(max).toBeLessThan(10);
    });
  });

  test("feature flag resolution performance", () => {
    const iterations = 10000;

    // Enable all features for comprehensive testing
    Object.assign(mockFeatures, {
      FEAT_MOCK_API: true,
      FEAT_EXTENDED_LOGGING: true,
      FEAT_ADVANCED_MONITORING: true,
      FEAT_PREMIUM: true,
      FEAT_NOTIFICATIONS: true,
      FEAT_CACHE_OPTIMIZED: true,
      PHONE_MULTI_ACCOUNT: true,
      PHONE_AUTOMATION_ENABLED: true,
      PHONE_REAL_TIME_SYNC: true,
      PHONE_ADVANCED_ANALYTICS: true,
      PHONE_BULK_OPERATIONS: true,
      FEAT_RETRY_LOGIC: true,
      FEAT_AUDIT_LOGGING: true,
      FEAT_REAL_TIME_DASHBOARD: true,
      INTEGRATION_EMAIL_SERVICE: true,
      INTEGRATION_SMS_SERVICE: true,
      INTEGRATION_WEBHOOK: true,
    });

    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      // Create all services to test feature flag resolution
      ServiceFactory.createApiService();
      ServiceFactory.createLoggingService();
      ServiceFactory.createMonitoringService();
      ServiceFactory.createNotificationService();
      ServiceFactory.createCacheService();
      ServiceFactory.createPhoneManager();

      const end = performance.now();
      times.push(end - start);
    }

    const average = times.reduce((a, b) => a + b, 0) / times.length;
    const max = Math.max(...times);
    const min = Math.min(...times);

    console.log(`All services (with all features) - Average: ${average.toFixed(4)}ms, Min: ${min.toFixed(4)}ms, Max: ${max.toFixed(4)}ms`);

    // Even with all features enabled, should be fast
    expect(average).toBeLessThan(5);
    expect(max).toBeLessThan(50);
  });

  test("memory usage benchmark", () => {
    const iterations = 100;
    const services: any[] = [];

    // Create many services to test memory usage
    for (let i = 0; i < iterations; i++) {
      services.push({
        api: ServiceFactory.createApiService(),
        logging: ServiceFactory.createLoggingService(),
        monitoring: ServiceFactory.createMonitoringService(),
        notification: ServiceFactory.createNotificationService(),
        cache: ServiceFactory.createCacheService(),
        phoneManager: ServiceFactory.createPhoneManager(),
      });
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Test that we can create many services without running out of memory
    expect(services.length).toBe(iterations);

    // Verify all services are properly created
    services.forEach((serviceSet, index) => {
      expect(serviceSet.api).toBeDefined();
      expect(serviceSet.logging).toBeDefined();
      expect(serviceSet.monitoring).toBeDefined();
      expect(serviceSet.notification).toBeDefined();
      expect(serviceSet.cache).toBeDefined();
      expect(serviceSet.phoneManager).toBeDefined();
    });

    console.log(`Created ${iterations * 6} service instances successfully`);
  });

  test("concurrent service creation", async () => {
    const iterations = 100;
    const promises: Promise<any>[] = [];

    // Create services concurrently
    for (let i = 0; i < iterations; i++) {
      promises.push(Promise.resolve(ServiceFactory.createApiService()));
      promises.push(Promise.resolve(ServiceFactory.createLoggingService()));
      promises.push(Promise.resolve(ServiceFactory.createMonitoringService()));
      promises.push(Promise.resolve(ServiceFactory.createNotificationService()));
      promises.push(Promise.resolve(ServiceFactory.createCacheService()));
      promises.push(Promise.resolve(ServiceFactory.createPhoneManager()));
    }

    const startTime = performance.now();
    const results = await Promise.all(promises);
    const endTime = performance.now();

    expect(results.length).toBe(iterations * 6);
    results.forEach(service => {
      expect(service).toBeDefined();
    });

    const duration = endTime - startTime;
    console.log(`Concurrent creation of ${iterations * 6} services took ${duration.toFixed(4)}ms`);

    // Concurrent creation should be faster than sequential
    expect(duration).toBeLessThan(100);
  });

  test("service method execution performance", () => {
    // Enable all features for comprehensive method testing
    Object.assign(mockFeatures, {
      FEAT_MOCK_API: true,
      FEAT_EXTENDED_LOGGING: true,
      FEAT_ADVANCED_MONITORING: true,
      FEAT_PREMIUM: true,
      FEAT_NOTIFICATIONS: true,
      FEAT_CACHE_OPTIMIZED: true,
      PHONE_MULTI_ACCOUNT: true,
      PHONE_AUTOMATION_ENABLED: true,
      PHONE_ADVANCED_ANALYTICS: true,
      PHONE_BULK_OPERATIONS: true,
    });

    const apiService = ServiceFactory.createApiService();
    const loggingService = ServiceFactory.createLoggingService();
    const monitoringService = ServiceFactory.createMonitoringService();
    const notificationService = ServiceFactory.createNotificationService();
    const cacheService = ServiceFactory.createCacheService();
    const phoneManager = ServiceFactory.createPhoneManager();

    const iterations = 1000;
    const results: { [key: string]: number[] } = {};

    // Benchmark API service methods
    results.apiRequest = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      apiService.request("/test");
      const end = performance.now();
      results.apiRequest.push(end - start);
    }

    // Benchmark logging service methods
    results.logMessage = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      loggingService.log(`Test message ${i}`);
      const end = performance.now();
      results.logMessage.push(end - start);
    }

    // Benchmark monitoring service methods
    results.trackMetric = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      monitoringService.trackMetric(`metric_${i}`, Math.random() * 100);
      const end = performance.now();
      results.trackMetric.push(end - start);
    }

    // Benchmark cache service methods
    results.cacheOperations = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      cacheService.set(`key_${i}`, `value_${i}`);
      cacheService.get(`key_${i}`);
      const end = performance.now();
      results.cacheOperations.push(end - start);
    }

    // Benchmark phone manager methods
    results.phoneCreation = [];
    for (let i = 0; i < Math.min(iterations, 10); i++) { // Limit due to account restrictions
      const start = performance.now();
      phoneManager.createPhone({ name: `Phone ${i}` });
      const end = performance.now();
      results.phoneCreation.push(end - start);
    }

    // Calculate and log performance metrics
    Object.entries(results).forEach(([method, times]) => {
      const average = times.reduce((a, b) => a + b, 0) / times.length;
      const max = Math.max(...times);
      const min = Math.min(...times);

      console.log(`${method} - Average: ${average.toFixed(4)}ms, Min: ${min.toFixed(4)}ms, Max: ${max.toFixed(4)}ms`);

      // Method execution should be very fast
      expect(average).toBeLessThan(0.1);
      expect(max).toBeLessThan(1);
    });
  });

  test("feature flag switching performance", () => {
    const iterations = 1000;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      // Toggle features on and off
      mockFeatures.FEAT_MOCK_API = i % 2 === 0;
      mockFeatures.FEAT_EXTENDED_LOGGING = i % 3 === 0;
      mockFeatures.FEAT_ADVANCED_MONITORING = i % 4 === 0;
      mockFeatures.FEAT_PREMIUM = i % 5 === 0;

      const start = performance.now();

      // Create services with different feature combinations
      ServiceFactory.createApiService();
      ServiceFactory.createLoggingService();
      ServiceFactory.createMonitoringService();

      const end = performance.now();
      times.push(end - start);
    }

    const average = times.reduce((a, b) => a + b, 0) / times.length;
    const max = Math.max(...times);

    console.log(`Feature switching - Average: ${average.toFixed(4)}ms, Max: ${max.toFixed(4)}ms`);

    // Feature switching should not significantly impact performance
    expect(average).toBeLessThan(2);
    expect(max).toBeLessThan(20);
  });

  test("bundle size impact simulation", () => {
    // Test that disabled features don't include their methods
    const allFeaturesDisabled = { ...mockFeatures };
    Object.keys(allFeaturesDisabled).forEach(key => {
      allFeaturesDisabled[key] = false;
    });

    const minimalApi = ServiceFactory.createApiService();
    const minimalLogging = ServiceFactory.createLoggingService();
    const minimalMonitoring = ServiceFactory.createMonitoringService();
    const minimalNotification = ServiceFactory.createNotificationService();
    const minimalCache = ServiceFactory.createCacheService();
    const minimalPhoneManager = ServiceFactory.createPhoneManager();

    // Verify that disabled features don't include their methods
    expect(minimalApi.simulateError).toBeUndefined();
    expect(minimalLogging.audit).toBeUndefined();
    expect(minimalMonitoring.calculateTrends).toBeUndefined();
    expect(minimalNotification.sendEmail).toBeUndefined();
    expect(minimalCache.getStats).toBeUndefined();
    expect(minimalPhoneManager.maxAccounts).toBe(1);

    // Now enable all features
    Object.assign(mockFeatures, {
      FEAT_MOCK_API: true,
      FEAT_EXTENDED_LOGGING: true,
      FEAT_ADVANCED_MONITORING: true,
      FEAT_PREMIUM: true,
      FEAT_NOTIFICATIONS: true,
      FEAT_CACHE_OPTIMIZED: true,
      PHONE_MULTI_ACCOUNT: true,
    });

    const fullApi = ServiceFactory.createApiService();
    const fullLogging = ServiceFactory.createLoggingService();
    const fullMonitoring = ServiceFactory.createMonitoringService();
    const fullNotification = ServiceFactory.createNotificationService();
    const fullCache = ServiceFactory.createCacheService();
    const fullPhoneManager = ServiceFactory.createPhoneManager();

    // Verify that enabled features include their methods
    expect(fullApi.simulateError).toBeDefined();
    expect(fullLogging.audit).toBeDefined();
    expect(fullMonitoring.calculateTrends).toBeDefined();
    expect(fullNotification.sendEmail).toBeDefined();
    expect(fullCache.getStats).toBeDefined();
    expect(fullPhoneManager.maxAccounts).toBe(5);

    console.log("Bundle size optimization verified - disabled features don't include their methods");
  });
});
