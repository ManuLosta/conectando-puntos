import { PrismaClient } from "@prisma/client";

export interface CreateSessionInput {
  phoneNumber: string;
  distributorId: string;
  expiresAt: Date;
}

export interface CreateMessageInput {
  sessionId: string;
  role: "user" | "assistant";
  content: string;
}

export interface WhatsAppMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface WhatsAppSessionWithMessages {
  id: string;
  phoneNumber: string;
  distributorId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  messages: WhatsAppMessageData[];
}

export interface WhatsAppMessageRepository {
  createSession(
    sessionData: CreateSessionInput,
  ): Promise<WhatsAppSessionWithMessages>;
  getSessionByPhone(
    phoneNumber: string,
    distributorId: string,
  ): Promise<WhatsAppSessionWithMessages | null>;
  addMessage(messageData: CreateMessageInput): Promise<WhatsAppMessageData>;
  getSessionMessages(sessionId: string): Promise<WhatsAppMessageData[]>;
  cleanupExpiredSessions(): Promise<void>;
  limitSessionMessages(sessionId: string, maxMessages: number): Promise<void>;
  updateSessionExpiry(sessionId: string, expiresAt: Date): Promise<void>;
  deactivateSession(sessionId: string): Promise<void>;
}

export class WhatsAppMessageRepositoryImpl
  implements WhatsAppMessageRepository
{
  constructor(private prisma: PrismaClient) {}

  async createSession(
    sessionData: CreateSessionInput,
  ): Promise<WhatsAppSessionWithMessages> {
    const session = await this.prisma.whatsAppSession.upsert({
      where: {
        phoneNumber_distributorId: {
          phoneNumber: sessionData.phoneNumber,
          distributorId: sessionData.distributorId,
        },
      },
      update: {
        // Reactivate and extend the session on concurrent creates
        isActive: true,
        expiresAt: sessionData.expiresAt,
      },
      create: sessionData,
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return {
      id: session.id,
      phoneNumber: session.phoneNumber,
      distributorId: session.distributorId,
      isActive: session.isActive,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      expiresAt: session.expiresAt,
      messages: session.messages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        createdAt: msg.createdAt,
      })),
    };
  }

  async getSessionByPhone(
    phoneNumber: string,
    distributorId: string,
  ): Promise<WhatsAppSessionWithMessages | null> {
    const session = await this.prisma.whatsAppSession.findUnique({
      where: {
        phoneNumber_distributorId: {
          phoneNumber,
          distributorId,
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!session) return null;

    return {
      id: session.id,
      phoneNumber: session.phoneNumber,
      distributorId: session.distributorId,
      isActive: session.isActive,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      expiresAt: session.expiresAt,
      messages: session.messages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        createdAt: msg.createdAt,
      })),
    };
  }

  async addMessage(
    messageData: CreateMessageInput,
  ): Promise<WhatsAppMessageData> {
    const message = await this.prisma.whatsAppMessage.create({
      data: messageData,
    });

    return {
      id: message.id,
      role: message.role as "user" | "assistant",
      content: message.content,
      createdAt: message.createdAt,
    };
  }

  async getSessionMessages(sessionId: string): Promise<WhatsAppMessageData[]> {
    const messages = await this.prisma.whatsAppMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });

    return messages.map((msg) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant",
      content: msg.content,
      createdAt: msg.createdAt,
    }));
  }

  async cleanupExpiredSessions(): Promise<void> {
    await this.prisma.whatsAppSession.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { isActive: false }],
      },
    });
  }

  async limitSessionMessages(
    sessionId: string,
    maxMessages: number,
  ): Promise<void> {
    const messages = await this.prisma.whatsAppMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      skip: maxMessages,
    });

    if (messages.length > 0) {
      const messageIds = messages.map((msg) => msg.id);
      await this.prisma.whatsAppMessage.deleteMany({
        where: {
          id: { in: messageIds },
        },
      });
    }
  }

  async updateSessionExpiry(sessionId: string, expiresAt: Date): Promise<void> {
    await this.prisma.whatsAppSession.update({
      where: { id: sessionId },
      data: { expiresAt },
    });
  }

  async deactivateSession(sessionId: string): Promise<void> {
    await this.prisma.whatsAppSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });
  }
}

const prisma = new PrismaClient();
export const whatsAppMessageRepo = new WhatsAppMessageRepositoryImpl(prisma);
