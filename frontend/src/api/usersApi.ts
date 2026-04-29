import { httpClient } from './httpClient';
import type {
  CreateUserPayload,
  ResetPasswordPayload,
  UpdateUserPayload,
  UserListItem,
} from '@/types/users';

export const usersApi = {
  getAll: () => httpClient.get<UserListItem[]>('users'),

  create: (payload: CreateUserPayload) =>
    httpClient.post<UserListItem>('users', payload),

  update: (id: number, payload: UpdateUserPayload) =>
    httpClient.put<UserListItem>(`users/${id}`, payload),

  toggleStatus: (id: number) =>
    httpClient.put<UserListItem>(`users/${id}/toggle-status`),

  resetPassword: (id: number, payload: ResetPasswordPayload) =>
    httpClient.put<unknown>(`users/${id}/reset-password`, payload),
};
