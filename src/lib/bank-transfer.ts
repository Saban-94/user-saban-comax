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
