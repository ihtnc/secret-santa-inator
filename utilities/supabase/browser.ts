"use client";

import { createBrowserClient } from "@supabase/ssr";

function getClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  const supabase = createBrowserClient(supabaseUrl, supabaseKey);
  return supabase;
};

export default getClient();