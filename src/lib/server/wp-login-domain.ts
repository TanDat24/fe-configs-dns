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

const DOMAINS_LIST_QUERY = `
  query DomainsList {
    dnsDomainsList {
      domain
      slug
    }
  }
`;

const DOMAINS_LIST_WITH_EMAIL_QUERY = `
  mutation DomainEmailMatch($domain: String!, $email: String!) {
    domainEmailMatch(input: { domain: $domain, email: $email }) {
      matched
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

type WpDomainsListResponse = {
  data?: {
    dnsDomainsList?: Array<{
      domain?: string | null;
      slug?: string | null;
    }> | null;
  };
  errors?: Array<{ message: string }>;
};

type WpDomainsListWithEmailResponse = {
  data?: {
    domainEmailMatch?: {
      matched?: boolean | null;
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

const DOMAIN_CHECK_FALLBACK_PASSWORD = "__domain_check_only__";

function normalizeDomain(value: string): string {
  const raw = value.trim().toLowerCase();
  const noProtocol = raw.replace(/^https?:\/\//, "");
  const noPath = noProtocol.split("/")[0] ?? "";
  return noPath.replace(/^www\./, "");
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isPermissionErrorMessage(message: string): boolean {
  return /khong co quyen|không có quyền|permission|forbidden|unauthorized|truy cap/i.test(message);
}

function isDomainMissingMessage(message: string): boolean {
  return /(ten mien|tên miền|domain).*(khong ton tai|không tồn tại|not exist|not found|invalid|unknown)/i.test(
    message,
  );
}

function isWrongPasswordMessage(message: string): boolean {
  return /(mat khau|mật khẩu|password).*(sai|khong dung|không đúng|invalid|incorrect|wrong)/i.test(message);
}

export async function wpCheckDomainExists(
  endpoint: string,
  domain: string,
): Promise<{ ok: true; domainExists: boolean } | { ok: false; status: number; message: string }> {
  let wpRes: Response;
  try {
    wpRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: DOMAINS_LIST_QUERY }),
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      status: 502,
      message: "Không kết nối được tới máy chủ WordPress.",
    };
  }

  let json: WpDomainsListResponse;
  try {
    json = await parseWpJson<WpDomainsListResponse>(wpRes);
  } catch {
    return {
      ok: false,
      status: 502,
      message: "Phản hồi từ WordPress không hợp lệ.",
    };
  }

  if (json.errors?.length) {
    const message = json.errors.map((e) => e.message).join(" ") || "Không kiểm tra được tên miền.";
    if (isPermissionErrorMessage(message)) {
      return await wpCheckDomainExistsByLoginAttempt(endpoint, domain);
    }
    return {
      ok: false,
      status: 400,
      message,
    };
  }

  const target = normalizeDomain(domain);
  const exists = (json.data?.dnsDomainsList ?? []).some((item) => {
    const normalizedDomain = normalizeDomain(item.domain ?? "");
    const normalizedSlug = normalizeDomain((item.slug ?? "").replace(/-/g, "."));
    return normalizedDomain === target || normalizedSlug === target;
  });

  return { ok: true, domainExists: exists };
}

export async function wpCheckDomainEmailMatch(
  endpoint: string,
  domain: string,
  email: string,
): Promise<{ ok: true; matched: boolean } | { ok: false; status: number; message: string }> {
  let wpRes: Response;
  try {
    wpRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: DOMAINS_LIST_WITH_EMAIL_QUERY,
        variables: { domain, email },
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

  let json: WpDomainsListWithEmailResponse;
  try {
    json = await parseWpJson<WpDomainsListWithEmailResponse>(wpRes);
  } catch {
    return {
      ok: false,
      status: 502,
      message: "Phản hồi từ WordPress không hợp lệ.",
    };
  }

  if (json.errors?.length) {
    return {
      ok: false,
      status: 400,
      message: json.errors.map((e) => e.message).join(" ") || "Không kiểm tra được thông tin tên miền.",
    };
  }

  return { ok: true, matched: json.data?.domainEmailMatch?.matched === true };
}

async function wpCheckDomainExistsByLoginAttempt(
  endpoint: string,
  domain: string,
): Promise<{ ok: true; domainExists: boolean } | { ok: false; status: number; message: string }> {
  const result = await wpGraphqlLoginWithDomain(endpoint, domain, DOMAIN_CHECK_FALLBACK_PASSWORD);
  if (result.ok) {
    return { ok: true, domainExists: true };
  }

  const message = result.message || "";
  if (isDomainMissingMessage(message)) {
    return { ok: true, domainExists: false };
  }
  if (isWrongPasswordMessage(message)) {
    return { ok: true, domainExists: true };
  }

  return result;
}

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
