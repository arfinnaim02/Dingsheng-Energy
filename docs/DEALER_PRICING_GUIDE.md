# Dealer Pricing Guide — Local v3

## What is active now

The local project now has a working protected dealer-pricing workflow backed by `data/catalog.json`.

- Public product pages never display dealer amounts.
- Admin can create/manage dealer price groups from `/admin/pricing`.
- Each product can have a separate approved price for Standard, Tier A, Tier B, VIP/Custom, or additional groups.
- Each price record supports currency, unit price, minimum quantity, lead-time text, and a protected commercial note.
- Product-specific SKU, unit label and dealer commercial details can be edited in `/admin/products/[slug]`.
- The local dealer portal uses the price group selected at Admin → Pricing.
- Dealer product cards and dealer product detail pages show the configured price.
- Products with no configured price explicitly show `Price not configured` and can continue through RFQ.
- Direct-purchase products with configured prices can be added to the local cart.
- Cart quantity, unit price, subtotal and total are calculated from the latest admin-managed price.
- Checkout performs a local test calculation and intentionally does not create a production payment/order record yet.
- RFQ Builder stores selected products locally for testing.

## No fabricated commercial prices

The project intentionally ships with blank price amounts because no client-approved price list was supplied. Enter real commercial values from the admin panel before testing numeric totals.

## Quick test

1. Start the app and sign in to `/admin-login`.
2. Open `/admin/pricing`.
3. Keep `Standard` as the local dealer price group.
4. Find a product whose commercial mode is `Dealer Purchase` or `Dealer Purchase + RFQ`.
5. Enter a real/test-authorized unit price, currency, MOQ and lead time, then Save Pricing.
6. Open `/dealer/login` and sign in through the local test form.
7. Open `/dealer/products` and the product detail page.
8. The protected dealer price will now be visible.
9. Add it to Cart and verify subtotal/total calculations.

## Production migration

The Prisma schema already contains `PriceGroup` and `ProductPrice`. In production, dealer authentication will resolve the authenticated dealer's assigned `PriceGroup`, and prices will be queried server-side from MySQL. Public requests must never receive protected dealer prices.

## Local pricing protection

Dealer pricing routes now require a signed HTTP-only local dealer session. Directly opening `/dealer/products`, `/dealer/cart`, `/dealer/rfq`, or other protected dealer pages without the session redirects to `/dealer/login`.

Local test login:
- Email: any valid email address
- Password: `123456` by default, configurable through `DEALER_DEMO_PASSWORD`

Only the currently assigned local dealer price group is serialized to dealer-side client components. Other price-group amounts are not sent to that dealer view. Public catalogue queries strip dealer prices, dealer-only documents, and dealer commercial details before data is passed to public client components.
