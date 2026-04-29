import Link from "next/link";

export default function ServicePolicyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <article className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Chinh sach dich vu</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Cap nhat lan cuoi: {new Date().toLocaleDateString("vi-VN")}
        </p>

        <section className="mt-6 space-y-3 text-sm leading-6 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-900">1. Muc dich thu thap thong tin</h2>
          <p>
            He thong co the thu thap va xu ly thong tin tai khoan tu nha cung cap dang nhap ben thu ba (Google, Zalo)
            de xac thuc danh tinh, tao hoac lien ket tai khoan va ho tro su dung dich vu quan ly ten mien.
          </p>
        </section>

        <section className="mt-5 space-y-3 text-sm leading-6 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-900">2. Pham vi thong tin xu ly</h2>
          <p>
            Cac thong tin co the bao gom: ten hien thi, dia chi email, anh dai dien va dinh danh tai khoan tu nha cung
            cap dang nhap ben thu ba.
          </p>
        </section>

        <section className="mt-5 space-y-3 text-sm leading-6 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-900">3. Luu tru va bao mat</h2>
          <p>
            Du lieu duoc luu tru tren he thong may chu cua chung toi va ap dung cac bien phap ky thuat phu hop de bao
            ve thong tin ca nhan khoi truy cap trai phep, mat mat hoac su dung sai muc dich.
          </p>
        </section>

        <section className="mt-5 space-y-3 text-sm leading-6 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-900">4. Quyen cua nguoi dung</h2>
          <p>
            Nguoi dung co quyen yeu cau cap nhat, chinh sua hoac xoa thong tin theo quy dinh phap luat hien hanh.
            Vui long lien he bo phan ho tro de duoc huong dan.
          </p>
        </section>

        <section className="mt-5 space-y-3 text-sm leading-6 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-900">5. Lien he ho tro</h2>
          <p>
            Neu ban co bat ky cau hoi nao ve chinh sach nay, vui long lien he qua email ho tro cua he thong.
          </p>
        </section>

        <div className="mt-8">
          <Link
            href="/logout"
            className="inline-flex h-10 items-center rounded-md border border-zinc-200 px-4 text-sm text-zinc-700 transition hover:bg-zinc-50"
          >
            Quay lai trang dang nhap
          </Link>
        </div>
      </article>
    </main>
  );
}

