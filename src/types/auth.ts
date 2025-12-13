export interface User {
  id: string;
  email?: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  banner_url?: string;
}

export interface AuthSession {
  user: User | null;
  accessToken: string | null;
}
