import { createServerFn } from '@tanstack/react-start';
import { registrationSchema } from './registration';

export const submitRegistration = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => registrationSchema.parse(input))
  .handler(async ({ data }) => {
    // Public intake only: no record lookup, updates, or privilege assignment.
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: row, error } = await supabaseAdmin.from('customer_requests').insert({
      request_kind: data.kind, customer_name: data.name, mobile: data.mobile, details: data,
    }).select('id').single();
    if (error || !row) throw new Error('לא ניתן לשלוח את הבקשה כרגע. הפרטים נשמרו בטופס, נסו שוב.');
    return { reference: row.id.slice(0, 8).toUpperCase() };
  });