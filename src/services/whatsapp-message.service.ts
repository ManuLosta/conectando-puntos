import { ModelMessage } from "ai";
import {
  whatsAppMessageRepo,
  WhatsAppMessageRepository,
  WhatsAppSessionWithMessages,
  WhatsAppMessageData,
} from "@/repositories/whatsapp-message.repository";

export interface WhatsAppMessageService {
  getOrCreateSession(
    phoneNumber: string,
    distributorId: string,
  ): Promise<WhatsAppSessionWithMessages>;
  addMessage(
    sessionId: string,
    role: "user" | "assistant",
    content: string,
  ): Promise<WhatsAppMessageData>;
  getSessionHistory(
    phoneNumber: string,
    distributorId: string,
  ): Promise<ModelMessage[]>;
  cleanupExpiredSessions(): Promise<void>;
}

export class WhatsAppMessageServiceImpl implements WhatsAppMessageService {
  private static readonly MAX_MESSAGES = 20;
  private static readonly SESSION_DURATION_HOURS = 6;

  constructor(
    private repository: WhatsAppMessageRepository = whatsAppMessageRepo,
  ) {}

  async getOrCreateSession(
    phoneNumber: string,
    distributorId: string,
  ): Promise<WhatsAppSessionWithMessages> {
    // Try to find existing active session
    let session = await this.repository.getSessionByPhone(
      phoneNumber,
      distributorId,
    );

    if (session && session.isActive && session.expiresAt > new Date()) {
      // Extend session expiry
      const newExpiry = new Date(
        Date.now() +
          WhatsAppMessageServiceImpl.SESSION_DURATION_HOURS * 60 * 60 * 1000,
      );
      await this.repository.updateSessionExpiry(session.id, newExpiry);
      session.expiresAt = newExpiry;
      return session;
    }

    // Create new session
    const expiresAt = new Date(
      Date.now() +
        WhatsAppMessageServiceImpl.SESSION_DURATION_HOURS * 60 * 60 * 1000,
    );
    session = await this.repository.createSession({
      phoneNumber,
      distributorId,
      expiresAt,
    });

    return session;
  }

  async addMessage(
    sessionId: string,
    role: "user" | "assistant",
    content: string,
  ): Promise<WhatsAppMessageData> {
    const message = await this.repository.addMessage({
      sessionId,
      role,
      content,
    });

    // Limit session messages to MAX_MESSAGES
    await this.repository.limitSessionMessages(
      sessionId,
      WhatsAppMessageServiceImpl.MAX_MESSAGES,
    );

    return message;
  }

  async getSessionHistory(
    phoneNumber: string,
    distributorId: string,
  ): Promise<ModelMessage[]> {
    const session = await this.repository.getSessionByPhone(
      phoneNumber,
      distributorId,
    );

    if (!session || !session.isActive || session.expiresAt <= new Date()) {
      return [];
    }

    return session.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  async cleanupExpiredSessions(): Promise<void> {
    await this.repository.cleanupExpiredSessions();
  }
}

export const whatsAppMessageService = new WhatsAppMessageServiceImpl();
