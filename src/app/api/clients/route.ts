import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { userService } from "@/services/user.service";
import { customerService } from "@/services/customer.service";
import { CreateCustomerInput } from "@/repositories/customer.repository";

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
    const clientData: CreateCustomerInput = {
      name: body.name,
      phone: body.phone || undefined,
      email: body.email || undefined,
      address: body.address || undefined,
      city: body.city || undefined,
      postalCode: body.postalCode || undefined,
      clientType: body.clientType || undefined,
      notes: body.notes || undefined,
      assignedSalespersonId: body.assignedSalespersonId || undefined,
    };

    // Validate required fields
    if (!clientData.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const newClient = await customerService.createForDistributor(
      distributorId,
      clientData,
    );

    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
