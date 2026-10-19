import type { Property } from "@/db/models";

export const BUSINESS_TYPES = [
  "accommodation",
  "software",
  "ecommerce",
  "jewelry",
  "professional-services",
  "healthcare",
  "education",
  "nonprofit",
  "other",
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  accommodation: "Hotel, villa, or accommodation",
  software: "Software or technology company",
  ecommerce: "Ecommerce or retail store",
  jewelry: "Jewelry or luxury goods",
  "professional-services": "Professional services",
  healthcare: "Healthcare or wellness",
  education: "Education or training",
  nonprofit: "Nonprofit or community organization",
  other: "Other business",
};

export function getBusinessType(property: Pick<Property, "businessType">): BusinessType {
  return property.businessType && BUSINESS_TYPES.includes(property.businessType)
    ? property.businessType
    : "accommodation";
}

export function isAccommodation(property: Pick<Property, "businessType">): boolean {
  return getBusinessType(property) === "accommodation";
}
