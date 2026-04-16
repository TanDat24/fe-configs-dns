# FE Config DNS

Ung dung frontend quan ly DNS cho he thong Config DNS, xay dung bang Next.js App Router.

## Chuc nang chinh

- Dang nhap/Dang xuat voi WordPress GraphQL JWT.
- Quan ly thong tin tong quan ten mien.
- Quan ly DNS records, Name Server, Child DNS, Email Forwarding.
- Quan ly goi bao mat, 2FA va doi mat khau.
- Flow quen mat khau.

## Kien truc du an

- `src/app`: App Router pages + route handlers (`/api/*`).
- `src/components`: UI va feature components.
- `src/hooks`: custom hooks cho state/flow.
- `src/services`: service layer nghiep vu.
- `src/lib/api`: client-side API wrapper.
- `src/lib/server`: server-side connectors/security/validation/observability.
- `src/lib/contracts`: DTO contracts dung chung giua client va routes.

## Bien moi truong

Tao file `.env.local`:

```bash
WP_GRAPHQL_URL=https://configsdns.com/graphql/
INTERNAL_API_ALLOWED_ORIGINS=https://your-fe-domain.com
```

Tuy chon observability:

```bash
# Datadog
DD_API_KEY=
DD_SITE=datadoghq.com

# Better Stack Logtail
LOGTAIL_SOURCE_TOKEN=

# Sentry
SENTRY_DSN=
```

## Chay local

```bash
npm install
npm run dev
```

Mo `http://localhost:3000`.

## Scripts

```bash
npm run dev               # local development
npm run build             # production build
npm run start             # start production server
npm run lint              # eslint
npm run test              # all unit/integration with coverage
npm run test:unit         # unit tests
npm run test:integration  # integration tests for route handlers
npm run test:e2e          # playwright e2e
```

## Testing strategy

- Unit:
  - `src/lib/api/client.test.ts`
  - `src/lib/domain-parser.test.ts`
- Integration:
  - `tests/integration/api-auth-login.test.ts`
  - `tests/integration/api-auth-forgot-password.test.ts`
  - `tests/integration/api-domain-save-tab.test.ts`
- E2E:
  - `tests/e2e/auth-domain-flow.spec.ts`

## Observability

- API routes da co `requestId` va structured error logs.
- Co the day log/exception den Datadog, Logtail hoac Sentry qua env.
- Module: `src/lib/server/observability.ts`.

## Tai lieu them

- Tong quan nghiep vu va roadmap: `FE_SYSTEM_OVERVIEW.md`.
