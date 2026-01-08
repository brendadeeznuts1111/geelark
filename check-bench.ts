#!/usr/bin/env bun

// Check what's available in bun:test
export { };

try {
  const testModule = await import('bun:test');
  console.log('Available exports from bun:test:', Object.keys(testModule));
} catch (error) {
  console.error('Error importing bun:test:', error);
}
