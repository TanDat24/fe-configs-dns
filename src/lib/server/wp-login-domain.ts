import "server-only";

const LOGIN_WITH_DOMAIN_MUTATION = `
  mutation LoginWithDomain($domain: String!, $password: String!) {
    loginWithDomain(input: { domain: $domain, password: $password }) {
      authToken
      username
      domain
    }
  }
`;

export type WpLoginDomainResponse = {
  data?: {
    loginWithDomain?: {
      authToken?: string | null;
      username?: string | null;
      domain?: string | null;
    } | null;
  };
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

export type WpLoginDomainResult =
  | { ok: true; authToken: string; username: string; domain: string }
  | { ok: false; status: number; message: string };

export async function wpGraphqlLoginWithDomain(
  endpoint: string,
  domain: string,
  password: string,
): Promise<WpLoginDomainResult> {
  let wpRes: Response;
  try {
    wpRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: LOGIN_WITH_DOMAIN_MUTATION,
        variables: { domain, password },
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

  let json: WpLoginDomainResponse;
  try {
    json = await parseWpJson<WpLoginDomainResponse>(wpRes);
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

  const payload = json.data?.loginWithDomain;
  const authToken = payload?.authToken;
  if (!authToken) {
    return {
      ok: false,
      status: 401,
      message: "Đăng nhập thất bại. Không nhận được authToken.",
    };
  }

  return {
    ok: true,
    authToken,
    username: payload?.username ?? "",
    domain: payload?.domain ?? domain,
  };
}
