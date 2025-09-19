import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { userService } from "@/services/user.service";
import { collectionsService } from "@/services/cobranzas.service";

export async function GET() {
  try {
    console.log("API: Getting invoices for collection");

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    console.log(
      "API: Session:",
      session ? "exists" : "null",
      session?.user?.id,
    );

    if (!session?.user?.id) {
      console.log("API: No user session found");
      return NextResponse.json(
        { error: "No user session found" },
        { status: 401 },
      );
    }

    console.log("API: Getting distributor for user:", session.user.id);
    const distributorId = await userService.getDistributorIdForUser(
      session.user.id,
    );

    console.log("API: Distributor ID:", distributorId);

    if (!distributorId) {
      console.log("API: No distributor found for user");
      return NextResponse.json(
        { error: "No distributor found for user" },
        { status: 404 },
      );
    }

    console.log("API: Fetching invoices for distributor:", distributorId);
    const invoices =
      await collectionsService.getInvoicesForCollection(distributorId);

    console.log("API: Found invoices:", invoices.length);
    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("API: Error getting invoices for collection:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
