# SYSTEM-WIDE AUDIT REPORT

Tai lieu nay tong hop ket qua audit toan he thong (FE + BE WordPress + DB + van hanh), theo 8 nhom yeu cau.

Phan loai muc do:
- Critical: can xu ly ngay (bao mat/du lieu/production outage)
- High: rui ro cao, can fix trong sprint hien tai
- Medium: can fix de giam no ky thuat va su co
- Low: cai tien chat luong va van hanh

---

## 1) BUG DETECTION

### Critical
- **Lo du lieu nhay cam trong SQL dump**
  - Cac file SQL trong `db` chua thong tin PII va hash mat khau that.
  - Vi du: `db/nlbdpzvthosting_figsdnscom1.sql`, `db/wp_w366_user_info.sql`, `db/wp_w366_order_contact.sql`.
  - Tac dong: ro ri du lieu nguoi dung, vi pham compliance.

### High
- **OAuth flow thieu state/nonce verification dung nghia**
  - FE callback Google/Zalo xu ly `code` nhung state khong duoc rang buoc session chat che.
  - File: `fe-config-dns/src/app/api/auth/google/route.ts`, `.../google/callback/route.ts`, `.../zalo/*`.
  - Tac dong: rui ro CSRF dang nhap/fixation trong OAuth.

- **Zalo login tren BE chua xac minh identity token server-side**
  - `loginWithZalo` nhan `zaloId` tu client va dang nhap/tao user.
  - File: `be-config-dns/themes/dns/modules/auth/auth-graphql.php`.
  - Tac dong: co the gia mao danh tinh neu biet `zaloId`.

- **Google login tren BE chua check du claim (`aud`, `iss`, `azp`)**
  - File: `be-config-dns/themes/dns/modules/auth/auth-graphql.php`.
  - Tac dong: chap nhan token khong dung app client mong doi.

### Medium
- **Write payload truyen thang, validation con mong**
  - Nhieu route FE nhan JSON raw roi forward backend.
  - File: `fe-config-dns/src/app/api/customer-data/*`.
  - Tac dong: loi runtime/mass assignment/du lieu ban.

- **Rui ro partial update khi save overview**
  - FE save tung field theo vong lap, fail giua chung se de lai trang thai nua chung.
  - File: `fe-config-dns/src/lib/api/domain.ts`.

- **Permission logic write/read dang gan nhau**
  - `dns_graphql_can_write_domains()` dung gate read-level.
  - File: `be-config-dns/themes/dns/modules/domain-panel/domain-panel-relational.php`.
  - Tac dong: mo rong surface ghi du lieu hon muc ky vong.

### Low
- **Logout API co the bi trigger cross-site (forced logout)**
  - File: `fe-config-dns/src/app/api/auth/logout/route.ts`.

---

## 2) MISSING PARTS

### High
- **Thieu test tu dong cho flow quan trong**
  - Hien chua co unit/integration/e2e test ro rang cho FE/BE chinh.
  - Tac dong: regression de lot vao production.

- **Thieu CI quality gates cap repo**
  - Chua co workflow CI cho app FE/BE chinh.
  - Plugin test workflow khong bao phu he thong that.

### Medium
- **Thieu env contract day du**
  - FE README va env su dung thuc te chua dong bo 100%.
  - Can `.env.example` + runtime validation fail-fast.

- **Validation schema chua dong nhat**
  - Chua co bo parser/schema (zod/io-ts) cho toan bo request body.

- **Thieu error-handling consistency**
  - Co route sanitize thong diep loi, co route tra loi upstream gan nhu nguyen ban.

### Low
- **Thieu runbook migration/deploy ro rang**
  - Co script SQL nhung huong dan va ten file schema co diem chua dong nhat.

---

## 3) CODE QUALITY & ARCHITECTURE

### High
- **Auth/business logic quan trong chua duoc contract test**
  - Rat de drift giua V1/V2 GraphQL alias va giua FE-BE.

### Medium
- **Mot so module backend qua day (doan dai, kho review)**
  - `domain-panel-relational.php` co resolver/mutation lon, readability thap.
  - Kho audit va kho sua an toan.

- **Code duplication API contracts**
  - V1 + V2 alias song song neu khong co test de dang lech hanh vi.

- **Tach layer FE da co, nhung validation/gateway chua dong bo**
  - `lib/api` + route handler + `lib/server` tot, nhung can harden schema va error map.

### Low
- **Naming/format chua dong deu o mot so SQL va module**
  - Anh huong kha nang bao tri dai han.

---

## 4) PERFORMANCE OPTIMIZATION

### Medium
- **N+1 query pattern tren backend domain payload**
  - List domain keo theo nhieu query con cho records/nameservers/childdns/forwards/services.
  - File: `be-config-dns/themes/dns/modules/domain-panel/domain-panel-relational.php`.

- **Template list dang query theo tung template**
  - Co the gom query mot lan roi group.

- **`limit/offset` FE route chua clamp chat**
  - Co the bi request lon gay load DB.

### Low
- **Rate limit dang in-memory (Map)**
  - File: `fe-config-dns/src/lib/server/request-security.ts`.
  - Khong hieu qua khi scale nhieu instance/restart.

- **Co the trung lap viewer fetch tren nhieu surface**
  - Header va cac hook co the goi lap lai API khong can thiet.

---

## 5) SECURITY REVIEW

### Critical
- **PII + hash password trong repo SQL dumps**
  - Can coi la su co bao mat.
  - Hanh dong ngay: rotate secret/password, scrub lich su, danh gia impact.

### High
- **OAuth CSRF/state chua vung**
  - Can state signed + nonce luu server-side + verify callback.

- **Google/Zalo auth verification BE chua day du**
  - Bat buoc verify issuer/audience/expiry + token introspection dung chuan.

- **CCCD upload nhay cam**
  - MIME trust client + luu o uploads cong khai.
  - File: `be-config-dns/themes/dns/modules/cccd/cccd-graphql.php`.
  - Can private storage + content sniffing + signed URL/time-limited access.

- **Du lieu mat khau legacy/predictable**
  - Script co mat khau default de doan (`MD5('Domain@123')`).
  - File: `db/link_domain_users.sql`.

### Medium
- **GraphQL write gate can tach ro capability**
  - Tang muc check cho mutation nhay cam.

- **Account/domain enumeration vectors**
  - Mot so query co the lo ton tai account/domain mapping.

### Low
- **Middleware bypass theo User-Agent crawler**
  - Co the bi spoof neu khong co lop bao ve bo sung.

---

## 6) BEST PRACTICES & IMPROVEMENTS

### High-priority recommendations
- Them validation schema dong bo:
  - FE route handler: `zod` cho body/query.
  - BE service: validate type/range/json syntax truoc write.
- Chuan hoa error model:
  - `code`, `message`, `requestId`, map loi nhat quan.
- Bo sung permission policy ro rang:
  - Tách read/write capability.
  - Object-level ACL bat buoc cho domain/order.

### Medium-priority recommendations
- Refactor backend module lon:
  - Tach resolver -> service -> repository theo domain nho hon.
- Add structured logging:
  - Co correlation id xuyen FE->BE.
- Add contract docs:
  - OpenAPI/GraphQL examples + changelog V1/V2.

### Code pattern goi y (ngan)
```ts
const BodySchema = z.object({
  order_id: z.number().int().positive(),
  title: z.string().max(255).optional(),
  total: z.number().nonnegative().optional(),
});
```

---

## 7) DEVOPS & DEPLOYMENT

### High
- **Chua co CI/CD repo-level cho app chinh**
  - Can pipeline lint/typecheck/test/build + gate merge.
- **Chua co deploy promotion model**
  - Can dev/staging/prod + rollback runbook.
- **Chua co docker/runtime definition cho FE/BE app chinh**
  - Can mo ta cach dong goi va deploy lap lai duoc.

### Medium
- **Thieu health/readiness/metrics endpoint**
  - Can bo chi so RED + alert cho auth failure/upstream GraphQL error.
- **Dependency governance chua day du**
  - Them SCA/audit trong CI.

### Low
- **Readme van hanh chua day du**
  - Can bo sung setup env, migration order, release checklist.

---

## 8) TESTING

### High
- **Missing test coverage cho auth + permission + mutation**
  - Unit:
    - `api/client` retry/error map
    - parser/validator
  - Integration:
    - FE route handlers (`auth`, `domain`, `customer-data`)
    - BE GraphQL resolvers + authorization checks
  - E2E:
    - Login -> domain list -> save tab -> verify persisted
    - Customer data CRUD (`my-user-info`, `order_contact`, `order_item`)
    - OAuth callback hardening cases (state mismatch, nonce mismatch)

### Medium
- **Performance/security regression tests**
  - Test clamp `limit/offset`, rate-limit behavior, malformed payload rejection.

---

## PRIORITY ACTION PLAN (de xuat)

### 0-48h (Incident & hardening)
1. Go bo SQL dump nhay cam khoi repository; neu da lo thi scrub lich su Git va rotate toan bo thong tin bi anh huong (password, token, API key).
2. Tam thoi khoa hoac gioi han cac flow auth rui ro cao; bo sung xac minh server-side day du cho Zalo/Google (issuer, audience, expiry, signature) truoc khi cap token noi bo.
3. Bat buoc OAuth `state` + `nonce` co chu ky HMAC va rang buoc theo session cookie; callback phai tu choi state/nonce sai, het han, hoac bi replay.

### Tuan 1
1. Them zod validation cho toan bo FE route handlers.
2. Tighten GraphQL write permission + audit object ACL.
3. Clamp `limit/offset` + chuan hoa error response.

### Tuan 2
1. Thiet lap CI pipeline full cho FE/BE.
2. Bo sung test integration + e2e cho flow quan trong.
3. Refactor cac module backend lon co rui ro cao.

### Tuan 3+
1. Chuyen rate-limit sang shared store (Redis/Upstash).
2. Bo sung metrics/alerts/runbook production.
3. Toi uu query N+1 va indexing cho bang customer-data.

