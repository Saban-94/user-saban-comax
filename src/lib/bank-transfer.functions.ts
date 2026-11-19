import { createServerFn } from "@tanstack/react-start";
import { bankReceiptSchema } from "./bank-transfer";

const DEFAULT_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzDOCBvwU49LocqXuSEl_8-hOgEns_6ROArXK3TEh63HqN9PMv_unjnuix78B46I2Y0xg/exec";

export interface UploadBankReceiptResult {
  reference: string;
  uploadedAt: string;
  driveUrl: string | null;
  driveSynced: boolean;
}

export const uploadBankReceipt = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => bankReceiptSchema.parse(input))
  .handler(async ({ data }): Promise<UploadBankReceiptResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("customer_requests")
      .insert({
        request_kind: "bank_transfer_receipt",
        customer_name: data.customerName,
        mobile: data.orderOrPhone,
        details: {
          orderOrPhone: data.orderOrPhone,
          amount: data.amount,
          notes: data.notes,
          fileName: data.fileName,
          mimeType: data.mimeType,
          fileSize: data.fileSize,
        },
      })
      .select("id")
      .single();

    const reference = (
      row?.id ? row.id.slice(0, 8) : crypto.randomUUID().slice(0, 8)
    ).toUpperCase();
    const uploadedAt = new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
    const appsScriptUrl = process.env["GOOGLE_APPS_SCRIPT_URL"]?.trim() || DEFAULT_APPS_SCRIPT_URL;

    let driveUrl: string | null = null;
    let driveSynced = false;

    try {
      const response = await fetch(appsScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        redirect: "follow",
        body: JSON.stringify({
          action: "uploadReceipt",
          reference,
          source: "דף העברה בנקאית אונליין",
          data,
        }),
      });
      if (response.ok) {
        const text = await response.text();
        const parsed = JSON.parse(text) as {
          ok?: boolean;
          driveUrl?: string;
          uploadedToDrive?: boolean;
        };
        if (parsed.ok && parsed.uploadedToDrive !== false) {
          driveSynced = true;
          driveUrl = parsed.driveUrl || null;
        }
      }
    } catch {
      // Fallback gracefully when Apps Script hasn't been redeployed with Drive permissions yet.
    }

    return {
      reference,
      uploadedAt,
      driveUrl,
      driveSynced,
    };
  });
