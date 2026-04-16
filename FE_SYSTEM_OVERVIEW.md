# FE Config DNS - Tong Quan He Thong

## 1) Muc tieu du an

`fe-config-dns` la ung dung `Next.js App Router` dung de:
- Dang nhap vao he thong quan ly DNS.
- Xem/sua thong tin tong quan ten mien.
- Quan ly DNS records, name servers, child DNS, email forwarding.
- Quan ly cac goi bao mat va 2FA cho tung ten mien.
- Thuc hien doi mat khau, quen mat khau cho tai khoan dang nhap.

Backend du lieu hien tai la WordPress GraphQL (qua `WP_GRAPHQL_URL`), FE dong vai tro BFF thong qua cac route `src/app/api/*`.

---

## 2) Kien truc tong the

### 2.1 Cong nghe chinh
- `Next.js 16` + `React 19` + `TypeScript`
- Styling bang Tailwind (v4 stack)
- `react-gauge-component` cho hieu thi muc do bao ve

### 2.2 Mo hinh luong request
1. UI component goi ham trong `src/lib/api/*`.
2. Ham `lib/api` goi route noi bo `/api/...` (Next Route Handler).
3. Route Handler doc cookie `wp_graphql_auth`, kiem tra auth.
4. Route Handler goi WordPress GraphQL qua `src/lib/server/*`.
5. Chuan hoa response tra ve UI.

### 2.3 Auth model
- Cookie auth: `wp_graphql_auth` (`httpOnly`, `sameSite=lax`, `secure` theo moi truong).
- Middleware (`src/middleware.ts`) bao ve cac route app (tru `logout`, `forgot-password`, static, `api`).
- Neu khong co cookie -> redirect ve `/logout` (man hinh dang nhap).

---

## 3) Cau truc thu muc quan trong

## `src/app`
- `layout.tsx`: root layout, metadata toan app.
- `(main)/layout.tsx`: layout sau khi da vao app (AppShell).
- `(main)/page.tsx`: trang chinh, render `HomeView`.
- `logout/page.tsx`: trang dang nhap.
- `forgot-password/page.tsx`: trang quen mat khau.
- `api/auth/*`: API auth noi bo (login/logout/viewer/forgot/change-password).
- `api/domain/*`: API domain noi bo (list/detail/templates/security-packages/save-tab).

## `src/components`
- `features/auth/*`: man hinh dang nhap, quen mat khau.
- `features/domain-overview/*`: dashboard tong quan, tab DNS, tab security, gauge.
- `layout/*`: shell/header/footer.
- `ui/*`: component dung chung.

## `src/lib`
- `api/client.ts`: wrapper fetch + ApiError + ngrok bypass header.
- `api/auth.ts`, `api/domain.ts`: client API cho UI.
- `server/wp-*.ts`: server-side connector den WordPress GraphQL.
- `auth-cookie.ts`: cookie name + cookie options.
- `domain-types.ts`: type domain/DNS/security.

## Files khac
- `.env.local`: `WP_GRAPHQL_URL`
- `middleware.ts`: route protection.
- `package.json`: scripts/dependencies.

---

## 4) Chuc nang FE hien tai

### 4.1 Dang nhap/Dang xuat
- Dang nhap tai `/logout` (login form).
- Goi `POST /api/auth/login`, sau do set cookie `wp_graphql_auth`.
- Dang xuat qua `POST /api/auth/logout` (clear cookie).

### 4.2 Quen mat khau
- Form tai `/forgot-password`.
- Goi `POST /api/auth/forgot-password`.
- BE/WordPress xu ly gui email reset.

### 4.3 Xac dinh nguoi dung hien tai
- `GET /api/auth/viewer` de lay thong tin `viewer` tu WP GraphQL.

### 4.4 Quan ly domain
- Tai danh sach domain: `GET /api/domain/list`.
- Tai chi tiet 1 domain theo `slug`: `GET /api/domain/[slug]`.
- Chon domain tren giao dien va hien thi thong tin theo tab.

### 4.5 Quan ly DNS
- Tai template DNS: `GET /api/domain/templates`.
- Chinh sua DNS records/name servers/child DNS/email forwarding.
- Luu du lieu qua `POST /api/domain/save-tab`.

### 4.6 Quan ly bao mat domain
- Tai danh sach goi bao mat: `GET /api/domain/security-packages`.
- Bat/tat service bao mat, bat/tat 2FA.
- Doi mat khau tai khoan qua `POST /api/auth/change-password`.

---

## 5) Danh sach API noi bo FE

## Auth APIs
- `POST /api/auth/login`
  - Input: `username`, `password`
  - Output: `authToken` + set cookie
- `POST /api/auth/logout`
  - Output: `{ ok: true }`, clear cookie
- `GET /api/auth/viewer`
  - Output: `{ viewer }`
- `POST /api/auth/forgot-password`
  - Input: `email`
  - Output: `message`
- `POST /api/auth/change-password`
  - Input: `oldPassword`, `newPassword`, `confirmPassword`
  - Output: `message`

## Domain APIs
- `GET /api/domain/list`
  - Output: `items[]` (id, domain, slug)
- `GET /api/domain/[slug]`
  - Output: `item` (DomainConfig)
- `GET /api/domain/templates`
  - Output: `items[]` (DNS templates)
- `GET /api/domain/security-packages`
  - Output: `items[]` (goi bao mat)
- `POST /api/domain/save-tab`
  - Input: `domainId`, `field`, `payload`
  - Output: `message`

---

## 6) Tich hop backend hien tai

- Bien moi truong bat buoc: `WP_GRAPHQL_URL` (vi du: `https://configsdns.com/graphql/`).
- Toan bo nghiep vu domain/auth hien tai di qua WordPress GraphQL:
  - login mutation
  - viewer query
  - forgot password mutation
  - change password mutation
  - domain queries/mutations

Luu y: FE hien chua goi truc tiep iNET API, ma dang su dung du lieu/logic trung gian tu WordPress.

---

## 7) Diem can nang cap (uu tien)

### P0 - Bao mat va on dinh
- Them rate-limit cho API auth (`login`, `forgot-password`, `change-password`).
- Them CSRF protection cho cac POST route noi bo (double-submit token hoac origin strict check).
- Chuan hoa logging + request id de trace loi de dang.
- Tranh expose qua nhieu thong diep loi backend ra UI (sanitize error mapping).

### P1 - Kien truc va maintainability
- Tach `domain-overview-view.tsx` thanh hooks + feature modules (dang gom nhieu state/logic).
- Chuan hoa schema validation voi `zod` cho tat ca request body/response parse.
- Them typed API contracts chung (`DTO`) de tranh drift giua UI va route handler.
- Tao service layer ro hon cho domain/security thay vi goi truc tiep trong component.

### P1 - UX/Product
- Them loading skeleton theo tung panel thay vi thong bao text don gian.
- Them optimistic update co rollback khi save that bai.
- Them co che retry va thong bao offline/network robust hon.

### P2 - Chat luong va van hanh
- Bo sung test:
  - Unit test cho `lib/api/client.ts`, parser domain.
  - Integration test cho route handlers `api/auth/*`, `api/domain/*`.
  - E2E cho login -> xem domain -> sua DNS -> save.
- Bo sung observability (Sentry/Logtail/Datadog) cho FE API routes.
- Viet lai `README.md` theo nghiep vu du an (hien van la mau mac dinh Next.js).

### P2 - Tich hop iNET (neu can)
- Tao `INETClient` rieng (server-only) + mapping schema.
- Toggle provider (`wordpress` | `inet`) qua env.
- Co co che fallback/read-only neu iNET API loi.

---

## 8) De xuat lo trinh nang cap ngan han

1. Chuan hoa `README.md` + tai lieu API (1 ngay).
2. Them validation (`zod`) cho toan bo Route Handlers (1-2 ngay).
3. Tach `DomainOverviewView` thanh custom hooks/use-cases (2-3 ngay).
4. Them test cho auth + domain save (2-3 ngay).
5. Chuan bi lop provider de co the cam iNET API sau nay (2 ngay).

