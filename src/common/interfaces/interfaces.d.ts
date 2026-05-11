export interface Result<T> {
  statusCode: number;
  message: string;
  data: T;
  success: boolean;
  timestamp: string;
}

export interface UserWithoutPassword {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  profile_photo: string;
  description: string;
  last_access: Date;
  active: boolean;
}

export interface RegisterResponse {
  access_token: string;
  user: UserWithoutPassword;
}

export interface LoginResponse {
  access_token: string;
  user: UserWithoutPassword;
}

export interface RefreshResponse {
  access_token: string;
}
