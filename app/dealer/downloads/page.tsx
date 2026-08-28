import { PortalShell } from "@/components/PortalShell";
import { requireDealer } from "@/lib/dealerAuth";
export default async function DealerDownloads(){
  await requireDealer();return <PortalShell title="Dealer Downloads"><div className="grid gap-4">{["Commercial Product Catalogue","Dealer Datasheets","Quotation Documents","Order Documents","Technical Manuals"].map(x=><div className="card p-6 flex items-center justify-between gap-4" key={x}><div><strong>{x}</strong><p className="mt-1 text-xs text-[#71838b]">Access controlled by dealer permissions.</p></div><button className="btn btn-secondary">Open</button></div>)}</div></PortalShell>}
