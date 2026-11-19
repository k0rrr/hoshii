import { validateDemand } from "./validation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Database, Json } from "./database.types";

type DemandRow = Database["public"]["Tables"]["demands"]["Row"];
type StatsRow = Database["public"]["Functions"]["get_demand_stats"]["Returns"][number];

type DemandQuery = {
  area?: string;
  category?: string;
  ids?: string[];
  sort?: "new" | "popular";
  viewerId?: string;
  authorId?: string;
};

export type Demand = DemandRow & {
  author: string;
  supporterCount: number;
  priceCounts: Record<string, number>;
  frequencyCounts: Record<string, number>;
  hasVoted: boolean;
};

function toCounts(value: Json): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, count]) => [key, Number(count) || 0]));
}

export async function listDemands(options: DemandQuery = {}): Promise<Demand[]> {
  let query = supabase.from("demands").select("*").order("created_at", { ascending: false });
  if (options.area && options.area !== "すべて") query = query.eq("area", options.area);
  if (options.category && options.category !== "すべて") query = query.eq("category", options.category);
  if (options.ids) query = query.in("id", options.ids);
  if (options.authorId) query = query.eq("user_id", options.authorId);

  const { data, error } = await query;
  if (error) throw error;
  return enrichDemands(data ?? [], options.viewerId, options.sort);
}

export async function getDemand(id: string, userId?: string): Promise<Demand> {
  const { data, error } = await supabase.from("demands").select("*").eq("id", id).single();
  if (error) throw error;
  const [demand] = await enrichDemands([data], userId);
  return demand;
}

async function enrichDemands(rows: DemandRow[], userId?: string, sort?: "new" | "popular"): Promise<Demand[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const [profileResult, statsResult, ownVotesResult] = await Promise.all([
    supabase.from("profiles").select("id, display_name").in("id", userIds),
    supabase.rpc("get_demand_stats", { p_demand_ids: ids }),
    userId ? supabase.from("votes").select("demand_id").eq("user_id", userId).in("demand_id", ids) : Promise.resolve({ data: [], error: null }),
  ]);
  if (profileResult.error) throw profileResult.error;
  if (statsResult.error) throw statsResult.error;
  if (ownVotesResult.error) throw ownVotesResult.error;

  const names = new Map((profileResult.data ?? []).map((profile) => [profile.id, profile.display_name]));
  const stats = new Map((statsResult.data ?? []).map((stat: StatsRow) => [stat.demand_id, stat]));
  const votedIds = new Set((ownVotesResult.data ?? []).map((vote) => vote.demand_id));
  const demands = rows.map((row) => {
    const stat = stats.get(row.id);
    return {
      ...row,
      author: names.get(row.user_id) ?? "HOSHIIユーザー",
      supporterCount: stat?.supporter_count ?? 0,
      priceCounts: toCounts(stat?.price_counts ?? {}),
      frequencyCounts: toCounts(stat?.frequency_counts ?? {}),
      hasVoted: votedIds.has(row.id),
    };
  });
  if (sort === "popular") demands.sort((a, b) => b.supporterCount - a.supporterCount || b.created_at.localeCompare(a.created_at));
  return demands;
}

export async function createDemand(input: Pick<DemandRow, "title" | "area" | "category" | "description">, user: User): Promise<string> {
  const { data: profile, error: profileError } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
  if (profileError) throw profileError;
  const { data, error } = await supabase.from("demands").insert({ ...validateDemand(input), author: profile?.display_name ?? "HOSHIIユーザー", user_id: user.id }).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function updateDemand(id: string, input: Pick<DemandRow, "title" | "area" | "category" | "description">): Promise<void> {
  const { data, error } = await supabase.from("demands").update(validateDemand(input)).eq("id", id).select("id").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("この投稿を編集する権限がありません。");
}

export async function deleteDemand(id: string): Promise<void> {
  const { data, error } = await supabase.from("demands").delete().eq("id", id).select("id").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("この投稿を削除する権限がありません。");
}

export async function submitVote(input: { demandId: string; priceRange: string; usageFrequency: string; comment: string }): Promise<void> {
  const { error } = await supabase.rpc("submit_vote", {
    p_demand_id: input.demandId,
    p_price_range: input.priceRange,
    p_usage_frequency: input.usageFrequency,
    p_comment: input.comment || null,
  });
  if (error) throw error;
}

export async function getVotedDemands(userId: string): Promise<Demand[]> {
  const { data, error } = await supabase.from("votes").select("demand_id").eq("user_id", userId);
  if (error) throw error;
  const ids = (data ?? []).map((vote) => vote.demand_id);
  return ids.length ? listDemands({ ids, viewerId: userId }) : [];
}
