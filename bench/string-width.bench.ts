#!/usr/bin/env bun

/**
 * String Width Calculation Performance Benchmarks
 * Following Bun's benchmarking best practices
 */

import { bench, describe, expect } from "bun:test";
import { StringWidth } from "../src/StringWidth";
import { benchmark, measureNanoseconds } from "./utils";

describe("String Width Calculation Performance", () => {
  const testStrings = {
    simple: "Hello, World!",
    unicode: "Hello, 世界! 🌍",
    emoji: "🇺🇸 🇬🇧 🇨🇦 🎉 🎊",
    flags: "🏳️ 🏴 🏁 🚩",
    ansi: "\x1b[31mRed\x1b[0m \x1b[32mGreen\x1b[0m \x1b[34mBlue\x1b[0m",
    eastAsian: "안녕하세요 こんにちは 你好",
    mixed: "Hello 世界 🌍 🇺🇸 \x1b[31mRed\x1b[0m",
    long: "A".repeat(1000),
    longUnicode: "世界".repeat(500),
    longEmoji: "🎉".repeat(100),
  };

  describe("Basic String Width Calculations", () => {
    bench("simple ASCII string", () => {
      StringWidth.calculate(testStrings.simple);
    }, {
      iterations: 10_000,
    });

    bench("Unicode string", () => {
      StringWidth.calculate(testStrings.unicode);
    }, {
      iterations: 10_000,
    });

    bench("emoji string", () => {
      StringWidth.calculate(testStrings.emoji);
    }, {
      iterations: 10_000,
    });

    bench("flag emoji string", () => {
      StringWidth.calculate(testStrings.flags);
    }, {
      iterations: 10_000,
    });
  });

  describe("ANSI Escape Sequences", () => {
    bench("ANSI colored string", () => {
      StringWidth.calculate(testStrings.ansi);
    }, {
      iterations: 10_000,
    });

    bench("string with multiple ANSI codes", () => {
      const complexAnsi = "\x1b[1m\x1b[31mBold Red\x1b[0m \x1b[2m\x1b[32mDim Green\x1b[0m";
      StringWidth.calculate(complexAnsi);
    }, {
      iterations: 10_000,
    });
  });

  describe("East Asian Characters", () => {
    bench("Korean characters", () => {
      StringWidth.calculate("안녕하세요");
    }, {
      iterations: 10_000,
    });

    bench("Japanese characters", () => {
      StringWidth.calculate("こんにちは");
    }, {
      iterations: 10_000,
    });

    bench("Chinese characters", () => {
      StringWidth.calculate("你好世界");
    }, {
      iterations: 10_000,
    });

    bench("mixed East Asian", () => {
      StringWidth.calculate(testStrings.eastAsian);
    }, {
      iterations: 10_000,
    });
  });

  describe("Complex Mixed Strings", () => {
    bench("mixed ASCII, Unicode, Emoji, ANSI", () => {
      StringWidth.calculate(testStrings.mixed);
    }, {
      iterations: 10_000,
    });

    bench("dashboard status bar string", () => {
      const statusBar = "🌍 DEV ✅ HEALTHY (12/15 features enabled)";
      StringWidth.calculate(statusBar);
    }, {
      iterations: 10_000,
    });

    bench("performance graph string", () => {
      const graph = "CPU: ▰▰▰▰▰ 80% | MEM: ▰▰▰▰▱ 60% | RES: ▰▰▰▱▱ 40ms";
      StringWidth.calculate(graph);
    }, {
      iterations: 10_000,
    });
  });

  describe("Long String Performance", () => {
    bench("long ASCII string (1000 chars)", () => {
      StringWidth.calculate(testStrings.long);
    }, {
      iterations: 1_000,
    });

    bench("long Unicode string (1000 chars)", () => {
      StringWidth.calculate(testStrings.longUnicode);
    }, {
      iterations: 1_000,
    });

    bench("long emoji string (100 emojis)", () => {
      StringWidth.calculate(testStrings.longEmoji);
    }, {
      iterations: 1_000,
    });
  });

  describe("Edge Cases", () => {
    bench("empty string", () => {
      StringWidth.calculate("");
    }, {
      iterations: 10_000,
    });

    bench("single character", () => {
      StringWidth.calculate("A");
    }, {
      iterations: 10_000,
    });

    bench("single emoji", () => {
      StringWidth.calculate("🎉");
    }, {
      iterations: 10_000,
    });

    bench("zero-width characters", () => {
      StringWidth.calculate("Hello\u200B\u200C\u200DWorld");
    }, {
      iterations: 10_000,
    });
  });

  describe("Microbenchmarks with Nanosecond Precision", () => {
    it("should measure simple string width with nanosecond precision", () => {
      const { duration } = measureNanoseconds(() => {
        StringWidth.calculate(testStrings.simple);
      });
      expect(duration).toBeLessThan(0.1); // Should be less than 0.1ms
    });

    it("should measure complex string width with nanosecond precision", () => {
      const { duration } = measureNanoseconds(() => {
        StringWidth.calculate(testStrings.mixed);
      });
      expect(duration).toBeLessThan(0.5); // Should be less than 0.5ms
    });
  });
});

