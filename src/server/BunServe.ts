/**
 * BunServe - HTTP and WebSocket server using Bun.serve
 *
 * https://bun.sh/docs/runtime/http
 */

import { BunContext } from "../context/BunContext.js";

// @ts-ignore - Bun types are available at runtime
declare global {
  interface URLPatternInput {
    pathname?: string;
    protocol?: string;
    username?: string;
    password?: string;
    hostname?: string;
    port?: string;
    search?: string;
    hash?: string;
    base?: string;
  }

  interface URLPatternResult {
    inputs: [URL | string];
    pathname: {
      input: string;
      groups: Record<string, string | undefined>;
    };
    search?: {
      input: string;
      groups: Record<string, string | undefined>;
    };
    hash?: {
      input: string;
      groups: Record<string, string | undefined>;
    };
  }

  interface URLPattern {
    new(input: URLPatternInput, base?: string): URLPattern;
    test(input: URL | string): boolean;
    exec(input: URL | string): URLPatternResult | null;
  }

  interface ServerWebSocket<T = any> {
    data: T;
    readyState: number;
    send(data: string | Buffer): void;
    close(code?: number, reason?: string): void;
    subscribe(topic: string): void;
    unsubscribe(topic: string): void;
    publish(topic: string, data: string | Buffer, compress?: boolean): void;
    isSubscribed(topic: string): boolean;
    cork(callback: () => void): void;
  }
}

export interface ServerOptions {
  port?: number;
  hostname?: string;
  basePath?: string;
  tls?: {
    cert: string;
    key: string;
  };
  cors?: {
    origin?: string | string[];
    methods?: string[];
    headers?: string[];
    credentials?: boolean;
  };
}

export interface Route {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";
  pattern: URLPattern;
  handler: (req: Request, params: Record<string, string>) => Response | Promise<Response>;
}

export interface WebSocketHandler<T = any> {
  message: (ws: ServerWebSocket<T>, message: any) => void | Promise<void>;
  open?: (ws: ServerWebSocket<T>) => void;
  close?: (ws: ServerWebSocket<T>, code: number, reason: string) => void;
}

export class BunServe {
  private routes: Route[] = [];
  private middleware: Array<
    (req: Request, next: () => Promise<Response>) => Response | Promise<Response>
  > = [];
  private server?: ReturnType<typeof Bun.serve>;
  private wsHandler?: WebSocketHandler;

  constructor(private options: ServerOptions = {}) {
    // Initialize with a default WebSocket handler to satisfy Bun's type requirements
    this.wsHandler = {
      message: (ws, message) => {
        console.log('WebSocket message received:', message);
      }
    };
  }

  /**
   * Add a route to the server
   */
  addRoute(
    method: Route["method"],
    path: string,
    handler: Route["handler"]
  ): this {
    // @ts-ignore - URLPattern is available at runtime
    const pattern = new URLPattern({ pathname: path });
    this.routes.push({ method, pattern, handler });
    return this;
  }

  /**
   * Shorthand for GET routes
   */
  get(path: string, handler: Route["handler"]): this {
    return this.addRoute("GET", path, handler);
  }

  /**
   * Shorthand for POST routes
   */
  post(path: string, handler: Route["handler"]): this {
    return this.addRoute("POST", path, handler);
  }

  /**
   * Shorthand for PUT routes
   */
  put(path: string, handler: Route["handler"]): this {
    return this.addRoute("PUT", path, handler);
  }

  /**
   * Shorthand for DELETE routes
   */
  delete(path: string, handler: Route["handler"]): this {
    return this.addRoute("DELETE", path, handler);
  }

  /**
   * Add middleware to the chain
   */
  use(
    fn: (req: Request, next: () => Promise<Response>) => Response | Promise<Response>
  ): this {
    this.middleware.push(fn);
    return this;
  }

  /**
   * Configure WebSocket handler
   */
  websocket(handler: WebSocketHandler): this {
    this.wsHandler = handler;
    return this;
  }

  /**
   * Start the server
   */
  start(): void {
    const port = this.options.port ?? (BunContext.getEnvNumber("PORT") ?? 3000);
    const hostname = this.options.hostname ?? "localhost";

    this.server = Bun.serve({
      port,
      hostname,
      fetch: this.fetch.bind(this),
      websocket: this.wsHandler,
      tls: this.options.tls
        ? {
            certFile: this.options.tls.cert,
            keyFile: this.options.tls.key,
          }
        : undefined,
    });

    console.log(`🚀 Server started on http://${hostname}:${this.server.port}`);
  }

  /**
   * Stop the server
   */
  stop(): void {
    this.server?.stop();
    console.log("🛑 Server stopped");
  }

  /**
   * Get server port
   */
  getPort(): number {
    return this.server?.port ?? 0;
  }

  /**
   * Main request handler
   */
  private async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const fullPath = url.pathname + url.search;

    // Handle CORS preflight
    if (req.method === "OPTIONS" && this.options.cors) {
      return this.corsResponse(new Response(null, { status: 204 }), req);
    }

    // Build middleware chain
    const executeMiddleware = async (req: Request): Promise<Response> => {
      let index = 0;

      const next = async (): Promise<Response> => {
        if (index >= this.middleware.length) {
          return this.handleRequest(req);
        }

        const middleware = this.middleware[index++];
        return middleware(req, next);
      };

      return next();
    };

    try {
      const response = await executeMiddleware(req);
      return this.corsResponse(response, req);
    } catch (error) {
      console.error("Request error:", error);
      return this.corsResponse(
        new Response(JSON.stringify({ error: "Internal Server Error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }),
        req
      );
    }
  }

  /**
   * Route matching and handler execution
   */
  private async handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const method = req.method as Route["method"];

    // Find matching route
    for (const route of this.routes) {
      if (route.method !== method) continue;

      const match = route.pattern.exec(url);
      if (match) {
        const params = match.pathname.groups;
        return route.handler(req, params);
      }
    }

    // No matching route
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Apply CORS headers to response
   */
  private corsResponse(response: Response, req: Request): Response {
    if (!this.options.cors) return response;

    const cors = this.options.cors;
    const origin = req.headers.get("Origin");
    const allowedOrigins = cors.origin ?? "*";

    let allowOrigin = "*";
    if (Array.isArray(allowedOrigins)) {
      allowOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    } else if (typeof allowedOrigins === "string") {
      allowOrigin = allowedOrigins;
    }

    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", allowOrigin);
    headers.set(
      "Access-Control-Allow-Methods",
      cors.methods?.join(", ") ?? "GET, POST, PUT, DELETE, OPTIONS"
    );
    headers.set(
      "Access-Control-Allow-Headers",
      cors.headers?.join(", ") ?? "Content-Type, Authorization"
    );
    if (cors.credentials) {
      headers.set("Access-Control-Allow-Credentials", "true");
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
}

/**
 * Create and start a server with a single function call
 */
export function createServer(options: ServerOptions, setup: (server: BunServe) => void): BunServe {
  const server = new BunServe(options);
  setup(server);
  server.start();
  return server;
}

/**
 * Re-export types for convenience
 */
export type { WebSocketHandler as BunWebSocketHandler, ServerWebSocket };
