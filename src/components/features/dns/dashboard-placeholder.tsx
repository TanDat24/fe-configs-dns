export function DnsDashboardPlaceholder() {
  return (
    <section
      aria-label="DNS"
      className="mt-8 rounded-lg border border-zinc-200 p-6 dark:border-zinc-800"
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Khu vực quản lý bản ghi DNS — thêm bảng, form và gọi API tại đây (
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">
          components/features/dns
        </code>
        ).
      </p>
    </section>
  );
}
