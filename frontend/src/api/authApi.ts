import { httpClient } from './httpClient';
import type { LoginRequest, LoginResponse } from '@/types/auth';

export const authApi = {
  login: (request: LoginRequest) =>
    httpClient.post<LoginResponse>('auth/login', request, { skipAuth: true }),
};
