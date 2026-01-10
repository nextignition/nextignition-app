export interface IndustryOption {
  label: string;
  value: string;
}

/**
 * Standard industry options for dropdowns throughout the application
 * Used in registration, onboarding, profile editing, filtering, etc.
 */
export const INDUSTRIES: IndustryOption[] = [
  { label: 'Select industry', value: '' },
  { label: 'Tech Startups', value: 'tech_startups' },
  { label: 'Healthcare & Biotech', value: 'healthcare_biotech' },
  { label: 'FinTech', value: 'fintech' },
  { label: 'E-commerce & Retail', value: 'ecommerce_retail' },
  { label: 'SaaS & B2B', value: 'saas_b2b' },
  { label: 'Consumer Products', value: 'consumer_products' },
  { label: 'Education & EdTech', value: 'education_edtech' },
  { label: 'Food & Beverage', value: 'food_beverage' },
  { label: 'Real Estate & PropTech', value: 'real_estate_proptech' },
  { label: 'Energy & CleanTech', value: 'energy_cleantech' },
];

/**
 * Industry options for filter dropdowns (includes "All Industries" option)
 */
export const INDUSTRIES_WITH_ALL: IndustryOption[] = [
  { label: 'All Industries', value: '' },
  ...INDUSTRIES.filter(i => i.value !== ''), // Exclude the "Select industry" option
];

/**
 * Get industry label by value
 */
export function getIndustryLabel(value: string | null | undefined): string {
  if (!value) return 'Not specified';
  const industry = INDUSTRIES.find(i => i.value === value);
  return industry?.label || value;
}
