import { apiJson, ApiError } from "./client";
import type {
  ChangePasswordRequestDto,
  ChangePasswordResponseDto,
  ForgotPasswordRequestDto,
  ForgotPasswordResponseDto,
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
} from "@/lib/contracts/api";

export type LoginInput = LoginRequestDto;

export type LoginResult = LoginResponseDto;

export async function login(input: LoginInput): Promise<LoginResult> {
  const data = await apiJson<LoginResponseDto>("/api/auth/login", {
    method: "POST",
    json: {
      username: input.username.trim(),
      password: input.password,
    },
  });

  if (!data.authToken) {
    throw new ApiError("Không nhận được token.", 500, data);
  }

  return { authToken: data.authToken };
}

export type RegisterInput = RegisterRequestDto;
export type RegisterResult = RegisterResponseDto;

export async function register(input: RegisterInput): Promise<RegisterResult> {
  return apiJson<RegisterResponseDto>("/api/auth/register", {
    method: "POST",
    json: {
      username: input.username.trim(),
      email: input.email.trim(),
      password: input.password,
      confirmPassword: input.confirmPassword,
    },
  });
}

export type ForgotPasswordInput = ForgotPasswordRequestDto;
export type ForgotPasswordResult = ForgotPasswordResponseDto;

export async function forgotPassword(
  input: ForgotPasswordInput,
): Promise<ForgotPasswordResult> {
  return apiJson<ForgotPasswordResult>("/api/auth/forgot-password", {
    method: "POST",
    json: { email: input.email.trim() },
  });
}

export type ViewerDto = {
  databaseId: number;
  name: string | null;
  username: string | null;
  email: string | null;
  roles: { nodes: Array<{ name: string }> };
};

export type ViewerResponse = {
  viewer: ViewerDto | null;
};

export async function getViewer(): Promise<ViewerResponse> {
  return apiJson<ViewerResponse>("/api/auth/viewer", { method: "GET" });
}

export type ChangePasswordInput = ChangePasswordRequestDto;

export async function changePassword(input: ChangePasswordInput): Promise<ChangePasswordResponseDto> {
  return apiJson<ChangePasswordResponseDto>("/api/auth/change-password", {
    method: "POST",
    json: input,
  });
}
