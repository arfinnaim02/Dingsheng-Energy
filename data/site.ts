export const company = {
  name: "Dingsheng Energy Limited",
  shortName: "Dingsheng Energy",
  tagline: "Global LPG Trading · Engineering · Complete Energy Solutions",
  phone: "+86 131 4255 0592",
  email: "arefin@dingsheng-energy.com",
  website: "dingsheng-energy.com",
  address:
    "Unit 1405B, 14/F, The Belgian Bank Building, Nos. 721–725 Nathan Road, Mong Kok, Hong Kong",
};

export const nav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Products", href: "/products" },
  { label: "Services", href: "/services" },
  { label: "Resources", href: "/resources" },
  { label: "Contact", href: "/contact" },
];

export const coreValues = [
  ["Safety First", "Safety is prioritized across equipment, engineering and operations."],
  ["Integrity", "Professional, transparent and dependable business relationships."],
  ["Innovation", "Continuous improvement through engineering, technology and better processes."],
  ["Reliability", "Solutions designed for dependable long-term operation."],
  ["Customer Commitment", "Technical support and service centered on customer requirements."],
  ["Sustainability", "Responsible energy solutions with attention to safety and efficiency."],
] as const;

export const suppliers = [
  "REGO",
  "Fisher",
  "Rochester Gauges",
  "Corken",
  "Petroland",
  "Blackmer",
  "Rotarex",
  "SCG Thailand",
  "Mopeka",
  "Kosel",
  "Makeen Energy",
];

export type CommercialMode =
  | "information"
  | "rfq"
  | "dealer-purchase"
  | "dealer-purchase-rfq";

export type ProductSpecification = [label: string, value: string];
export type ManagedProductImage = {
  id?: string;
  url: string;
  cloudinaryPublicId: string | null;
  alt: string;
  position: number;
  uploadedNow?: boolean;
};

export type DealerPrice = {
  priceGroupSlug: string;
  currency: string;
  amount?: number;
  minimumQty?: number;
  leadTimeText?: string;
  note?: string;
};

export type PriceGroup = {
  slug: string;
  name: string;
  description?: string;
  active?: boolean;
};

export type DealerPortalSettings = {
  demoPriceGroupSlug: string;
  demoCompanyName: string;
  demoContactName: string;
};

export type Product = {
  slug: string;
  name: string;
  categorySlugs: string[];
  primaryCategorySlug: string;
  subcategory: string;
  categoryGroups?: Record<string, string>;
  eyebrow: string;
  summary: string;
  description?: string;
  image: string;
  gallery?: string[];
  specs: ProductSpecification[];
  standards?: string[];
  applications?: string[];
  commercialMode: CommercialMode;
  dealerPriceProtected: boolean;
  featured?: boolean;
  availability?: string;
  sku?: string;
  unitLabel?: string;
  dealerCommercialDetails?: string;
  dealerPrices?: DealerPrice[];
  publicDownloads?: string[];
  dealerDownloads?: string[];
  relatedProducts?: string[];
  active?: boolean;
};

export type ProductCategory = {
  slug: string;
  name: string;
  shortName?: string;
  summary: string;
  description: string;
  image: string;
  heroImage: string;
  groups: string[];
};

export type Service = {
  slug: string;
  name: string;
  shortName?: string;
  summary: string;
  description?: string;
  image: string;
  heroImage: string;
  scope: string[];
  process?: string[];
  applications?: string[];
  active?: boolean;
  featured?: boolean;
};

export type CatalogContent = {
  updatedAt: string;
  categories: ProductCategory[];
  products: Product[];
  services: Service[];
  priceGroups: PriceGroup[];
  dealerPortal: DealerPortalSettings;
};

export const industries = [
  ["lpg-bottling-plants", "LPG Bottling Plants", "Filling, storage, transfer and utility systems for bottling operations."],
  ["import-terminals", "LPG Import Terminals", "Storage, transfer and logistics support for LPG import infrastructure."],
  ["storage-facilities", "LPG Storage Facilities", "Bulk storage equipment, safety systems and instrumentation."],
  ["industrial-plants", "Industrial Plants", "Reliable LPG supply systems for process heat and industrial operations."],
  ["hotels-hospitals", "Hotels & Hospitals", "Centralized LPG distribution for commercial kitchens and building services."],
  ["textile", "Textile Industry", "LPG systems for steam, heating and production processes."],
  ["food", "Food Industry", "Controlled LPG energy supply for food processing and commercial production."],
  ["glass-ceramic", "Glass & Ceramic Industry", "Fuel systems for high-temperature process applications."],
  ["pharmaceutical", "Pharmaceutical Industry", "Engineered LPG supply for boilers, utilities and controlled industrial operations."],
  ["power-plants", "Power Plants", "LPG handling and supply solutions for applicable power-generation requirements."],
] as const;

export const mission = [
  "Deliver reliable and competitive LPG trading solutions across international markets.",
  "Provide complete end-to-end logistics, including sourcing, vessel chartering, terminal coordination, loading, unloading and regulatory compliance.",
  "Supply high-quality LPG equipment and engineering solutions that meet international standards.",
  "Ensure high standards of safety, quality and environmental responsibility in every operation.",
  "Build long-term partnerships through professionalism, integrity, technical expertise and customer service.",
  "Continuously improve services through innovation, technology and operational excellence.",
];

export const vision =
  "To become a globally recognized leader in LPG trading, logistics and engineering solutions by delivering safe, innovative and sustainable energy services that create long-term value for customers, partners and communities worldwide.";
