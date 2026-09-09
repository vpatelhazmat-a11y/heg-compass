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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bids: {
        Row: {
          bid_name: string
          bid_type: string | null
          created_at: string
          customer_id: string | null
          decision_date: string | null
          document_status: string | null
          due_date: string | null
          estimated_loads: number | null
          estimated_revenue: number | null
          id: string
          issue_date: string | null
          loss_reason: string | null
          notes: string | null
          opportunity_id: string | null
          outcome: string | null
          owner: string | null
          pricing_status: string | null
          qualification_status: string | null
          question_deadline: string | null
          status: string
          updated_at: string
        }
        Insert: {
          bid_name: string
          bid_type?: string | null
          created_at?: string
          customer_id?: string | null
          decision_date?: string | null
          document_status?: string | null
          due_date?: string | null
          estimated_loads?: number | null
          estimated_revenue?: number | null
          id?: string
          issue_date?: string | null
          loss_reason?: string | null
          notes?: string | null
          opportunity_id?: string | null
          outcome?: string | null
          owner?: string | null
          pricing_status?: string | null
          qualification_status?: string | null
          question_deadline?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          bid_name?: string
          bid_type?: string | null
          created_at?: string
          customer_id?: string | null
          decision_date?: string | null
          document_status?: string | null
          due_date?: string | null
          estimated_loads?: number | null
          estimated_revenue?: number | null
          id?: string
          issue_date?: string | null
          loss_reason?: string | null
          notes?: string | null
          opportunity_id?: string | null
          outcome?: string | null
          owner?: string | null
          pricing_status?: string | null
          qualification_status?: string | null
          question_deadline?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          active: boolean
          contact_type: string | null
          created_at: string
          customer_id: string | null
          department: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          mobile: string | null
          notes: string | null
          phone: string | null
          preferred_contact_method: string | null
          site_id: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          contact_type?: string | null
          created_at?: string
          customer_id?: string | null
          department?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          mobile?: string | null
          notes?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          site_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          contact_type?: string | null
          created_at?: string
          customer_id?: string | null
          department?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          mobile?: string | null
          notes?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          site_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          commercial_terms_summary: string | null
          contract_name: string | null
          contract_number: string | null
          created_at: string
          customer_id: string | null
          effective_date: string | null
          expiration_date: string | null
          id: string
          notes: string | null
          owner: string | null
          renewal_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          commercial_terms_summary?: string | null
          contract_name?: string | null
          contract_number?: string | null
          created_at?: string
          customer_id?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          id?: string
          notes?: string | null
          owner?: string | null
          renewal_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          commercial_terms_summary?: string | null
          contract_name?: string | null
          contract_number?: string | null
          created_at?: string
          customer_id?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          id?: string
          notes?: string | null
          owner?: string | null
          renewal_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      corrective_actions: {
        Row: {
          action: string
          completion_date: string | null
          completion_evidence: string | null
          created_at: string
          due_date: string | null
          id: string
          incident_id: string | null
          notes: string | null
          owner: string | null
          status: string
          updated_at: string
        }
        Insert: {
          action: string
          completion_date?: string | null
          completion_evidence?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          incident_id?: string | null
          notes?: string | null
          owner?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          action?: string
          completion_date?: string | null
          completion_evidence?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          incident_id?: string | null
          notes?: string | null
          owner?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "corrective_actions_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          account_owner: string | null
          archived_at: string | null
          commercial_notes: string | null
          created_at: string
          created_by: string | null
          customer_since: string | null
          customer_type: string | null
          data_quality_status: string | null
          dba_name: string | null
          headquarters_address: string | null
          id: string
          import_batch_id: string | null
          imported_at: string | null
          industry: string | null
          last_synced_at: string | null
          legal_name: string
          needs_review: boolean
          qualification_notes: string | null
          qualification_status: string
          review_reason: string | null
          risk_notes: string | null
          source_file: string | null
          source_record_id: string | null
          source_row: number | null
          source_sheet: string | null
          source_system: string | null
          status: string
          strategic_priority: string | null
          sync_status: string | null
          updated_at: string
          updated_by: string | null
          website: string | null
        }
        Insert: {
          account_owner?: string | null
          archived_at?: string | null
          commercial_notes?: string | null
          created_at?: string
          created_by?: string | null
          customer_since?: string | null
          customer_type?: string | null
          data_quality_status?: string | null
          dba_name?: string | null
          headquarters_address?: string | null
          id?: string
          import_batch_id?: string | null
          imported_at?: string | null
          industry?: string | null
          last_synced_at?: string | null
          legal_name: string
          needs_review?: boolean
          qualification_notes?: string | null
          qualification_status?: string
          review_reason?: string | null
          risk_notes?: string | null
          source_file?: string | null
          source_record_id?: string | null
          source_row?: number | null
          source_sheet?: string | null
          source_system?: string | null
          status?: string
          strategic_priority?: string | null
          sync_status?: string | null
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Update: {
          account_owner?: string | null
          archived_at?: string | null
          commercial_notes?: string | null
          created_at?: string
          created_by?: string | null
          customer_since?: string | null
          customer_type?: string | null
          data_quality_status?: string | null
          dba_name?: string | null
          headquarters_address?: string | null
          id?: string
          import_batch_id?: string | null
          imported_at?: string | null
          industry?: string | null
          last_synced_at?: string | null
          legal_name?: string
          needs_review?: boolean
          qualification_notes?: string | null
          qualification_status?: string
          review_reason?: string | null
          risk_notes?: string | null
          source_file?: string | null
          source_record_id?: string | null
          source_row?: number | null
          source_sheet?: string | null
          source_system?: string | null
          status?: string
          strategic_priority?: string | null
          sync_status?: string | null
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          classification: string | null
          created_at: string
          document_name: string
          document_type: string | null
          effective_date: string | null
          expiration_date: string | null
          id: string
          linked_entity_id: string | null
          linked_entity_type: string | null
          notes: string | null
          owner: string | null
          source: string | null
          status: string | null
          storage_path: string | null
          updated_at: string
          version: string | null
        }
        Insert: {
          classification?: string | null
          created_at?: string
          document_name: string
          document_type?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          id?: string
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          notes?: string | null
          owner?: string | null
          source?: string | null
          status?: string | null
          storage_path?: string | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          classification?: string | null
          created_at?: string
          document_name?: string
          document_type?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          id?: string
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          notes?: string | null
          owner?: string | null
          source?: string | null
          status?: string | null
          storage_path?: string | null
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      driver_qualifications: {
        Row: {
          created_at: string
          driver_id: string
          expiration_date: string | null
          id: string
          issue_date: string | null
          notes: string | null
          qualification_type: string | null
          status: string | null
          updated_at: string
          verification_date: string | null
          verification_source: string | null
        }
        Insert: {
          created_at?: string
          driver_id: string
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          qualification_type?: string | null
          status?: string | null
          updated_at?: string
          verification_date?: string | null
          verification_source?: string | null
        }
        Update: {
          created_at?: string
          driver_id?: string
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          qualification_type?: string | null
          status?: string | null
          updated_at?: string
          verification_date?: string | null
          verification_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_qualifications_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_safety_events: {
        Row: {
          category: string | null
          created_at: string
          driver_id: string
          event_date: string | null
          id: string
          notes: string | null
          resolution: string | null
          review_date: string | null
          severity: string | null
          source: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          driver_id: string
          event_date?: string | null
          id?: string
          notes?: string | null
          resolution?: string | null
          review_date?: string | null
          severity?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          driver_id?: string
          event_date?: string | null
          id?: string
          notes?: string | null
          resolution?: string | null
          review_date?: string | null
          severity?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_safety_events_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          created_at: string
          employee_reference: string | null
          general_notes: string | null
          hire_date: string | null
          id: string
          qualification_status: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_reference?: string | null
          general_notes?: string | null
          hire_date?: string | null
          id?: string
          qualification_status?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_reference?: string | null
          general_notes?: string | null
          hire_date?: string | null
          id?: string
          qualification_status?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          archived_at: string | null
          capacity: string | null
          category: string | null
          certified_weight: string | null
          color: string | null
          created_at: string
          current_customer_id: string | null
          current_site_id: string | null
          data_quality_status: string | null
          equipment_type: string | null
          id: string
          import_batch_id: string | null
          import_notes: string | null
          make: string | null
          model_year: number | null
          needs_review: boolean
          notes: string | null
          ownership_type: string | null
          plate_number: string | null
          review_reason: string | null
          serial_number: string | null
          source_file: string | null
          source_record: Json | null
          source_row: number | null
          source_sheet: string | null
          source_system: string | null
          status: string
          unit_number: string | null
          updated_at: string
          vin: string | null
        }
        Insert: {
          archived_at?: string | null
          capacity?: string | null
          category?: string | null
          certified_weight?: string | null
          color?: string | null
          created_at?: string
          current_customer_id?: string | null
          current_site_id?: string | null
          data_quality_status?: string | null
          equipment_type?: string | null
          id?: string
          import_batch_id?: string | null
          import_notes?: string | null
          make?: string | null
          model_year?: number | null
          needs_review?: boolean
          notes?: string | null
          ownership_type?: string | null
          plate_number?: string | null
          review_reason?: string | null
          serial_number?: string | null
          source_file?: string | null
          source_record?: Json | null
          source_row?: number | null
          source_sheet?: string | null
          source_system?: string | null
          status?: string
          unit_number?: string | null
          updated_at?: string
          vin?: string | null
        }
        Update: {
          archived_at?: string | null
          capacity?: string | null
          category?: string | null
          certified_weight?: string | null
          color?: string | null
          created_at?: string
          current_customer_id?: string | null
          current_site_id?: string | null
          data_quality_status?: string | null
          equipment_type?: string | null
          id?: string
          import_batch_id?: string | null
          import_notes?: string | null
          make?: string | null
          model_year?: number | null
          needs_review?: boolean
          notes?: string | null
          ownership_type?: string | null
          plate_number?: string | null
          review_reason?: string | null
          serial_number?: string | null
          source_file?: string | null
          source_record?: Json | null
          source_row?: number | null
          source_sheet?: string | null
          source_system?: string | null
          status?: string
          unit_number?: string | null
          updated_at?: string
          vin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_current_customer_id_fkey"
            columns: ["current_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_current_site_id_fkey"
            columns: ["current_site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_assignments: {
        Row: {
          assignment_type: string | null
          created_at: string
          customer_id: string | null
          end_date: string | null
          equipment_id: string
          id: string
          lane_id: string | null
          notes: string | null
          product_id: string | null
          site_id: string | null
          start_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          assignment_type?: string | null
          created_at?: string
          customer_id?: string | null
          end_date?: string | null
          equipment_id: string
          id?: string
          lane_id?: string | null
          notes?: string | null
          product_id?: string | null
          site_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          assignment_type?: string | null
          created_at?: string
          customer_id?: string | null
          end_date?: string | null
          equipment_id?: string
          id?: string
          lane_id?: string | null
          notes?: string | null
          product_id?: string | null
          site_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_assignments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_assignments_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_assignments_lane_id_fkey"
            columns: ["lane_id"]
            isOneToOne: false
            referencedRelation: "lanes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_assignments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_assignments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_compliance: {
        Row: {
          created_at: string
          effective_date: string | null
          equipment_id: string
          expiration_date: string | null
          id: string
          jurisdiction: string | null
          notes: string | null
          plate_number: string | null
          registration_type: string | null
          required: boolean | null
          requirement: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_date?: string | null
          equipment_id: string
          expiration_date?: string | null
          id?: string
          jurisdiction?: string | null
          notes?: string | null
          plate_number?: string | null
          registration_type?: string | null
          required?: boolean | null
          requirement?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_date?: string | null
          equipment_id?: string
          expiration_date?: string | null
          id?: string
          jurisdiction?: string | null
          notes?: string | null
          plate_number?: string | null
          registration_type?: string | null
          required?: boolean | null
          requirement?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_compliance_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_leases: {
        Row: {
          contract_id: string | null
          created_at: string
          customer_id: string | null
          end_date: string | null
          equipment_id: string
          id: string
          lease_type: string | null
          notes: string | null
          rate: number | null
          start_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          customer_id?: string | null
          end_date?: string | null
          equipment_id: string
          id?: string
          lease_type?: string | null
          notes?: string | null
          rate?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          customer_id?: string | null
          end_date?: string | null
          equipment_id?: string
          id?: string
          lease_type?: string | null
          notes?: string | null
          rate?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_leases_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_leases_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_leases_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_technology: {
        Row: {
          cable_id: string | null
          created_at: string
          device_id: string | null
          equipment_id: string
          id: string
          installation_date: string | null
          notes: string | null
          removal_date: string | null
          status: string | null
          technology_type: string | null
          updated_at: string
        }
        Insert: {
          cable_id?: string | null
          created_at?: string
          device_id?: string | null
          equipment_id: string
          id?: string
          installation_date?: string | null
          notes?: string | null
          removal_date?: string | null
          status?: string | null
          technology_type?: string | null
          updated_at?: string
        }
        Update: {
          cable_id?: string | null
          created_at?: string
          device_id?: string | null
          equipment_id?: string
          id?: string
          installation_date?: string | null
          notes?: string | null
          removal_date?: string | null
          status?: string | null
          technology_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_technology_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          created_at: string
          filename: string | null
          id: string
          imported_at: string | null
          imported_by: string | null
          notes: string | null
          records_created: number
          records_needing_review: number
          records_processed: number
          records_rejected: number
          records_updated: number
          source: string | null
          status: string
          target_entity: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          filename?: string | null
          id?: string
          imported_at?: string | null
          imported_by?: string | null
          notes?: string | null
          records_created?: number
          records_needing_review?: number
          records_processed?: number
          records_rejected?: number
          records_updated?: number
          source?: string | null
          status?: string
          target_entity?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          filename?: string | null
          id?: string
          imported_at?: string | null
          imported_by?: string | null
          notes?: string | null
          records_created?: number
          records_needing_review?: number
          records_processed?: number
          records_rejected?: number
          records_updated?: number
          source?: string | null
          status?: string
          target_entity?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      import_staging: {
        Row: {
          batch_id: string | null
          confidence: string | null
          created_at: string
          data_quality_status: string | null
          id: string
          import_decision: string | null
          import_notes: string | null
          match_method: string | null
          matched_record_id: string | null
          review_reason: string | null
          source_record: Json | null
          source_row: number | null
          source_sheet: string | null
          target_entity: string | null
          updated_at: string
        }
        Insert: {
          batch_id?: string | null
          confidence?: string | null
          created_at?: string
          data_quality_status?: string | null
          id?: string
          import_decision?: string | null
          import_notes?: string | null
          match_method?: string | null
          matched_record_id?: string | null
          review_reason?: string | null
          source_record?: Json | null
          source_row?: number | null
          source_sheet?: string | null
          target_entity?: string | null
          updated_at?: string
        }
        Update: {
          batch_id?: string | null
          confidence?: string | null
          created_at?: string
          data_quality_status?: string | null
          id?: string
          import_decision?: string | null
          import_notes?: string | null
          match_method?: string | null
          matched_record_id?: string | null
          review_reason?: string | null
          source_record?: Json | null
          source_row?: number | null
          source_sheet?: string | null
          target_entity?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_staging_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          closed_date: string | null
          corrective_action: string | null
          created_at: string
          customer_communication: string | null
          customer_id: string | null
          customer_notified: boolean | null
          description: string | null
          driver_id: string | null
          due_date: string | null
          equipment_id: string | null
          id: string
          immediate_action: string | null
          incident_date: string | null
          incident_type: string | null
          lane_id: string | null
          notes: string | null
          owner: string | null
          resolution: string | null
          review_date: string | null
          root_cause: string | null
          severity: string | null
          site_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          closed_date?: string | null
          corrective_action?: string | null
          created_at?: string
          customer_communication?: string | null
          customer_id?: string | null
          customer_notified?: boolean | null
          description?: string | null
          driver_id?: string | null
          due_date?: string | null
          equipment_id?: string | null
          id?: string
          immediate_action?: string | null
          incident_date?: string | null
          incident_type?: string | null
          lane_id?: string | null
          notes?: string | null
          owner?: string | null
          resolution?: string | null
          review_date?: string | null
          root_cause?: string | null
          severity?: string | null
          site_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          closed_date?: string | null
          corrective_action?: string | null
          created_at?: string
          customer_communication?: string | null
          customer_id?: string | null
          customer_notified?: boolean | null
          description?: string | null
          driver_id?: string | null
          due_date?: string | null
          equipment_id?: string | null
          id?: string
          immediate_action?: string | null
          incident_date?: string | null
          incident_type?: string | null
          lane_id?: string | null
          notes?: string | null
          owner?: string | null
          resolution?: string | null
          review_date?: string | null
          root_cause?: string | null
          severity?: string | null
          site_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_lane_id_fkey"
            columns: ["lane_id"]
            isOneToOne: false
            referencedRelation: "lanes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_articles: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          customer_id: string | null
          effective_date: string | null
          id: string
          notes: string | null
          owner: string | null
          review_date: string | null
          site_id: string | null
          status: string | null
          title: string
          updated_at: string
          version: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          customer_id?: string | null
          effective_date?: string | null
          id?: string
          notes?: string | null
          owner?: string | null
          review_date?: string | null
          site_id?: string | null
          status?: string | null
          title: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          customer_id?: string | null
          effective_date?: string | null
          id?: string
          notes?: string | null
          owner?: string | null
          review_date?: string | null
          site_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_articles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_articles_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      lanes: {
        Row: {
          active: boolean
          created_at: string
          customer_id: string | null
          destination_description: string | null
          destination_site_id: string | null
          driver_requirements: string | null
          equipment_requirements: string | null
          id: string
          lane_name: string
          mileage: number | null
          notes: string | null
          origin_description: string | null
          origin_site_id: string | null
          permit_requirements: string | null
          route_description: string | null
          route_restrictions: string | null
          seasonal_notes: string | null
          site_requirements: string | null
          states_traversed: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          customer_id?: string | null
          destination_description?: string | null
          destination_site_id?: string | null
          driver_requirements?: string | null
          equipment_requirements?: string | null
          id?: string
          lane_name: string
          mileage?: number | null
          notes?: string | null
          origin_description?: string | null
          origin_site_id?: string | null
          permit_requirements?: string | null
          route_description?: string | null
          route_restrictions?: string | null
          seasonal_notes?: string | null
          site_requirements?: string | null
          states_traversed?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          customer_id?: string | null
          destination_description?: string | null
          destination_site_id?: string | null
          driver_requirements?: string | null
          equipment_requirements?: string | null
          id?: string
          lane_name?: string
          mileage?: number | null
          notes?: string | null
          origin_description?: string | null
          origin_site_id?: string | null
          permit_requirements?: string | null
          route_description?: string | null
          route_restrictions?: string | null
          seasonal_notes?: string | null
          site_requirements?: string | null
          states_traversed?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lanes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lanes_destination_site_id_fkey"
            columns: ["destination_site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lanes_origin_site_id_fkey"
            columns: ["origin_site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      lookup_values: {
        Row: {
          active: boolean
          category: string
          created_at: string
          id: string
          label: string
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          id?: string
          label: string
          sort_order?: number
          updated_at?: string
          value: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          id?: string
          label?: string
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      lost_business: {
        Row: {
          capacity_issue: boolean | null
          competitor: string | null
          created_at: string
          customer_id: string | null
          customer_issue: boolean | null
          driver_issue: boolean | null
          equipment_issue: boolean | null
          estimated_loads: number | null
          estimated_revenue: number | null
          id: string
          lane_id: string | null
          notes: string | null
          occurred_on: string | null
          opportunity_id: string | null
          owner: string | null
          product_id: string | null
          qualification_issue: boolean | null
          rate_issue: boolean | null
          reason_category: string
          reason_detail: string | null
          recoverable: boolean | null
          recovery_plan: string | null
          service_issue: boolean | null
          site_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          capacity_issue?: boolean | null
          competitor?: string | null
          created_at?: string
          customer_id?: string | null
          customer_issue?: boolean | null
          driver_issue?: boolean | null
          equipment_issue?: boolean | null
          estimated_loads?: number | null
          estimated_revenue?: number | null
          id?: string
          lane_id?: string | null
          notes?: string | null
          occurred_on?: string | null
          opportunity_id?: string | null
          owner?: string | null
          product_id?: string | null
          qualification_issue?: boolean | null
          rate_issue?: boolean | null
          reason_category?: string
          reason_detail?: string | null
          recoverable?: boolean | null
          recovery_plan?: string | null
          service_issue?: boolean | null
          site_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          capacity_issue?: boolean | null
          competitor?: string | null
          created_at?: string
          customer_id?: string | null
          customer_issue?: boolean | null
          driver_issue?: boolean | null
          equipment_issue?: boolean | null
          estimated_loads?: number | null
          estimated_revenue?: number | null
          id?: string
          lane_id?: string | null
          notes?: string | null
          occurred_on?: string | null
          opportunity_id?: string | null
          owner?: string | null
          product_id?: string | null
          qualification_issue?: boolean | null
          rate_issue?: boolean | null
          reason_category?: string
          reason_detail?: string | null
          recoverable?: boolean | null
          recovery_plan?: string | null
          service_issue?: boolean | null
          site_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_business_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_business_lane_id_fkey"
            columns: ["lane_id"]
            isOneToOne: false
            referencedRelation: "lanes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_business_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_business_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_business_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string
          created_by: string | null
          decisions: string | null
          id: string
          meeting_date: string
          meeting_type: string
          notes: string | null
          participants: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          decisions?: string | null
          id?: string
          meeting_date?: string
          meeting_type: string
          notes?: string | null
          participants?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          decisions?: string | null
          id?: string
          meeting_date?: string
          meeting_type?: string
          notes?: string | null
          participants?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          capacity_status: string | null
          competitor: string | null
          created_at: string
          customer_id: string | null
          estimated_loads: number | null
          estimated_revenue: number | null
          expected_close_date: string | null
          id: string
          loss_reason: string | null
          name: string
          next_action: string | null
          next_action_date: string | null
          notes: string | null
          owner: string | null
          probability: number | null
          qualification: string | null
          site_id: string | null
          source: string | null
          stage: string
          updated_at: string
        }
        Insert: {
          capacity_status?: string | null
          competitor?: string | null
          created_at?: string
          customer_id?: string | null
          estimated_loads?: number | null
          estimated_revenue?: number | null
          expected_close_date?: string | null
          id?: string
          loss_reason?: string | null
          name: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          owner?: string | null
          probability?: number | null
          qualification?: string | null
          site_id?: string | null
          source?: string | null
          stage?: string
          updated_at?: string
        }
        Update: {
          capacity_status?: string | null
          competitor?: string | null
          created_at?: string
          customer_id?: string | null
          estimated_loads?: number | null
          estimated_revenue?: number | null
          expected_close_date?: string | null
          id?: string
          loss_reason?: string | null
          name?: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          owner?: string | null
          probability?: number | null
          qualification?: string | null
          site_id?: string | null
          source?: string | null
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          created_at: string
          customer_id: string | null
          customer_product_code: string | null
          data_quality_status: string | null
          driver_requirements: string | null
          equipment_requirements: string | null
          handling_requirements: string | null
          hazard_classification: string | null
          id: string
          material_description: string | null
          needs_review: boolean
          notes: string | null
          packing_group: string | null
          physical_state: string | null
          product_name: string
          source: string | null
          special_instructions: string | null
          un_number: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          customer_id?: string | null
          customer_product_code?: string | null
          data_quality_status?: string | null
          driver_requirements?: string | null
          equipment_requirements?: string | null
          handling_requirements?: string | null
          hazard_classification?: string | null
          id?: string
          material_description?: string | null
          needs_review?: boolean
          notes?: string | null
          packing_group?: string | null
          physical_state?: string | null
          product_name: string
          source?: string | null
          special_instructions?: string | null
          un_number?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          customer_id?: string | null
          customer_product_code?: string | null
          data_quality_status?: string | null
          driver_requirements?: string | null
          equipment_requirements?: string | null
          handling_requirements?: string | null
          hazard_classification?: string | null
          id?: string
          material_description?: string | null
          needs_review?: boolean
          notes?: string | null
          packing_group?: string | null
          physical_state?: string | null
          product_name?: string
          source?: string | null
          special_instructions?: string | null
          un_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          department: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rate_history: {
        Row: {
          approved_by: string | null
          created_at: string
          effective_date: string | null
          id: string
          new_amount: number | null
          notes: string | null
          percentage_change: number | null
          previous_amount: number | null
          rate_id: string
          reason: string | null
          source: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          effective_date?: string | null
          id?: string
          new_amount?: number | null
          notes?: string | null
          percentage_change?: number | null
          previous_amount?: number | null
          rate_id: string
          reason?: string | null
          source?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          effective_date?: string | null
          id?: string
          new_amount?: number | null
          notes?: string | null
          percentage_change?: number | null
          previous_amount?: number | null
          rate_id?: string
          reason?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rate_history_rate_id_fkey"
            columns: ["rate_id"]
            isOneToOne: false
            referencedRelation: "rates"
            referencedColumns: ["id"]
          },
        ]
      }
      rates: {
        Row: {
          accessorials: string | null
          amount: number | null
          approval_date: string | null
          approved_by: string | null
          contract_id: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          customer_id: string | null
          effective_date: string | null
          expiration_date: string | null
          fuel_method: string | null
          fuel_surcharge: string | null
          id: string
          lane_id: string | null
          minimum_charge: number | null
          notes: string | null
          product_id: string | null
          quote_reference: string | null
          rate_type: string | null
          site_id: string | null
          source: string | null
          status: string
          unit: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          accessorials?: string | null
          amount?: number | null
          approval_date?: string | null
          approved_by?: string | null
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          customer_id?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          fuel_method?: string | null
          fuel_surcharge?: string | null
          id?: string
          lane_id?: string | null
          minimum_charge?: number | null
          notes?: string | null
          product_id?: string | null
          quote_reference?: string | null
          rate_type?: string | null
          site_id?: string | null
          source?: string | null
          status?: string
          unit?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          accessorials?: string | null
          amount?: number | null
          approval_date?: string | null
          approved_by?: string | null
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          customer_id?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          fuel_method?: string | null
          fuel_surcharge?: string | null
          id?: string
          lane_id?: string | null
          minimum_charge?: number | null
          notes?: string | null
          product_id?: string | null
          quote_reference?: string | null
          rate_type?: string | null
          site_id?: string | null
          source?: string | null
          status?: string
          unit?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rates_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rates_lane_id_fkey"
            columns: ["lane_id"]
            isOneToOne: false
            referencedRelation: "lanes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rates_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      requirements: {
        Row: {
          category: string
          created_at: string
          description: string | null
          effective_date: string | null
          entity_id: string | null
          entity_type: string
          expiration_date: string | null
          id: string
          mandatory: boolean
          notes: string | null
          owner: string | null
          requirement: string
          source_document: string | null
          status: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          effective_date?: string | null
          entity_id?: string | null
          entity_type: string
          expiration_date?: string | null
          id?: string
          mandatory?: boolean
          notes?: string | null
          owner?: string | null
          requirement: string
          source_document?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          effective_date?: string | null
          entity_id?: string | null
          entity_type?: string
          expiration_date?: string | null
          id?: string
          mandatory?: boolean
          notes?: string | null
          owner?: string | null
          requirement?: string
          source_document?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_assessments: {
        Row: {
          approval_status: string | null
          assessment_date: string | null
          assessment_type: string | null
          assessor: string | null
          corrective_actions: string | null
          created_at: string
          findings: string | null
          id: string
          next_review_date: string | null
          notes: string | null
          restrictions: string | null
          site_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          approval_status?: string | null
          assessment_date?: string | null
          assessment_type?: string | null
          assessor?: string | null
          corrective_actions?: string | null
          created_at?: string
          findings?: string | null
          id?: string
          next_review_date?: string | null
          notes?: string | null
          restrictions?: string | null
          site_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          approval_status?: string | null
          assessment_date?: string | null
          assessment_type?: string | null
          assessor?: string | null
          corrective_actions?: string | null
          created_at?: string
          findings?: string | null
          id?: string
          next_review_date?: string | null
          notes?: string | null
          restrictions?: string | null
          site_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_assessments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          access_requirements: string | null
          active: boolean
          address: string | null
          appointment_required: boolean | null
          archived_at: string | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          data_quality_status: string | null
          emergency_contact: string | null
          environmental_requirements: string | null
          id: string
          import_batch_id: string | null
          latitude: number | null
          loading_requirements: string | null
          longitude: number | null
          needs_review: boolean
          operating_hours: string | null
          parking_notes: string | null
          postal_code: string | null
          ppe_requirements: string | null
          review_reason: string | null
          route_notes: string | null
          safety_requirements: string | null
          security_requirements: string | null
          site_code: string | null
          site_name: string
          site_type: string | null
          source_file: string | null
          source_row: number | null
          source_sheet: string | null
          source_system: string | null
          special_instructions: string | null
          state: string | null
          status: string
          unloading_requirements: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          access_requirements?: string | null
          active?: boolean
          address?: string | null
          appointment_required?: boolean | null
          archived_at?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          data_quality_status?: string | null
          emergency_contact?: string | null
          environmental_requirements?: string | null
          id?: string
          import_batch_id?: string | null
          latitude?: number | null
          loading_requirements?: string | null
          longitude?: number | null
          needs_review?: boolean
          operating_hours?: string | null
          parking_notes?: string | null
          postal_code?: string | null
          ppe_requirements?: string | null
          review_reason?: string | null
          route_notes?: string | null
          safety_requirements?: string | null
          security_requirements?: string | null
          site_code?: string | null
          site_name: string
          site_type?: string | null
          source_file?: string | null
          source_row?: number | null
          source_sheet?: string | null
          source_system?: string | null
          special_instructions?: string | null
          state?: string | null
          status?: string
          unloading_requirements?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          access_requirements?: string | null
          active?: boolean
          address?: string | null
          appointment_required?: boolean | null
          archived_at?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          data_quality_status?: string | null
          emergency_contact?: string | null
          environmental_requirements?: string | null
          id?: string
          import_batch_id?: string | null
          latitude?: number | null
          loading_requirements?: string | null
          longitude?: number | null
          needs_review?: boolean
          operating_hours?: string | null
          parking_notes?: string | null
          postal_code?: string | null
          ppe_requirements?: string | null
          review_reason?: string | null
          route_notes?: string | null
          safety_requirements?: string | null
          security_requirements?: string | null
          site_code?: string | null
          site_name?: string
          site_type?: string | null
          source_file?: string | null
          source_row?: number | null
          source_sheet?: string | null
          source_system?: string | null
          special_instructions?: string | null
          state?: string | null
          status?: string
          unloading_requirements?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed_date: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          linked_entity_id: string | null
          linked_entity_type: string | null
          owner: string | null
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_date?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          owner?: string | null
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_date?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          owner?: string | null
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_incidents: { Args: never; Returns: boolean }
      can_view_safety: { Args: never; Returns: boolean }
      can_write: { Args: never; Returns: boolean }
      can_write_safety: { Args: never; Returns: boolean }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "sales"
        | "operations"
        | "safety"
        | "management"
        | "read_only"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "admin",
        "sales",
        "operations",
        "safety",
        "management",
        "read_only",
      ],
    },
  },
} as const
