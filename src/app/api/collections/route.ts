import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { userService } from "@/services/user.service";
import { collectionsService } from "@/services/cobranzas.service";
import { PaymentType } from "@prisma/client";

export async function POST(request: Request) {
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

    const body = await request.json();
    const { invoiceId, amount, paymentMethod, notes, date } = body;

    // Validate required fields
    if (!invoiceId || !amount || !paymentMethod || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Map payment method to PaymentType enum
    let paymentType: PaymentType;
    switch (paymentMethod) {
      case "efectivo":
        paymentType = PaymentType.CASH;
        break;
      case "transferencia":
        paymentType = PaymentType.BANK_TRANSFER;
        break;
      case "cheque":
        paymentType = PaymentType.CHECK;
        break;
      case "tarjeta":
        paymentType = PaymentType.CREDIT_CARD;
        break;
      default:
        paymentType = PaymentType.CASH;
    }

    // Register the payment
    const collection = await collectionsService.recordPayment(
      invoiceId,
      parseFloat(amount),
      paymentType,
      notes || undefined,
    );

    return NextResponse.json({
      success: true,
      collection,
    });
  } catch (error) {
    console.error("Error registering payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
