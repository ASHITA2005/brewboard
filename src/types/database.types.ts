export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
        };
      };
      table_sessions: {
        Row: {
          id: string;
          table_number: string;
          code: string;
          owner_id: string;
          is_closed: boolean;
          created_at: string;
          closed_at: string | null;
          last_active_at: string;
        };
        Insert: {
          id?: string;
          table_number: string;
          code: string;
          owner_id: string;
          is_closed?: boolean;
          created_at?: string;
          closed_at?: string | null;
          last_active_at?: string;
        };
        Update: {
          is_closed?: boolean;
          closed_at?: string | null;
          last_active_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          table_session_id: string;
          customer_id: string;
          status: "received" | "preparing" | "ready" | "complete";
          items: Json;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          table_session_id: string;
          customer_id: string;
          status?: "received" | "preparing" | "ready" | "complete";
          items: Json;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          status?: "received" | "preparing" | "ready" | "complete";
          completed_at?: string | null;
        };
      };
      love_messages: {
        Row: {
          id: string;
          table_session_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          table_session_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          body?: string;
        };
      };
      menu_items: {
        Row: {
          id: string;
          name: string;
          description: string;
          price: number;
          category: string;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          price: number;
          category: string;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          price?: number;
          category?: string;
          image_url?: string | null;
          is_active?: boolean;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
