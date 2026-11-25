import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import type { RecordHistoryDetail, RecordHistoryEntry } from "@/lib/record-history";
import { wpGraphqlWithAuth } from "@/lib/server/wp-graphql-client";

const SUMMARY = "id operationId actorId actorName occurredAt source status baselineSource applicationOk added removed modified";
const LIST_QUERY = `query RecordHistory($slug: String!, $beforeId: Int, $limit: Int) {
  dnsRecordHistory(slug: $slug, beforeId: $beforeId, limit: $limit) {
    ok code items { ${SUMMARY} } nextCursor
  }
}`;
const DETAIL_QUERY = `query RecordHistoryItem($slug: String!, $id: Int!) {
  dnsRecordHistoryItem(slug: $slug, id: $id) {
    ok code item { ${SUMMARY} beforeJson requestedJson observedJson diffJson }
  }
}`;

type RawDetail = RecordHistoryEntry & {
  beforeJson: string;
  requestedJson: string | null;
  observedJson: string | null;
  diffJson: string;
};
type Result = { ok: boolean; code?: string; items?: RecordHistoryEntry[]; nextCursor?: number | null; item?: RawDetail };
type WpResult = { data?: { dnsRecordHistory?: Result; dnsRecordHistoryItem?: Result }; errors?: unknown[] };

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

function positiveInt(raw: string | null): number | null {
  if (raw === null || !/^\d+$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 && value <= 2147483647 ? value : null;
}

export async function recordHistoryResponse(request: Request, slug: string, historyId?: string) {
  try {
    const token = (await cookies()).get(WP_AUTH_COOKIE_NAME)?.value;
    if (!token) return reply({ message: "Bạn cần đăng nhập để xem lịch sử." }, 401);
    const endpoint = process.env.WP_GRAPHQL_URL;
    if (!endpoint) return reply({ message: "Cấu hình hệ thống chưa đầy đủ." }, 500);
    if (!slug || slug.length > 255) return reply({ message: "Tên miền không hợp lệ." }, 400);
    const params = new URL(request.url).searchParams;
    const beforeId = params.has("beforeId") ? positiveInt(params.get("beforeId")) : undefined;
    const limit = params.has("limit") ? positiveInt(params.get("limit")) : 20;
    const id = historyId === undefined ? undefined : positiveInt(historyId);
    if (beforeId === null || limit === null || limit > 50 || id === null) {
      return reply({ message: "Tham số lịch sử không hợp lệ." }, 400);
    }
    const detail = historyId !== undefined;
    const json = await wpGraphqlWithAuth<WpResult>(endpoint, token, detail ? DETAIL_QUERY : LIST_QUERY,
      detail ? { slug, id } : { slug, beforeId, limit });
    if (json.errors?.length) return reply({ message: "Không tải được lịch sử." }, 502);
    const result = detail ? json.data?.dnsRecordHistoryItem : json.data?.dnsRecordHistory;
    if (!result?.ok) {
      const status = result?.code === "FORBIDDEN" ? 403 : result?.code === "NOT_FOUND" ? 404 : 503;
      return reply({ message: status === 403 ? "Bạn không có quyền xem lịch sử này." : "Không tải được lịch sử." }, status);
    }
    if (!detail) return reply({ items: result.items ?? [], nextCursor: result.nextCursor ?? null });
    if (!result.item) return reply({ message: "Không tìm thấy lịch sử." }, 404);
    const { beforeJson, requestedJson, observedJson, diffJson, ...summary } = result.item;
    const item: RecordHistoryDetail = {
      ...summary, before: JSON.parse(beforeJson),
      requested: requestedJson == null ? null : JSON.parse(requestedJson),
      observed: observedJson == null ? null : JSON.parse(observedJson), diff: JSON.parse(diffJson),
    };
    return reply({ item });
  } catch {
    return reply({ message: "Tạm thời không tải được lịch sử." }, 502);
  }
}
