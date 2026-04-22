export type ApiSuccess<T> = T;

export type ApiErrorBody = {
  message: string;
  requestId?: string;
};

export type LoginRequestDto = {
  username: string;
  password: string;
};

export type LoginResponseDto = {
  authToken: string;
};

export type LoginDomainRequestDto = {
  domain: string;
  password: string;
};

export type LoginDomainResponseDto = {
  authToken: string;
  username?: string;
  domain?: string;
};

export type ForgotPasswordRequestDto = {
  email: string;
};

export type ForgotPasswordResponseDto = {
  message: string;
  clientMutationId?: string;
};

export type ChangePasswordRequestDto = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ChangePasswordResponseDto = {
  message: string;
};

export type RegisterRequestDto = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type RegisterResponseDto = {
  message: string;
  authToken?: string;
};

export type SaveDomainTabRequestDto = {
  domainId: number;
  field: string;
  payload: unknown;
};

export type SaveDomainTabResponseDto = {
  message: string;
};
