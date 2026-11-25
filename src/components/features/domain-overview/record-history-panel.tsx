"use client";

import { useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiJson } from "@/lib/api/client";
import { historySourceLabel, historyStatusLabel, type HistoryRecord, type RecordHistoryDetail, type RecordHistoryPage } from "@/lib/record-history";

function RecordTable({ title, rows }: { title: string; rows: HistoryRecord[] }) {
  return <div className="space-y-2">
    <h4 className="font-medium">{title} ({rows.length})</h4>
    {rows.length === 0 ? <p className="text-zinc-500">Không có bản ghi.</p> : <div className="max-h-72 overflow-auto">
      <table className="w-full text-left text-xs"><thead><tr>{["Host", "Loại", "Giá trị", "TTL", "Ưu tiên"].map(t => <th key={t} className="border-b p-2">{t}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}><td className="p-2">{r.host}</td><td className="p-2">{r.type}</td><td className="max-w-80 break-words whitespace-pre-wrap p-2">{r.value}</td><td className="p-2">{r.ttl}</td><td className="p-2">{r.priority ?? "—"}</td></tr>)}</tbody>
      </table>
    </div>}
  </div>;
}

export function RecordHistoryPanel({ slug, refreshVersion }: { slug: string; refreshVersion: number }) {
  return <RecordHistoryContent key={`${slug}:${refreshVersion}`} slug={slug} refreshVersion={refreshVersion} />;
}

function RecordHistoryContent({ slug, refreshVersion }: { slug: string; refreshVersion: number }) {
  const [reload, setReload] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const endpoint = `/api/domain/${encodeURIComponent(slug)}/record-history`;
  const history = useInfiniteQuery({
    queryKey: ["dns-record-history", slug, refreshVersion, reload],
    initialPageParam: null as number | null,
    queryFn: ({ pageParam, signal }) => apiJson<RecordHistoryPage>(
      `${endpoint}?limit=20${pageParam === null ? "" : `&beforeId=${pageParam}`}`, { method: "GET", signal }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    gcTime: 0,
    retry: false,
  });
  const detailQuery = useQuery({
    queryKey: ["dns-record-history-detail", slug, refreshVersion, selectedId, reload],
    queryFn: ({ signal }) => apiJson<{ item: RecordHistoryDetail }>(`${endpoint}/${selectedId}`, { method: "GET", signal }),
    enabled: selectedId !== null,
    gcTime: 0,
    retry: false,
  });
  const items = history.data?.pages.flatMap(page => page.items) ?? [];
  const loading = history.isFetching;
  const error = history.error?.message;
  const detail = detailQuery.data?.item;
  const detailError = detailQuery.error?.message;
  const detailLoading = detailQuery.isFetching;

  return <section aria-label="Lịch sử thay đổi record" className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm">
    <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Lịch sử thay đổi record</h3><button type="button" disabled={loading} onClick={() => { setSelectedId(null); setReload(n => n + 1); }} className="rounded border bg-white px-3 py-1 disabled:opacity-50">Tải lại</button></div>
    <p className="text-xs text-zinc-600">Lịch sử bắt đầu từ khi bật tính năng. Yêu cầu lưu chưa xác minh không chứng minh DNS trên iNET đã thay đổi. Thời gian đồng bộ là lúc phát hiện, không phải lúc thay đổi thực tế.</p>
    {error ? <p role="alert" className="text-red-700">{error}</p> : null}
    {!loading && !error && items.length === 0 ? <p>Chưa có lịch sử.</p> : null}
    <ul className="space-y-2">{items.map(item => <li key={item.id} className="rounded border bg-white p-3">
      <div className="flex flex-wrap justify-between gap-2"><span>{new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "medium" }).format(new Date(item.occurredAt))} (VN)</span><button type="button" aria-expanded={selectedId === item.id} onClick={() => setSelectedId(selectedId === item.id ? null : item.id)} className="text-teal-700 underline">{selectedId === item.id ? "Đóng chi tiết" : "Xem chi tiết"}</button></div>
      <p>{item.actorName || "Không xác định"} · {historySourceLabel(item.source)}</p>
      <p className="font-medium">{historyStatusLabel(item.status)}</p>
      <p className="text-xs">{item.status === "observed" ? "Chênh lệch quan sát" : "Chênh lệch yêu cầu"}: thêm {item.added}, sửa {item.modified}, xóa {item.removed}</p>
      {selectedId === item.id ? <div className="mt-3 space-y-4 border-t pt-3">
        {detailLoading ? <p role="status">Đang tải chi tiết...</p> : null}
        {detailError ? <p role="alert" className="text-red-700">{detailError}</p> : null}
        {detail ? <>
          <p className="break-all text-xs text-zinc-500">Mã thao tác: {detail.operationId}</p>
          <RecordTable title={`Trước thao tác (${detail.baselineSource === "inet" ? "đọc từ iNET" : "dữ liệu local"})`} rows={detail.before} />
          {detail.requested !== null ? <RecordTable title="Danh sách yêu cầu lưu — chưa xác minh trên iNET" rows={detail.requested} /> : null}
          {detail.observed !== null ? <RecordTable title="Danh sách quan sát được từ iNET" rows={detail.observed} /> : null}
          <RecordTable title="Thêm" rows={detail.diff.added} /><RecordTable title="Xóa" rows={detail.diff.removed} />
          {detail.diff.modified.map((change, i) => <div key={i} className="space-y-2 rounded border p-2"><RecordTable title="Sửa — trước" rows={[change.before]} /><RecordTable title="Sửa — sau" rows={[change.after]} /></div>)}
        </> : null}
      </div> : null}
    </li>)}</ul>
    {loading ? <p role="status">Đang tải lịch sử...</p> : null}
    {history.hasNextPage ? <button type="button" disabled={loading} onClick={() => { void history.fetchNextPage(); }} className="rounded border bg-white px-3 py-2 disabled:opacity-50">Tải thêm</button> : null}
  </section>;
}
