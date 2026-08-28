import { DealerManager } from "@/components/admin/DealerManager";
import { PortalShell } from "@/components/PortalShell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDealersPage() {
  const [dealers, priceGroups] = await Promise.all([
    prisma.dealerProfile.findMany({
      include: {
        user: {
          select: {
            email: true,
            role: true,
            emailVerified: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.priceGroup.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  const totals = {
    total: dealers.length,
    pending: dealers.filter(
      (dealer) => dealer.status === "PENDING",
    ).length,
    active: dealers.filter(
      (dealer) => dealer.status === "ACTIVE",
    ).length,
    suspended: dealers.filter(
      (dealer) => dealer.status === "SUSPENDED",
    ).length,
  };

  const serializedDealers = dealers.map(
    (dealer) => ({
      ...dealer,

      createdAt:
        dealer.createdAt.toISOString(),

      updatedAt:
        dealer.updatedAt.toISOString(),

      user: {
        email:
          dealer.user.email,

        role:
          dealer.user.role,

        emailVerified:
          dealer.user.emailVerified?.toISOString() ??
          null,
      },
    }),
  );

  return (
    <PortalShell admin title="Dealer Management">
      <div className="grid-4 mb-7">
        {[
          ["Total Dealers", totals.total],
          ["Pending Approval", totals.pending],
          ["Active Dealers", totals.active],
          ["Suspended", totals.suspended],
        ].map(([label, value]) => (
          <div className="card p-6" key={label}>
            <div className="text-xs font-black uppercase tracking-[.08em] text-[#71838b]">
              {label}
            </div>

            <div className="mt-2 text-3xl font-black text-[#0a9c63]">
              {value}
            </div>
          </div>
        ))}
      </div>

      <DealerManager
        dealers={serializedDealers}
        priceGroups={priceGroups}
      />
    </PortalShell>
  );
}