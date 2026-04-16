import { apiJson, ApiError } from "./client";

export type LoginInput = {
  username: string;
  password: string;
};

export type LoginResult = {
  authToken: string;
};

export async function login(input: LoginInput): Promise<LoginResult> {
  const data = await apiJson<{ authToken?: string }>("/api/auth/login", {
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

export type ForgotPasswordInput = {
  email: string;
};

export type ForgotPasswordResult = {
  message: string;
  clientMutationId?: string;
};

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

export type ChangePasswordInput = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export async function changePassword(input: ChangePasswordInput): Promise<{ message: string }> {
  return apiJson<{ message: string }>("/api/auth/change-password", {
    method: "POST",
    json: input,
  });
}
