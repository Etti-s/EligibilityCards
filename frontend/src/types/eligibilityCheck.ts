export const EligibilityStatus = {
  Eligible: 1,
  NotEligible: 2,
  CardAlreadyIssued: 3,
} as const;

export type EligibilityStatusValue = (typeof EligibilityStatus)[keyof typeof EligibilityStatus];

export interface EligibilityCheckRequest {
  idNumber: string;
}

export interface EligibilityCheckResponse {
  status: EligibilityStatusValue;
  idNumber: string;
}

export interface CardIssuanceRequest {
  idNumber: string;
  cardNumber: string;
}

export interface CardIssuanceResponse {
  success: boolean;
  message: string;
}
