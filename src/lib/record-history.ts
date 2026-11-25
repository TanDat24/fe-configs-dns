export type HistoryRecord = {
  host: string;
  type: string;
  value: string;
  ttl: number;
  priority: number | null;
};

export type RecordHistoryEntry = {
  id: number;
  operationId: string;
  actorId: number | null;
  actorName: string;
  occurredAt: string;
  source: string;
  status: string;
  baselineSource: string;
  applicationOk: boolean | null;
  added: number;
  removed: number;
  modified: number;
};

export type RecordHistoryDetail = RecordHistoryEntry & {
  before: HistoryRecord[];
  requested: HistoryRecord[] | null;
  observed: HistoryRecord[] | null;
  diff: {
    added: HistoryRecord[];
    removed: HistoryRecord[];
    modified: Array<{ before: HistoryRecord; after: HistoryRecord }>;
  };
};

export type RecordHistoryPage = { items: RecordHistoryEntry[]; nextCursor: number | null };

export function historyStatusLabel(status: string): string {
  return ({
    pending: "Chưa xác định (chưa hoàn tất nhật ký)",
    unknown: "Chưa xác định kết quả trên iNET",
    upstream_rejected: "iNET trả lỗi",
    failed: "Ứng dụng báo thao tác thất bại",
    unverified: "Ứng dụng báo thành công — chưa xác minh iNET",
    local_saved: "Ứng dụng báo đã lưu local",
    observed: "Đã quan sát thay đổi từ iNET",
  } as Record<string, string>)[status] ?? "Chưa xác định";
}

export function historySourceLabel(source: string): string {
  return ({ graphql: "Ứng dụng / GraphQL", wordpress: "WordPress / AJAX", inet_cron: "Đồng bộ tự động iNET", inet_sync: "Đọc / đồng bộ iNET" } as Record<string, string>)[source] ?? "Không xác định";
}
