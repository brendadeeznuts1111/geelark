/**
 * Test Setup and Utilities
 */

export interface TestUploadConfig {
  apiBaseUrl: string;
  testFile?: {
    name: string;
    content: string;
    type: string;
  };
}

export class UploadTestHelper {
  constructor(private config: TestUploadConfig) {}

  /**
   * Create a test file blob
   */
  createTestFile(content: string, filename: string, type: string): Blob {
    return new Blob([content], { type });
  }

  /**
   * Initiate a test upload
   */
  async initiateUpload(file: File, options?: {
    filename?: string;
    contentType?: string;
    contentDisposition?: "inline" | "attachment";
    metadata?: Record<string, string>;
  }): Promise<Response> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("filename", options?.filename || file.name);
    formData.append("contentType", options?.contentType || file.type);

    if (options?.contentDisposition) {
      formData.append("contentDisposition", options.contentDisposition);
    }

    if (options?.metadata) {
      formData.append("metadata", JSON.stringify(options.metadata));
    }

    return fetch(`${this.config.apiBaseUrl}/upload/initiate`, {
      method: "POST",
      body: formData,
    });
  }

  /**
   * Get upload status
   */
  async getUploadStatus(uploadId: string): Promise<Response> {
    return fetch(`${this.config.apiBaseUrl}/upload/status/${uploadId}`);
  }

  /**
   * Get active uploads
   */
  async getActiveUploads(): Promise<Response> {
    return fetch(`${this.config.apiBaseUrl}/uploads/active`);
  }

  /**
   * Cancel upload
   */
  async cancelUpload(uploadId: string): Promise<Response> {
    return fetch(`${this.config.apiBaseUrl}/upload/cancel/${uploadId}`, {
      method: "POST",
    });
  }

  /**
   * Get upload telemetry
   */
  async getUploadTelemetry(): Promise<Response> {
    return fetch(`${this.config.apiBaseUrl}/uploads/telemetry`);
  }

  /**
   * Get recent uploads
   */
  async getRecentUploads(limit: number = 100): Promise<Response> {
    return fetch(`${this.config.apiBaseUrl}/uploads/recent?limit=${limit}`);
  }

  /**
   * Poll for upload completion
   */
  async pollForCompletion(
    uploadId: string,
    maxAttempts: number = 30,
    interval: number = 1000
  ): Promise<{ success: boolean; progress?: any }> {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await this.getUploadStatus(uploadId);

      if (response.ok) {
        const progress = await response.json();

        if (progress.status === "completed") {
          return { success: true, progress };
        }

        if (progress.status === "failed" || progress.status === "cancelled") {
          return { success: false, progress };
        }
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    return { success: false };
  }

  /**
   * Create a test upload and wait for completion
   */
  async testUpload(
    content: string,
    filename: string,
    contentType: string = "text/plain"
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      const file = new File([content], filename, { type: contentType });
      const response = await this.initiateUpload(file);

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || "Upload failed" };
      }

      const result = await response.json();
      const completion = await this.pollForCompletion(result.uploadId);

      return {
        success: completion.success,
        result: completion.progress,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
