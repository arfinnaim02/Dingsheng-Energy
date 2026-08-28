# Dingsheng Energy Limited — Premium Local Build v2

A custom Next.js + TypeScript + Tailwind CSS application for Dingsheng Energy Limited, based on the approved UI direction and the supplied company / Product & Service documents.

## What changed in v2

This build is **not a static product/service prototype anymore**.

Products, product systems and services are loaded from:

`data/catalog.json`

The protected local Admin Control Center can:

- create products
- edit products
- delete products
- assign one product to multiple LPG product systems
- manage product groups / subcategories
- edit summaries and descriptions
- add / remove technical specifications
- manage standards and applications
- configure commercial mode (information / RFQ / dealer purchase / purchase + RFQ)
- toggle featured and public visibility
- upload product images locally
- manage public/dealer document URLs
- create, edit and delete services
- edit service scopes, delivery process and applications
- upload service images
- edit the four public product systems/categories

Changes are written to `data/catalog.json` and the public site reads that data dynamically. The original v2 seed is also retained as `data/catalog.seed.json` for recovery.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- local JSON persistence for the current local-development content-management phase
- MySQL + Prisma production schema prepared in `prisma/schema.prisma`

## Run locally

### Requirements

- Node.js 22 recommended
- npm

### 1. Extract the project

### 2. Open Command Prompt in the project folder

### 3. Install

```bash
npm install
```

### 4. Optional but recommended: create `.env.local`

Windows CMD:

```bat
copy .env.example .env.local
```

Default local admin password is:

```text
dingsheng-admin
```

Change `ADMIN_PASSWORD` in `.env.local` whenever you want.

### 5. Start

```bash
npm run dev
```

Open:

`http://localhost:3000`

## Admin Control Center

Open:

`http://localhost:3000/admin-login`

Default local password:

`dingsheng-admin`

After login:

- `/admin` — dashboard
- `/admin/products` — manage products
- `/admin/products/new` — add product
- `/admin/services` — manage services
- `/admin/services/new` — add service
- `/admin/categories` — manage the four LPG product systems

### Local image uploads

The product/service editor can upload JPG, PNG and WEBP files. Uploads are saved under:

- `public/uploads/products/`
- `public/uploads/services/`

PDF is also accepted by the upload API for the future document workflow.

> Local filesystem uploads are suitable for this local build. Before production launch, protected dealer documents and transactional files should be moved to the final production storage architecture.

## Public routes

- `/` — Home
- `/about` — About
- `/products` — Product catalogue
- `/products/lpg-filling-plant`
- `/products/lpg-transport-distribution`
- `/products/autogas-refueling-station`
- `/products/industrial-lpg-solutions`
- `/products/[category]/[product]` — reusable product detail
- `/services` — Services
- `/services/[service]` — reusable service detail
- `/lpg-trading`
- `/industries`
- `/resources`
- `/contact`

## Current catalogue seed

The seed catalogue contains 4 product systems, 50 product records and 7 service records.

Detailed specifications are included only where supported by the supplied client Product & Service material. Where the source named an item but did not provide detailed specifications, the product is included without fabricated values.

## Dealer portal

The dealer portal UI is retained. Real dealer account approval, protected dealer pricing, RFQ transactions, orders, payments and activity logging remain the next database phase. Public pages never display a fabricated dealer price.

## MySQL / Prisma migration

The production schema is prepared in:

`prisma/schema.prisma`

It includes:

- users / roles
- dealer profiles / statuses
- pricing groups
- many-to-many product/category assignments
- products, images, specifications, standards and applications
- product documents
- dealer prices
- services
- RFQs and quotations
- orders and payments
- dealer notes
- activity logs

When the Hostinger MySQL credentials are ready, the local JSON catalogue can be migrated into MySQL rather than manually re-entered.

## Recommended next implementation phases

1. Finish visual review using the local admin-managed content.
2. Map all client product images to catalogue items.
3. Create Hostinger staging deployment.
4. Connect MySQL + Prisma.
5. Replace local admin password with database-backed admin authentication + role permissions.
6. Build dealer application/approval.
7. Implement server-protected dealer price groups.
8. Connect RFQ / quotation lifecycle.
9. Connect orders, checkout and payment gateway.
10. Add SMTP notifications, protected documents, audit logs and reporting.

## Important production note

`data/catalog.json` is intentionally used for the local design/content phase so you can manage products/services without installing MySQL on your PC. It is **not the final production database**. The project already contains the MySQL/Prisma model for the later production migration.


## Dealer Pricing v3

Protected pricing is now functional in the local build. Open `/admin/pricing` to manage price groups and approved per-product prices. The dealer portal reads the selected local dealer price group, displays configured prices, calculates cart totals and supports the local RFQ/checkout test workflow. No price amounts are pre-filled because no client-approved price list was supplied. See `docs/DEALER_PRICING_GUIDE.md`.
