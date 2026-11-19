import { createServerFn } from "@tanstack/react-start";
import { registrationSchema } from "./registration";

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

    const appsScriptUrl = process.env["GOOGLE_APPS_SCRIPT_URL"]?.trim();
    if (appsScriptUrl) {
      const response = await fetch(appsScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (result.ok === false) {
        throw new Error(result.error || "הסנכרון מול גיליון הגוגל נכשל. נסו שוב.");
      }
    }

    return { reference };
  });
