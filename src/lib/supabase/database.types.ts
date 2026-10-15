export type Json = string | number | boolean | null | { readonly [key: string]: Json | undefined } | Json[]

export type Database = {
  readonly public: {
    readonly Tables: {
      readonly profiles: {
        readonly Row: { readonly id: string; readonly display_name: string; readonly created_at: string }
        readonly Insert: { readonly id: string; readonly display_name: string; readonly created_at?: string }
        readonly Update: { readonly display_name?: string }
        readonly Relationships: []
      }
    }
    readonly Views: { readonly [key in never]: never }
    readonly Functions: {
      readonly personal_snapshot: { readonly Args: Record<string, never>; readonly Returns: Json }
      readonly personal_command: { readonly Args: { readonly command: Json }; readonly Returns: Json }
      readonly workspace_snapshot: { readonly Args: { readonly selected_group?: string | null }; readonly Returns: Json }
      readonly collaboration_command: { readonly Args: { readonly command: Json }; readonly Returns: Json }
    }
    readonly Enums: { readonly [key in never]: never }
    readonly CompositeTypes: { readonly [key in never]: never }
  }
}
