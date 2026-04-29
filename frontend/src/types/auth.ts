export const UserRole = {
  Admin: 1,
  BranchManager: 2,
  Clerk: 3,
} as const;

export type UserRoleValue = (typeof UserRole)[keyof typeof UserRole];

export const UserRoleLabels: Record<UserRoleValue, string> = {
  [UserRole.Admin]: 'מנהל מערכת',
  [UserRole.BranchManager]: 'מנהל סניף',
  [UserRole.Clerk]: 'פקיד',
};

export interface AuthUser {
  userId: number;
  fullName: string;
  email: string;
  role: UserRoleValue;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: number;
  fullName: string;
  email: string;
  role: UserRoleValue;
  expiresAt: string;
}
