import "server-only";
import { wpGraphqlRequest } from "@/lib/server/wp-graphql-client";

const LOGIN_MUTATION = `
  mutation Login($username: String!, $password: String!) {
    login(input: { username: $username, password: $password }) {
      authToken
      refreshToken
    }
  }
`;

const REFRESH_MUTATION = `
  mutation RefreshJwtAuthToken($jwtRefreshToken: String!) {
    refreshJwtAuthToken(input: { jwtRefreshToken: $jwtRefreshToken }) {
      authToken
    }
  }
`;

export type WpGraphqlLoginResponse = {
  data?: { login?: { authToken?: string | null; refreshToken?: string | null } | null };
  errors?: Array<{ message: string }>;
};

type WpGraphqlRefreshResponse = {
  data?: { refreshJwtAuthToken?: { authToken?: string | null } | null };
  errors?: Array<{ message: string }>;
};

export type WpAuthTokens = {
  authToken: string;
  refreshToken: string | null;
};

export async function wpGraphqlLogin(
  endpoint: string,
  username: string,
  password: string,
): Promise<{ ok: true; authToken: string; refreshToken: string | null } | { ok: false; status: number; message: string }> {
  try {
    const json = await wpGraphqlRequest<WpGraphqlLoginResponse>(endpoint, {
      query: LOGIN_MUTATION,
      variables: { username, password },
    });

    if (json.errors?.length) {
      const msg = json.errors.map((e) => e.message).join(" ") || "Dang nhap that bai.";
      return { ok: false, status: 401, message: msg };
    }

    const authToken = json.data?.login?.authToken;
    if (!authToken) {
      return {
        ok: false,
        status: 401,
        message: "Dang nhap that bai. Khong nhan duoc authToken.",
      };
    }

    const refreshToken = json.data?.login?.refreshToken ?? null;
    return { ok: true, authToken, refreshToken: refreshToken ?? null };
  } catch {
    return {
      ok: false,
      status: 502,
      message: "Khong ket noi duoc toi may chu WordPress.",
    };
  }
}

export async function wpGraphqlRefreshAuthToken(
  endpoint: string,
  refreshToken: string,
): Promise<{ ok: true; authToken: string } | { ok: false; status: number; message: string }> {
  if (refreshToken.trim() === "") {
    return { ok: false, status: 401, message: "Thieu refresh token." };
  }

  try {
    const json = await wpGraphqlRequest<WpGraphqlRefreshResponse>(endpoint, {
      query: REFRESH_MUTATION,
      variables: { jwtRefreshToken: refreshToken },
    });

    if (json.errors?.length) {
      const msg = json.errors.map((e) => e.message).join(" ") || "Refresh token khong hop le.";
      return { ok: false, status: 401, message: msg };
    }

    const authToken = json.data?.refreshJwtAuthToken?.authToken;
    if (!authToken) {
      return { ok: false, status: 401, message: "Khong nhan duoc authToken moi." };
    }

    return { ok: true, authToken };
  } catch {
    return {
      ok: false,
      status: 502,
      message: "Khong ket noi duoc toi may chu WordPress.",
    };
  }
}
