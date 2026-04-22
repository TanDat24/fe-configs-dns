import "server-only";

const REGISTER_MUTATION = `
  mutation RegisterDnsUser($username: String!, $email: String!, $password: String!) {
    registerDnsUser(input: { username: $username, email: $email, password: $password }) {
      message
    }
  }
`;

const LOGIN_WITH_GOOGLE_MUTATION = `
  mutation LoginWithGoogle($idToken: String!) {
    loginWithGoogle(input: { idToken: $idToken }) {
      authToken
    }
  }
`;

const LOGIN_WITH_ZALO_MUTATION = `
  mutation LoginWithZalo($zaloId: String!, $name: String, $picture: String) {
    loginWithZalo(input: { zaloId: $zaloId, name: $name, picture: $picture }) {
      authToken
    }
  }
`;

type RegisterResponse = {
  data?: { registerDnsUser?: { message?: string | null } | null };
  errors?: Array<{ message: string }>;
};

type GoogleLoginResponse = {
  data?: { loginWithGoogle?: { authToken?: string | null } | null };
  errors?: Array<{ message: string }>;
};

type ZaloLoginResponse = {
  data?: { loginWithZalo?: { authToken?: string | null } | null };
  errors?: Array<{ message: string }>;
};

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    const start = text.indexOf("{");
    if (start >= 0) return JSON.parse(text.slice(start)) as T;
    throw new Error("invalid_json");
  }
}

export async function wpRegisterUser(
  endpoint: string,
  username: string,
  email: string,
  password: string,
): Promise<{ ok: true; message: string } | { ok: false; status: number; message: string }> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: REGISTER_MUTATION,
        variables: { username, email, password },
      }),
      cache: "no-store",
    });

    const json = await parseJson<RegisterResponse>(res);

    if (json.errors?.length) {
      return { ok: false, status: 400, message: json.errors[0]?.message ?? "Dang ky that bai." };
    }

    const message = json.data?.registerDnsUser?.message;
    if (!message) {
      return { ok: false, status: 500, message: "Dang ky that bai." };
    }

    return { ok: true, message };
  } catch {
    return { ok: false, status: 502, message: "Khong ket noi duoc may chu WordPress." };
  }
}

export async function wpLoginWithGoogle(
  endpoint: string,
  idToken: string,
): Promise<{ ok: true; authToken: string } | { ok: false; status: number; message: string }> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: LOGIN_WITH_GOOGLE_MUTATION,
        variables: { idToken },
      }),
      cache: "no-store",
    });

    const json = await parseJson<GoogleLoginResponse>(res);

    if (json.errors?.length) {
      return { ok: false, status: 401, message: json.errors[0]?.message ?? "Dang nhap Google that bai." };
    }

    const authToken = json.data?.loginWithGoogle?.authToken;
    if (!authToken) {
      return { ok: false, status: 401, message: "Khong nhan duoc token tu may chu." };
    }

    return { ok: true, authToken };
  } catch {
    return { ok: false, status: 502, message: "Khong ket noi duoc may chu WordPress." };
  }
}

export async function wpLoginWithZalo(
  endpoint: string,
  input: { zaloId: string; name?: string; picture?: string },
): Promise<{ ok: true; authToken: string } | { ok: false; status: number; message: string }> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: LOGIN_WITH_ZALO_MUTATION,
        variables: {
          zaloId: input.zaloId,
          name: input.name ?? null,
          picture: input.picture ?? null,
        },
      }),
      cache: "no-store",
    });

    const json = await parseJson<ZaloLoginResponse>(res);

    if (json.errors?.length) {
      return { ok: false, status: 401, message: json.errors[0]?.message ?? "Dang nhap Zalo that bai." };
    }

    const authToken = json.data?.loginWithZalo?.authToken;
    if (!authToken) {
      return { ok: false, status: 401, message: "Khong nhan duoc token tu may chu." };
    }

    return { ok: true, authToken };
  } catch {
    return { ok: false, status: 502, message: "Khong ket noi duoc may chu WordPress." };
  }
}
