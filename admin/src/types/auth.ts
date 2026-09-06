export type AdminProfile = {
  name: string;
  email: string;
  phone: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  admin: AdminProfile;
};

export type ApiErrorBody = {
  error: {
    message: string;
    code: string;
  };
};
