import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function withTenant<T>(
  args: { userId: string; distributorId?: string; bypassRls?: boolean },
  run: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  const { userId, distributorId, bypassRls } = args;

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`select set_config('app.user_id', ${userId}, true)`;
    await tx.$queryRaw`select set_config('app.bypass_rls', ${bypassRls ? "on" : "off"}, true)`;
    if (distributorId) {
      await tx.$queryRaw`select set_config('app.distributor_id', ${distributorId}, true)`;
    }
    return run(tx);
  });
}
