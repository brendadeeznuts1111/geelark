/**
 * Shared benchmarking utilities following Bun best practices
 */

export interface BenchmarkResult {
  name: string;
  average: number; // in milliseconds
  min: number;
  max: number;
  median: number;
  stdDev: number;
  iterations: number;
  unit: "ms" | "μs" | "ns";
}

/**
 * Measure function execution time using performance.now()
 */
export function measure<T>(fn: () => T): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  return { result, duration: end - start };
}

/**
 * Measure function execution time using Bun.nanoseconds()
 */
export function measureNanoseconds<T>(fn: () => T): { result: T; duration: number } {
  const start = Bun.nanoseconds();
  const result = fn();
  const end = Bun.nanoseconds();
  return { result, duration: (end - start) / 1_000_000 }; // Convert to milliseconds
}

/**
 * Run benchmark with multiple iterations and calculate statistics
 */
export function benchmark(
  name: string,
  fn: () => void,
  iterations: number = 1000
): BenchmarkResult {
  const times: number[] = [];

  // Warmup run (not measured)
  for (let i = 0; i < Math.min(10, iterations); i++) {
    fn();
  }

  // Force GC before benchmarking
  Bun.gc(true);

  // Actual benchmark runs
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);

    // Periodic GC to avoid memory pressure
    if (i % 100 === 0 && i > 0) {
      Bun.gc(true);
    }
  }

  times.sort((a, b) => a - b);

  const sum = times.reduce((a, b) => a + b, 0);
  const average = sum / iterations;
  const min = times[0];
  const max = times[times.length - 1];
  const median = times[Math.floor(iterations / 2)];

  // Calculate standard deviation
  const variance = times.reduce((acc, time) => acc + Math.pow(time - average, 2), 0) / iterations;
  const stdDev = Math.sqrt(variance);

  // Determine unit based on average value
  let unit: "ms" | "μs" | "ns" = "ms";
  let displayAverage = average;
  let displayMin = min;
  let displayMax = max;
  let displayMedian = median;
  let displayStdDev = stdDev;

  if (average < 0.001) {
    unit = "ns";
    displayAverage = average * 1_000_000;
    displayMin = min * 1_000_000;
    displayMax = max * 1_000_000;
    displayMedian = median * 1_000_000;
    displayStdDev = stdDev * 1_000_000;
  } else if (average < 1) {
    unit = "μs";
    displayAverage = average * 1_000;
    displayMin = min * 1_000;
    displayMax = max * 1_000;
    displayMedian = median * 1_000;
    displayStdDev = stdDev * 1_000;
  }

  return {
    name,
    average: displayAverage,
    min: displayMin,
    max: displayMax,
    median: displayMedian,
    stdDev: displayStdDev,
    iterations,
    unit,
  };
}

/**
 * Compare current benchmark result against baseline
 */
export function compareBaseline(
  current: BenchmarkResult,
  baseline: BenchmarkResult
): {
  faster: boolean;
  percentChange: number;
  message: string;
} {
  const percentChange = ((baseline.average - current.average) / baseline.average) * 100;
  const faster = current.average < baseline.average;

  const sign = faster ? "-" : "+";
  const message = `${current.name}: ${faster ? "✅ faster" : "⚠️ slower"} by ${sign}${Math.abs(percentChange).toFixed(2)}% (${current.average.toFixed(4)}${current.unit} vs ${baseline.average.toFixed(4)}${baseline.unit})`;

  return {
    faster,
    percentChange,
    message,
  };
}

/**
 * Force garbage collection between benchmark runs
 */
export function gcBetweenRuns(): void {
  Bun.gc(true);
}

/**
 * Format benchmark result for display
 */
export function formatBenchmarkResult(result: BenchmarkResult): string {
  return `
📊 ${result.name}
   Average: ${result.average.toFixed(4)} ${result.unit}
   Median:  ${result.median.toFixed(4)} ${result.unit}
   Min:     ${result.min.toFixed(4)} ${result.unit}
   Max:     ${result.max.toFixed(4)} ${result.unit}
   StdDev:  ${result.stdDev.toFixed(4)} ${result.unit}
   Runs:    ${result.iterations}
`;
}

/**
 * Create a benchmark suite with consistent settings
 */
export function createBenchmarkSuite(name: string, iterations: number = 1000) {
  return {
    name,
    iterations,
    run: (testName: string, fn: () => void) => {
      const result = benchmark(testName, fn, iterations);
      console.log(formatBenchmarkResult(result));
      return result;
    },
  };
}

