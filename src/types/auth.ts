export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  username: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}
