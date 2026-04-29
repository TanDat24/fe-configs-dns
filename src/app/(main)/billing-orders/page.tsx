"use client";

import { FormEvent, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { getOrderItems } from "@/lib/api/customer-data";

type ItemLite = { id?: number | null; title?: string | null; total?: number | null; status?: string | null };

export default function BillingOrdersPage() {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [items, setItems] = useState<ItemLite[]>([]);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    const id = Number(orderId);
    if (!Number.isInteger(id) || id <= 0) {
      setMessage("Nhập orderId hợp lệ để tìm chi tiết đơn hàng.");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await getOrderItems(id, { limit: 200, offset: 0 });
      setItems(res.items.map((it) => ({ id: it.id, title: it.title, total: it.total, status: it.status })));
      setMessage(`Đã tải chi tiết đơn hàng với ${res.items.length} mục hàng.`);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Tải chi tiết đơn hàng thất bại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="w-full py-4">
      <h1 className="text-xl font-semibold text-zinc-900">Thanh toán & Đơn hàng</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Danh sách/chi tiết đơn hàng, các mặt hàng (items), số tiền, VAT, trạng thái thanh toán,
        giao dịch và hàng đợi gia hạn.
      </p>

      <form onSubmit={onSearch} className="mt-4 flex gap-2">
        <input
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="Nhập orderId"
          className="w-56 rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {loading ? "Đang tải..." : "Tải chi tiết đơn hàng"}
        </button>
      </form>

      {message ? <p className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm">{message}</p> : null}

      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">ID</th>
              <th className="px-3 py-2 text-left font-medium">Tiêu đề</th>
              <th className="px-3 py-2 text-left font-medium">Tổng</th>
              <th className="px-3 py-2 text-left font-medium">VAT</th>
              <th className="px-3 py-2 text-left font-medium">Thanh toán</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((it, idx) => (
              <tr key={it.id ?? `i-${idx}`}>
                <td className="px-3 py-2">{it.id ?? "-"}</td>
                <td className="px-3 py-2">{it.title || "-"}</td>
                <td className="px-3 py-2">{typeof it.total === "number" ? it.total : 0}</td>
                <td className="px-3 py-2">Đã bao gồm</td>
                <td className="px-3 py-2">{it.status || "chờ xử lý"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
