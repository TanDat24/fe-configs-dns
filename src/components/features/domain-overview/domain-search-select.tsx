"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { DomainOption } from "@/lib/api/domain";
import { cn } from "@/lib/utils";

type DomainSearchSelectProps = {
  domains: DomainOption[];
  value: string;
  onChange: (slug: string) => void;
  disabled?: boolean;
  className?: string;
};

export function DomainSearchSelect({
  domains,
  value,
  onChange,
  disabled = false,
  className,
}: DomainSearchSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => domains.find((d) => d.slug === value) ?? domains[0] ?? null,
    [domains, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return domains;
    return domains.filter(
      (d) =>
        d.domain.toLowerCase().includes(q) ||
        d.slug.toLowerCase().includes(q),
    );
  }, [domains, query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(timer);
    }
    setQuery("");
  }, [open]);

  if (domains.length === 0) {
    return null;
  }

  if (domains.length === 1) {
    return (
      <span
        className={cn(
          "text-sm font-medium text-zinc-900",
          className,
        )}
        title={domains[0].domain}
      >
        {domains[0].domain}
      </span>
    );
  }

  function pick(slug: string) {
    onChange(slug);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={rootRef} className={cn("relative min-w-[12rem] max-w-full", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-9 w-full min-w-[12rem] max-w-xs items-center justify-between gap-2 rounded-md border border-zinc-300 bg-white px-3 text-left text-sm text-zinc-900 transition",
          "hover:border-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span className="truncate" title={selected?.domain}>
          {selected?.domain ?? "Chọn tên miền"}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={cn("h-4 w-4 shrink-0 text-zinc-400 transition", open && "rotate-180")}
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open ? (
        <div
          className="absolute left-0 top-[calc(100%+4px)] z-50 w-full min-w-[16rem] max-w-sm overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg"
        >
          <div className="border-b border-zinc-100 p-2">
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setOpen(false);
                  setQuery("");
                }
                if (e.key === "Enter" && filtered[0]) {
                  e.preventDefault();
                  pick(filtered[0].slug);
                }
              }}
              placeholder="Lọc tên miền..."
              className="h-8 w-full rounded-md border border-zinc-200 px-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
              aria-label="Lọc tên miền"
            />
          </div>

          <ul
            id={listId}
            role="listbox"
            className="max-h-60 overflow-y-auto py-1"
            aria-label="Danh sách tên miền"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-zinc-500">Không tìm thấy tên miền.</li>
            ) : (
              filtered.map((d) => {
                const isSelected = d.slug === value;
                return (
                  <li key={d.id} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => pick(d.slug)}
                      className={cn(
                        "flex w-full items-center px-3 py-2 text-left text-sm transition",
                        isSelected
                          ? "bg-teal-50 font-medium text-teal-900"
                          : "text-zinc-800 hover:bg-zinc-50",
                      )}
                    >
                      <span className="truncate" title={d.domain}>
                        {d.domain}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          <div className="border-t border-zinc-100 px-3 py-1.5 text-xs text-zinc-500">
            {filtered.length}/{domains.length} tên miền
          </div>
        </div>
      ) : null}
    </div>
  );
}
