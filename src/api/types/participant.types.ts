export type ParticipantStatus = "interested" | "pending_review" | "eligible" | "booked";

export interface BaseParticipant {
  id: number;
  status: ParticipantStatus;
  email: string;
  createdAt: string;
}

// Stage 1: Interested
export interface InterestedParticipant extends BaseParticipant {
  status: "interested";
}

// Stage 2: Pending Review (completed pre-screener)
export interface PendingReviewParticipant extends BaseParticipant {
  status: "pending_review";
  name?: string;
  age?: number;
  preScreenSurveyLink?: string;
  preScreenData?: any;
  surveyLink?: string;
}

// Stage 3: Eligible but not yet booked
export interface EligibleParticipant extends BaseParticipant {
  status: "eligible";
  name: string;
  age: number;
  preScreenData?: any;
  surveyLink?: string;
}

// Stage 4: Booked
export interface BookedParticipant extends BaseParticipant {
    status: "booked";
    name: string;
    age: number;
    surveyLink: string;
    cancelLink: string;
    rescheduleLink: string;
    bookingTime: string;
    preScreenData?: any;
}

// Final union type
export type Participant =
  | InterestedParticipant
  | PendingReviewParticipant
  | EligibleParticipant
  | BookedParticipant;

// Payload for /sendbooking endpoint
export interface SendBookingRequest {
  startTime: string;
  endTime: string;
  email: string;
  body: string;
}
