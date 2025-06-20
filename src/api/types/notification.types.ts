export type NotificationType =
  | "email_received"
  | "pre_screen_completed"
  | "booking_scheduled";

export type NotificationStatus = "pending" | "approved" | "rejected";

export interface Notification {
  id: number;
  type: NotificationType;
  email: string;
  timestamp: string;
  status: NotificationStatus;
  emailSubject?: string; // Add subject field
  emailBody?: string;    // Add body field
  
  // Optional, depending on notification type
  data?: {
    name?: string;
    age?: number;
    surveyLink?: string;
    bookingTime?: string;
    cancelLink?: string;
    rescheduleLink?: string;
  };
}

export interface SurveyMonkeyResponse {
  id: string;
  recipient_id: string;
  collection_mode: string;
  response_status: string;
  custom_value: string;
  first_name: string;
  last_name: string;
  email_address: string;
  ip_address: string;
  logic_path: Record<string, any>;
  metadata: { contact: Record<string, any> };
  page_path: any[];
  collector_id: string;
  survey_id: string;
  language: string;
  custom_variables: Record<string, any>;
  edit_url: string;
  analyze_url: string;
  total_time: number;
  date_modified: string;
  date_created: string;
  href: string;
  pages: Array<{
    id: string;
    questions: Array<{
      id: string;
      answers: Array<{
        row_id?: string;
        tag_data?: any[];
        text?: string;
        choice_id?: string;
        choice_metadata?: Record<string, any>;
      }>;
    }>;
  }>;
}

