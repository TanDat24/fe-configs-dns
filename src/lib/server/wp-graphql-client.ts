import "server-only";

export type WpGraphqlError = { message: string };

export type WpGraphqlResponse<T> = {
  data?: T;
  errors?: WpGraphqlError[];
};

export async function parseWpJson<T>(response: Response): Promise<T> {
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

export function getWpGraphqlEndpoint(): string | null {
  const endpoint = process.env.WP_GRAPHQL_URL?.trim();
  return endpoint ? endpoint : null;
}

export async function wpGraphqlRequest<T>(
  endpoint: string,
  body: { query: string; variables?: Record<string, unknown> },
  authToken?: string,
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  return parseWpJson<T>(response);
}

export async function wpGraphqlWithAuth<T>(
  endpoint: string,
  authToken: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  return wpGraphqlRequest<T>(endpoint, { query, variables }, authToken);
}
