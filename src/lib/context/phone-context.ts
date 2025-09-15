/**
 * Phone number context for AI tools
 * This module provides a secure way to access phone numbers per session
 * without allowing AI to modify them directly. Supports concurrent conversations.
 */

import { requestContext } from "./request-context";

class PhoneContext {
  private phoneNumbers = new Map<string, string>();

  /**
   * Sets the phone number for a specific session
   * This should only be called by system code, not AI tools
   */
  setPhoneNumber(sessionId: string, phoneNumber: string): void {
    this.phoneNumbers.set(sessionId, phoneNumber);
  }

  /**
   * Gets the phone number for a specific session
   * Returns null if no phone number is set for that session
   * If no sessionId provided, uses current request context
   */
  getPhoneNumber(sessionId?: string): string | null {
    const actualSessionId = sessionId || requestContext.getSessionId();
    if (!actualSessionId) {
      return null;
    }
    return this.phoneNumbers.get(actualSessionId) || null;
  }

  /**
   * Gets the phone number for a session with validation
   * Throws error if no phone number is set for that session
   * If no sessionId provided, uses current request context
   */
  requirePhoneNumber(sessionId?: string): string {
    const actualSessionId = sessionId || requestContext.requireSessionId();
    const phoneNumber = this.phoneNumbers.get(actualSessionId);
    if (!phoneNumber) {
      throw new Error(
        `No phone number set in context for session: ${actualSessionId}`,
      );
    }
    return phoneNumber;
  }

  /**
   * Clears the phone number for a specific session
   */
  clearPhoneNumber(sessionId: string): void {
    this.phoneNumbers.delete(sessionId);
  }

  /**
   * Clears all phone numbers (for cleanup)
   */
  clearAllPhoneNumbers(): void {
    this.phoneNumbers.clear();
  }
}

export const phoneContext = new PhoneContext();
