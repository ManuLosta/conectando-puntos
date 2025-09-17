import { SuggestedProduct } from "@/types/suggestedProduct";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

export interface UserRepository {
  getSalespersonDistributor(salespersonId: string): Promise<string | null>;
  getSalespersonDistributorByPhone(phone: string): Promise<string | null>;
  getSalespersonIdByPhone(phone: string): Promise<string | null>;
}

export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async getSalespersonDistributor(
    salespersonId: string,
  ): Promise<string | null> {
    const salesperson = await this.prisma.salesperson.findUnique({
      where: { id: salespersonId },
      select: { distributorId: true },
    });

    return salesperson?.distributorId || null;
  }

  async getSalespersonDistributorByPhone(
    phone: string,
  ): Promise<string | null> {
    const salesperson = await this.prisma.salesperson.findFirst({
      where: {
        phone: phone,
      },
      select: { distributorId: true },
    });

    return salesperson?.distributorId || null;
  }

  async getSalespersonIdByPhone(phone: string): Promise<string | null> {
    const salesperson = await this.prisma.salesperson.findFirst({
      where: {
        phone: phone,
      },
      select: { id: true },
    });

    return salesperson?.id || null;
  }

  async getSuggestedProducts(
    clientId: string,
    distributorId: string,
    asOf: Date,
    top: number,
  ): Promise<SuggestedProduct[]> {
    // Leer el archivo SQL
    const sqlPath = path.join(
      process.cwd(),
      "src",
      "queries",
      "suggestions.sql",
    );
    const sqlQuery = fs.readFileSync(sqlPath, "utf-8");

    // Reemplazar los parámetros en la query
    const processedQuery = sqlQuery
      .replace(/:client_id::text/g, `'${clientId}'::text`)
      .replace(/:distributor_id::text/g, `'${distributorId}'::text`)
      .replace(/:as_of::timestamptz/g, `'${asOf.toISOString()}'::timestamptz`)
      .replace(/:top::int/g, `${top}`);

    const results =
      await this.prisma.$queryRawUnsafe<SuggestedProduct[]>(processedQuery);

    return results;
  }
}

const prisma = new PrismaClient();
export const userRepo = new PrismaUserRepository(prisma);
