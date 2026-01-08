#!/usr/bin/env bun

/**
 * Bundle Size Analysis Script
 *
 * Analyzes bundle sizes for different feature flag combinations
 * to demonstrate compile-time optimization effects
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';

const allFeatures = ['FEAT_MOCK_API', 'FEAT_EXTENDED_LOGGING', 'FEAT_ADVANCED_MONITORING', 'FEAT_PREMIUM', 'FEAT_ENTERPRISE', 'FEAT_NOTIFICATIONS', 'FEAT_ENCRYPTION'];

const configs = [
  {
    name: 'dev',
    features: ['ENV_DEVELOPMENT', 'FEAT_MOCK_API', 'FEAT_EXTENDED_LOGGING'],
    description: 'Development build with mock APIs and extended logging'
  },
  {
    name: 'prod-free',
    features: ['ENV_PRODUCTION', 'FEAT_ENCRYPTION'],
    description: 'Production free tier with basic security'
  },
  {
    name: 'prod-premium',
    features: ['ENV_PRODUCTION', 'FEAT_PREMIUM', 'FEAT_ENCRYPTION', 'FEAT_ADVANCED_MONITORING'],
    description: 'Production premium tier with advanced monitoring'
  },
  {
    name: 'prod-enterprise',
    features: ['ENV_PRODUCTION', 'FEAT_ENTERPRISE', 'FEAT_PREMIUM', 'FEAT_ENCRYPTION', 'FEAT_ADVANCED_MONITORING', 'FEAT_NOTIFICATIONS'],
    description: 'Production enterprise tier with all features'
  },
];

console.log('📦 Bundle Size Analysis');
console.log('======================\n');

// Create temporary directory
const tmpDir = 'tmp/bundles';
await fs.rm(tmpDir, { recursive: true, force: true });
await fs.mkdir(tmpDir, { recursive: true });

const results = [];

for (const config of configs) {
  console.log(`🔨 Building ${config.name}...`);
  console.log(`   Features: ${config.features.join(', ')}`);

  try {
    // Build with current feature set
    const buildCommand = `bun build --minify --target=bun src/CLI.ts --outdir ${tmpDir}/${config.name}`;

    execSync(buildCommand, {
      stdio: 'pipe'
    });

    // Get bundle size
    const bundlePath = `${tmpDir}/${config.name}/CLI.js`;
    const stats = await fs.stat(bundlePath);
    const sizeKB = stats.size / 1024;

    // Analyze bundle content
    const content = await fs.readFile(bundlePath, 'utf8');

    // Check for feature-specific code inclusion
    const featureAnalysis = {};
    for (const feature of config.features) {
      const regex = new RegExp(feature, 'gi');
      const matches = content.match(regex);
      featureAnalysis[feature] = matches ? matches.length : 0;
    }

    // Check for excluded features
    const excludedFeatures = allFeatures.filter(f => !config.features.includes(f));
    const excludedAnalysis = {};
    for (const feature of excludedFeatures) {
      const regex = new RegExp(feature, 'gi');
      const matches = content.match(regex);
      excludedAnalysis[feature] = matches ? matches.length : 0;
    }

    results.push({
      name: config.name,
      description: config.description,
      sizeKB: sizeKB,
      sizeBytes: stats.size,
      features: config.features,
      featureAnalysis,
      excludedAnalysis,
      contentLength: content.length
    });

    console.log(`   ✅ Size: ${sizeKB.toFixed(1)} KB (${stats.size.toLocaleString()} bytes)`);

  } catch (error) {
    console.log(`   ❌ Build failed: ${error.message}`);
    results.push({
      name: config.name,
      description: config.description,
      sizeKB: 0,
      sizeBytes: 0,
      features: config.features,
      error: error.message
    });
  }

  console.log('');
}

// Generate analysis report
console.log('📊 Analysis Results');
console.log('==================\n');

// Sort by size
results.sort((a, b) => a.sizeBytes - b.sizeBytes);

results.forEach(result => {
  console.log(`🏷️  ${result.name} (${result.description})`);
  console.log(`   Size: ${result.sizeKB.toFixed(1)} KB (${result.sizeBytes.toLocaleString()} bytes)`);
  console.log(`   Features: ${result.features.join(', ')}`);

  if (result.error) {
    console.log(`   ❌ Error: ${result.error}`);
  } else {
    console.log('   📈 Feature Analysis:');

    // Show included features
    Object.entries(result.featureAnalysis).forEach(([feature, count]) => {
      if (count > 0) {
        console.log(`      ✅ ${feature}: ${count} occurrences`);
      }
    });

    // Show excluded features (should be 0 if tree-shaking works)
    const excludedCount = Object.values(result.excludedAnalysis).reduce((sum, count) => sum + count, 0);
    if (excludedCount > 0) {
      console.log('   ⚠️  Excluded features found (tree-shaking issues):');
      Object.entries(result.excludedAnalysis).forEach(([feature, count]) => {
        if (count > 0) {
          console.log(`      ❌ ${feature}: ${count} occurrences (should be 0)`);
        }
      });
    } else {
      console.log('   ✅ All excluded features properly tree-shaken');
    }
  }

  console.log('');
});

// Size comparison
console.log('📏 Size Comparison');
console.log('==================\n');

if (results.length > 1) {
  const smallest = results.find(r => r.sizeBytes > 0);
  const largest = results.find(r => r.sizeBytes > 0 && r !== smallest);

  if (smallest && largest) {
    const savings = largest.sizeBytes - smallest.sizeBytes;
    const savingsPercent = ((savings / largest.sizeBytes) * 100).toFixed(1);

    console.log(`Smallest bundle: ${smallest.name} (${smallest.sizeKB.toFixed(1)} KB)`);
    console.log(`Largest bundle:  ${largest.name} (${largest.sizeKB.toFixed(1)} KB)`);
    console.log(`Size difference: ${savings.toLocaleString()} bytes (${savingsPercent}% savings)`);
    console.log('');
  }
}

// Feature impact analysis
console.log('🎯 Feature Impact Analysis');
console.log('========================\n');

const featureImpact = {};
allFeatures.forEach(feature => {
  const withFeature = results.filter(r => r.features.includes(feature) && r.sizeBytes > 0);
  const withoutFeature = results.filter(r => !r.features.includes(feature) && r.sizeBytes > 0);

  if (withFeature.length > 0 && withoutFeature.length > 0) {
    const avgWith = withFeature.reduce((sum, r) => sum + r.sizeBytes, 0) / withFeature.length;
    const avgWithout = withoutFeature.reduce((sum, r) => sum + r.sizeBytes, 0) / withoutFeature.length;
    const impact = avgWith - avgWithout;

    featureImpact[feature] = {
      avgWith: (avgWith / 1024).toFixed(1),
      avgWithout: (avgWithout / 1024).toFixed(1),
      impactBytes: impact,
      impactKB: (impact / 1024).toFixed(1)
    };
  }
});

Object.entries(featureImpact).forEach(([feature, data]) => {
  console.log(`${feature}:`);
  console.log(`   With feature:    ${data.avgWith} KB`);
  console.log(`   Without feature: ${data.avgWithout} KB`);
  console.log(`   Impact:          +${data.impactKB} KB (${data.impactBytes.toLocaleString()} bytes)`);
  console.log('');
});

// Cleanup
await fs.rm(tmpDir, { recursive: true, force: true });

console.log('🧹 Cleanup completed');
console.log('\n✅ Bundle analysis complete!');
