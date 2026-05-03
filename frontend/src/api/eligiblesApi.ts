import { downloadFile, httpClient } from './httpClient';
import type {
  CreateEligiblePayload,
  EligibleFilter,
  EligibleListItem,
  ImportResult,
  UpdateEligiblePayload,
} from '@/types/eligibles';

function buildQuery(filter: EligibleFilter): Record<string, string | number | undefined> {
  const query: Record<string, string | number | undefined> = {};
  if (filter.search && filter.search.trim()) query.search = filter.search.trim();
  if (filter.cardSearch && filter.cardSearch.trim()) query.cardSearch = filter.cardSearch.trim();
  if (typeof filter.numberOfPersons === 'number') query.numberOfPersons = filter.numberOfPersons;
  if (filter.cardStatus !== undefined && filter.cardStatus !== 0) query.cardStatus = filter.cardStatus;
  return query;
}

export const eligiblesApi = {
  getAll: (filter: EligibleFilter = {}) =>
    httpClient.get<EligibleListItem[]>('eligibles', { query: buildQuery(filter) }),

  getNumberOfPersonsOptions: () =>
    httpClient.get<number[]>('eligibles/number-of-persons-options'),

  create: (payload: CreateEligiblePayload) =>
    httpClient.post<EligibleListItem>('eligibles', payload),

  update: (id: number, payload: UpdateEligiblePayload) =>
    httpClient.put<EligibleListItem>(`eligibles/${id}`, payload),

  delete: (id: number) =>
    httpClient.delete<unknown>(`eligibles/${id}`),

  import: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return httpClient.post<ImportResult>('eligibles/import', formData);
  },

  downloadTemplate: () =>
    downloadFile('eligibles/import-template', 'eligibles-template.xlsx'),
};
