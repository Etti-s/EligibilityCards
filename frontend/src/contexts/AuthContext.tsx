import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authApi } from '@/api/authApi';
import { setUnauthorizedHandler, tokenStorage } from '@/api/httpClient';
import { UserRole, type AuthUser, type UserRoleValue } from '@/types/auth';
import { decodeJwt, isTokenExpired } from '@/utils/jwt';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function parseRoleString(roleString?: string): UserRoleValue | null {
  if (!roleString) return null;
  if (roleString in UserRole) {
    return UserRole[roleString as keyof typeof UserRole];
  }
  const numeric = Number(roleString);
  if (!Number.isNaN(numeric) && [1, 2, 3].includes(numeric)) {
    return numeric as UserRoleValue;
  }
  return null;
}

function buildUserFromToken(token: string): AuthUser | null {
  const payload = decodeJwt(token);
  if (!payload) return null;

  const role = parseRoleString(payload.role);
  if (role == null) return null;

  const userId = Number(payload.uid);
  if (Number.isNaN(userId)) return null;

  return {
    userId,
    fullName: typeof payload.name === 'string' ? payload.name : '',
    email: typeof payload.email === 'string' ? payload.email : '',
    role,
  };
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
    });
  }, []);

  useEffect(() => {
    const stored = tokenStorage.get();
    if (stored && !isTokenExpired(stored)) {
      const parsedUser = buildUserFromToken(stored);
      if (parsedUser) {
        setToken(stored);
        setUser(parsedUser);
      } else {
        tokenStorage.clear();
      }
    } else if (stored) {
      tokenStorage.clear();
    }
    setIsInitialized(true);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    tokenStorage.set(response.token);
    const authUser: AuthUser = {
      userId: response.userId,
      fullName: response.fullName,
      email: response.email,
      role: response.role,
    };
    setToken(response.token);
    setUser(authUser);
    return authUser;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token,
      isInitialized,
      login,
      logout,
    }),
    [user, token, isInitialized, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth חייב להיות בתוך AuthProvider');
  }
  return context;
}
