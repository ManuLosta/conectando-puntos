import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { userService } from "@/services/user.service";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No user session found" },
        { status: 401 },
      );
    }

    const distributorId = await userService.getDistributorIdForUser(
      session.user.id,
    );

    if (!distributorId) {
      return NextResponse.json(
        { error: "No distributor found for user" },
        { status: 404 },
      );
    }

    return NextResponse.json({ distributorId });
  } catch (error) {
    console.error("Error getting distributor ID:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
