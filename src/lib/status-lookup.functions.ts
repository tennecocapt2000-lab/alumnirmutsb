import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  term: z.string().trim().min(3).max(30),
});

export type StatusLookupRow = {
  id: string;
  prefix: string;
  full_name: string;
  phone: string;
  status: string;
  member_no: string | null;
  created_at: string;
  payment_date: string | null;
};

// Public lookup: returns minimal fields and only matches by exact phone or exact member_no.
// admin_note is intentionally excluded — it may contain internal notes that should
// not be exposed via a public phone-based lookup.
export const lookupApplicationStatus = createServerFn({ method: "POST" })
  .inputValidator((input) => schema.parse(input))
  .handler(async ({ data }): Promise<StatusLookupRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const term = data.term.replace(/\s+/g, "");

    const { data: rows, error } = await supabaseAdmin
      .from("applications")
      .select("id,prefix,full_name,phone,status,member_no,created_at,payment_date")
      .or(`phone.eq.${term},member_no.eq.${term}`)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw new Error(error.message);
    return (rows ?? []) as StatusLookupRow[];
  });
