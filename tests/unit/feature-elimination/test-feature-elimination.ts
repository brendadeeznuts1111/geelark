#!/usr/bin/env bun

import { feature } from "bun:bundle";

// This should be eliminated when FEAT_PREMIUM is not enabled
if (feature("FEAT_PREMIUM")) {
  console.log("🏆 Premium features enabled");

  // Large premium code block that should be eliminated
  const premiumAnalytics = {
    track: (event: string) => {
      console.log(`Premium tracking: ${event}`);
      // Complex analytics logic
      const data = {
        event,
        timestamp: Date.now(),
        userId: "premium-user",
        metadata: {
          source: "premium-tier",
          version: "2.0.0",
          features: ["advanced-analytics", "real-time-tracking", "export"],
        } as Record<string, any>,
      };

      // Simulate heavy processing
      for (let i = 0; i < 1000; i++) {
        data.metadata[`metric_${i}`] = Math.random() * 100;
      }

      return data;
    },

    export: (format: "json" | "csv" | "pdf") => {
      console.log(`Exporting analytics in ${format} format`);
      // Heavy export logic
      const report = {
        format,
        size: "2MB",
        generated: new Date().toISOString(),
        data: new Array(10000).fill(0).map((_, i) => ({
          id: i,
          value: Math.random() * 1000,
          category: `category_${i % 10}`,
        })),
      };
      return report;
    },
  };

  // Use the premium features
  premiumAnalytics.track("user_login");
  premiumAnalytics.export("json");
} else {
  console.log("📱 Free tier - no premium features");
}

// This should always be included
console.log("✅ Application started");
