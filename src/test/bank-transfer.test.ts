import { describe, expect, it } from "vitest";
import {
  BANK_TRANSFER_DETAILS,
  MAX_RECEIPT_BYTES,
  bankReceiptSchema,
  buildSalesWhatsAppUrl,
  normalizeWhatsAppNumber,
} from "@/lib/bank-transfer";

const validReceipt = {
  customerName: "בנייה מתקדמת בע״מ",
  orderOrPhone: "0501234567",
  amount: "4500",
  notes: "אסמכתא בנקאית 99812",
  fileName: "transfer-receipt.png",
  mimeType: "image/png" as const,
  fileSize: 20480,
  base64Data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ",
};

describe("Bank transfer details & receipt validation", () => {
  it("exposes exact Mizrahi Tefahot account details for H. Saban", () => {
    expect(BANK_TRANSFER_DETAILS.bankCode).toBe("20");
    expect(BANK_TRANSFER_DETAILS.branchCode).toBe("512");
    expect(BANK_TRANSFER_DETAILS.accountNumber).toBe("289134");
  });

  it("accepts a valid image or PDF receipt payload", () => {
    expect(bankReceiptSchema.safeParse(validReceipt).success).toBe(true);
    expect(
      bankReceiptSchema.safeParse({
        ...validReceipt,
        fileName: "receipt.pdf",
        mimeType: "application/pdf",
      }).success,
    ).toBe(true);
  });

  it("requires customer name and order/phone association", () => {
    expect(bankReceiptSchema.safeParse({ ...validReceipt, customerName: "" }).success).toBe(false);
    expect(bankReceiptSchema.safeParse({ ...validReceipt, orderOrPhone: "1" }).success).toBe(false);
  });

  it("rejects unsupported file types and files larger than 8MB", () => {
    expect(
      bankReceiptSchema.safeParse({
        ...validReceipt,
        mimeType: "application/zip",
      }).success,
    ).toBe(false);

    expect(
      bankReceiptSchema.safeParse({
        ...validReceipt,
        fileSize: MAX_RECEIPT_BYTES + 1,
      }).success,
    ).toBe(false);
  });

  it("normalizes Israeli phone numbers and builds a pre-filled sales WhatsApp link", () => {
    expect(normalizeWhatsAppNumber("050-123-4567")).toBe("972501234567");
    expect(normalizeWhatsAppNumber("+972 52 7654321")).toBe("972527654321");

    const url = buildSalesWhatsAppUrl({
      phone: "050-9876543",
      customerName: "משה כהן",
      orderOrPhone: "4512",
      amount: "1200",
      reference: "AB12CD34",
    });

    expect(url.startsWith("https://wa.me/972509876543?text=")).toBe(true);
    const decoded = decodeURIComponent(url.split("?text=")[1] ?? "");
    expect(decoded).toContain("העברה בנקאית");
    expect(decoded).toContain("289134");
    expect(decoded).toContain("משה כהן");
    expect(decoded).toContain("AB12CD34");
  });
});
