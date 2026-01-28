export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          codigo_municipio: string | null
          company_id: string
          complemento: string | null
          created_at: string
          documento: string
          email: string | null
          id: string
          inscricao_estadual: string | null
          is_active: boolean
          logradouro: string | null
          nome: string
          numero: string | null
          telefone: string | null
          tipo_documento: string
          uf: string | null
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          codigo_municipio?: string | null
          company_id: string
          complemento?: string | null
          created_at?: string
          documento: string
          email?: string | null
          id?: string
          inscricao_estadual?: string | null
          is_active?: boolean
          logradouro?: string | null
          nome: string
          numero?: string | null
          telefone?: string | null
          tipo_documento: string
          uf?: string | null
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          codigo_municipio?: string | null
          company_id?: string
          complemento?: string | null
          created_at?: string
          documento?: string
          email?: string | null
          id?: string
          inscricao_estadual?: string | null
          is_active?: boolean
          logradouro?: string | null
          nome?: string
          numero?: string | null
          telefone?: string | null
          tipo_documento?: string
          uf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          ambiente: Database["public"]["Enums"]["invoice_environment"]
          bairro: string
          cep: string
          certificate_file_path: string | null
          certificate_password_hash: string | null
          cidade: string
          cnpj: string
          codigo_municipio: string
          complemento: string | null
          created_at: string
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          is_active: boolean
          logradouro: string
          nome_fantasia: string | null
          numero: string
          numero_nfe_atual: number
          razao_social: string
          regime_tributario: Database["public"]["Enums"]["tax_regime"]
          serie_nfe: number
          uf: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ambiente?: Database["public"]["Enums"]["invoice_environment"]
          bairro: string
          cep: string
          certificate_file_path?: string | null
          certificate_password_hash?: string | null
          cidade: string
          cnpj: string
          codigo_municipio: string
          complemento?: string | null
          created_at?: string
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          is_active?: boolean
          logradouro: string
          nome_fantasia?: string | null
          numero: string
          numero_nfe_atual?: number
          razao_social: string
          regime_tributario?: Database["public"]["Enums"]["tax_regime"]
          serie_nfe?: number
          uf: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ambiente?: Database["public"]["Enums"]["invoice_environment"]
          bairro?: string
          cep?: string
          certificate_file_path?: string | null
          certificate_password_hash?: string | null
          cidade?: string
          cnpj?: string
          codigo_municipio?: string
          complemento?: string | null
          created_at?: string
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          is_active?: boolean
          logradouro?: string
          nome_fantasia?: string | null
          numero?: string
          numero_nfe_atual?: number
          razao_social?: string
          regime_tributario?: Database["public"]["Enums"]["tax_regime"]
          serie_nfe?: number
          uf?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      correction_letters: {
        Row: {
          correcao: string
          created_at: string
          data_registro: string
          id: string
          invoice_id: string
          numero_sequencia: number
          protocolo: string | null
          status: string
        }
        Insert: {
          correcao: string
          created_at?: string
          data_registro?: string
          id?: string
          invoice_id: string
          numero_sequencia: number
          protocolo?: string | null
          status?: string
        }
        Update: {
          correcao?: string
          created_at?: string
          data_registro?: string
          id?: string
          invoice_id?: string
          numero_sequencia?: number
          protocolo?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "correction_letters_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          cfop: string
          codigo: string
          cofins_aliquota: number
          cofins_base: number
          cofins_valor: number
          created_at: string
          csosn: string | null
          cst: string | null
          descricao: string
          icms_aliquota: number
          icms_base: number
          icms_valor: number
          id: string
          invoice_id: string
          ipi_aliquota: number
          ipi_base: number
          ipi_valor: number
          ncm: string
          numero_item: number
          origem: string
          pis_aliquota: number
          pis_base: number
          pis_valor: number
          product_id: string | null
          quantidade: number
          unidade: string
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          cfop: string
          codigo: string
          cofins_aliquota?: number
          cofins_base?: number
          cofins_valor?: number
          created_at?: string
          csosn?: string | null
          cst?: string | null
          descricao: string
          icms_aliquota?: number
          icms_base?: number
          icms_valor?: number
          id?: string
          invoice_id: string
          ipi_aliquota?: number
          ipi_base?: number
          ipi_valor?: number
          ncm: string
          numero_item: number
          origem?: string
          pis_aliquota?: number
          pis_base?: number
          pis_valor?: number
          product_id?: string | null
          quantidade: number
          unidade: string
          valor_total: number
          valor_unitario: number
        }
        Update: {
          cfop?: string
          codigo?: string
          cofins_aliquota?: number
          cofins_base?: number
          cofins_valor?: number
          created_at?: string
          csosn?: string | null
          cst?: string | null
          descricao?: string
          icms_aliquota?: number
          icms_base?: number
          icms_valor?: number
          id?: string
          invoice_id?: string
          ipi_aliquota?: number
          ipi_base?: number
          ipi_valor?: number
          ncm?: string
          numero_item?: number
          origem?: string
          pis_aliquota?: number
          pis_base?: number
          pis_valor?: number
          product_id?: string | null
          quantidade?: number
          unidade?: string
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          ambiente: Database["public"]["Enums"]["invoice_environment"]
          chave_acesso: string | null
          client_id: string
          company_id: string
          created_at: string
          danfe_path: string | null
          data_autorizacao: string | null
          data_cancelamento: string | null
          data_emissao: string
          id: string
          informacoes_complementares: string | null
          motivo_cancelamento: string | null
          natureza_operacao: string
          numero: number
          protocolo_autorizacao: string | null
          serie: number
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
          valor_cofins: number
          valor_desconto: number
          valor_frete: number
          valor_icms: number
          valor_ipi: number
          valor_outras_despesas: number
          valor_pis: number
          valor_produtos: number
          valor_seguro: number
          valor_total: number
          xml_path: string | null
        }
        Insert: {
          ambiente: Database["public"]["Enums"]["invoice_environment"]
          chave_acesso?: string | null
          client_id: string
          company_id: string
          created_at?: string
          danfe_path?: string | null
          data_autorizacao?: string | null
          data_cancelamento?: string | null
          data_emissao?: string
          id?: string
          informacoes_complementares?: string | null
          motivo_cancelamento?: string | null
          natureza_operacao?: string
          numero: number
          protocolo_autorizacao?: string | null
          serie: number
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
          valor_cofins?: number
          valor_desconto?: number
          valor_frete?: number
          valor_icms?: number
          valor_ipi?: number
          valor_outras_despesas?: number
          valor_pis?: number
          valor_produtos?: number
          valor_seguro?: number
          valor_total?: number
          xml_path?: string | null
        }
        Update: {
          ambiente?: Database["public"]["Enums"]["invoice_environment"]
          chave_acesso?: string | null
          client_id?: string
          company_id?: string
          created_at?: string
          danfe_path?: string | null
          data_autorizacao?: string | null
          data_cancelamento?: string | null
          data_emissao?: string
          id?: string
          informacoes_complementares?: string | null
          motivo_cancelamento?: string | null
          natureza_operacao?: string
          numero?: number
          protocolo_autorizacao?: string | null
          serie?: number
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
          valor_cofins?: number
          valor_desconto?: number
          valor_frete?: number
          valor_icms?: number
          valor_ipi?: number
          valor_outras_despesas?: number
          valor_pis?: number
          valor_produtos?: number
          valor_seguro?: number
          valor_total?: number
          xml_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          cfop: string
          codigo: string
          cofins_aliquota: number | null
          company_id: string
          created_at: string
          csosn: string | null
          cst: string | null
          descricao: string
          icms_aliquota: number | null
          id: string
          ipi_aliquota: number | null
          is_active: boolean
          ncm: string
          origem: string
          pis_aliquota: number | null
          unidade: string
          updated_at: string
          valor_unitario: number
        }
        Insert: {
          cfop: string
          codigo: string
          cofins_aliquota?: number | null
          company_id: string
          created_at?: string
          csosn?: string | null
          cst?: string | null
          descricao: string
          icms_aliquota?: number | null
          id?: string
          ipi_aliquota?: number | null
          is_active?: boolean
          ncm: string
          origem?: string
          pis_aliquota?: number | null
          unidade: string
          updated_at?: string
          valor_unitario: number
        }
        Update: {
          cfop?: string
          codigo?: string
          cofins_aliquota?: number | null
          company_id?: string
          created_at?: string
          csosn?: string | null
          cst?: string | null
          descricao?: string
          icms_aliquota?: number | null
          id?: string
          ipi_aliquota?: number | null
          is_active?: boolean
          ncm?: string
          origem?: string
          pis_aliquota?: number | null
          unidade?: string
          updated_at?: string
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_owns_company: { Args: { company_uuid: string }; Returns: boolean }
    }
    Enums: {
      invoice_environment: "homologacao" | "producao"
      invoice_status:
        | "rascunho"
        | "pendente"
        | "autorizada"
        | "cancelada"
        | "rejeitada"
      tax_regime: "simples_nacional" | "lucro_presumido" | "lucro_real"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      invoice_environment: ["homologacao", "producao"],
      invoice_status: [
        "rascunho",
        "pendente",
        "autorizada",
        "cancelada",
        "rejeitada",
      ],
      tax_regime: ["simples_nacional", "lucro_presumido", "lucro_real"],
    },
  },
} as const
