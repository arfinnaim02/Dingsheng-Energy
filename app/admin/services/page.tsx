import Link from "next/link";

import { PortalShell } from "@/components/PortalShell";
import { getServices } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function AdminServices() {
  const services = await getServices({ activeOnly: false });
  return <PortalShell admin title="Service Management"><div className="card p-6"><div className="flex flex-wrap justify-between gap-4"><div><div className="eyebrow">Engineering Content</div><h2 className="mt-2 text-xl font-black">Services</h2><p className="mt-1 text-sm text-[#71838b]">Manage service summaries, delivery scopes, process steps and imagery.</p></div><Link href="/admin/services/new" className="btn btn-primary">+ Add Service</Link></div><div className="table-wrap mt-6"><table><thead><tr><th>Service</th><th>Scope Items</th><th>Featured</th><th>Status</th><th>Action</th></tr></thead><tbody>{services.map((service)=><tr key={service.slug}><td><div className="font-black">{service.name}</div><div className="mt-1 text-[11px] text-[#7b8d94]">/{service.slug}</div></td><td>{service.scope.length}</td><td>{service.featured?"Yes":"No"}</td><td><span className={`status ${service.active===false?"!bg-[#f4e8e8] !text-[#9b4b4b]":""}`}>{service.active===false?"Hidden":"Active"}</span></td><td><Link href={`/admin/services/${service.slug}`} className="text-xs font-black text-[#0a9c63]">Edit →</Link></td></tr>)}</tbody></table></div></div></PortalShell>;
}
