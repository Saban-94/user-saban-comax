CREATE TABLE public.customer_requests (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamptz NOT NULL DEFAULT now(), request_kind text NOT NULL, customer_name text NOT NULL, mobile text NOT NULL, details jsonb NOT NULL);
GRANT ALL ON public.customer_requests TO service_role;
ALTER TABLE public.customer_requests ENABLE ROW LEVEL SECURITY;