#!/usr/bin/env bun
/**
 * Manual Upload API Test Script
 *
 * This script tests the upload API endpoints manually.
 * Run with: bun run tests/manual/test-upload-api.ts
 */

const API_BASE = "http://localhost:3000/api";

async function testUploadAPI() {
  console.log("🧪 Testing Upload API Endpoints\n");

  // Test 1: Health check
  console.log("1. Testing health check...");
  try {
    const response = await fetch(`http://localhost:3000/api/health`);
    console.log(`   Status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Server is running: ${data.status}`);
    } else {
      console.log(`   ⚠️ Server may not be running`);
    }
  } catch (error) {
    console.log(`   ❌ Cannot connect to server`);
    console.log(`   Please start the server first: bun run dev-hq/servers/dashboard-server.ts\n`);
    return;
  }

  // Test 2: Create a test file
  console.log("\n2. Creating test file...");
  const testContent = "Hello, this is a test upload!";
  const testFile = new File([testContent], "test-upload.txt", {
    type: "text/plain",
  });
  console.log(`   ✅ Created test file: ${testFile.name} (${testFile.size} bytes)`);

  // Test 3: Initiate upload
  console.log("\n3. Testing POST /api/upload/initiate...");
  const formData = new FormData();
  formData.append("file", testFile);
  formData.append("filename", testFile.name);
  formData.append("contentType", testFile.type);

  let uploadId: string | null = null;

  try {
    const uploadResponse = await fetch(`${API_BASE}/upload/initiate`, {
      method: "POST",
      body: formData,
    });

    console.log(`   Status: ${uploadResponse.status}`);

    if (uploadResponse.ok) {
      const result = await uploadResponse.json();
      uploadId = result.uploadId;
      console.log(`   ✅ Upload initiated: ${uploadId}`);
      console.log(`   Provider: ${result.provider}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Duration: ${result.duration}ms`);
    } else {
      const error = await uploadResponse.json();
      console.log(`   ❌ Upload failed: ${error.error}`);
      return;
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error}`);
    return;
  }

  // Test 4: Check upload status
  if (uploadId) {
    console.log("\n4. Testing GET /api/upload/status/:id...");
    try {
      const statusResponse = await fetch(`${API_BASE}/upload/status/${uploadId}`);
      console.log(`   Status: ${statusResponse.status}`);

      if (statusResponse.ok) {
        const progress = await statusResponse.json();
        console.log(`   ✅ Upload status: ${progress.status}`);
        console.log(`   Filename: ${progress.filename}`);
        console.log(`   Progress: ${progress.progress.toFixed(1)}%`);
        console.log(`   Bytes: ${progress.uploadedBytes}/${progress.totalBytes}`);
      } else {
        console.log(`   ❌ Failed to get status`);
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error}`);
    }
  }

  // Test 5: Get active uploads
  console.log("\n5. Testing GET /api/uploads/active...");
  try {
    const activeResponse = await fetch(`${API_BASE}/uploads/active`);
    console.log(`   Status: ${activeResponse.status}`);

    if (activeResponse.ok) {
      const activeUploads = await activeResponse.json();
      console.log(`   ✅ Active uploads: ${activeUploads.length}`);
      activeUploads.forEach((upload: any) => {
        console.log(`      - ${upload.filename}: ${upload.status}`);
      });
    } else {
      console.log(`   ❌ Failed to get active uploads`);
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error}`);
  }

  // Test 6: Get upload telemetry
  console.log("\n6. Testing GET /api/uploads/telemetry...");
  try {
    const telemetryResponse = await fetch(`${API_BASE}/uploads/telemetry`);
    console.log(`   Status: ${telemetryResponse.status}`);

    if (telemetryResponse.ok) {
      const stats = await telemetryResponse.json();
      console.log(`   ✅ Upload statistics:`);
      console.log(`      Total: ${stats.total}`);
      console.log(`      Success: ${stats.success}`);
      console.log(`      Failure: ${stats.failure}`);
      console.log(`      Avg Duration: ${stats.avgDuration.toFixed(0)}ms`);
      console.log(`      Total Bytes: ${stats.totalBytes}`);
      if (stats.byProvider) {
        console.log(`      By Provider:`);
        Object.entries(stats.byProvider).forEach(([provider, data]: [string, any]) => {
          console.log(`         ${provider}: ${data.count} uploads`);
        });
      }
    } else {
      const error = await telemetryResponse.json();
      console.log(`   ⚠️ ${error.error || "Failed to get telemetry"}`);
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error}`);
  }

  // Test 7: Get recent uploads
  console.log("\n7. Testing GET /api/uploads/recent...");
  try {
    const recentResponse = await fetch(`${API_BASE}/uploads/recent?limit=5`);
    console.log(`   Status: ${recentResponse.status}`);

    if (recentResponse.ok) {
      const recentUploads = await recentResponse.json();
      console.log(`   ✅ Recent uploads: ${recentUploads.length}`);
      recentUploads.slice(0, 5).forEach((upload: any) => {
        console.log(`      - ${upload.filename} (${upload.status})`);
      });
    } else {
      const error = await recentResponse.json();
      console.log(`   ⚠️ ${error.error || "Failed to get recent uploads"}`);
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error}`);
  }

  console.log("\n✅ All tests completed!");
}

// Run tests
testUploadAPI().catch(console.error);
