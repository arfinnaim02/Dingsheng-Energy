# Admin Content Guide

## Login

Open `/admin-login`.

Default local password: `dingsheng-admin`.

For a private local password, copy `.env.example` to `.env.local` and change:

```env
ADMIN_PASSWORD="your-private-password"
ADMIN_SESSION_SECRET="a-long-random-secret"
```

## Products

Go to `/admin/products`.

The editor supports:

- product name and slug
- multi-category assignment
- a separate product group inside each assigned category
- primary/canonical category
- short and full descriptions
- technical specifications
- product standards/references
- applications
- related-product slugs
- image upload or image URL
- gallery URLs
- public and dealer-only document URLs
- commercial mode
- dealer-price protection flag
- featured-product flag
- active/hidden status

### Important technical-content rule

Do not invent specification values. If the supplied client material names an item but does not give technical values, leave its specification list empty until the client supplies verified data.

## Services

Go to `/admin/services`.

The service editor supports:

- name and slug
- summary and full description
- card and hero imagery
- scope of work
- delivery process
- applications
- featured status
- public/hidden status

## Product systems

Go to `/admin/categories`.

The four current systems are:

1. LPG Filling Plant
2. LPG Transport & Distribution
3. Autogas Refueling Station
4. Industrial LPG Solutions

You can update descriptions, imagery and product group labels.

## Local persistence

Changes are stored in `data/catalog.json`.

Back up this file before large content changes. It is the source for the local content-management phase.

## Production migration

Before launch, the catalogue will be migrated into MySQL using the model prepared in `prisma/schema.prisma`. The local JSON manager is designed to let the UI and content be finalized without forcing MySQL installation on the local Windows machine.
