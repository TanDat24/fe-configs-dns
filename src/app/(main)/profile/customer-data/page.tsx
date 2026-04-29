"use client";

import { FormEvent, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  deleteOrderContact,
  deleteOrderItem,
  getMyUserInfo,
  getOrderContacts,
  getOrderItems,
  upsertMyUserInfo,
  upsertOrderContact,
  upsertOrderItem,
} from "@/lib/api/customer-data";

export default function CustomerDataPage() {
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const [orderIdInput, setOrderIdInput] = useState("");
  const [contacts, setContacts] = useState<Array<{ id?: number | null; name?: string | null; email?: string | null }>>([]);
  const [items, setItems] = useState<Array<{ id?: number | null; title?: string | null; total?: number | null }>>([]);
  const [listMessage, setListMessage] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [contactId, setContactId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [itemId, setItemId] = useState("");
  const [itemTitle, setItemTitle] = useState("");
  const [itemTotal, setItemTotal] = useState("");

  async function loadMyInfo() {
    setLoadingInfo(true);
    setInfoMessage(null);
    try {
      const item = await getMyUserInfo();
      setName(item?.name ?? "");
      setPhone(item?.phone ?? "");
      setAddress(item?.address ?? "");
      setInfoMessage("Da tai thong tin user.");
    } catch (err) {
      setInfoMessage(err instanceof ApiError ? err.message : "Khong tai duoc user info.");
    } finally {
      setLoadingInfo(false);
    }
  }

  async function onSaveInfo(e: FormEvent) {
    e.preventDefault();
    setSavingInfo(true);
    setInfoMessage(null);
    try {
      const res = await upsertMyUserInfo({ name, phone, address });
      setInfoMessage(res.message || "Da luu user info.");
    } catch (err) {
      setInfoMessage(err instanceof ApiError ? err.message : "Luu user info that bai.");
    } finally {
      setSavingInfo(false);
    }
  }

  async function loadOrderData() {
    const orderId = Number(orderIdInput);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      setListMessage("Nhap orderId hop le.");
      return;
    }
    setLoadingList(true);
    setListMessage(null);
    try {
      const [contactRes, itemRes] = await Promise.all([
        getOrderContacts(orderId, { limit: 200, offset: 0 }),
        getOrderItems(orderId, { limit: 200, offset: 0 }),
      ]);
      setContacts(contactRes.items.map((x) => ({ id: x.id, name: x.name, email: x.email })));
      setItems(itemRes.items.map((x) => ({ id: x.id, title: x.title, total: x.total })));
      setListMessage("Da tai danh sach contacts/items.");
    } catch (err) {
      setListMessage(err instanceof ApiError ? err.message : "Tai du lieu order that bai.");
    } finally {
      setLoadingList(false);
    }
  }

  async function onDeleteContact(id?: number | null) {
    if (!id) return;
    try {
      await deleteOrderContact(id);
      setContacts((prev) => prev.filter((x) => x.id !== id));
      setListMessage("Da xoa contact.");
    } catch (err) {
      setListMessage(err instanceof ApiError ? err.message : "Xoa contact that bai.");
    }
  }

  async function onDeleteItem(id?: number | null) {
    if (!id) return;
    try {
      await deleteOrderItem(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      setListMessage("Da xoa item.");
    } catch (err) {
      setListMessage(err instanceof ApiError ? err.message : "Xoa item that bai.");
    }
  }

  async function onSaveContact(e: FormEvent) {
    e.preventDefault();
    const orderId = Number(orderIdInput);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      setListMessage("Nhap orderId hop le truoc khi luu contact.");
      return;
    }
    setSavingContact(true);
    try {
      await upsertOrderContact(orderId, {
        id: contactId ? Number(contactId) : undefined,
        name: contactName,
        email: contactEmail,
      });
      setListMessage("Da luu contact.");
      setContactId("");
      setContactName("");
      setContactEmail("");
      await loadOrderData();
    } catch (err) {
      setListMessage(err instanceof ApiError ? err.message : "Luu contact that bai.");
    } finally {
      setSavingContact(false);
    }
  }

  async function onSaveItem(e: FormEvent) {
    e.preventDefault();
    const orderId = Number(orderIdInput);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      setListMessage("Nhap orderId hop le truoc khi luu item.");
      return;
    }
    setSavingItem(true);
    try {
      await upsertOrderItem(orderId, {
        id: itemId ? Number(itemId) : undefined,
        title: itemTitle,
        total: itemTotal ? Number(itemTotal) : 0,
      });
      setListMessage("Da luu item.");
      setItemId("");
      setItemTitle("");
      setItemTotal("");
      await loadOrderData();
    } catch (err) {
      setListMessage(err instanceof ApiError ? err.message : "Luu item that bai.");
    } finally {
      setSavingItem(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-4 text-xl font-semibold text-zinc-900">Customer Data</h1>

      <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">My User Info</h2>
          <button
            type="button"
            onClick={loadMyInfo}
            disabled={loadingInfo}
            className="rounded-md border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50 disabled:opacity-60"
          >
            {loadingInfo ? "Dang tai..." : "Tai du lieu"}
          </button>
        </div>
        <form className="grid gap-3 md:grid-cols-3" onSubmit={onSaveInfo}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ho ten" className="rounded-md border border-zinc-300 px-3 py-2 text-sm" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="So dien thoai" className="rounded-md border border-zinc-300 px-3 py-2 text-sm" />
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dia chi" className="rounded-md border border-zinc-300 px-3 py-2 text-sm" />
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={savingInfo}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {savingInfo ? "Dang luu..." : "Luu user info"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 text-base font-semibold">Order Contacts & Items</h2>
        <div className="mb-4 flex gap-2">
          <input
            value={orderIdInput}
            onChange={(e) => setOrderIdInput(e.target.value)}
            placeholder="Nhap orderId"
            className="w-56 rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={loadOrderData}
            disabled={loadingList}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {loadingList ? "Dang tai..." : "Tai du lieu order"}
          </button>
        </div>

        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <form onSubmit={onSaveContact} className="rounded-lg border border-zinc-200 p-3">
            <h3 className="mb-2 font-medium">Them / Sua Contact</h3>
            <div className="grid gap-2">
              <input value={contactId} onChange={(e) => setContactId(e.target.value)} placeholder="ID (bo trong de tao moi)" className="rounded-md border border-zinc-300 px-3 py-2 text-sm" />
              <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Ten contact" className="rounded-md border border-zinc-300 px-3 py-2 text-sm" />
              <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Email contact" className="rounded-md border border-zinc-300 px-3 py-2 text-sm" />
              <button type="submit" disabled={savingContact} className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-60">
                {savingContact ? "Dang luu..." : "Luu contact"}
              </button>
            </div>
          </form>

          <form onSubmit={onSaveItem} className="rounded-lg border border-zinc-200 p-3">
            <h3 className="mb-2 font-medium">Them / Sua Item</h3>
            <div className="grid gap-2">
              <input value={itemId} onChange={(e) => setItemId(e.target.value)} placeholder="ID (bo trong de tao moi)" className="rounded-md border border-zinc-300 px-3 py-2 text-sm" />
              <input value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} placeholder="Tieu de item" className="rounded-md border border-zinc-300 px-3 py-2 text-sm" />
              <input value={itemTotal} onChange={(e) => setItemTotal(e.target.value)} placeholder="Total" className="rounded-md border border-zinc-300 px-3 py-2 text-sm" />
              <button type="submit" disabled={savingItem} className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-60">
                {savingItem ? "Dang luu..." : "Luu item"}
              </button>
            </div>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 font-medium">Contacts ({contacts.length})</h3>
            <ul className="space-y-2">
              {contacts.map((c, idx) => (
                <li key={c.id ?? `contact-${idx}`} className="flex items-center justify-between rounded border border-zinc-200 px-3 py-2 text-sm">
                  <div>
                    <div>{c.name || "(Khong ten)"}</div>
                    <div className="text-zinc-500">{c.email || "-"}</div>
                  </div>
                  <button type="button" onClick={() => onDeleteContact(c.id)} className="text-red-600 hover:underline">
                    Xoa
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 font-medium">Items ({items.length})</h3>
            <ul className="space-y-2">
              {items.map((i, idx) => (
                <li key={i.id ?? `item-${idx}`} className="flex items-center justify-between rounded border border-zinc-200 px-3 py-2 text-sm">
                  <div>
                    <div>{i.title || "(Khong tieu de)"}</div>
                    <div className="text-zinc-500">Total: {typeof i.total === "number" ? i.total : 0}</div>
                  </div>
                  <button type="button" onClick={() => onDeleteItem(i.id)} className="text-red-600 hover:underline">
                    Xoa
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {infoMessage ? <p className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm">{infoMessage}</p> : null}
      {listMessage ? <p className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm">{listMessage}</p> : null}
    </main>
  );
}
