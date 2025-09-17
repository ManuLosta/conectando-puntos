-- CreateTable
CREATE TABLE "public"."whatsapp_sessions" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "distributorId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."whatsapp_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_sessions_phoneNumber_distributorId_key" ON "public"."whatsapp_sessions"("phoneNumber", "distributorId");

-- AddForeignKey
ALTER TABLE "public"."whatsapp_sessions" ADD CONSTRAINT "whatsapp_sessions_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "public"."distributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."whatsapp_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
