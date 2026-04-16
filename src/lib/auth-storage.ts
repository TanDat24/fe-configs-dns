/** Khóa lưu JWT từ WPGraphQL login (localStorage). */
export const WP_AUTH_TOKEN_KEY = "wp_graphql_auth_token";

export function saveWpAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WP_AUTH_TOKEN_KEY, token);
}

export function clearWpAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(WP_AUTH_TOKEN_KEY);
}

export function getWpAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(WP_AUTH_TOKEN_KEY);
}
