"use client";

import { useEffect, useState } from "react";
import { FeatureErrorBoundary } from "@/components/ui/feature-error-boundary";
import {
  getUserContactsErrorMessage,
  useUserContactMutations,
  useUserContacts,
} from "@/hooks/use-user-contacts";
import {
  CONTACT_MODE_LABELS,
  CONTACT_TYPE_LABELS,
  CONTACT_TYPE_ORDER,
  createEmptyContactDraft,
  type ContactDraft,
  type ContactType,
} from "@/lib/contact-types";

function createInitialContacts(): Record<ContactType, ContactDraft> {
  return Object.fromEntries(
    CONTACT_TYPE_ORDER.map((type) => [type, createEmptyContactDraft(type)]),
  ) as Record<ContactType, ContactDraft>;
}

function ContactSection({
  type,
  draft,
  saving,
  onChange,
  onSave,
  onDelete,
}: {
  type: ContactType;
  draft: ContactDraft;
  saving: boolean;
  onChange: <K extends keyof ContactDraft>(field: K, value: ContactDraft[K]) => void;
  onSave: (type: ContactType) => Promise<void>;
  onDelete: (type: ContactType) => Promise<void>;
}) {
  const isOwner = type === "owner";
  const isCompany = draft.contactMode === "company";
  const canDelete = Boolean(draft.id);

  const commonInputClass =
    "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100";

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 sm:text-lg">
              {CONTACT_TYPE_LABELS[type]}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {isOwner
                ? "Chủ thể có thể là tổ chức hoặc cá nhân."
                : "Luôn là thông tin cá nhân."}
            </p>
          </div>
          <div className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
            {draft.id ? `Đã lưu #${draft.id}` : "Chưa có dữ liệu"}
          </div>
        </div>
      </div>

      <div className="space-y-5 px-4 py-5 sm:px-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {isOwner ? (
            <fieldset className="sm:col-span-2 lg:col-span-4">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50">
                <input
                  type="checkbox"
                  checked={draft.contactMode === "company"}
                  onChange={(e) => onChange("contactMode", e.target.checked ? "company" : "personal")}
                />
                Đăng ký tổ chức / công ty
              </label>
            </fieldset>
          ) : (
            <div className="sm:col-span-2 lg:col-span-4">
              <div className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                {CONTACT_MODE_LABELS.personal}
              </div>
            </div>
          )}

          {isCompany ? (
            <>
              <label className="sm:col-span-2 lg:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-zinc-700">Tên công ty</span>
                <input
                  value={draft.companyName}
                  onChange={(e) => onChange("companyName", e.target.value)}
                  placeholder="Tên doanh nghiệp"
                  className={`${commonInputClass} w-full`}
                  disabled={saving}
                />
              </label>
              <label className="lg:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-zinc-700">Mã số thuế</span>
                <input
                  value={draft.taxCode}
                  onChange={(e) => onChange("taxCode", e.target.value)}
                  placeholder="Mã số thuế"
                  className={`${commonInputClass} w-full`}
                  disabled={saving}
                />
              </label>
            </>
          ) : (
            <>
              <label className="sm:col-span-2 lg:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-zinc-700">Họ và tên</span>
                <input
                  value={draft.fullName}
                  onChange={(e) => onChange("fullName", e.target.value)}
                  placeholder="Họ và tên"
                  className={`${commonInputClass} w-full`}
                  disabled={saving}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium text-zinc-700">Giới tính</span>
                <select
                  value={draft.gender}
                  onChange={(e) => onChange("gender", e.target.value as ContactDraft["gender"])}
                  className={`${commonInputClass} w-full`}
                  disabled={saving}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium text-zinc-700">Ngày sinh</span>
                <input
                  type="date"
                  value={draft.birthday}
                  onChange={(e) => onChange("birthday", e.target.value)}
                  className={`${commonInputClass} w-full`}
                  disabled={saving}
                />
              </label>
              <label className="sm:col-span-2 lg:col-span-1">
                <span className="mb-1.5 block text-sm font-medium text-zinc-700">Số định danh</span>
                <input
                  value={draft.identityNumber}
                  onChange={(e) => onChange("identityNumber", e.target.value)}
                  placeholder="CCCD / hộ chiếu"
                  className={`${commonInputClass} w-full`}
                  disabled={saving}
                />
              </label>
            </>
          )}

          <label>
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">Quốc gia</span>
            <input
              value={draft.country}
              onChange={(e) => onChange("country", e.target.value)}
              placeholder="VN"
              className={`${commonInputClass} w-full`}
              disabled={saving}
            />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">Tỉnh / Thành phố</span>
            <input
              value={draft.province}
              onChange={(e) => onChange("province", e.target.value)}
              placeholder="Tỉnh / Thành phố"
              className={`${commonInputClass} w-full`}
              disabled={saving}
            />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">Phường / Xã</span>
            <input
              value={draft.ward}
              onChange={(e) => onChange("ward", e.target.value)}
              placeholder="Phường / Xã"
              className={`${commonInputClass} w-full`}
              disabled={saving}
            />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">Email</span>
            <input
              type="email"
              value={draft.email}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder="email@domain.com"
              className={`${commonInputClass} w-full`}
              disabled={saving}
            />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">Điện thoại</span>
            <input
              value={draft.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              placeholder="Số điện thoại"
              className={`${commonInputClass} w-full`}
              disabled={saving}
            />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">Fax</span>
            <input
              value={draft.fax}
              onChange={(e) => onChange("fax", e.target.value)}
              placeholder="Fax"
              className={`${commonInputClass} w-full`}
              disabled={saving}
            />
          </label>
          <label className="sm:col-span-2 lg:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">Địa chỉ</span>
            <textarea
              value={draft.address}
              onChange={(e) => onChange("address", e.target.value)}
              placeholder="Địa chỉ"
              rows={3}
              className={`${commonInputClass} w-full`}
              disabled={saving}
            />
          </label>
          <label className="sm:col-span-2 lg:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">Mã bưu chính</span>
            <input
              value={draft.postalCode}
              onChange={(e) => onChange("postalCode", e.target.value)}
              placeholder="Mã bưu chính"
              className={`${commonInputClass} w-full`}
              disabled={saving}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-4">
          <button
            type="button"
            onClick={() => void onSave(type)}
            disabled={saving}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-teal-600 px-4 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Lưu contact"}
          </button>
          <button
            type="button"
            onClick={() => void onDelete(type)}
            disabled={saving || !canDelete}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Xóa contact
          </button>
        </div>
      </div>
    </section>
  );
}

function UserContactsPanel({ embedded = false, domainId }: { embedded?: boolean; domainId?: number }) {
  const { data, isLoading, isError, error } = useUserContacts(domainId);
  const { saveMutation, deleteMutation } = useUserContactMutations(domainId);
  const [contacts, setContacts] = useState<Record<ContactType, ContactDraft>>(createInitialContacts);
  const [message, setMessage] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<ContactType>("owner");
  const savingType = saveMutation.isPending
    ? (saveMutation.variables?.contactType ?? null)
    : deleteMutation.isPending
      ? (deleteMutation.variables?.contactType ?? null)
      : null;

  useEffect(() => {
    if (data) {
      setContacts(data);
    }
  }, [data]);

  function updateContact<K extends keyof ContactDraft>(type: ContactType, field: K, value: ContactDraft[K]) {
    setContacts((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  }

  async function handleSave(type: ContactType) {
    setMessage(null);
    try {
      await saveMutation.mutateAsync(contacts[type]);
      setMessage(`${CONTACT_TYPE_LABELS[type]} da duoc luu.`);
    } catch (err) {
      setMessage(getUserContactsErrorMessage(err));
    }
  }

  async function handleDelete(type: ContactType) {
    const current = contacts[type];
    if (!current.id) {
      setContacts((prev) => ({
        ...prev,
        [type]: createEmptyContactDraft(type, type === "owner" ? prev[type].contactMode : "personal"),
      }));
      return;
    }

    setMessage(null);
    try {
      await deleteMutation.mutateAsync({ id: current.id, contactType: type });
      setMessage(`${CONTACT_TYPE_LABELS[type]} da duoc xoa.`);
    } catch (err) {
      setMessage(getUserContactsErrorMessage(err));
    }
  }

  if (isLoading) {
    return (
      <div className={embedded ? "space-y-4" : "space-y-4 px-4 py-6 sm:px-6"}>
        {!embedded ? <div className="h-8 w-56 animate-pulse rounded bg-zinc-200" /> : null}
        <div className="h-12 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100" />
        <div className="h-80 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={embedded ? "px-4 py-6" : "mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8"}>
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {getUserContactsErrorMessage(error)}
        </p>
      </div>
    );
  }

  return (
    <div className={embedded ? "space-y-4" : "mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8"}>
      {!embedded ? (
        <div className="mb-6 flex flex-col gap-3">
          <h1 className="text-2xl font-semibold text-zinc-900">Chủ thể & Contact</h1>
          <p className="max-w-3xl text-sm leading-6 text-zinc-600">
            Mỗi contact thuộc về tài khoản hiện tại. Chủ thể có thể là công ty hoặc cá nhân;
            technical, management và billing luôn là cá nhân.
          </p>
          {message ? (
            <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">
              {message}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-2">
          {CONTACT_TYPE_ORDER.map((type) => {
            const isActive = activeType === type;
            const hasData = Boolean(contacts[type].id);
            return (
              <button
                key={type}
                type="button"
                onClick={() => setActiveType(type)}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-white text-teal-700 shadow-sm ring-1 ring-teal-200"
                    : "text-zinc-600 hover:bg-white hover:text-zinc-900"
                }`}
              >
                <span>{CONTACT_TYPE_LABELS[type]}</span>
                <span className={`h-2.5 w-2.5 rounded-full ${hasData ? "bg-emerald-500" : "bg-zinc-300"}`} />
              </button>
            );
          })}
        </div>

        {message ? (
          <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">
            {message}
          </div>
        ) : null}

        <ContactSection
          type={activeType}
          draft={contacts[activeType]}
          saving={savingType === activeType}
          onChange={(field, value) => updateContact(activeType, field, value)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}

export function UserContactsTabs({ domainId }: { domainId?: number }) {
  return (
    <FeatureErrorBoundary featureName="contact theo domain">
      <UserContactsPanel embedded domainId={domainId} />
    </FeatureErrorBoundary>
  );
}

export function UserContactsManager() {
  return (
    <FeatureErrorBoundary featureName="contact">
      <UserContactsPanel />
    </FeatureErrorBoundary>
  );
}
