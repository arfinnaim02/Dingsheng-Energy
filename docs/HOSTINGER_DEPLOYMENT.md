# Hostinger Deployment Plan (after local approval)

1. Create production and staging MySQL databases in hPanel.
2. Create `staging.dingsheng-energy.com` and deploy the repository as a Next.js web app.
3. Add environment variables in the Hostinger web app configuration; never commit secrets.
4. Run Prisma generation/migrations only after the production schema is reviewed.
5. Configure SMTP / transactional email.
6. Configure protected storage strategy for dealer documents and quotation files.
7. Integrate the client's selected payment gateway and settlement currency.
8. Test dealer permissions, price protection, RFQ workflow, orders and audit logs on staging.
9. Configure production domain, SSL, backups, monitoring and analytics.
10. Launch only after client acceptance testing.
