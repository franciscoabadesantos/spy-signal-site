import type { NetworkNode } from './network'

export type MarketRegionKey =
  | 'northAmerica'
  | 'latinAmerica'
  | 'europe'
  | 'africa'
  | 'middleEast'
  | 'india'
  | 'eastAsia'
  | 'southeastAsia'
  | 'australia'
  | 'unknown'

export type ColorMode = 'zone' | 'field'

export type CountryColorSpec = {
  key: string
  label: string
  family: MarketRegionKey
  familyLabel: string
  color: string
}

export type GicsSectorKey =
  | 'communicationServices'
  | 'consumerDiscretionary'
  | 'consumerStaples'
  | 'energy'
  | 'financials'
  | 'healthCare'
  | 'industrials'
  | 'informationTechnology'
  | 'materials'
  | 'realEstate'
  | 'utilities'
  | 'unknown'

export const MARKET_REGION_ORDER: MarketRegionKey[] = [
  'northAmerica',
  'latinAmerica',
  'europe',
  'africa',
  'middleEast',
  'india',
  'eastAsia',
  'southeastAsia',
  'australia',
  'unknown',
]

export const MARKET_REGION_LABELS: Record<MarketRegionKey, string> = {
  northAmerica: 'North America',
  latinAmerica: 'Latin America',
  europe: 'Europe',
  africa: 'Africa',
  middleEast: 'Middle East',
  india: 'India',
  eastAsia: 'East Asia',
  southeastAsia: 'Southeast Asia',
  australia: 'Australia',
  unknown: 'Unknown',
}

export const MARKET_REGION_COLORS: Record<MarketRegionKey, string> = {
  northAmerica: '#36B3FF',
  latinAmerica: '#1677FF',
  europe: '#67DEAB',
  africa: '#F97316',
  middleEast: '#D8B4FE',
  india: '#F59E0B',
  eastAsia: '#FFCB47',
  southeastAsia: '#14B8A6',
  australia: '#A78BFA',
  unknown: '#94A3B8',
}

const REGION_ALIASES: Record<string, MarketRegionKey> = {
  northamerica: 'northAmerica',
  north_america: 'northAmerica',
  us: 'northAmerica',
  usa: 'northAmerica',
  unitedstates: 'northAmerica',
  united_states: 'northAmerica',
  canada: 'northAmerica',
  americas: 'northAmerica',
  latinamerica: 'latinAmerica',
  latin_america: 'latinAmerica',
  europe: 'europe',
  emea: 'europe',
  africa: 'africa',
  middleeast: 'middleEast',
  middle_east: 'middleEast',
  india: 'india',
  eastasia: 'eastAsia',
  east_asia: 'eastAsia',
  japan: 'eastAsia',
  china: 'eastAsia',
  southeastasia: 'southeastAsia',
  southeast_asia: 'southeastAsia',
  australia: 'australia',
  oceania: 'australia',
}

const COUNTRY_ALIASES: Record<string, string> = {
  us: 'US',
  usa: 'US',
  unitedstates: 'US',
  united_states: 'US',
  'united states': 'US',
  canada: 'CA',
  ca: 'CA',
  mexico: 'MX',
  mx: 'MX',
  brazil: 'BR',
  br: 'BR',
  argentina: 'AR',
  ar: 'AR',
  chile: 'CL',
  cl: 'CL',
  germany: 'DE',
  deutschland: 'DE',
  de: 'DE',
  france: 'FR',
  fr: 'FR',
  uk: 'GB',
  gb: 'GB',
  britain: 'GB',
  unitedkingdom: 'GB',
  united_kingdom: 'GB',
  'united kingdom': 'GB',
  portugal: 'PT',
  pt: 'PT',
  netherlands: 'NL',
  nl: 'NL',
  italy: 'IT',
  it: 'IT',
  spain: 'ES',
  es: 'ES',
  switzerland: 'CH',
  ch: 'CH',
  denmark: 'DK',
  dk: 'DK',
  sweden: 'SE',
  se: 'SE',
  norway: 'NO',
  no: 'NO',
  finland: 'FI',
  fi: 'FI',
  ireland: 'IE',
  ie: 'IE',
  belgium: 'BE',
  be: 'BE',
  japan: 'JP',
  jp: 'JP',
  china: 'CN',
  cn: 'CN',
  hongkong: 'HK',
  hong_kong: 'HK',
  hk: 'HK',
  taiwan: 'TW',
  tw: 'TW',
  korea: 'KR',
  southkorea: 'KR',
  south_korea: 'KR',
  kr: 'KR',
  india: 'IN',
  in: 'IN',
  singapore: 'SG',
  sg: 'SG',
  australia: 'AU',
  au: 'AU',
  southafrica: 'ZA',
  south_africa: 'ZA',
  za: 'ZA',
  israel: 'IL',
  il: 'IL',
  uae: 'AE',
  ae: 'AE',
  saudiarabia: 'SA',
  saudi_arabia: 'SA',
  sa: 'SA',
}

const COUNTRY_SPECS: Record<string, Omit<CountryColorSpec, 'key'>> = {
  US: { label: 'United States', family: 'northAmerica', familyLabel: 'Americas', color: '#36B3FF' },
  CA: { label: 'Canada', family: 'northAmerica', familyLabel: 'Americas', color: '#73CBFF' },
  MX: { label: 'Mexico', family: 'northAmerica', familyLabel: 'Americas', color: '#0A99FF' },
  BR: { label: 'Brazil', family: 'latinAmerica', familyLabel: 'Americas', color: '#1677FF' },
  AR: { label: 'Argentina', family: 'latinAmerica', familyLabel: 'Americas', color: '#4F8CFF' },
  CL: { label: 'Chile', family: 'latinAmerica', familyLabel: 'Americas', color: '#5AA7E8' },
  DE: { label: 'Germany', family: 'europe', familyLabel: 'Europe', color: '#67DEAB' },
  FR: { label: 'France', family: 'europe', familyLabel: 'Europe', color: '#12B76A' },
  GB: { label: 'United Kingdom', family: 'europe', familyLabel: 'Europe', color: '#22C55E' },
  PT: { label: 'Portugal', family: 'europe', familyLabel: 'Europe', color: '#7DD3A8' },
  NL: { label: 'Netherlands', family: 'europe', familyLabel: 'Europe', color: '#0EAD69' },
  IT: { label: 'Italy', family: 'europe', familyLabel: 'Europe', color: '#84CC8A' },
  ES: { label: 'Spain', family: 'europe', familyLabel: 'Europe', color: '#2FBF71' },
  CH: { label: 'Switzerland', family: 'europe', familyLabel: 'Europe', color: '#9BE7C2' },
  DK: { label: 'Denmark', family: 'europe', familyLabel: 'Europe', color: '#47D18C' },
  SE: { label: 'Sweden', family: 'europe', familyLabel: 'Europe', color: '#5BE39D' },
  NO: { label: 'Norway', family: 'europe', familyLabel: 'Europe', color: '#3CBF7D' },
  FI: { label: 'Finland', family: 'europe', familyLabel: 'Europe', color: '#A7F3D0' },
  IE: { label: 'Ireland', family: 'europe', familyLabel: 'Europe', color: '#34D399' },
  BE: { label: 'Belgium', family: 'europe', familyLabel: 'Europe', color: '#86EFAC' },
  JP: { label: 'Japan', family: 'eastAsia', familyLabel: 'East Asia', color: '#FFCB47' },
  CN: { label: 'China', family: 'eastAsia', familyLabel: 'East Asia', color: '#F97316' },
  HK: { label: 'Hong Kong', family: 'eastAsia', familyLabel: 'East Asia', color: '#FB923C' },
  TW: { label: 'Taiwan', family: 'eastAsia', familyLabel: 'East Asia', color: '#F59E0B' },
  KR: { label: 'South Korea', family: 'eastAsia', familyLabel: 'East Asia', color: '#FDBA74' },
  IN: { label: 'India', family: 'india', familyLabel: 'India', color: '#D97706' },
  SG: { label: 'Singapore', family: 'southeastAsia', familyLabel: 'Southeast Asia', color: '#14B8A6' },
  AU: { label: 'Australia', family: 'australia', familyLabel: 'Australia', color: '#A78BFA' },
  ZA: { label: 'South Africa', family: 'africa', familyLabel: 'Africa', color: '#F97316' },
  IL: { label: 'Israel', family: 'middleEast', familyLabel: 'Middle East', color: '#D8B4FE' },
  AE: { label: 'United Arab Emirates', family: 'middleEast', familyLabel: 'Middle East', color: '#C084FC' },
  SA: { label: 'Saudi Arabia', family: 'middleEast', familyLabel: 'Middle East', color: '#E879F9' },
}

export const GICS_SECTOR_ORDER: GicsSectorKey[] = [
  'communicationServices',
  'consumerDiscretionary',
  'consumerStaples',
  'energy',
  'financials',
  'healthCare',
  'industrials',
  'informationTechnology',
  'materials',
  'realEstate',
  'utilities',
  'unknown',
]

export const GICS_SECTOR_LABELS: Record<GicsSectorKey, string> = {
  communicationServices: 'Communication Services',
  consumerDiscretionary: 'Consumer Discretionary',
  consumerStaples: 'Consumer Staples',
  energy: 'Energy',
  financials: 'Financials',
  healthCare: 'Health Care',
  industrials: 'Industrials',
  informationTechnology: 'Information Technology',
  materials: 'Materials',
  realEstate: 'Real Estate',
  utilities: 'Utilities',
  unknown: 'Unknown / ETF',
}

export const GICS_SECTOR_COLORS: Record<GicsSectorKey, string> = {
  communicationServices: '#8B5CF6',
  consumerDiscretionary: '#F97316',
  consumerStaples: '#84CC16',
  energy: '#EF4444',
  financials: '#0EA5E9',
  healthCare: '#EC4899',
  industrials: '#F59E0B',
  informationTechnology: '#6366F1',
  materials: '#A16207',
  realEstate: '#14B8A6',
  utilities: '#22C55E',
  unknown: '#94A3B8',
}

const SECTOR_ALIASES: Array<[GicsSectorKey, RegExp]> = [
  ['communicationServices', /communication|telecom|media|entertainment/i],
  ['consumerDiscretionary', /consumer discretionary|discretionary|automobile|retail|apparel|restaurant|leisure/i],
  ['consumerStaples', /consumer staples|staples|food|beverage|household|personal products/i],
  ['energy', /energy|oil|gas|exploration|drilling|refining/i],
  ['financials', /financial|bank|insurance|capital markets|asset management|broker/i],
  ['healthCare', /health|pharma|biotech|life sciences|medical/i],
  ['industrials', /industrial|aerospace|defense|machinery|transport|logistics|construction/i],
  ['informationTechnology', /information technology|technology|software|semiconductor|hardware|it services/i],
  ['materials', /materials|chemical|metals|mining|paper|packaging/i],
  ['realEstate', /real estate|reit/i],
  ['utilities', /utilities|utility|electric|water|gas utilities/i],
]

export function normalizeMarketRegion(region: string | null | undefined): MarketRegionKey {
  if (!region) return 'unknown'
  const trimmed = region.trim()
  if (!trimmed) return 'unknown'
  if ((MARKET_REGION_ORDER as string[]).includes(trimmed)) return trimmed as MarketRegionKey

  const compact = trimmed.toLowerCase().replace(/[\s-]+/g, '_')
  return REGION_ALIASES[compact] ?? REGION_ALIASES[compact.replace(/_/g, '')] ?? 'unknown'
}

export function marketRegionLabel(region: string | null | undefined): string {
  return MARKET_REGION_LABELS[normalizeMarketRegion(region)]
}

export function marketRegionColor(region: string | null | undefined): string {
  return MARKET_REGION_COLORS[normalizeMarketRegion(region)]
}

export function normalizeCountryCode(country: string | null | undefined): string | null {
  if (!country) return null
  const trimmed = country.trim()
  if (!trimmed) return null
  const upper = trimmed.toUpperCase()
  if (/^[A-Z]{2}$/.test(upper)) return upper
  const compact = trimmed.toLowerCase().replace(/[\s-]+/g, '_')
  return COUNTRY_ALIASES[compact] ?? COUNTRY_ALIASES[compact.replace(/_/g, '')] ?? null
}

export function countryColorSpec(country: string | null | undefined, region?: string | null): CountryColorSpec {
  const code = normalizeCountryCode(country)
  if (code && COUNTRY_SPECS[code]) {
    return {
      key: code,
      ...COUNTRY_SPECS[code],
    }
  }

  const family = normalizeMarketRegion(region)
  return {
    key: family,
    label: marketRegionLabel(family),
    family,
    familyLabel: MARKET_REGION_LABELS[family],
    color: MARKET_REGION_COLORS[family],
  }
}

export function countryDisplayName(country: string | null | undefined, region?: string | null): string {
  return countryColorSpec(country, region).label
}

export function countryColor(country: string | null | undefined, region?: string | null): string {
  return countryColorSpec(country, region).color
}

export function normalizeGicsSector(sector: string | null | undefined): GicsSectorKey {
  if (!sector) return 'unknown'
  const trimmed = sector.trim()
  if (!trimmed) return 'unknown'
  if (/etf|fund|trust|index|portfolio/i.test(trimmed)) return 'unknown'
  for (const [key, pattern] of SECTOR_ALIASES) {
    if (pattern.test(trimmed)) return key
  }
  return 'unknown'
}

export function sectorLabel(sector: string | null | undefined): string {
  return GICS_SECTOR_LABELS[normalizeGicsSector(sector)]
}

export function sectorColor(sector: string | null | undefined): string {
  return GICS_SECTOR_COLORS[normalizeGicsSector(sector)]
}

export function nodeColor(node: NetworkNode, mode: ColorMode): string {
  return mode === 'field' ? sectorColor(node.sector) : countryColor(node.country, node.region)
}

export function buildCountryLegend(nodes: NetworkNode[]): CountryColorSpec[] {
  const byKey = new Map<string, CountryColorSpec>()
  for (const node of nodes) {
    const spec = countryColorSpec(node.country, node.region)
    if (!byKey.has(spec.key)) byKey.set(spec.key, spec)
  }
  return [...byKey.values()].sort(
    (a, b) =>
      MARKET_REGION_ORDER.indexOf(a.family) - MARKET_REGION_ORDER.indexOf(b.family) ||
      a.label.localeCompare(b.label)
  )
}

export function buildSectorLegend(nodes: NetworkNode[]): Array<{ key: GicsSectorKey; label: string; color: string; count: number }> {
  const counts = new Map<GicsSectorKey, number>()
  for (const node of nodes) {
    const key = normalizeGicsSector(node.sector)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return GICS_SECTOR_ORDER
    .filter((key) => counts.has(key))
    .map((key) => ({
      key,
      label: GICS_SECTOR_LABELS[key],
      color: GICS_SECTOR_COLORS[key],
      count: counts.get(key) ?? 0,
    }))
}
