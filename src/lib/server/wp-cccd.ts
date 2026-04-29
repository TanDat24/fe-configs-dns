import "server-only";

const UPLOAD_MY_CCCD_MUTATION = `
  mutation UploadMyCccd($fileName: String!, $mimeType: String!, $contentBase64: String!, $side: String!) {
    uploadMyCccd(input: { fileName: $fileName, mimeType: $mimeType, contentBase64: $contentBase64, side: $side }) {
      ok
      message
      fileUrl
      side
    }
  }
`;

const MY_CCCD_REVIEW_STATUS_QUERY = `
  query MyCccdReviewStatus {
    myCccdReviewStatus {
      status
      canUpload
      message
    }
  }
`;

type UploadCccdResponse = {
  data?: {
    uploadMyCccd?: {
      ok?: boolean | null;
      message?: string | null;
      fileUrl?: string | null;
      side?: string | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
};

type CccdStatusResponse = {
  data?: {
    myCccdReviewStatus?: {
      status?: string | null;
      canUpload?: boolean | null;
      message?: string | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
};

async function parseJson<T>(response: Response): Promise<T> {
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

export async function wpUploadMyCccd(
  endpoint: string,
  authToken: string,
  input: { fileName: string; mimeType: string; contentBase64: string; side: "front" | "back" },
): Promise<{ ok: true; fileUrl: string; side: "front" | "back"; message: string } | { ok: false; status: number; message: string }> {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        query: UPLOAD_MY_CCCD_MUTATION,
        variables: input,
      }),
      cache: "no-store",
    });

    const json = await parseJson<UploadCccdResponse>(response);
    if (json.errors?.length) {
      return { ok: false, status: 400, message: json.errors.map((e) => e.message).join(" ") };
    }

    const payload = json.data?.uploadMyCccd;
    if (!payload?.ok || !payload.fileUrl) {
      return { ok: false, status: 400, message: payload?.message ?? "Tai CCCD that bai." };
    }

    return {
      ok: true,
      fileUrl: payload.fileUrl,
      side: payload.side === "back" ? "back" : "front",
      message: payload.message ?? "Da tai CCCD thanh cong.",
    };
  } catch {
    return { ok: false, status: 502, message: "Khong ket noi duoc may chu WordPress." };
  }
}

export async function wpGetMyCccdReviewStatus(
  endpoint: string,
  authToken: string,
): Promise<
  | { ok: true; status: "none" | "pending" | "approved" | "rejected"; canUpload: boolean; message: string }
  | { ok: false; status: number; message: string }
> {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ query: MY_CCCD_REVIEW_STATUS_QUERY }),
      cache: "no-store",
    });

    const json = await parseJson<CccdStatusResponse>(response);
    if (json.errors?.length) {
      return { ok: false, status: 400, message: json.errors.map((e) => e.message).join(" ") };
    }

    const payload = json.data?.myCccdReviewStatus;
    const statusRaw = payload?.status ?? "none";
    const status =
      statusRaw === "pending" || statusRaw === "approved" || statusRaw === "rejected" ? statusRaw : "none";
    return {
      ok: true,
      status,
      canUpload: payload?.canUpload !== false,
      message: payload?.message ?? "",
    };
  } catch {
    return { ok: false, status: 502, message: "Khong ket noi duoc may chu WordPress." };
  }
}

