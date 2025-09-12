
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (data?.claims) {
    redirect("/protected");
  } else {
    redirect("/auth/login");
  }
}
