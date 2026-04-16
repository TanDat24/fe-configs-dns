import "server-only";

const LOGIN_MUTATION = `
  mutation Login($username: String!, $password: String!) {
    login(input: { username: $username, password: $password }) {
      authToken
    }
  }
`;

export type WpGraphqlResponse = {
  data?: { login?: { authToken?: string | null } | null };
  errors?: Array<{ message: string }>;
};

async function parseWpJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    const jsonStart = text.indexOf("{");
    if (jsonStart >= 0) {
      return JSON.parse(text.slice(jsonStart)) as T;
    }
    throw new Error("invalid_json");
  }
}

export async function wpGraphqlLogin(
  endpoint: string,
  username: string,
  password: string,
): Promise<{ ok: true; authToken: string } | { ok: false; status: number; message: string }> {
  let wpRes: Response;
  try {
    wpRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: LOGIN_MUTATION,
        variables: { username, password },
      }),
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      status: 502,
      message: "Không kết nối được tới máy chủ WordPress.",
    };
  }

  let json: WpGraphqlResponse;
  try {
    json = await parseWpJson<WpGraphqlResponse>(wpRes);
  } catch {
    return {
      ok: false,
      status: 502,
      message: "Phản hồi từ WordPress không hợp lệ.",
    };
  }

  if (json.errors?.length) {
    const msg =
      json.errors.map((e) => e.message).join(" ") || "Đăng nhập thất bại.";
    return { ok: false, status: 401, message: msg };
  }

  const authToken = json.data?.login?.authToken;
  if (!authToken) {
    return {
      ok: false,
      status: 401,
      message: "Đăng nhập thất bại. Không nhận được authToken.",
    };
  }

  return { ok: true, authToken };
}
