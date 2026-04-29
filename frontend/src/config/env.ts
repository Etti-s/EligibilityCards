interface AppConfig {
  apiBaseUrl: string;
  appEnv: 'development' | 'production';
}

function getEnv(key: string, fallback?: string): string {
  const value = import.meta.env[key] as string | undefined;
  if (!value) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required env variable: ${key}`);
  }
  return value;
}

export const config: AppConfig = {
  apiBaseUrl: getEnv('VITE_API_BASE_URL'),
  appEnv: getEnv('VITE_APP_ENV', 'development') as AppConfig['appEnv'],
};
