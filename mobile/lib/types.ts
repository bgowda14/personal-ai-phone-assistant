export type Call = {
  id: number;
  phone_number: string;
  caller_name: string | null;
  reason: string | null;
  urgency: string | null;
  started_at: string;
  ended_at: string | null;
  status: string;
  ai_name: string | null;
  ai_company: string | null;
  ai_type: string | null;
  ai_intent: string | null;
  ai_priority: string | null;
  ai_message: string | null;
  ai_error: string | null;
  ai_recommended_action: string | null;
  dismissed_at: string | null;
  decided_action: string | null;
  matched_contact_id: number | null;
  matched_contact_name: string | null;
  transfer_result: string | null;
};

export type Contact = {
  id: number;
  name: string;
  phone_number: string;
  relationship: string;
  priority: string;
  created_at: string;
};

export type StatusInterpretation = {
  instruction: string;
  mode_label: string;
  expires_at: string | null;
  transfer_types: string[];
  urgent_always_transfers: boolean;
  summary: string;
};

export type StatusResponse = {
  mode: string;
  custom_instruction: string | null;
  expires_at: string | null;
  custom_transfer_types: string[] | null;
  custom_urgent_transfers: boolean | null;
};

export type Config = {
  openai_configured: boolean;
  transfer_configured: boolean;
};
