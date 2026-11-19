import { createServerFn } from "@tanstack/react-start";
import { registrationSchema } from "./registration";

const DEFAULT_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzDOCBvwU49LocqXuSEl_8-hOgEns_6ROArXK3TEh63HqN9PMv_unjnuix78B46I2Y0xg/exec";

export const submitRegistration = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => registrationSchema.parse(input))
  .handler(async ({ data }) => {
    // Public intake only: no record lookup, updates, or privilege assignment.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("customer_requests")
      .insert({
        request_kind: data.kind,
        customer_name: data.name,
        mobile: data.mobile,
        details: data,
      })
      .select("id")
      .single();
    if (error || !row) {
      throw new Error("לא ניתן לשלוח את הבקשה כרגע. הפרטים נשמרו בטופס, נסו שוב.");
    }

    const reference = row.id.slice(0, 8).toUpperCase();
    const appsScriptUrl = process.env["GOOGLE_APPS_SCRIPT_URL"]?.trim() || DEFAULT_APPS_SCRIPT_URL;

    const response = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      redirect: "follow",
      body: JSON.stringify({
        action: "submit",
        reference,
        source: "ממשק אינטרנט אונליין",
        data,
      }),
    });

    if (!response.ok) {
      throw new Error("הסנכרון מול גיליון הגוגל נכשל. נסו שוב.");
    }

    const rawText = await response.text();
    let result: { ok?: boolean; error?: string; reference?: string } | null = null;
    try {
      result = JSON.parse(rawText) as { ok?: boolean; error?: string; reference?: string };
    } catch {
      throw new Error("תגובה לא תקינה משרת הגיליון. נסו שוב.");
    }

    if (!result?.ok) {
      throw new Error(result?.error || "הסנכרון מול גיליון הגוגל נכשל. נסו שוב.");
    }

    return { reference: result.reference || reference };
  });
