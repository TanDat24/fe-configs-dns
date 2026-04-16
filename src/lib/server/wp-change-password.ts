import "server-only";

type ChangePasswordResponse = {
  data?: {
    changeMyPassword?: {
      ok?: boolean | null;
      message?: string | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
};

const CHANGE_PASSWORD_MUTATION = `
  mutation ChangeMyPassword($oldPassword: String!, $newPassword: String!, $confirmPassword: String!) {
    changeMyPassword(input: {
      oldPassword: $oldPassword
      newPassword: $newPassword
      confirmPassword: $confirmPassword
    }) {
      ok
      message
    }
  }
`;

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

export async function wpGraphqlChangePassword(
  endpoint: string,
  authToken: string,
  input: { oldPassword: string; newPassword: string; confirmPassword: string },
): Promise<{ ok: true; message: string } | { ok: false; status: number; message: string }> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        query: CHANGE_PASSWORD_MUTATION,
        variables: input,
      }),
      cache: "no-store",
    });

    const json = await parseWpJson<ChangePasswordResponse>(res);
    if (json.errors?.length) {
      return { ok: false, status: 400, message: json.errors.map((e) => e.message).join(" ") };
    }

    const payload = json.data?.changeMyPassword;
    if (!payload?.ok) {
      return { ok: false, status: 400, message: payload?.message ?? "Khong doi duoc mat khau." };
    }

    return { ok: true, message: payload.message ?? "Da doi mat khau." };
  } catch {
    return { ok: false, status: 502, message: "Loi ket noi WordPress." };
  }
}
