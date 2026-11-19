import { validateDisplayName } from "./validation";
import { supabase } from "./supabase";

export async function getDisplayName(userId: string): Promise<string> {
  const { data, error } = await supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data?.display_name ?? "HOSHIIユーザー";
}

export async function updateDisplayName(userId: string, displayName: string): Promise<void> {
  const { data, error } = await supabase.from("profiles").update({ display_name: validateDisplayName(displayName) }).eq("id", userId).select("id").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("プロフィールが見つかりません。");
}
