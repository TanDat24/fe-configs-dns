 "use client";

export default function SupportTicketsPage() {
  return (
    <main className="w-full py-4">
      <h1 className="text-xl font-semibold text-zinc-900">Hỗ trợ / Vé</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Hàng đợi ticket cho các thay đổi về domain/contact/security và xử lý sự cố (incident handling).
      </p>

      <div className="mt-5 rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
        Chưa triển khai hệ thống ticket. Đề xuất tích hợp Linear/Jira/Zendesk hoặc module nội bộ ở phase 4.
      </div>
    </main>
  );
}
