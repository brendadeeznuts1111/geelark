#!/usr/bin/env bun

import { describe, expect, test } from "bun:test";

describe("👁️ Bun.watch API - File System Monitoring", () => {
  const tempDir = "/tmp/bun-watch-test";

  test("✅ Basic file watching with recursive: true", async () => {
    // Create test directory structure
    await Bun.write(`${tempDir}/watch-test.txt`, "Initial content");
    await Bun.write(`${tempDir}/subdir/nested.txt`, "Nested content");

    let changeCount = 0;
    const changes: Array<{ event: string; filename: string }> = [];

    // Start watching
    const watcher = Bun.watch(process.cwd(), { recursive: true });

    watcher.on("change", (event, filename) => {
      changeCount++;
      changes.push({ event, filename: filename || "unknown" });
      console.log(`👁️ File change: ${event} - ${filename}`);
    });

    // Wait a moment for watcher to initialize
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Make some changes
    await Bun.write(`${tempDir}/watch-test.txt`, "Updated content");
    await Bun.write(`${tempDir}/new-file.txt`, "New file content");
    await Bun.write(`${tempDir}/subdir/nested.txt`, "Updated nested");

    // Wait for changes to be detected
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verify changes were detected
    expect(changeCount).toBeGreaterThan(0);
    expect(changes.length).toBeGreaterThan(0);

    // Cleanup
    watcher.close();
    console.log(`✅ Detected ${changeCount} file changes`);
  });

  test("✅ Watch specific directory", async () => {
    // Create test files
    await Bun.write(`${tempDir}/specific.txt`, "Specific directory test");
    await Bun.write(`${tempDir}/outside.txt`, "Outside watch directory");

    let specificChanges = 0;
    const watcher = Bun.watch(tempDir, { recursive: true });

    watcher.on("change", (event, filename) => {
      specificChanges++;
      console.log(`📁 Specific dir change: ${event} - ${filename}`);
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Change file inside watched directory
    await Bun.write(`${tempDir}/specific.txt`, "Updated specific");

    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(specificChanges).toBeGreaterThan(0);

    watcher.close();
  });

  test("✅ Multiple event types", async () => {
    await Bun.write(`${tempDir}/multi-test.txt`, "Multi event test");

    const events: Array<{ type: string; event: string; filename: string }> = [];
    const watcher = Bun.watch(tempDir, { recursive: true });

    watcher.on("change", (event, filename) => {
      events.push({ type: "change", event, filename: filename || "unknown" });
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Test different operations
    await Bun.write(`${tempDir}/multi-test.txt`, "Updated");
    await new Promise((resolve) => setTimeout(resolve, 50));

    await Bun.write(`${tempDir}/new-multi.txt`, "New file");
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Remove file
    await Bun.remove(`${tempDir}/new-multi.txt`);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(events.length).toBeGreaterThan(0);

    watcher.close();
    console.log(`✅ Captured ${events.length} file system events`);
  });

  test("✅ Watch with file patterns", async () => {
    // Create different file types
    await Bun.write(`${tempDir}/test.js`, "console.log('test');");
    await Bun.write(`${tempDir}/style.css`, "body { color: red; }");
    await Bun.write(`${tempDir}/data.json`, '{"test": true}');

    const jsChanges: string[] = [];
    const watcher = Bun.watch(tempDir, { recursive: true });

    watcher.on("change", (event, filename) => {
      if (filename?.endsWith(".js")) {
        jsChanges.push(filename);
        console.log(`📜 JS file changed: ${filename}`);
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Update JavaScript file
    await Bun.write(`${tempDir}/test.js`, "console.log('updated');");

    // Update CSS file (should be ignored)
    await Bun.write(`${tempDir}/style.css`, "body { color: blue; }");

    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(jsChanges.length).toBeGreaterThan(0);
    expect(jsChanges.some((file) => file.includes("test.js"))).toBe(true);

    watcher.close();
  });

  test("✅ Error handling and cleanup", async () => {
    const watcher = Bun.watch(tempDir, { recursive: true });

    let errorCount = 0;
    watcher.on("error", (error) => {
      errorCount++;
      console.log(`❌ Watcher error: ${error}`);
    });

    // Test normal operation
    await Bun.write(`${tempDir}/error-test.txt`, "Test content");
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Close watcher
    watcher.close();

    // Try to use closed watcher (should handle gracefully)
    expect(() => watcher.close()).not.toThrow();

    console.log(`✅ Error handling test completed with ${errorCount} errors`);
  });

  test("✅ Performance with many files", async () => {
    // Create multiple files
    const fileCount = 10;
    const files: string[] = [];

    for (let i = 0; i < fileCount; i++) {
      const filename = `${tempDir}/perf-${i}.txt`;
      await Bun.write(filename, `Content ${i}`);
      files.push(filename);
    }

    let changeCount = 0;
    const startTime = Date.now();

    const watcher = Bun.watch(tempDir, { recursive: true });
    watcher.on("change", () => changeCount++);

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Update all files rapidly
    const updatePromises = files.map((file, i) =>
      Bun.write(file, `Updated content ${i}`)
    );

    await Promise.all(updatePromises);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const duration = Date.now() - startTime;

    expect(changeCount).toBeGreaterThan(0);
    expect(duration).toBeLessThan(2000); // Should complete within 2 seconds

    watcher.close();

    console.log(
      `✅ Performance test: ${fileCount} files, ${changeCount} changes in ${duration}ms`
    );
  });

  test("✅ Integration with Dev HQ automation", async () => {
    // Create a Dev HQ configuration file
    const config = {
      name: "test-project",
      scripts: {
        build: "echo 'Building...'",
        test: "bun test",
      },
    };

    await Bun.write(`${tempDir}/package.json`, JSON.stringify(config, null, 2));

    let configChanges = 0;
    let testChanges = 0;

    const watcher = Bun.watch(tempDir, { recursive: true });

    watcher.on("change", (event, filename) => {
      if (filename?.includes("package.json")) {
        configChanges++;
        console.log(`📦 Config changed: ${event} - ${filename}`);
      }
      if (filename?.includes(".test.")) {
        testChanges++;
        console.log(`🧪 Test file changed: ${event} - ${filename}`);
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Update configuration
    config.version = "1.0.1";
    await Bun.write(`${tempDir}/package.json`, JSON.stringify(config, null, 2));

    // Create a test file
    await Bun.write(
      `${tempDir}/integration.test.ts`,
      `
import { test, expect } from 'bun:test';
test('integration', () => expect(true).toBe(true));
    `
    );

    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(configChanges).toBeGreaterThan(0);
    expect(testChanges).toBeGreaterThan(0);

    watcher.close();

    console.log(
      `✅ Dev HQ integration: ${configChanges} config changes, ${testChanges} test changes`
    );
  });
});
