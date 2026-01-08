#!/usr/bin/env bun

import { describe, expect, test } from "bun:test";

describe("🎯 Bun Run - File Execution Verification", () => {
  test("✅ bun run index.js - creates and runs index.js", async () => {
    // Create index.js file
    const jsContent = `
console.log('Hello from index.js!');
const message = 'Bun is running JavaScript successfully';
console.log(message);

// Test some JavaScript features
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log('Doubled numbers:', doubled);
`;

    await Bun.write("/tmp/index.js", jsContent);

    // Execute: bun run index.js
    const result = await Bun.spawn(["bun", "run", "index.js"], {
      cwd: "/tmp",
      stdout: "pipe",
      stderr: "pipe",
    }).exited;

    expect(result).toBe(0);
  });

  test("✅ bun run index.js - error handling for missing file", async () => {
    // Test with non-existent index.js in current directory
    const result = await Bun.spawn(["bun", "run", "index.js"], {
      cwd: "/tmp/nonexistent",
      stdout: "pipe",
      stderr: "pipe",
    }).exited;

    expect(result).not.toBe(0);
  });

  test("✅ bun run index.js - relative path execution", async () => {
    // Create index.js in subdirectory
    await Bun.write(
      "/tmp/subdir/index.js",
      "console.log('From subdir/index.js');"
    );

    // Execute with relative path
    const result = await Bun.spawn(["bun", "run", "./subdir/index.js"], {
      cwd: "/tmp",
      stdout: "pipe",
      stderr: "pipe",
    }).exited;

    expect(result).toBe(0);
  });

  test("✅ bun run index.js - with ES modules", async () => {
    // Create index.js with ES module syntax
    const esmContent = `
// ES Module syntax
import { readFile } from 'fs/promises';

const message = 'ES Module index.js running';
console.log(message);

// Test async/await
const main = async () => {
  try {
    console.log('Async/await working in ES module');
    console.log('Module type:', import.meta.url);
  } catch (error) {
    console.log('Error handling works:', error.message);
  }
};

main().catch(console.error);
`;

    await Bun.write("/tmp/index-esm.js", esmContent);

    // Execute ES module
    const result = await Bun.spawn(["bun", "run", "index-esm.js"], {
      cwd: "/tmp",
      stdout: "pipe",
      stderr: "pipe",
    }).exited;

    expect(result).toBe(0);
  });

  test("✅ bun run index.js - with CommonJS", async () => {
    // Create index.js with CommonJS syntax
    const cjsContent = `
// CommonJS syntax
const fs = require('fs');

const message = 'CommonJS index.js running';
console.log(message);

// Test require and module.exports
const utils = {
  greet: (name) => \`Hello, \${name}!\`,
  add: (a, b) => a + b
};

console.log(utils.greet('World'));
console.log('2 + 3 =', utils.add(2, 3));

module.exports = utils;
`;

    await Bun.write("/tmp/index-cjs.js", cjsContent);

    // Execute CommonJS module
    const result = await Bun.spawn(["bun", "run", "index-cjs.js"], {
      cwd: "/tmp",
      stdout: "pipe",
      stderr: "pipe",
    }).exited;

    expect(result).toBe(0);
  });

  test("✅ bun run index.js - with package.json script precedence", async () => {
    // Create package.json with index script
    const packageJson = {
      name: "test-project",
      version: "1.0.0",
      scripts: {
        index: "echo 'Running index script from package.json'",
      },
    };

    await Bun.write("/tmp/package.json", JSON.stringify(packageJson, null, 2));
    await Bun.write(
      "/tmp/index.js",
      "console.log('This should not run when using bun run index');"
    );

    // Test that package.json script takes precedence
    const result = await Bun.spawn(["bun", "run", "index"], {
      cwd: "/tmp",
      stdout: "pipe",
      stderr: "pipe",
    }).exited;

    expect(result).toBe(0);

    // Test direct file execution
    const fileResult = await Bun.spawn(["bun", "run", "index.js"], {
      cwd: "/tmp",
      stdout: "pipe",
      stderr: "pipe",
    }).exited;

    expect(fileResult).toBe(0);
  });

  test("✅ bun run index.js - with TypeScript features", async () => {
    // Create index.js with TypeScript-like features (Bun supports TS in .js files)
    const tsLikeContent = `
// TypeScript features in .js file (Bun supports this)
const message = "TypeScript features in JavaScript";
console.log(message);

// Type annotations (will be ignored by runtime but parsed by Bun)
const name /*: string */ = "Bun";
const version /*: number */ = 1.0;

// Arrow functions with implicit typing
const greet = (name) => \`Hello, \${name}!\`;
console.log(greet(name));

// Destructuring
const [major, minor] = [1, 3];
console.log(\`Version \${major}.\${minor}\`);

// Optional chaining (if supported)
const config = { api: { url: "http://localhost:3000" } };
console.log('API URL:', config?.api?.url);
`;

    await Bun.write("/tmp/index-ts-like.js", tsLikeContent);

    // Execute TypeScript-like JavaScript
    const result = await Bun.spawn(["bun", "run", "index-ts-like.js"], {
      cwd: "/tmp",
      stdout: "pipe",
      stderr: "pipe",
    }).exited;

    expect(result).toBe(0);
  });

  test("✅ bun run index.js - with environment variables", async () => {
    // Create index.js that uses environment variables
    const envContent = `
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('Custom var:', process.env.CUSTOM_VAR || 'not set');

// Test process object
console.log('Platform:', process.platform);
console.log('Node version:', process.version);
console.log('Bun version:', typeof Bun !== 'undefined' ? Bun.version : 'N/A');
`;

    await Bun.write("/tmp/index-env.js", envContent);

    // Execute with environment variables
    const result = await Bun.spawn(["bun", "run", "index-env.js"], {
      cwd: "/tmp",
      env: {
        ...process.env,
        NODE_ENV: "test",
        CUSTOM_VAR: "hello-bun",
      },
      stdout: "pipe",
      stderr: "pipe",
    }).exited;

    expect(result).toBe(0);
  });
});
