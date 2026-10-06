export type PropertyMode = 'house' | 'condo';

export type MainTab = 'explore' | 'valuation' | 'ai_search' | 'mortgage' | 'dashboard' | 'admin';

export interface HouseProperty {
  id: number;
  grLivArea: number; // sq ft or sq m
  bedroomAbvGr: number;
  fullBath: number;
  overallQual: number; // 1-10
  overallCond: number; // 1-10
  yearBuilt: number;
  garageCars: number;
  totalBsmtSF: number;
  neighborhood: string;
  salePrice_THB: number;
  latitude: number;
  longitude: number;
}

export interface CondoProperty {
  id: number;
  name: string;
  district: string;
  latitude: number;
  longitude: number;
  yearBuilt: number;
  bldAge: number;
  projArea: number; // sq.m.
  nbrFloors: number;
  units: number;
  priceSqm: number; // Target in THB
  distTran1: number; // km
  distShop1: number; // km
  distSchool1: number; // km
  hospital: number; // km
  // Amenities
  elevator: boolean;
  parking: boolean;
  security: boolean;
  cctv: boolean;
  pool: boolean;
  sauna: boolean;
  gym: boolean;
  garden: boolean;
  playground: boolean;
  shop: boolean;
  restaurant: boolean;
  wifi: boolean;
}

export interface HouseInputForm {
  grLivArea: number; // sq.m. (converted to sqft internally or displayed with both)
  bedroomAbvGr: number;
  fullBath: number;
  overallQual: number;
  overallCond: number;
  yearBuilt: number;
  garageCars: number;
  totalBsmtSF: number;
  neighborhood: string;
}

export interface CondoInputForm {
  district: string;
  roomSizeSqm: number;
  bldAge: number;
  projArea: number;
  nbrFloors: number;
  units: number;
  distTran1: number;
  distShop1: number;
  distSchool1: number;
  hospital: number;
  elevator: boolean;
  parking: boolean;
  pool: boolean;
  gym: boolean;
  sauna: boolean;
  garden: boolean;
  playground: boolean;
  security: boolean;
  cctv: boolean;
  shop: boolean;
  restaurant: boolean;
  wifi: boolean;
}

export interface ModelMetrics {
  mae: number;
  r2: number;
  rmse: number;
  trainCount: number;
  testCount: number;
  targetName: string;
  unit: string;
  featureImportances: { feature: string; importance: number; thaiName: string }[];
  validationPoints: { actual: number; predicted: number; name?: string }[];
}

export interface MortgageResult {
  loanAmount: number;
  downPaymentAmount: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  annualInterestRate: number;
  loanTermYears: number;
}

export interface AiSearchIntent {
  budget_amount: number | null;
  budget_type: 'monthly_installment' | 'total_price';
  property_type: 'house' | 'condo' | 'both';
  location_hint: string | null;
  other_preferences: string[];
  room_size_sqm?: number | null;
  needs_confirmation: boolean;
  clarification_question?: string | null;
  interpreted_summary: string;
}

export interface LoanAssumption {
  annualInterestRate: number; // e.g. 6.5%
  loanTermYears: number; // e.g. 30 years
  downPaymentPercent: number; // e.g. 10%
  condoRoomSizeSqm: number; // e.g. 30 sq.m.
}

export interface RecommendedProperty {
  id: string | number;
  type: 'condo' | 'house';
  title: string;
  location: string;
  districtOrNeighborhood: string;
  totalPriceTHB: number;
  unitPriceTHB?: number; // e.g. price per sqm
  roomSizeSqm?: number;
  livingAreaSqFt?: number;
  bedroomCount?: number;
  bathCount?: number;
  distToTransitKm?: number; // BTS/MRT
  distToShopKm?: number;
  ageYears?: number;
  qualityRating?: number; // 1-10
  amenities: string[];
  latitude: number;
  longitude: number;
  monthlyInstallmentAtAssumption: number;
  isOverBudget?: boolean; // true if none in budget and showing closest
}

export interface AiSearchResult {
  intent: AiSearchIntent;
  assumptions: LoanAssumption;
  maxAffordablePriceTHB: number;
  loanPrincipalTHB: number;
  downPaymentTHB: number;
  recommendedProperties: RecommendedProperty[];
  summaryMessage: string;
  isOverBudgetFallback: boolean;
}

