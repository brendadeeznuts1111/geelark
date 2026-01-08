#!/usr/bin/env bun

import { describe, expect, test } from "bun:test";

describe("🎯 Perfect Flag Separation Pattern Tests", () => {
  test("bun flags + cli flags", async () => {
    const { stdout } = await Bun.spawn(
      ["bun", "--smol", "dev-hq-cli.ts", "insights", "--table"],
      {
        stdout: "pipe",
        stderr: "pipe",
      }
    );

    const output = await new Response(stdout).text();

    // Bun processes --smol flag, CLI only sees remaining args
    expect(output).toContain("🟡 Bun flags: []"); // Bun handled --smol already
    expect(output).toContain("🟢 CLI flags: [--table]");
    expect(output).toContain("🔵 Command: insights");
    expect(output).toContain("Dev HQ");
  });

  test("multiple bun flags + multiple cli flags", async () => {
    const { stdout } = await Bun.spawn(
      [
        "bun",
        "--hot",
        "--watch",
        "dev-hq-cli.ts",
        "git",
        "--json",
        "--verbose",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      }
    );

    const output = await new Response(stdout).text();

    // Should show proper flag separation
    expect(output).toContain("🟡 Bun flags: [--hot, --watch]");
    expect(output).toContain("🟢 CLI flags: [--json, --verbose]");
    expect(output).toContain("🔵 Command: git");

    // Should contain JSON output
    expect(output).toContain("{");
    expect(output).toContain("}");
  });

  test("bun define flag with cli timeout flag", async () => {
    const { stdout } = await Bun.spawn(
      [
        "bun",
        "--define",
        "NODE_ENV=production",
        "dev-hq-cli.ts",
        "test",
        "--timeout",
        "5000",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      }
    );

    const output = await new Response(stdout).text();

    // Should parse complex flag combinations
    expect(output).toContain("🟡 Bun flags: [--define, NODE_ENV=production]");
    expect(output).toContain("🟢 CLI flags: [--timeout, 5000]");
    expect(output).toContain("🔵 Command: test");
  });

  test("bun watch flag with cli quiet flag", async () => {
    const { stdout } = await Bun.spawn(
      ["bun", "--watch", "dev-hq-cli.ts", "health", "--quiet"],
      {
        stdout: "pipe",
        stderr: "pipe",
      }
    );

    const output = await new Response(stdout).text();

    expect(output).toContain("🟡 Bun flags: [--watch]");
    expect(output).toContain("🟢 CLI flags: [--quiet]");
    expect(output).toContain("🔵 Command: health");
  });

  test("no bun flags + cli flags only", async () => {
    const { stdout } = await Bun.spawn(
      ["bun", "dev-hq-cli.ts", "cloc", "--json"],
      {
        stdout: "pipe",
        stderr: "pipe",
      }
    );

    const output = await new Response(stdout).text();

    expect(output).toContain("🟡 Bun flags: []");
    expect(output).toContain("🟢 CLI flags: [--json]");
    expect(output).toContain("🔵 Command: cloc");
  });

  test("bun flags only + no cli flags", async () => {
    const { stdout } = await Bun.spawn(
      ["bun", "--smol", "dev-hq-cli.ts", "server"],
      {
        stdout: "pipe",
        stderr: "pipe",
      }
    );

    const output = await new Response(stdout).text();

    expect(output).toContain("🟡 Bun flags: [--smol]");
    expect(output).toContain("🟢 CLI flags: []");
    expect(output).toContain("🔵 Command: server");
  });

  test("complex real-world scenario", async () => {
    const { stdout } = await Bun.spawn(
      [
        "bun",
        "--hot",
        "--watch",
        "--define",
        "DEBUG=true",
        "dev-hq-cli.ts",
        "run",
        "npm run build",
        "--timeout",
        "60000",
        "--verbose",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      }
    );

    const output = await new Response(stdout).text();

    expect(output).toContain(
      "🟡 Bun flags: [--hot, --watch, --define, DEBUG=true]"
    );
    expect(output).toContain(
      "🟢 CLI flags: [npm run build, --timeout, 60000, --verbose]"
    );
    expect(output).toContain("🔵 Command: run");
  });

  test("output formatting verification", async () => {
    // Test table output
    const { stdout: tableOutput } = await Bun.spawn(
      ["bun", "dev-hq-cli.ts", "insights", "--table"],
      {
        stdout: "pipe",
        stderr: "pipe",
      }
    );

    const tableText = await new Response(tableOutput).text();
    expect(tableText).toContain("📊 Tabular Output:");

    // Test JSON output
    const { stdout: jsonOutput } = await Bun.spawn(
      ["bun", "dev-hq-cli.ts", "insights", "--json"],
      {
        stdout: "pipe",
        stderr: "pipe",
      }
    );

    const jsonText = await new Response(jsonOutput).text();
    expect(jsonText).toContain("{");
    expect(jsonText).toContain("}");

    // Test standard output
    const { stdout: standardOutput } = await Bun.spawn(
      ["bun", "dev-hq-cli.ts", "insights"],
      {
        stdout: "pipe",
        stderr: "pipe",
      }
    );

    const standardText = await new Response(standardOutput).text();
    expect(standardText).toContain("📋 Standard Output:");
  });

  test("flag parsing edge cases", async () => {
    // Test with flags that have values
    const { stdout } = await Bun.spawn(
      [
        "bun",
        "--define",
        "NODE_ENV=production",
        "--filter",
        "package",
        "dev-hq-cli.ts",
        "test",
        "--timeout",
        "10000",
        "--output",
        "results.json",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      }
    );

    const output = await new Response(stdout).text();

    expect(output).toContain(
      "🟡 Bun flags: [--define, NODE_ENV=production, --filter, package]"
    );
    expect(output).toContain(
      "🟢 CLI flags: [--timeout, 10000, --output, results.json]"
    );
    expect(output).toContain("🔵 Command: test");
  });

  test("help command shows pattern documentation", async () => {
    const { stdout } = await Bun.spawn(["bun", "dev-hq-cli.ts"], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = await new Response(stdout).text();

    // Should contain the pattern documentation
    expect(output).toContain(
      "Pattern: bun [bun-flags] dev-hq [command] [cli-flags]"
    );
    expect(output).toContain("Bun Flags (handled by Bun):");
    expect(output).toContain("CLI Flags (handled by CLI):");
    expect(output).toContain(
      "Perfect separation: Bun handles runtime, CLI handles formatting!"
    );
  });
});
