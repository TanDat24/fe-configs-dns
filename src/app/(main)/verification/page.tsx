 "use client";

import Link from "next/link";

export default function VerificationPage() {
  return (
    <main className="w-full py-4 ">
      <h1 className="text-xl font-semibold text-zinc-900">Xác minh (KYC)</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Quy trình xử lý: tải lên - chờ xử lý - đánh giá - phê duyệt/từ chối - lý do.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="font-medium">Xác minh của tôi</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Khách hàng cập nhật thông tin định danh và theo dõi trạng thái xử lý.
          </p>
          <Link href="/profile/cccd" className="mt-3 inline-block rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800">
            Đi tới Upload CCCD
          </Link>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="font-medium">Hàng chờ KYC (nhân viên/quản trị)</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Danh sách cho đánh giá/phê duyệt của bộ phận Compliance (sẽ tách màn hình riêng ở phase tiếp theo).
          </p>
        </section>
      </div>
    </main>
  );
}
