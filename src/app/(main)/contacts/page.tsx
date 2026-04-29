"use client";

import { FormEvent, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { deleteOrderContact, getOrderContacts, upsertOrderContact } from "@/lib/api/customer-data";

type ContactLite = { id?: number | null; name?: string | null; email?: string | null; type?: string | null };

export default function ContactsPage() {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [savingContact, setSavingContact] = useState(false);
  const [contacts, setContacts] = useState<ContactLite[]>([]);

  // Form cho thêm / sửa contact
  const [contactId, setContactId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactType, setContactType] = useState("");

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    const id = Number(orderId);
    if (!Number.isInteger(id) || id <= 0) {
      setMessage("Vui lòng nhập orderId hợp lệ để tìm danh sách hồ sơ liên hệ.");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await getOrderContacts(id, { limit: 200, offset: 0 });
      setContacts(res.items.map((c) => ({ id: c.id, name: c.name, email: c.email, type: c.type })));
      setMessage(`Đã tải ${res.items.length} hồ sơ liên hệ.`);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Tải hồ sơ liên hệ thất bại.");
    } finally {
      setLoading(false);
    }
  }

  async function reloadContacts() {
    const id = Number(orderId);
    if (!Number.isInteger(id) || id <= 0) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await getOrderContacts(id, { limit: 200, offset: 0 });
      setContacts(res.items.map((c) => ({ id: c.id, name: c.name, email: c.email, type: c.type })));
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Tải lại hồ sơ liên hệ thất bại.");
    } finally {
      setLoading(false);
    }
  }

  async function onSaveContact(e: FormEvent) {
    e.preventDefault();
    const id = Number(orderId);
    if (!Number.isInteger(id) || id <= 0) {
      setMessage("Vui lòng nhập orderId hợp lệ trước khi lưu contact.");
      return;
    }

    setSavingContact(true);
    setMessage(null);
    try {
      await upsertOrderContact(id, {
        id: contactId ? Number(contactId) : undefined,
        name: contactName || undefined,
        email: contactEmail || undefined,
        type: contactType || undefined,
      });

      setMessage("Đã lưu contact.");
      setContactId("");
      setContactName("");
      setContactEmail("");
      setContactType("");
      await reloadContacts();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Lưu contact thất bại.");
    } finally {
      setSavingContact(false);
    }
  }

  async function onDeleteContact(id?: number | null) {
    if (!id) return;
    setSavingContact(true);
    setMessage(null);
    try {
      await deleteOrderContact(id);
      setMessage("Đã xóa contact.");
      await reloadContacts();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Xóa contact thất bại.");
    } finally {
      setSavingContact(false);
    }
  }

  return (
    <main className="w-full py-4">
      <h1 className="text-xl font-semibold text-zinc-900">Liên hệ</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Hồ sơ liên hệ, trạng thái xác minh và mapping pháp lý theo domain/order.
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
          {loading ? "Đang tải..." : "Tải liên hệ"}
        </button>
      </form>

      {message ? <p className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm">{message}</p> : null}

      <section className="mt-5 rounded-lg border border-zinc-200 bg-white p-3">
        <h2 className="mb-3 text-base font-semibold text-zinc-900">Thêm / Sửa contact</h2>
        <form onSubmit={onSaveContact} className="grid gap-2 md:grid-cols-4">
          <input
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            placeholder="ID (bỏ trống để tạo mới)"
            className="col-span-2 rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Tên"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="Email"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            value={contactType}
            onChange={(e) => setContactType(e.target.value)}
            placeholder="Vai trò / type"
            className="md:col-span-2 rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <div className="md:col-span-4">
            <button
              type="submit"
              disabled={savingContact}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {savingContact ? "Đang lưu..." : "Lưu contact"}
            </button>
          </div>
        </form>
      </section>

      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">ID</th>
              <th className="px-3 py-2 text-left font-medium">Tên</th>
              <th className="px-3 py-2 text-left font-medium">Email</th>
              <th className="px-3 py-2 text-left font-medium">Vai trò</th>
              <th className="px-3 py-2 text-left font-medium">Xác minh</th>
              <th className="px-3 py-2 text-left font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {contacts.map((c, idx) => (
              <tr key={c.id ?? `c-${idx}`}>
                <td className="px-3 py-2">{c.id ?? "-"}</td>
                <td className="px-3 py-2">{c.name || "-"}</td>
                <td className="px-3 py-2">{c.email || "-"}</td>
                <td className="px-3 py-2">{c.type || "người đăng ký"}</td>
                <td className="px-3 py-2">
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">chờ xử lý</span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={savingContact}
                      onClick={() => {
                        setContactId(c.id ? String(c.id) : "");
                        setContactName(c.name ?? "");
                        setContactEmail(c.email ?? "");
                        setContactType(c.type ?? "");
                      }}
                      className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      disabled={savingContact}
                      onClick={() => onDeleteContact(c.id)}
                      className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
