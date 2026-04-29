import type { UserRoleValue } from './auth';

export interface UserListItem {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRoleValue;
  createdAt: string;
  isActive: boolean;
  canEdit: boolean;
  canToggleStatus: boolean;
  canResetPassword: boolean;
}

export interface CreateUserPayload {
  fullName: string;
  email: string;
  phone?: string | null;
  password: string;
  role: UserRoleValue;
}

export interface UpdateUserPayload {
  fullName: string;
  email: string;
  phone?: string | null;
  role: UserRoleValue;
}

export interface ResetPasswordPayload {
  newPassword: string;
}
