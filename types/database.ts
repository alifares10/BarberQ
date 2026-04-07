export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      appointment_services: {
        Row: {
          appointment_id: string;
          service_id: string;
        };
        Insert: {
          appointment_id: string;
          service_id: string;
        };
        Update: {
          appointment_id?: string;
          service_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'appointment_services_appointment_id_fkey';
            columns: ['appointment_id'];
            isOneToOne: false;
            referencedRelation: 'appointments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'appointment_services_service_id_fkey';
            columns: ['service_id'];
            isOneToOne: false;
            referencedRelation: 'services';
            referencedColumns: ['id'];
          },
        ];
      };
      appointments: {
        Row: {
          appointment_date: string;
          appointment_time: string;
          barber_id: string;
          created_at: string;
          customer_id: string;
          end_time: string;
          id: string;
          notes: string | null;
          shop_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          appointment_date: string;
          appointment_time: string;
          barber_id: string;
          created_at?: string;
          customer_id: string;
          end_time: string;
          id?: string;
          notes?: string | null;
          shop_id: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          appointment_date?: string;
          appointment_time?: string;
          barber_id?: string;
          created_at?: string;
          customer_id?: string;
          end_time?: string;
          id?: string;
          notes?: string | null;
          shop_id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'appointments_barber_id_fkey';
            columns: ['barber_id'];
            isOneToOne: false;
            referencedRelation: 'barbers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'appointments_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'appointments_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
        ];
      };
      barber_services: {
        Row: {
          barber_id: string;
          service_id: string;
        };
        Insert: {
          barber_id: string;
          service_id: string;
        };
        Update: {
          barber_id?: string;
          service_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'barber_services_barber_id_fkey';
            columns: ['barber_id'];
            isOneToOne: false;
            referencedRelation: 'barbers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'barber_services_service_id_fkey';
            columns: ['service_id'];
            isOneToOne: false;
            referencedRelation: 'services';
            referencedColumns: ['id'];
          },
        ];
      };
      barber_unavailable_dates: {
        Row: {
          barber_id: string;
          created_at: string;
          date: string;
          id: string;
          reason: string | null;
        };
        Insert: {
          barber_id: string;
          created_at?: string;
          date: string;
          id?: string;
          reason?: string | null;
        };
        Update: {
          barber_id?: string;
          created_at?: string;
          date?: string;
          id?: string;
          reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'barber_unavailable_dates_barber_id_fkey';
            columns: ['barber_id'];
            isOneToOne: false;
            referencedRelation: 'barbers';
            referencedColumns: ['id'];
          },
        ];
      };
      barbers: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          shop_id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          shop_id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          shop_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'barbers_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
        ];
      };
      otp_codes: {
        Row: {
          code: string;
          created_at: string;
          expires_at: string;
          id: string;
          phone: string;
          verified: boolean;
        };
        Insert: {
          code: string;
          created_at?: string;
          expires_at: string;
          id?: string;
          phone: string;
          verified?: boolean;
        };
        Update: {
          code?: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          phone?: string;
          verified?: boolean;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string;
          id: string;
          language: string;
          phone: string;
          role: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name: string;
          id: string;
          language?: string;
          phone: string;
          role: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string;
          id?: string;
          language?: string;
          phone?: string;
          role?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_tokens: {
        Row: {
          created_at: string;
          expo_push_token: string;
          id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          expo_push_token: string;
          id?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          expo_push_token?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'push_tokens_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      services: {
        Row: {
          created_at: string;
          description: string | null;
          duration: number;
          id: string;
          is_active: boolean;
          name: string;
          price: number;
          shop_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          duration: number;
          id?: string;
          is_active?: boolean;
          name: string;
          price: number;
          shop_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          duration?: number;
          id?: string;
          is_active?: boolean;
          name?: string;
          price?: number;
          shop_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'services_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
        ];
      };
      shop_closures: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          reason: string | null;
          shop_id: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          id?: string;
          reason?: string | null;
          shop_id: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: string;
          reason?: string | null;
          shop_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'shop_closures_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
        ];
      };
      shops: {
        Row: {
          address: string;
          buffer_minutes: number;
          cancellation_window_hours: number | null;
          cover_image_url: string | null;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          latitude: number;
          longitude: number;
          name: string;
          owner_id: string;
          phone: string;
          updated_at: string;
        };
        Insert: {
          address: string;
          buffer_minutes?: number;
          cancellation_window_hours?: number | null;
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          latitude: number;
          longitude: number;
          name: string;
          owner_id: string;
          phone: string;
          updated_at?: string;
        };
        Update: {
          address?: string;
          buffer_minutes?: number;
          cancellation_window_hours?: number | null;
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          latitude?: number;
          longitude?: number;
          name?: string;
          owner_id?: string;
          phone?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'shops_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      working_hours: {
        Row: {
          barber_id: string;
          day_of_week: number;
          end_time: string;
          id: string;
          is_available: boolean;
          start_time: string;
        };
        Insert: {
          barber_id: string;
          day_of_week: number;
          end_time: string;
          id?: string;
          is_available?: boolean;
          start_time: string;
        };
        Update: {
          barber_id?: string;
          day_of_week?: number;
          end_time?: string;
          id?: string;
          is_available?: boolean;
          start_time?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'working_hours_barber_id_fkey';
            columns: ['barber_id'];
            isOneToOne: false;
            referencedRelation: 'barbers';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof DatabaseWithoutInternals, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer RowType;
    }
    ? RowType
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer RowType;
      }
      ? RowType
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer InsertType;
    }
    ? InsertType
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer InsertType;
      }
      ? InsertType
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer UpdateType;
    }
    ? UpdateType
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer UpdateType;
      }
      ? UpdateType
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
