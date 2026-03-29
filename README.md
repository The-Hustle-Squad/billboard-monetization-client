# VacantSlot Client

Vendor dashboard for **VacantSlot**—rule-based dynamic discounting for time-based billboard inventory. Built with **Next.js**, **React**, **Tailwind CSS**, and **Axios** against the VacantSlot REST API.

**Production:** [https://billboard-monetization-client.vercel.app/](https://billboard-monetization-client.vercel.app/)

---

## API documentation

The UI calls the same backend documented for integrations. Use these when aligning requests, responses, or error messages with the server.

| Resource | Location |
|----------|----------|
| **Human-readable reference** (payloads, errors, flows) | In the API repository: `docs/API.md` |
| **OpenAPI UI** | [https://billboard-monetization.onrender.com/docs](https://billboard-monetization.onrender.com/docs) |
| **OpenAPI JSON** (codegen, Postman, Insomnia) | [https://billboard-monetization.onrender.com/docs-json](https://billboard-monetization.onrender.com/docs-json) |

- REST routes use the global prefix **`/api/v1`** (unless the API is configured with a different `API_PREFIX`).
- Swagger is served at **`/docs`** and **`/docs-json`** on the API host (not under `API_PREFIX`).
- **Authentication:** the client sends `x-api-key` with the vendor key on authenticated requests. After **`POST /api/v1/vendors`**, the returned key is stored in **`localStorage`** (`vendor_api_key`) for subsequent calls. Treat that key like a secret on shared devices.

When the API changes request or response shapes, update shared types in **`lib/types.ts`** and **`lib/api.ts`** so the dashboard stays in sync with Swagger and **`docs/API.md`**.

---

## Prerequisites

- **Node.js** 18 or newer (LTS recommended)
- **pnpm** (package manager for this repo; see `pnpm-lock.yaml`)

---

## Configuration

1. Create **`.env.local`** (recommended for Next.js) or **`.env`** in the project root.
2. Set the API origin the browser will call.

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | **Required.** API origin, e.g. `https://billboard-monetization.onrender.com`, **or** the full prefix including `/api/v1`. Trailing slashes are ignored. The client resolves requests under `/api/v1`. |

**Guidelines:** never commit `.env`, `.env.local`, or real API keys. For production (e.g. Vercel), set `NEXT_PUBLIC_API_URL` in the host’s environment/secret UI.

---

## Project setup

```bash
pnpm install
```

Ensure the API is reachable at the URL you configure; the dashboard does not run the NestJS server.

---

## Build and run

```bash
# development (Next.js dev server)
pnpm run dev

# production build + serve
pnpm run build
pnpm run start
```

Open [http://localhost:3000](http://localhost:3000) during local development (default Next.js port).

---

## Repository layout (guidelines)

| Area | Role |
|------|------|
| `app/` | Next.js App Router: `layout.tsx`, `page.tsx`, global styles |
| `lib/api.ts` | Axios client, `NEXT_PUBLIC_API_URL` → `/api/v1`, `x-api-key` from `localStorage` |
| `lib/types.ts` | DTO-aligned TypeScript types for API responses and bodies |
| `lib/utils.ts` | Shared helpers |
| `components/dashboard/` | Vendor flows: overview, slots, sync, slot detail, pricing rules |
| `components/auth/` | Vendor registration (API key onboarding) |
| `components/ui/` | Reusable UI (Radix-based primitives, forms, charts) |

**Boundaries:** keep HTTP and env wiring in **`lib/api.ts`**. Feature components should call exported API helpers and handle UI state; avoid duplicating base URLs or header logic outside the client module.

**Errors:** the API returns stable `message` strings—surface them in toasts or inline copy where appropriate.

---

## Code quality

```bash
pnpm run lint
```

Run lint before opening a PR or merging; fix new issues in files you touch.

---

## License

UNLICENSED (private).
