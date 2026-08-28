import {
  DealerContactForm,
} from "@/components/dealer/DealerContactForm";

import {
  PortalShell,
} from "@/components/PortalShell";

import {
  requireDealer,
} from "@/lib/dealerAuth";

export const dynamic =
  "force-dynamic";

export default async function DealerContactPage() {
  const dealer =
    await requireDealer();

  return (
    <PortalShell
      title="Contact Support"
    >
      <DealerContactForm
        dealer={{
          companyName:
            dealer.companyName,

          contactName:
            dealer.contactName,

          email:
            dealer.user.email,

          phone:
            dealer.phone,

          country:
            dealer.country,
        }}
      />
    </PortalShell>
  );
}