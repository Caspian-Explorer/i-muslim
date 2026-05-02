import type { BusinessReport } from "@/types/business";

const now = Date.now();

export const MOCK_BUSINESS_REPORTS: BusinessReport[] = [
  {
    id: "rep-1",
    businessId: "biz-noor-cafe",
    businessSlug: "noor-cafe-edgware-road",
    businessName: "Noor Café",
    reason: "wrong_info",
    note: "Phone number disconnected when I called yesterday.",
    reporterEmail: "concerned@example.com",
    status: "open",
    createdAt: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: "rep-2",
    businessId: "biz-saray-sweets",
    businessSlug: "saray-sweets-london",
    businessName: "Saray Sweets",
    reason: "closed",
    note: "Permanently shut, lights off, sign down.",
    status: "open",
    createdAt: new Date(now - 1000 * 60 * 60 * 30).toISOString(),
  },
];
