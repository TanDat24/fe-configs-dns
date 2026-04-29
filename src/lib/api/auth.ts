import { apiJson, ApiError, tunnelBypassHeaders } from "./client";
import type {
  ChangePasswordRequestDto,
  ChangePasswordResponseDto,
  ForgotPasswordDomainRequestDto,
  ForgotPasswordDomainResponseDto,
  ForgotPasswordRequestDto,
  ForgotPasswordResponseDto,
  LoginDomainRequestDto,
  LoginDomainResponseDto,
  LoginRequestDto,
  LoginResponseDto,
  UploadCccdResponseDto,
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

export type LoginByDomainInput = LoginDomainRequestDto;
export type LoginByDomainResult = LoginDomainResponseDto;

export async function loginByDomain(
  input: LoginByDomainInput,
): Promise<LoginByDomainResult> {
  const data = await apiJson<LoginDomainResponseDto>(
    "/api/auth/login-domain",
    {
      method: "POST",
      json: {
        domain: input.domain.trim(),
        ...(input.password ? { password: input.password } : {}),
      },
    },
  );
  return data;
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

export type ForgotPasswordDomainInput = ForgotPasswordDomainRequestDto;
export type ForgotPasswordDomainResult = ForgotPasswordDomainResponseDto;

export async function forgotPasswordByDomain(
  input: ForgotPasswordDomainInput,
): Promise<ForgotPasswordDomainResult> {
  return apiJson<ForgotPasswordDomainResponseDto>("/api/auth/forgot-password-domain", {
    method: "POST",
    json: {
      domain: input.domain.trim(),
      email: input.email.trim(),
    },
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

export async function uploadMyCccd(frontFile: File, backFile: File): Promise<UploadCccdResponseDto> {
  const form = new FormData();
  form.append("frontFile", frontFile);
  form.append("backFile", backFile);

  const res = await fetch("/api/profile/cccd", {
    method: "POST",
    headers: {
      ...tunnelBypassHeaders(),
    },
    body: form,
  });

  let data: unknown = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message?: unknown }).message === "string"
        ? ((data as { message: string }).message as string)
        : "Tai CCCD that bai.";
    throw new ApiError(message, res.status, data);
  }

  return data as UploadCccdResponseDto;
}

export type CccdReviewStatus = "none" | "pending" | "approved" | "rejected";

export async function getMyCccdStatus(): Promise<{ status: CccdReviewStatus; canUpload: boolean; message: string }> {
  return apiJson<{ status: CccdReviewStatus; canUpload: boolean; message: string }>("/api/profile/cccd-status", {
    method: "GET",
  });
}
