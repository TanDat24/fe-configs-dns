 "use client";

import Link from "next/link";

export default function SecurityPage() {
  return (
    <main className="w-full py-4">
      <h1 className="text-xl font-semibold text-zinc-900">Bảo mật</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Bảo mật tài khoản, các phương thức 2FA, các phiên đăng nhập, lịch sử đăng nhập,
        chính sách bảo mật tên miền và cảnh báo.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="font-medium">Bảo mật tài khoản</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Quản lý 2FA, các phiên đăng nhập đang hoạt động và lịch sử đăng nhập theo vai trò/người dùng.
          </p>
          <ul className="mt-3 list-inside list-disc text-sm text-zinc-700">
            <li>Phương thức 2FA</li>
            <li>Thu hồi phiên đăng nhập</li>
            <li>Lịch sử đăng nhập</li>
          </ul>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="font-medium">Chính sách bảo mật tên miền</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Mặc định khóa tên miền (domain lock), các quy tắc cảnh báo,
            và các hành vi cập nhật/yêu cầu chuyển nhượng bất thường.
          </p>
          <Link href="/domains" className="mt-3 inline-block text-sm text-zinc-900 underline underline-offset-2">
            Mở chi tiết tên miền để quản lý DNSSEC/khóa Registrar
          </Link>
        </section>
      </div>
    </main>
  );
}
