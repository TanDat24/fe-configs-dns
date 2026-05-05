import type { ReactNode } from "react";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  children?: ReactNode;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Xac nhan",
  cancelLabel = "Huy",
  loading = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
          <button
            type="button"
            aria-label="Dong"
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100"
            onClick={onCancel}
          >
            ✕
          </button>
        </div>
        {description ? (
          <p className="mt-2 text-sm text-zinc-600">{description}</p>
        ) : null}
        {children ? <div className="mt-3">{children}</div> : null}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Dang xu ly..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
