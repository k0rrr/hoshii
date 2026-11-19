export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      demands: {
        Row: { id: string; author: string; title: string; area: string; category: string; description: string; user_id: string; created_at: string };
        Insert: { id?: string; author: string; title: string; area: string; category: string; description: string; user_id: string; created_at?: string };
        Update: { title?: string; area?: string; category?: string; description?: string };
        Relationships: [];
      };
      profiles: {
        Row: { id: string; display_name: string; created_at: string };
        Insert: { id: string; display_name?: string; created_at?: string };
        Update: { display_name?: string };
        Relationships: [];
      };
      votes: {
        Row: { id: string; demand_id: string; user_id: string; created_at: string };
        Insert: { id?: string; demand_id: string; user_id: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      vote_answers: {
        Row: { id: string; vote_id: string; price_range: string; usage_frequency: string; comment: string | null; created_at: string };
        Insert: { id?: string; vote_id: string; price_range: string; usage_frequency: string; comment?: string | null; created_at?: string };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_demand_stats: { Args: { p_demand_ids: string[] }; Returns: { demand_id: string; supporter_count: number; price_counts: Json; frequency_counts: Json }[] };
      submit_vote: { Args: { p_demand_id: string; p_price_range: string; p_usage_frequency: string; p_comment?: string | null }; Returns: string };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
