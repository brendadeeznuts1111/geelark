#!/usr/bin/env bun
// Test the Dev HQ Test Runner with different options

import { DevHQTestRunner } from "./dev-hq-test.js";

const testRunner = new DevHQTestRunner();

async function demonstrateTestRunner() {
  console.log("🎯 Dev HQ Test Runner Demonstration\n");

  // Test 1: Basic test run
  console.log("1️⃣ Basic Test Run:");
  await testRunner.run({ verbose: true });

  // Test 2: Coverage mode
  console.log("\n2️⃣ Coverage Mode:");
  await testRunner.coverage({ verbose: true });

  // Test 3: Filter mode
  console.log("\n3️⃣ Filter Mode:");
  await testRunner.filter("api-fixes", { verbose: true });

  // Test 4: Watch mode (brief demo)
  console.log("\n4️⃣ Watch Mode (brief):");
  const watchProc = Bun.spawn(["bun", "dev-hq-test.ts", "watch"], {
    stdout: "inherit",
    stderr: "inherit",
  });

  // Let it run briefly then stop
  setTimeout(() => {
    watchProc.kill();
    console.log("\n✅ Demo completed!");
  }, 3000);
}

// Run demonstration
demonstrateTestRunner().catch(console.error);
