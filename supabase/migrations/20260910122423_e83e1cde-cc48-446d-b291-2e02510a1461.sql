CREATE TABLE IF NOT EXISTS public.refused_loads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_in_date date NOT NULL DEFAULT current_date,
  customer_id uuid REFERENCES public.customers(id),
  contact_id uuid REFERENCES public.contacts(id),
  site_id uuid REFERENCES public.sites(id),
  lane_id uuid REFERENCES public.lanes(id),
  product_id uuid REFERENCES public.products(id),
  product text,
  equipment_id uuid REFERENCES public.equipment(id),
  equipment_type text,
  load_count numeric,
  rated_status text,
  pickup_city text,
  pickup_state text,
  delivery_city text,
  delivery_state text,
  multiple_requested_dates boolean NOT NULL DEFAULT false,
  requested_comments text,
  offered_date date,
  offered_comments text,
  loss_reason text,
  cs_rep text,
  estimated_lost_revenue numeric,
  currency text NOT NULL DEFAULT 'USD',
  opportunity_id uuid REFERENCES public.opportunities(id),
  bid_id uuid REFERENCES public.bids(id),
  rate_id uuid REFERENCES public.rates(id),
  internal_notes text,
  record_status text NOT NULL DEFAULT 'Active',
  review_status text NOT NULL DEFAULT 'Not reviewed',
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.refused_loads TO authenticated;
GRANT ALL ON public.refused_loads TO service_role;

ALTER TABLE public.refused_loads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "refused_loads_select" ON public.refused_loads FOR SELECT TO authenticated USING (true);
CREATE POLICY "refused_loads_insert" ON public.refused_loads FOR INSERT TO authenticated WITH CHECK (public.can_write());
CREATE POLICY "refused_loads_update" ON public.refused_loads FOR UPDATE TO authenticated USING (public.can_write()) WITH CHECK (public.can_write());
CREATE POLICY "refused_loads_delete" ON public.refused_loads FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.refused_loads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS refused_loads_customer_idx ON public.refused_loads(customer_id);
CREATE INDEX IF NOT EXISTS refused_loads_call_in_date_idx ON public.refused_loads(call_in_date DESC);

INSERT INTO public.lookup_values (category, value, label, sort_order)
SELECT 'refused_load_equipment_type', v, v, i
FROM unnest(ARRAY['Product Tanker','Box Van','Waste Tanker','Power Only','Other']) WITH ORDINALITY AS t(v, i)
ON CONFLICT DO NOTHING;

INSERT INTO public.lookup_values (category, value, label, sort_order)
SELECT 'refused_load_status', v, v, i
FROM unnest(ARRAY['Active','Under review','Recovered','Closed']) WITH ORDINALITY AS t(v, i)
ON CONFLICT DO NOTHING;

INSERT INTO public.lookup_values (category, value, label, sort_order)
SELECT 'loss_reason', v, v, i
FROM unnest(ARRAY['No capacity','No driver available','No equipment available','Rate too high','Not rated','Product not approved','Site not approved','Timing / customer schedule','Lane not serviced','Other']) WITH ORDINALITY AS t(v, i)
ON CONFLICT DO NOTHING;

INSERT INTO public.lookup_values (category, value, label, sort_order)
SELECT 'us_state', v, v, i
FROM unnest(ARRAY['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC']) WITH ORDINALITY AS t(v, i)
ON CONFLICT DO NOTHING;