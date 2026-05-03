import { httpClient } from './httpClient';
import type {
  CardIssuanceRequest,
  CardIssuanceResponse,
  EligibilityCheckRequest,
  EligibilityCheckResponse,
} from '@/types/eligibilityCheck';

export const eligibilityCheckApi = {
  check: (request: EligibilityCheckRequest) =>
    httpClient.post<EligibilityCheckResponse>('eligibility-check/check', request),

  issueCard: (request: CardIssuanceRequest) =>
    httpClient.post<CardIssuanceResponse>('eligibility-check/issue-card', request),
};
