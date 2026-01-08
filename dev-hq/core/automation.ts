// dev-hq/automation.ts - Spawn-powered automation
import type { Subprocess } from "bun";

export class DevHQAutomation {
  private processes = new Map<string, Subprocess>();

  // 🏃‍♂️ Run commands with real-time output
  async runCommand(
    label: string,
    cmd: string[],
    options?: {
      cwd?: string;
      env?: Record<string, string>;
      stream?: boolean;
      timeout?: number;
    }
  ) {
    console.log(`▶️  Running: ${cmd.join(" ")}`);

    try {
      const proc = Bun.spawn(cmd, {
        cwd: options?.cwd || process.cwd(),
        env: { ...process.env, ...options?.env },
        stdout: options?.stream ? "inherit" : "pipe",
        stderr: options?.stream ? "inherit" : "pipe",
      });

      this.processes.set(label, proc);

      if (!options?.stream) {
        try {
          const [stdout, stderr] = await Promise.all([
            new Response(proc.stdout as unknown as ReadableStream).text(),
            new Response(proc.stderr as unknown as ReadableStream).text(),
          ]);

          await proc.exited;
          return { stdout, stderr, exitCode: proc.exitCode };
        } catch (error: any) {
          // Handle errors during execution
          return {
            stdout: "",
            stderr: error.message || String(error),
            exitCode: 1,
            error: true,
          };
        }
      }

      return proc;
    } catch (error: any) {
      // Handle spawn errors (like command not found)
      return {
        stdout: "",
        stderr: error.message || String(error),
        exitCode: 1,
        error: true,
      };
    }
  }

  // 📊 Get system resource usage
  async getResourceUsage() {
    const usage: Record<string, any> = {};

    for (const [label, proc] of this.processes) {
      try {
        const stats = proc.resourceUsage();
        if (stats) {
          usage[label] = {
            cpu: `${stats.cpuTime.total.toFixed(2)}ms`,
            memory: `${(stats.maxRSS / 1024 / 1024).toFixed(2)}MB`,
            contextSwitches: stats.contextSwitches.voluntary,
          };
        }
      } catch {
        // Process might have exited
      }
    }

    return usage;
  }

  // 🧹 Cleanup all processes
  async cleanup() {
    for (const [label, proc] of this.processes) {
      if (!proc.killed) {
        proc.kill();
        console.log(`🛑 Killed: ${label}`);
      }
    }

    this.processes.clear();
  }

  // 📋 List all running processes
  listProcesses() {
    const processes: Array<{ label: string; pid: number; killed: boolean }> = [];

    for (const [label, proc] of this.processes) {
      processes.push({
        label,
        pid: proc.pid,
        killed: proc.killed
      });
    }

    return processes;
  }

  // 📊 Get process status
  getProcessStatus(label: string) {
    const proc = this.processes.get(label);
    if (!proc) {
      return { exists: false, status: 'not_found', label };
    }

    return {
      exists: true,
      label,
      pid: proc.pid,
      killed: proc.killed,
      status: proc.killed ? 'killed' : 'running'
    };
  }

  // 🔪 Kill a specific process
  killProcess(label: string) {
    const proc = this.processes.get(label);
    if (!proc) {
      return { success: false, reason: 'Process not found' };
    }

    if (proc.killed) {
      return { success: false, reason: 'Process already killed' };
    }

    proc.kill();
    return { success: true, pid: proc.pid };
  }
}

// 📦 Pre-built automations for Dev HQ
export const DevHQActions = {
  // 🔍 Code analysis automations
  async analyzeWithCLOC() {
    const auto = new DevHQAutomation();
    try {
      const result = await auto.runCommand("cloc", ["cloc", "--json", "."]);

      if (result && "stdout" in result && result.exitCode === 0) {
        return JSON.parse(result.stdout as string);
      }
      return {
        error: "cloc command failed or not available",
        message: "Install cloc with: brew install cloc (macOS) or apt-get install cloc (Linux)",
        fallback: await this.fallbackCodeAnalysis(),
      };
    } catch (error: any) {
      return {
        error: error.message || "cloc not found",
        message: "Install cloc with: brew install cloc (macOS) or apt-get install cloc (Linux)",
        fallback: await this.fallbackCodeAnalysis(),
      };
    }
  },

  // 🔍 Fallback code analysis when cloc is not available
  async fallbackCodeAnalysis() {
    try {
      const fs = await import("fs/promises");
      const path = await import("path");

      let totalLines = 0;
      let fileCount = 0;
      const extensions: Record<string, number> = {};

      async function countLinesInDir(dir: string): Promise<void> {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            // Skip common directories
            if (entry.name.startsWith(".") ||
                entry.name === "node_modules" ||
                entry.name === "dist" ||
                entry.name === ".git") {
              continue;
            }

            if (entry.isDirectory()) {
              await countLinesInDir(fullPath);
            } else if (entry.isFile()) {
              const ext = path.extname(entry.name) || "no-extension";
              extensions[ext] = (extensions[ext] || 0) + 1;

              try {
                const content = await fs.readFile(fullPath, "utf-8");
                const lines = content.split("\n").length;
                totalLines += lines;
                fileCount++;
              } catch {
                // Skip binary files or files we can't read
              }
            }
          }
        } catch {
          // Skip directories we can't read
        }
      }

      await countLinesInDir(process.cwd());

      return {
        totalLines,
        fileCount,
        extensions,
        note: "Fallback analysis (cloc not available)",
      };
    } catch (error) {
      return {
        error: "Fallback analysis failed",
        message: String(error),
      };
    }
  },

  // 📊 Git history analysis
  async gitInsights() {
    const auto = new DevHQAutomation();

    const commands = {
      contributors: ["git", "shortlog", "-sn", "--all"],
      recentCommits: ["git", "log", "--oneline", "-10", "--format=%h|%an|%s"],
      stats: ["git", "diff", "--shortstat", "@{1}"],
    };

    const results = await Promise.all(
      Object.entries(commands).map(async ([key, cmd]) => {
        const result = await auto.runCommand(key, cmd);
        return { [key]: result && "stdout" in result ? result.stdout : null };
      })
    );

    await auto.cleanup();
    return Object.assign({}, ...results);
  },

  // 🧪 Run tests with coverage
  async runTests(coverage: boolean = true) {
    const auto = new DevHQAutomation();

    const testProc = await auto.runCommand(
      "tests",
      ["bun", "test", ...(coverage ? ["--coverage"] : [])],
      { stream: true }
    );

    return testProc;
  },

  // 🐳 Docker container analysis
  async dockerInsights() {
    const auto = new DevHQAutomation();

    const results = await Promise.all([
      auto.runCommand("docker-ps", ["docker", "ps", "--format", "json"]),
      auto.runCommand("docker-images", [
        "docker",
        "images",
        "--format",
        "json",
      ]),
      auto.runCommand("docker-stats", [
        "docker",
        "stats",
        "--no-stream",
        "--format",
        "json",
      ]),
    ]);

    const insights = {
      containers: [],
      images: [],
      stats: [],
    };

    results.forEach((result, i) => {
      if (result && "stdout" in result && result.stdout) {
        try {
          const key = Object.keys(insights)[i] as keyof typeof insights;
          insights[key] = JSON.parse(
            `[${String(result.stdout).trim().split("\n").join(",")}]`
          ) as any;
        } catch (e) {
          console.error(`Failed to parse ${Object.keys(insights)[i]}:`, e);
        }
      }
    });

    await auto.cleanup();
    return insights;
  },
};
