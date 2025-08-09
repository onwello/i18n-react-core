// Integration Tests Index
// This file organizes all integration tests for the React package

export * from './react-app.integration.spec';
export * from './nextjs.integration.spec';
export * from './bundle.integration.spec';
export * from './performance.integration.spec';

// Integration test configuration
export const integrationTestConfig = {
  timeout: 10000, // 10 seconds for integration tests
  retries: 2, // Retry failed integration tests
  parallel: false, // Run integration tests sequentially
};

// Integration test utilities
export const integrationTestUtils = {
  // Helper to create test configuration
  createTestConfig: (overrides = {}) => ({
    defaultLocale: 'en',
    supportedLocales: ['en', 'fr', 'es'],
    translationsPath: 'test-translations',
    debug: false,
    serviceName: 'integration-test',
    ...overrides,
  }),

  // Helper to wait for async operations
  waitForAsync: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to measure performance
  measurePerformance: (fn: () => void | Promise<void>) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    return { duration: end - start, result };
  },

  // Helper to check memory usage
  getMemoryUsage: () => {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
    };
  },
};
