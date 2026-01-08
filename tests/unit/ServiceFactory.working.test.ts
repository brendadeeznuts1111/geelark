import { beforeEach, describe, expect, mock, test } from "bun:test";
import { ServiceFactory } from "../../src/services/ServiceFactory";

// Mock fetch for API testing
const mockResponse = {
  ok: true,
  status: 200,
  statusText: "OK",
  json: () => Promise.resolve({ success: true, data: "test" }),
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  blob: () => Promise.resolve(new Blob()),
  formData: () => Promise.resolve(new FormData()),
  text: () => Promise.resolve("test"),
  bytes: () => Promise.resolve(new Uint8Array()),
  preconnect: () => Promise.resolve(),
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
  abort: () => {},
  clone: () => mockResponse,
  body: null,
  bodyUsed: false,
  headers: new Headers(),
  redirected: false,
  trailer: Promise.resolve(new Headers()),
  type: "basic" as ResponseType,
  url: "",
} as unknown as Response;

// Create a complete fetch mock
const mockFetch = Object.assign(
  mock(() => Promise.resolve(mockResponse)),
  {
    preconnect: () => Promise.resolve(),
  }
);

global.fetch = mockFetch as typeof fetch;

// Mock console to suppress logs during tests
beforeEach(() => {
  console.log = mock(() => {});
});

describe("ServiceFactory - Basic Functionality", () => {
  test("should create all service types", () => {
    // Test that all factory methods exist and return objects
    const apiService = ServiceFactory.createApiService();
    const loggingService = ServiceFactory.createLoggingService();
    const monitoringService = ServiceFactory.createMonitoringService();
    const notificationService = ServiceFactory.createNotificationService();
    const cacheService = ServiceFactory.createCacheService();
    const phoneManager = ServiceFactory.createPhoneManager();

    // All services should be defined
    expect(apiService).toBeDefined();
    expect(loggingService).toBeDefined();
    expect(monitoringService).toBeDefined();
    expect(notificationService).toBeDefined();
    expect(cacheService).toBeDefined();
    expect(phoneManager).toBeDefined();

    // All services should have basic methods
    expect(typeof apiService.request).toBe("function");
    expect(typeof loggingService.log).toBe("function");
    expect(typeof monitoringService.trackMetric).toBe("function");
    expect(typeof notificationService.send).toBe("function");
    expect(typeof cacheService.get).toBe("function");
    expect(typeof phoneManager.createPhone).toBe("function");
  });

  test("API service should make requests", async () => {
    const apiService = ServiceFactory.createApiService();
    const response = await apiService.request("/test");

    expect(response.success).toBe(true);
    expect(response.data).toBe("test");
  });

  test("logging service should log messages", () => {
    const loggingService = ServiceFactory.createLoggingService();
    loggingService.log("test message");

    expect(console.log).toHaveBeenCalled();
  });

  test("monitoring service should track metrics", () => {
    const monitoringService = ServiceFactory.createMonitoringService();
    monitoringService.trackMetric("test_metric", 100);

    expect(console.log).toHaveBeenCalled();
  });

  test("notification service should send notifications", async () => {
    const notificationService = ServiceFactory.createNotificationService();
    await notificationService.send("test notification");

    expect(console.log).toHaveBeenCalled();
  });

  test("cache service should store and retrieve values", () => {
    const cacheService = ServiceFactory.createCacheService();
    cacheService.set("test_key", "test_value");
    const value = cacheService.get("test_key");

    expect(value).toBe("test_value");
  });

  test("phone manager should create phones", async () => {
    const phoneManager = ServiceFactory.createPhoneManager();
    const phone = await phoneManager.createPhone({ name: "Test Phone" });

    expect(phone).toBeDefined();
    expect(phone.name).toBe("Test Phone");
    expect(phone.id).toBeDefined();
  });

  test("phone manager should enforce account limits", async () => {
    const phoneManager = ServiceFactory.createPhoneManager();

    // Create first phone
    await phoneManager.createPhone({ name: "Phone 1" });

    // Second phone should fail due to account limit
    await expect(phoneManager.createPhone({ name: "Phone 2" })).rejects.toThrow("Account limit reached");
  });
});

describe("ServiceFactory - Service Methods", () => {
  test("API service should have health check", () => {
    const apiService = ServiceFactory.createApiService();
    expect(typeof apiService.healthCheck).toBe("function");
  });

  test("phone manager should have method factory", () => {
    const phoneManager = ServiceFactory.createPhoneManager();
    expect(typeof phoneManager.getPhoneMethods).toBe("function");
  });

  test("cache service should have clear method", () => {
    const cacheService = ServiceFactory.createCacheService();
    expect(typeof cacheService.clear).toBe("function");
  });

  test("monitoring service should handle metric tracking", () => {
    const monitoringService = ServiceFactory.createMonitoringService();

    // Track multiple metrics
    monitoringService.trackMetric("cpu_usage", 75.5);
    monitoringService.trackMetric("memory_usage", 1024);
    monitoringService.trackMetric("response_time", 150);

    // Should not throw errors
    expect(true).toBe(true);
  });

  test("notification service should handle async sending", async () => {
    const notificationService = ServiceFactory.createNotificationService();

    // Should not throw errors
    await expect(notificationService.send("Async test message")).resolves.toBeUndefined();
  });
});

describe("ServiceFactory - Error Handling", () => {
  test("API service should handle fetch errors", async () => {
    // Mock fetch to reject
    const errorFetch = Object.assign(
      mock(() => Promise.reject(new Error("Network error"))),
      {
        preconnect: () => Promise.resolve(),
      }
    );
    global.fetch = errorFetch as typeof fetch;

    const apiService = ServiceFactory.createApiService();

    await expect(apiService.request("/error-test")).rejects.toThrow("Network error");
  });

  test("cache service should handle missing keys", () => {
    const cacheService = ServiceFactory.createCacheService();
    const value = cacheService.get("nonexistent_key");

    expect(value).toBeNull();
  });

  test("phone manager should validate phone creation", async () => {
    const phoneManager = ServiceFactory.createPhoneManager();

    // Should create phone with valid config
    const phone = await phoneManager.createPhone({
      name: "Valid Phone",
      number: "+1234567890"
    });

    expect(phone).toBeDefined();
    expect(phone.name).toBe("Valid Phone");
  });
});

describe("ServiceFactory - Performance", () => {
  test("should create services quickly", () => {
    const startTime = performance.now();

    // Create all services
    ServiceFactory.createApiService();
    ServiceFactory.createLoggingService();
    ServiceFactory.createMonitoringService();
    ServiceFactory.createNotificationService();
    ServiceFactory.createCacheService();
    ServiceFactory.createPhoneManager();

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should complete in reasonable time
    expect(duration).toBeLessThan(100);
  });

  test("should handle multiple service creations", () => {
    const iterations = 10;

    for (let i = 0; i < iterations; i++) {
      const service = ServiceFactory.createApiService();
      expect(service).toBeDefined();
    }
  });

  test("should handle concurrent service creation", async () => {
    const promises = [
      Promise.resolve(ServiceFactory.createApiService()),
      Promise.resolve(ServiceFactory.createLoggingService()),
      Promise.resolve(ServiceFactory.createMonitoringService()),
    ];

    const results = await Promise.all(promises);

    expect(results).toHaveLength(3);
    results.forEach(service => {
      expect(service).toBeDefined();
    });
  });
});

describe("ServiceFactory - Integration", () => {
  test("should work with service combinations", async () => {
    // Reset fetch mock for this test
    const integrationMockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      json: () => Promise.resolve({ success: true, data: "test" }),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob()),
      formData: () => Promise.resolve(new FormData()),
      text: () => Promise.resolve("test"),
      bytes: () => Promise.resolve(new Uint8Array()),
      preconnect: () => Promise.resolve(),
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
      abort: () => {},
      clone: () => ({} as Response),
      body: null,
      bodyUsed: false,
      headers: new Headers(),
      redirected: false,
      trailer: Promise.resolve(new Headers()),
      type: "basic" as ResponseType,
      url: "",
    } as unknown as Response;

    const integrationFetch = Object.assign(
      mock(() => Promise.resolve(integrationMockResponse)),
      {
        preconnect: () => Promise.resolve(),
      }
    );
    global.fetch = integrationFetch as typeof fetch;

    const apiService = ServiceFactory.createApiService();
    const loggingService = ServiceFactory.createLoggingService();
    const cacheService = ServiceFactory.createCacheService();

    // Make API call
    const response = await apiService.request("/api/test");

    // Log the response
    loggingService.log("API call completed", { success: response.success });

    // Cache the response
    cacheService.set("api_response", JSON.stringify(response));

    // Retrieve from cache
    const cachedResponse = cacheService.get("api_response");
    const parsedResponse = JSON.parse(cachedResponse);

    expect(parsedResponse.success).toBe(true);
    expect(console.log).toHaveBeenCalled();
  });

  test("should handle phone manager with other services", async () => {
    const phoneManager = ServiceFactory.createPhoneManager();
    const loggingService = ServiceFactory.createLoggingService();

    // Create phone
    const phone = await phoneManager.createPhone({
      name: "Integration Phone",
      number: "+1234567890"
    });

    // Log phone creation
    loggingService.log("Phone created", { phoneId: phone.id });

    expect(phone).toBeDefined();
    expect(phone.id).toBeDefined();
    expect(console.log).toHaveBeenCalled();
  });

  test("should maintain service isolation", () => {
    const loggingService1 = ServiceFactory.createLoggingService();
    const loggingService2 = ServiceFactory.createLoggingService();
    const monitoringService1 = ServiceFactory.createMonitoringService();
    const monitoringService2 = ServiceFactory.createMonitoringService();

    // Services should be independent
    loggingService1.log("Service 1 message");
    loggingService2.log("Service 2 message");

    // Both should work independently
    expect(loggingService1).toBeDefined();
    expect(loggingService2).toBeDefined();
    expect(monitoringService1).toBeDefined();
    expect(monitoringService2).toBeDefined();
  });
});
