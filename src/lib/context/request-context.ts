/**
 * Request context for tracking current session across AI tool calls
 * This provides a way to access the current session ID from within AI tools
 */

import { AsyncLocalStorage } from "async_hooks";

interface RequestContext {
  sessionId: string;
}

class RequestContextManager {
  private storage = new AsyncLocalStorage<RequestContext>();

  /**
   * Runs a function within a request context
   */
  run<T>(sessionId: string, fn: () => T): T {
    return this.storage.run({ sessionId }, fn);
  }

  /**
   * Gets the current session ID from context
   */
  getSessionId(): string | null {
    const context = this.storage.getStore();
    return context?.sessionId || null;
  }

  /**
   * Gets the current session ID with validation
   */
  requireSessionId(): string {
    const sessionId = this.getSessionId();
    if (!sessionId) {
      throw new Error("No session ID available in request context");
    }
    return sessionId;
  }
}

export const requestContext = new RequestContextManager();
