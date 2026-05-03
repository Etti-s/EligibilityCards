export interface EligibleListItem {
  id: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  idNumber: string;
  address: string | null;
  numberOfPersons: number;
  cardNumber: string | null;
}

export interface CreateEligiblePayload {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  email?: string | null;
  idNumber: string;
  address?: string | null;
  numberOfPersons: number;
}

export interface UpdateEligiblePayload {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  email?: string | null;
  idNumber: string;
  address?: string | null;
  numberOfPersons: number;
  cardNumber?: string | null;
}

export const CardStatusFilter = {
  All: 0,
  Assigned: 1,
  NotAssigned: 2,
} as const;

export type CardStatusFilterValue = (typeof CardStatusFilter)[keyof typeof CardStatusFilter];

export interface EligibleFilter {
  search?: string;
  cardSearch?: string;
  numberOfPersons?: number;
  cardStatus?: CardStatusFilterValue;
}

export interface ImportRowError {
  rowNumber: number;
  error: string;
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  errors: ImportRowError[];
}
