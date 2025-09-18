import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { userService } from "@/services/user.service";
import { salespersonService } from "@/services/salesperson.service";
import { CreateSalespersonInput } from "@/repositories/salesperson.repository";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const distributorId = await userService.getDistributorIdForUser(
      session.user.id,
    );

    if (!distributorId) {
      return NextResponse.json(
        { error: "No distributor found for user" },
        { status: 403 },
      );
    }

    const salespeople = await salespersonService.listForDistributor(
      distributorId,
      {
        userId: session.user.id,
        bypassRls: false,
      },
    );

    return NextResponse.json(salespeople);
  } catch (error) {
    console.error("Error fetching salespeople:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const distributorId = await userService.getDistributorIdForUser(
      session.user.id,
    );

    if (!distributorId) {
      return NextResponse.json(
        { error: "No distributor found for user" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const salespersonData: CreateSalespersonInput = {
      name: body.name,
      email: body.email,
      phone: body.phone || undefined,
      territory: body.territory || undefined,
    };

    // Validate required fields
    if (!salespersonData.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!salespersonData.email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const newSalesperson = await salespersonService.createForDistributor(
      distributorId,
      salespersonData,
      {
        userId: session.user.id,
        bypassRls: false,
      },
    );

    return NextResponse.json(newSalesperson, { status: 201 });
  } catch (error) {
    console.error("Error creating salesperson:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
