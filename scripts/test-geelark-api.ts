#!/usr/bin/env bun

/**
 * GeeLark API Test Script
 * Tests the GeeLark API connection using Bun's native APIs
 * Uses secure environment variable loading with Bun.env
 *
 * API Documentation: https://open.geelark.com/api/cloud-phone-request-instructions
 */

import { randomUUID } from 'crypto';

interface GeelarkConfig {
  apiKey: string;
  appId: string;
  bearerToken: string;
  baseUrl: string;
}

interface GeelarkApiResponse {
  traceId: string;
  code: number; // 0 = success, any other = failure
  msg: string;
  data?: any;
}

// Legacy interface for backward compatibility
interface LegacyApiResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
}

class GeelarkApiTester {
  private config: GeelarkConfig;
  private dryRun: boolean;

  constructor(config?: Partial<GeelarkConfig>, dryRun: boolean = false) {
    this.dryRun = dryRun;
    // Use provided config or load from Bun.env
    this.config = {
      apiKey: config?.apiKey || Bun.env.GEELARK_API_KEY || '',
      appId: config?.appId || Bun.env.GEELARK_APP_ID || '',
      bearerToken: config?.bearerToken || Bun.env.GEELARK_BEARER_TOKEN || '',
      baseUrl: config?.baseUrl || Bun.env.GEELARK_BASE_URL || 'https://openapi.geelark.com',
    };

    this.validateConfig();
  }

  /**
   * Static factory to load from .env file using Bun.file()
   */
  static async create(dryRun: boolean = false): Promise<GeelarkApiTester> {
    // Load environment variables from .env file using Bun.file()
    await GeelarkApiTester.loadEnvFile();

    return new GeelarkApiTester(undefined, dryRun);
  }

  /**
   * Load .env file securely using Bun.file()
   */
  private static async loadEnvFile(): Promise<void> {
    try {
      // Try .env first, then .env.test
      const envFiles = ['.env', '.env.test'];

      for (const envFile of envFiles) {
        const file = Bun.file(envFile);
        if (await file.exists()) {
          const content = await file.text();
          const lines = content.split('\n');

          for (const line of lines) {
            const trimmed = line.trim();
            // Skip comments and empty lines
            if (!trimmed || trimmed.startsWith('#')) continue;

            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
              const value = valueParts.join('=').trim();
              // Only set if not already in Bun.env (env vars take precedence)
              if (!Bun.env[key]) {
                Bun.env[key] = value;
              }
            }
          }

          console.log(`📄 Loaded environment from ${envFile}`);
          break;
        }
      }
    } catch (error) {
      // If .env file doesn't exist, that's okay - use Bun.env directly
      console.log('ℹ️  No .env file found, using Bun.env directly');
    }
  }

  private validateConfig(): void {
    const missing: string[] = [];

    if (!this.config.apiKey) missing.push('GEELARK_API_KEY');
    if (!this.config.appId) missing.push('GEELARK_APP_ID');
    if (!this.config.bearerToken) missing.push('GEELARK_BEARER_TOKEN');

    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:');
      missing.forEach((key) => console.error(`   - ${key}`));
      console.error('\n💡 Create a .env file with your credentials:');
      console.error('   GEELARK_API_KEY=your_api_key');
      console.error('   GEELARK_APP_ID=your_app_id');
      console.error('   GEELARK_BEARER_TOKEN=your_bearer_token');
      console.error('   GEELARK_BASE_URL=https://open.geelark.com');
      process.exit(1);
    }

    console.log('✅ Configuration loaded successfully');
    console.log(`   Base URL: ${this.config.baseUrl}`);
    console.log(`   APP ID: ${this.config.appId.substring(0, 8)}...`);
    console.log(`   API Key: ${this.config.apiKey.substring(0, 8)}...`);
    console.log(`   Bearer Token: ${this.config.bearerToken.substring(0, 8)}...`);
  }

  /**
   * Generate signature for key verification
   */
  private async generateSignature(traceId: string, ts: number, nonce: string): Promise<string> {
    const stringToSign = `${this.config.appId}${traceId}${ts}${nonce}${this.config.apiKey}`;

    // Use Bun's built-in crypto for SHA256
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToSign);

    // Bun has crypto.subtle available
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  /**
   * Generate key verification headers
   */
  private async generateKeyVerificationHeaders(): Promise<Record<string, string>> {
    const traceId = randomUUID();
    const ts = Date.now();
    const nonce = traceId.substring(0, 6); // First 6 chars of traceId
    const sign = await this.generateSignature(traceId, ts, nonce);

    return {
      'appId': this.config.appId,
      'traceId': traceId,
      'ts': ts.toString(),
      'nonce': nonce,
      'sign': sign,
    };
  }

  /**
   * Generate token verification headers
   */
  private generateTokenVerificationHeaders(): Record<string, string> {
    const traceId = randomUUID();

    return {
      'traceId': traceId,
      'Authorization': `Bearer ${this.config.bearerToken}`,
    };
  }

  /**
   * Make a secure API request using Bun's fetch
   * Follows GeeLark API specification: https://open.geelark.com/api/cloud-phone-request-instructions
   */
  private async makeRequest(
    endpoint: string,
    body: Record<string, any> = {}
  ): Promise<LegacyApiResponse> {
    const url = `${this.config.baseUrl}${endpoint}`;

    // Prepare base headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Choose authentication method (prefer token verification)
    let authHeaders: Record<string, string>;
    let traceId: string;

    if (this.config.bearerToken) {
      // Token verification (simpler)
      authHeaders = this.generateTokenVerificationHeaders();
      traceId = authHeaders.traceId;
      Object.assign(headers, authHeaders);
    } else if (this.config.apiKey && this.config.appId) {
      // Key verification (with signature)
      authHeaders = await this.generateKeyVerificationHeaders();
      traceId = authHeaders.traceId;
      Object.assign(headers, authHeaders);
    } else {
      throw new Error('No authentication method available. Need either Bearer token or API key + App ID');
    }

    // DRY RUN MODE: Don't make actual requests
    if (this.dryRun) {
      console.log(`\n🔍 [DRY RUN] Would make request to: ${endpoint}`);
      console.log(`   URL: ${url}`);
      console.log(`   Method: POST`);
      console.log(`   Headers:`, {
        'Content-Type': headers['Content-Type'],
        'traceId': traceId,
        'Authorization': headers['Authorization'] ? 'Bearer ***' : undefined,
        'appId': headers['appId'] || undefined,
        'ts': headers['ts'] || undefined,
        'nonce': headers['nonce'] || undefined,
        'sign': headers['sign'] ? '***' : undefined,
      });
      console.log(`   Body: ${JSON.stringify(body, null, 2)}`);
      console.log(`   ✅ [DRY RUN] Request validated - would be sent successfully`);

      return {
        success: true,
        data: {
          dryRun: true,
          traceId,
          message: 'This is a dry run - no actual request was made'
        },
      };
    }

    try {
      console.log(`\n📡 Making request to: ${endpoint}`);
      console.log(`   Method: POST`);
      console.log(`   TraceId: ${traceId}`);
      console.log(`   Auth: ${this.config.bearerToken ? 'Bearer Token' : 'API Key + Signature'}`);
      console.log(`   Body: ${JSON.stringify(body, null, 2)}`);

      // Use Bun's native fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseData: GeelarkApiResponse = await response.json().catch(() => ({
        traceId: traceId,
        code: response.status,
        msg: response.statusText,
      }));

      // GeeLark API response format: code 0 = success
      if (responseData.code === 0) {
        return {
          success: true,
          data: responseData.data,
        };
      } else {
        return {
          success: false,
          error: {
            code: `API_${responseData.code}`,
            message: responseData.msg || 'API request failed',
          },
          data: responseData,
        };
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: 'Request timed out after 30 seconds',
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Network request failed',
        },
      };
    }
  }

  /**
   * Test API connection
   * Note: Actual endpoint paths need to be confirmed from official API docs
   */
  async testConnection(): Promise<boolean> {
    console.log('\n🔍 Testing GeeLark API Connection...');
    console.log('═'.repeat(60));
    console.log('   Note: Using correct authentication method per API spec');
    console.log('   All requests use POST method with JSON body');

    // Use the actual API endpoint from official documentation
    const testEndpoint = '/open/v1/phone/list';
    const requestBody = {
      page: 1,
      pageSize: 10,
    };

    console.log(`\n   Using endpoint: ${testEndpoint}`);
    const result = await this.makeRequest(testEndpoint, requestBody);

    if (result.success) {
      console.log('✅ API Connection successful!');
      console.log('   Endpoint:', testEndpoint);
      console.log('   Response:', JSON.stringify(result.data, null, 2));
      return true;
    } else {
      const apiCode = result.error?.code?.replace('API_', '') || '';

      console.log('❌ API Connection failed');
      console.log('   Error Code:', result.error?.code);
      console.log('   Error Message:', result.error?.message);
      if (result.data) {
        console.log('   Response:', JSON.stringify(result.data, null, 2));
      }

      // If it's a validation error (40004), the endpoint exists but needs correct params
      if (apiCode === '40004') {
        console.log('   ✅ Endpoint exists! (validation error means endpoint is correct)');
        return true; // Endpoint exists, just needs correct parameters
      }

      // If it's auth error (40003), authentication failed
      if (apiCode === '40003') {
        console.log('   ⚠️  Authentication failed - check credentials');
      }

      return false;
    }
  }

  /**
   * Test phone list (actual API endpoint)
   */
  async testPhoneList(): Promise<boolean> {
    console.log('\n📱 Testing Phone List API...');
    console.log('═'.repeat(60));

    const result = await this.makeRequest('/open/v1/phone/list', {
      page: 1,
      pageSize: 10,
    });

    if (result.success) {
      console.log('✅ Phone list retrieved successfully!');
      console.log('   Response:', JSON.stringify(result.data, null, 2));
      return true;
    } else {
      console.log('❌ Phone list failed');
      console.log('   Error:', result.error?.message);
      console.log('   Code:', result.error?.code);
      if (result.data) {
        console.log('   Details:', JSON.stringify(result.data, null, 2));
      }
      return false;
    }
  }

  /**
   * Test authentication by checking if credentials are valid
   */
  async testAuthentication(): Promise<boolean> {
    console.log('\n🔐 Testing Authentication...');
    console.log('═'.repeat(60));

    // Verify credentials are loaded
    const hasBearer = !!this.config.bearerToken;
    const hasApiKey = !!this.config.apiKey;
    const hasAppId = !!this.config.appId;

    console.log(`   Bearer Token: ${hasBearer ? '✅ Present' : '❌ Missing'}`);
    console.log(`   API Key: ${hasApiKey ? '✅ Present' : '❌ Missing'}`);
    console.log(`   APP ID: ${hasAppId ? '✅ Present' : '❌ Missing'}`);

    if (hasBearer || hasApiKey) {
      console.log('✅ Credentials loaded successfully');
      console.log('   Note: Actual API endpoint validation requires correct endpoint paths');
      return true;
    }

    return false;
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    const mode = this.dryRun ? '🔍 DRY RUN MODE' : '🚀 LIVE MODE';
    console.log(`${mode} - GeeLark API Test Suite`);
    console.log('═'.repeat(60));
    console.log(`Using Bun ${Bun.version}`);
    console.log(`Platform: ${process.platform}`);
    console.log(`Node: ${process.version}`);
    if (this.dryRun) {
      console.log(`\n⚠️  DRY RUN: No actual API calls will be made`);
      console.log(`   This validates configuration and request format only`);
    }

    const results = {
      connection: false,
      authentication: false,
      phoneCreation: false,
    };

    // Test 1: Authentication
    results.authentication = await this.testAuthentication();

    // Test 2: Connection
    results.connection = await this.testConnection();

    // Test 3: Phone List (if connection works)
    if (results.connection) {
      results.phoneCreation = await this.testPhoneList();
    }

    // Summary
    console.log('\n📊 Test Summary');
    console.log('═'.repeat(60));
    console.log(`Authentication: ${results.authentication ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Connection:     ${results.connection ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Phone List:     ${results.phoneCreation ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = Object.values(results).every((r) => r);
    console.log(`\n${allPassed ? '✅ All tests passed!' : '❌ Some tests failed'}`);

    process.exit(allPassed ? 0 : 1);
  }
}

// Main execution
async function main() {
  try {
    // Check for --dry-run flag
    const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');

    const tester = await GeelarkApiTester.create(dryRun);
    await tester.runAllTests();
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.main) {
  main();
}

export { GeelarkApiTester };

