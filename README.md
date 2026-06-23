# FINKO Business Advisor

FINKO Business Advisor is a Next.js application for preliminary assessment of business ideas, financial model viability, risks, bank/leasing readiness and exportable advisory reports.

## Tech Stack

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Zod
- ExcelJS
- pdf-lib
- OpenAI structured extraction with deterministic fallback

## Database

The project is PostgreSQL-only. SQLite is not used for runtime, development setup, tests or production fallback.

Use a PostgreSQL-compatible provider such as Supabase, Neon, Railway, Render or managed PostgreSQL.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

Local setup:

```bash
cp .env.example .env
npm ci
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev
```

Production deployment commands:

```bash
npx prisma generate
npx prisma migrate deploy
```

Important: `.npmrc` has `ignore-scripts=true`, so `npm ci` intentionally does not run package postinstall scripts. Production CI/CD must call `npx prisma generate` explicitly before `npm run build`/`npm run start`, and must run `npx prisma migrate deploy` against the production PostgreSQL database.

Useful Prisma commands:

```bash
npx prisma generate
npx prisma migrate dev
npx prisma migrate deploy
```

## Demo Access

Ordinary demo users open `/advisor` or `/advisor/new` directly. The app creates a signed user demo session automatically and does not ask for a password.

Admin routes remain protected:

```txt
/admin/*
/demo-login?admin=1
```

Set a strong `DEMO_SESSION_SECRET` in every non-local environment. Do not use the admin token for ordinary user demo sessions.

## Exchange Rate

USD/UZS conversion uses only the official Central Bank of the Republic of Uzbekistan endpoint:

```txt
https://cbu.uz/ru/arkhiv-kursov-valyut/json/USD/{YYYY-MM-DD}/
```

Reports store a reproducible rate snapshot with requested date, CBU rate date, rate, source URL and fetch timestamp. Existing report snapshots are reused instead of silently recalculating old reports.

## Main Flow

1. Open `/advisor/new`.
2. Enter the business type, idea, region and required project details.
3. Complete the structured interview.
4. Calculate the preliminary assessment after critical fields are present.
5. Review the report.
6. Download PDF or Excel.

## Market Data

Market data must be source-backed. AI must not invent company counts, revenue, import/export values, exchange rates or official statistics.

Supported official/source-backed inputs:

- server-side fetch from verified public sources;
- admin uploads for curated CSV, XLSX or JSON datasets.

Recommended upload columns:

```csv
sector,businessType,indicator,year,region,value,unit,currency,hsCode,activityCode,tradeType,country,productCategory,valueUsd,volume,sourceName,sourceUrl,sourceType,lastUpdated
```

## Report Export

Reports can be exported to PDF and Excel. The PDF exporter embeds Unicode fonts through this priority chain: `public/fonts/NotoSans-Regular.ttf` and `public/fonts/NotoSans-Bold.ttf` when supplied by the deployment, common Linux system fonts such as DejaVu/Liberation/Noto, then the packaged `@fontsource/noto-sans` fallback, and finally a network fallback used only when allowed. For production, either provide Unicode fonts in `public/fonts` during deployment or use an image that contains Cyrillic/Uzbek-capable system fonts. Do not rely on PDF core fonts for Russian or Uzbek output.

## Checks

```bash
npm run typecheck
npm test
npm run build
```

`typecheck` and `build` require a generated Prisma client.

## Security Notes

Do not commit or ship:

- `.env` or `.env.*` except `.env.example`;
- local database files or dumps;
- `.next/`;
- `node_modules/`;
- API keys, auth headers, raw prompts, raw financial data or uploaded confidential files.

Production should use:

- strong `DEMO_SESSION_SECRET`;
- protected admin token;
- managed PostgreSQL with TLS;
- `npx prisma migrate deploy`;
- shared storage for rate limits if deployed across multiple instances.

The report is a preliminary advisory assessment, not a guarantee of profit, investment, financing, loan approval or leasing approval.
