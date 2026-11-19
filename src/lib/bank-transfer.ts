import { z } from "zod";

export const ALLOWED_RECEIPT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
] as const;

export const MAX_RECEIPT_BYTES = 8 * 1024 * 1024;

export const bankReceiptSchema = z.object({
  customerName: z.string().trim().min(1, "יש להזין שם לקוח או שם עסק").max(200),
  orderOrPhone: z.string().trim().min(2, "יש להזין מספר הזמנה או טלפון לשיוך").max(120),
  amount: z.string().trim().max(40),
  notes: z.string().trim().max(1000),
  fileName: z.string().trim().min(1, "יש לצרף קובץ אסמכתא").max(255),
  mimeType: z.enum(ALLOWED_RECEIPT_MIME_TYPES, {
    errorMap: () => ({ message: "יש להעלות קובץ תמונה (JPG/PNG/WEBP) או PDF בלבד" }),
  }),
  fileSize: z
    .number()
    .int()
    .positive("קובץ ריק אינו תקין")
    .max(MAX_RECEIPT_BYTES, "גודל הקובץ המרבי הוא 8MB"),
  base64Data: z.string().min(10, "תוכן הקובץ אינו תקין"),
});

export type BankReceiptInput = z.infer<typeof bankReceiptSchema>;

export const BANK_TRANSFER_DETAILS = {
  beneficiary: 'ח.סבן חומרי בנין 1994 בע"מ',
  bankName: "בנק מזרחי",
  bankCode: "20",
  branchCode: "512",
  accountNumber: "289134",
} as const;

export const DEFAULT_SALES_WHATSAPP_NUMBER = "972500000000";

export function normalizeWhatsAppNumber(raw?: string): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return DEFAULT_SALES_WHATSAPP_NUMBER;
  if (digits.startsWith("0")) {
    return `972${digits.slice(1)}`;
  }
  return digits;
}

export interface WhatsAppSupportContext {
  phone?: string | undefined;
  customerName?: string | undefined;
  orderOrPhone?: string | undefined;
  amount?: string | undefined;
  reference?: string | undefined;
}

export function buildSalesWhatsAppUrl(context: WhatsAppSupportContext = {}): string {
  const envPhone =
    typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env["VITE_SALES_WHATSAPP_NUMBER"]
      : undefined;
  const phone = normalizeWhatsAppNumber(context.phone ?? envPhone);

  const lines = [
    `שלום מחלקת המכירות של ${BANK_TRANSFER_DETAILS.beneficiary},`,
    `אני פונה בנוגע להעברה בנקאית לחשבון ${BANK_TRANSFER_DETAILS.bankName} (${BANK_TRANSFER_DETAILS.bankCode}) סניף ${BANK_TRANSFER_DETAILS.branchCode} חשבון ${BANK_TRANSFER_DETAILS.accountNumber}.`,
  ];

  if (context.customerName?.trim()) {
    lines.push(`שם לקוח / עסק: ${context.customerName.trim()}`);
  }
  if (context.orderOrPhone?.trim()) {
    lines.push(`מספר הזמנה / טלפון: ${context.orderOrPhone.trim()}`);
  }
  if (context.amount?.trim()) {
    lines.push(`סכום העברה: ${context.amount.trim()} ₪`);
  }
  if (context.reference?.trim()) {
    lines.push(`מספר אסמכתא במערכת: ${context.reference.trim()}`);
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
}
