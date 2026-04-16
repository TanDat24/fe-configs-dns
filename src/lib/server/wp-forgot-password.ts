import "server-only";

const FORGOT_PASSWORD_MUTATION = `
  mutation ForgotPassword($email: String!) {
    forgotPassword(input: { email: $email }) {
      clientMutationId
      message
    }
  }
`;

type WpForgotPasswordResponse = {
  data?: {
    forgotPassword?: {
      clientMutationId?: string | null;
      message?: string | null;
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

export async function wpGraphqlForgotPassword(
  endpoint: string,
  email: string,
): Promise<
  | { ok: true; message: string; clientMutationId?: string | null }
  | { ok: false; status: number; message: string }
> {
  let wpRes: Response;
  try {
    wpRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: FORGOT_PASSWORD_MUTATION,
        variables: { email },
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

  let json: WpForgotPasswordResponse;
  try {
    json = await parseWpJson<WpForgotPasswordResponse>(wpRes);
  } catch {
    return {
      ok: false,
      status: 502,
      message: "Phản hồi từ WordPress không hợp lệ.",
    };
  }

  if (json.errors?.length) {
    const msg =
      json.errors.map((e) => e.message).join(" ") || "Không thể gửi yêu cầu.";
    return { ok: false, status: 400, message: msg };
  }

  const payload = json.data?.forgotPassword;
  const message =
    (typeof payload?.message === "string" && payload.message.trim()) ||
    "Nếu tài khoản tồn tại, bạn sẽ nhận email hướng dẫn đặt lại mật khẩu.";

  return {
    ok: true,
    message,
    clientMutationId: payload?.clientMutationId,
  };
}
