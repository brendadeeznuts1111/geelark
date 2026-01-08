#!/usr/bin/env bun

// @ts-ignore - bun:test types are available when running with Bun
import { describe, expect, it } from "bun:test";
// @ts-ignore - test utilities are available when running with Bun
import { testUtils } from "../../config/test-setup";

// Note: This file demonstrates Bun's optimized file I/O APIs
// All Bun globals are available when running with Bun test runner
// @ts-ignore - Bun globals are available when running with Bun

describe("Bun File I/O Best Practices", () => {
  const tempDir = testUtils.createTempDir();

  it("should demonstrate Bun.file for reading", async () => {
    // Create a test file using Bun.write
    const testFile = `${tempDir}/test-read.txt`;
    const content = "Hello, Bun file I/O!";

    await Bun.write(testFile, content);

    // Read using Bun.file - optimized for performance
    const file = Bun.file(testFile);
    const readContent = await file.text();

    expect(readContent).toBe(content);
    expect(file.size).toBe(content.length);
    expect(file.type).toBe("text/plain");

    // Cleanup
    testUtils.cleanupTempDir(tempDir);
  });

  it("should demonstrate Bun.write for writing", async () => {
    const testFile = `${tempDir}/test-write.txt`;
    const content = "Written with Bun.write()";

    // Bun.write is optimized for performance
    await Bun.write(testFile, content);

    // Verify the write
    const file = Bun.file(testFile);
    expect(await file.text()).toBe(content);

    // Test writing different data types
    const jsonFile = `${tempDir}/test.json`;
    const jsonData = { test: true, message: "Bun I/O" };

    await Bun.write(jsonFile, JSON.stringify(jsonData));
    const readJson = JSON.parse(await Bun.file(jsonFile).text());

    expect(readJson).toEqual(jsonData);

    testUtils.cleanupTempDir(tempDir);
  });

  it("should demonstrate file existence checking", async () => {
    const testFile = `${tempDir}/existence.txt`;

    // Check non-existent file
    expect(await Bun.file(testFile).exists()).toBe(false);

    // Create file
    await Bun.write(testFile, "I exist!");

    // Check existing file
    expect(await Bun.file(testFile).exists()).toBe(true);

    testUtils.cleanupTempDir(tempDir);
  });

  it("should demonstrate streaming with file I/O", async () => {
    const testFile = `${tempDir}/stream.txt`;
    const largeContent = "Line 1\n".repeat(1000);

    // Write large content
    await Bun.write(testFile, largeContent);

    // Read as stream for memory efficiency
    const file = Bun.file(testFile);
    const stream = file.stream();

    const reader = stream.getReader();
    let result = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += new TextDecoder().decode(value);
    }

    expect(result).toBe(largeContent);

    testUtils.cleanupTempDir(tempDir);
  });

  it("should demonstrate binary file handling", async () => {
    const binaryFile = `${tempDir}/binary.bin`;
    const binaryData = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"

    // Write binary data
    await Bun.write(binaryFile, binaryData);

    // Read binary data
    const file = Bun.file(binaryFile);
    const readBinary = await file.arrayBuffer();
    const readArray = new Uint8Array(readBinary);

    expect(readArray).toEqual(binaryData);

    testUtils.cleanupTempDir(tempDir);
  });
});
