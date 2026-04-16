import "server-only";

const VIEWER_QUERY = `
  query Viewer {
    viewer {
      databaseId
      name
      username
      email
      roles {
        nodes {
          name
        }
      }
    }
  }
`;

export type WpViewer = {
  databaseId: number;
  name: string | null;
  username: string | null;
  email: string | null;
  roles: { nodes: Array<{ name: string }> };
};

type WpViewerResponse = {
  data?: {
    viewer?: {
      databaseId?: number | null;
      name?: string | null;
      username?: string | null;
      email?: string | null;
      roles?: { nodes?: Array<{ name?: string | null }> } | null;
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

export async function wpGraphqlViewer(
  endpoint: string,
  authToken: string,
): Promise<
  | { ok: true; viewer: WpViewer | null }
  | { ok: false; status: number; message: string }
> {
  let wpRes: Response;
  try {
    wpRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ query: VIEWER_QUERY }),
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      status: 502,
      message: "Không kết nối được tới máy chủ WordPress.",
    };
  }

  let json: WpViewerResponse;
  try {
    json = await parseWpJson<WpViewerResponse>(wpRes);
  } catch {
    return {
      ok: false,
      status: 502,
      message: "Phản hồi từ WordPress không hợp lệ.",
    };
  }

  if (json.errors?.length) {
    const msg =
      json.errors.map((e) => e.message).join(" ") || "Không tải được thông tin tài khoản.";
    return { ok: false, status: 401, message: msg };
  }

  const v = json.data?.viewer;
  if (!v || v.databaseId == null) {
    return { ok: true, viewer: null };
  }

  const nodes = v.roles?.nodes ?? [];
  const viewer: WpViewer = {
    databaseId: v.databaseId,
    name: v.name ?? null,
    username: v.username ?? null,
    email: v.email ?? null,
    roles: {
      nodes: nodes
        .map((n) => (typeof n?.name === "string" ? { name: n.name } : null))
        .filter(Boolean) as Array<{ name: string }>,
    },
  };

  return { ok: true, viewer };
}
