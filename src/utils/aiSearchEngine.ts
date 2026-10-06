import {
  AiSearchIntent,
  LoanAssumption,
  RecommendedProperty,
  AiSearchResult,
  CondoProperty,
  HouseProperty
} from '../types';
import { CONDOS_DATA } from '../data/condosData';
import { HOUSES_DATA, NEIGHBORHOOD_INFO } from '../data/housesData';

// Thai to English Bangkok district mapping dictionary
const DISTRICT_SYNONYMS: Record<string, string[]> = {
  "Chatuchak": ["จตุจักร", "หมอชิต", "ลาดพร้าวตอนต้น", "พหลโยธิน", "chatuchak", "mo chit"],
  "Watthana": ["วัฒนา", "สุขุมวิท", "ทองหล่อ", "เอกมัย", "พร้อมพงษ์", "อโศก", "watthana", "thong lor", "ekkamai"],
  "Khlong Toei": ["คลองเตย", "พระราม 4", "กล้วยน้ำไท", "khlong toei"],
  "Sathon": ["สาทร", "ช่องนนทรี", "สุรศักดิ์", "sathon", "chong nonsi"],
  "Bang Rak": ["บางรัก", "สีลม", "ศาลาแดง", "bang rak", "silom"],
  "Pathum Wan": ["ปทุมวัน", "สยาม", "ชิดลม", "เพลินจิต", "ราชดำริ", "pathum wan", "siam"],
  "Phaya Thai": ["พญาไท", "อารีย์", "สะพานควาย", "สนามเป้า", "phaya thai", "ari"],
  "Ratchathewi": ["ราชเทวี", "อนุสาวรีย์ชัย", "พญาไท", "รางน้ำ", "ratchathewi"],
  "Bang Kapi": ["บางกะปิ", "ลาดพร้าว", "รามคำแหง", "ลำสาลี", "bang kapi", "ramkhamhaeng"],
  "Bang Khae": ["บางแค", "เพชรเกษม", "หลักสอง", "bang khae", "phetkasem"],
  "Bang Na": ["บางนา", "แบริ่ง", "อุดมสุข", "ศรีนครินทร์", "bang na", "bearing", "udom suk"],
  "Phra Khanong": ["พระโขนง", "อ่อนนุช", "บางจาก", "phra khanong", "on nut"],
  "Din Daeng": ["ดินแดง", "รัชดา", "ห้วยขวาง", "พระราม 9", "din daeng", "rama 9"],
  "Huai Khwang": ["ห้วยขวาง", "ศูนย์วัฒนธรรม", "สุทธิสาร", "huai khwang"],
  "Don Mueang": ["ดอนเมือง", "สรงประภา", "don mueang"],
  "Sai Mai": ["สายไหม", "วัชรพล", "sai mai"],
  "Min Buri": ["มีนบุรี", "รามอินทรา", "min buri"],
  "Lat Krabang": ["ลาดกระบัง", "สุวรรณภูมิ", "lat krabang"],
  "Bang Sue": ["บางซื่อ", "เตาปูน", "วงศ์สว่าง", "bang sue", "tao poon"],
  "Thon Buri": ["ธนบุรี", "วงเวียนใหญ่", "ตลาดพลู", "thon buri", "wongwian yai"],
  "Khlong San": ["คลองสาน", "ไอคอนสยาม", "กรุงธนบุรี", "khlong san", "iconsiam"],
  "Suan Luang": ["สวนหลวง", "พัฒนาการ", "ศรีนครินทร์", "suan luang", "pattanakarn"],
  "Yan Nawa": ["ยานนาวา", "พระราม 3", "สาธุประดิษฐ์", "yan nawa", "rama 3"],
};

/**
 * Standard Mortgage monthly payment formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calculateMonthlyPayment(
  principal: number,
  annualInterestRate: number,
  loanTermYears: number
): number {
  if (principal <= 0) return 0;
  const monthlyRate = annualInterestRate / 100 / 12;
  const totalMonths = loanTermYears * 12;
  if (monthlyRate === 0) return principal / totalMonths;

  const factor = Math.pow(1 + monthlyRate, totalMonths);
  const monthlyPayment = principal * ((monthlyRate * factor) / (factor - 1));
  return Math.round(monthlyPayment);
}

/**
 * Reverse Amortization: Given monthly payment M, find loan principal P
 * P = M * [(1+r)^n - 1] / [r(1+r)^n]
 */
export function calculateMaxLoanFromMonthly(
  monthlyBudget: number,
  annualInterestRate: number,
  loanTermYears: number
): number {
  if (monthlyBudget <= 0) return 0;
  const monthlyRate = annualInterestRate / 100 / 12;
  const totalMonths = loanTermYears * 12;
  if (monthlyRate === 0) return monthlyBudget * totalMonths;

  const factor = Math.pow(1 + monthlyRate, totalMonths);
  const principal = monthlyBudget * ((factor - 1) / (monthlyRate * factor));
  return Math.round(principal);
}

/**
 * Check if a property's district/neighborhood matches a location hint
 */
function matchesLocation(propLocation: string, locationHint: string | null): boolean {
  if (!locationHint) return true;
  const hintLower = locationHint.trim().toLowerCase();
  const propLower = propLocation.trim().toLowerCase();

  if (propLower.includes(hintLower)) return true;

  // Check synonyms dictionary
  for (const [districtKey, synonyms] of Object.entries(DISTRICT_SYNONYMS)) {
    if (districtKey.toLowerCase() === propLower) {
      if (synonyms.some((s) => s.includes(hintLower) || hintLower.includes(s))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Process natural language search intent against REAL datasets
 */
export function executePropertySearch(
  intent: AiSearchIntent,
  customAssumptions?: Partial<LoanAssumption>
): AiSearchResult {
  const assumptions: LoanAssumption = {
    annualInterestRate: customAssumptions?.annualInterestRate ?? 6.5,
    loanTermYears: customAssumptions?.loanTermYears ?? 30,
    downPaymentPercent: customAssumptions?.downPaymentPercent ?? 10,
    condoRoomSizeSqm: intent.room_size_sqm || customAssumptions?.condoRoomSizeSqm || 30,
  };

  const budget = intent.budget_amount ?? 50000;
  const isMonthly = intent.budget_type === 'monthly_installment';

  let loanPrincipalTHB = 0;
  let maxAffordablePriceTHB = 0;
  let downPaymentTHB = 0;

  if (isMonthly) {
    // 1. Reverse amortization for monthly payment
    loanPrincipalTHB = calculateMaxLoanFromMonthly(
      budget,
      assumptions.annualInterestRate,
      assumptions.loanTermYears
    );
    // 2. Add down payment to find max purchase price
    const downPaymentRatio = assumptions.downPaymentPercent / 100;
    maxAffordablePriceTHB = Math.round(loanPrincipalTHB / (1 - downPaymentRatio));
    downPaymentTHB = maxAffordablePriceTHB - loanPrincipalTHB;
  } else {
    // Total price directly specified
    maxAffordablePriceTHB = budget;
    const downPaymentRatio = assumptions.downPaymentPercent / 100;
    downPaymentTHB = Math.round(maxAffordablePriceTHB * downPaymentRatio);
    loanPrincipalTHB = maxAffordablePriceTHB - downPaymentTHB;
  }

  // Filter Condos
  const matchedCondos: RecommendedProperty[] = [];
  if (intent.property_type === 'condo' || intent.property_type === 'both') {
    CONDOS_DATA.forEach((c: CondoProperty) => {
      const totalPrice = c.priceSqm * assumptions.condoRoomSizeSqm;
      const matchLoc = matchesLocation(c.district, intent.location_hint);

      const loanForProp = totalPrice * (1 - assumptions.downPaymentPercent / 100);
      const monthlyPmt = calculateMonthlyPayment(
        loanForProp,
        assumptions.annualInterestRate,
        assumptions.loanTermYears
      );

      const amenitiesList: string[] = [];
      if (c.pool) amenitiesList.push('สระว่ายน้ำ');
      if (c.gym) amenitiesList.push('ฟิตเนส');
      if (c.parking) amenitiesList.push('ที่จอดรถ');
      if (c.security) amenitiesList.push('รปภ.24ชม.');
      if (c.garden) amenitiesList.push('สวนส่วนกลาง');

      if (matchLoc && totalPrice <= maxAffordablePriceTHB) {
        matchedCondos.push({
          id: `condo-${c.id}`,
          type: 'condo',
          title: c.name,
          location: `เขต${c.district}, กรุงเทพฯ`,
          districtOrNeighborhood: c.district,
          totalPriceTHB: totalPrice,
          unitPriceTHB: c.priceSqm,
          roomSizeSqm: assumptions.condoRoomSizeSqm,
          distToTransitKm: c.distTran1,
          distToShopKm: c.distShop1,
          ageYears: c.bldAge,
          amenities: amenitiesList,
          latitude: c.latitude,
          longitude: c.longitude,
          monthlyInstallmentAtAssumption: monthlyPmt,
          isOverBudget: false,
        });
      }
    });
  }

  // Filter Houses
  const matchedHouses: RecommendedProperty[] = [];
  if (intent.property_type === 'house' || intent.property_type === 'both') {
    HOUSES_DATA.forEach((h: HouseProperty) => {
      const totalPrice = h.salePrice_THB;
      const neighInfo = NEIGHBORHOOD_INFO[h.neighborhood];
      const neighName = neighInfo ? neighInfo.nameTh : h.neighborhood;
      const matchLoc =
        matchesLocation(h.neighborhood, intent.location_hint) ||
        matchesLocation(neighName, intent.location_hint);

      const loanForProp = totalPrice * (1 - assumptions.downPaymentPercent / 100);
      const monthlyPmt = calculateMonthlyPayment(
        loanForProp,
        assumptions.annualInterestRate,
        assumptions.loanTermYears
      );

      if (matchLoc && totalPrice <= maxAffordablePriceTHB) {
        matchedHouses.push({
          id: `house-${h.id}`,
          type: 'house',
          title: `บ้านเดี่ยว Ames #${h.id} (${neighName})`,
          location: `${neighName} (${h.neighborhood})`,
          districtOrNeighborhood: h.neighborhood,
          totalPriceTHB: totalPrice,
          livingAreaSqFt: h.grLivArea,
          bedroomCount: h.bedroomAbvGr,
          bathCount: h.fullBath,
          ageYears: 2024 - h.yearBuilt,
          qualityRating: h.overallQual,
          amenities: [`${h.bedroomAbvGr} ห้องนอน`, `${h.fullBath} ห้องน้ำ`, `ที่จอดรถ ${h.garageCars} คัน`],
          latitude: h.latitude,
          longitude: h.longitude,
          monthlyInstallmentAtAssumption: monthlyPmt,
          isOverBudget: false,
        });
      }
    });
  }

  // Sort both by price closest to budget downwards
  matchedCondos.sort((a, b) => b.totalPriceTHB - a.totalPriceTHB);
  matchedHouses.sort((a, b) => b.totalPriceTHB - a.totalPriceTHB);

  let combinedRecommendations: RecommendedProperty[] = [];
  let isOverBudgetFallback = false;

  if (intent.property_type === 'condo') {
    combinedRecommendations = matchedCondos.slice(0, 10);
  } else if (intent.property_type === 'house') {
    combinedRecommendations = matchedHouses.slice(0, 10);
  } else {
    // Both: take up to 5 best from each, or fill up to 10
    const half = Math.ceil(10 / 2);
    combinedRecommendations = [
      ...matchedCondos.slice(0, half),
      ...matchedHouses.slice(0, half),
    ].sort((a, b) => b.totalPriceTHB - a.totalPriceTHB).slice(0, 10);
  }

  // 3) FALLBACK IF NONE IN BUDGET:
  // "ถ้าไม่มีรายการใดอยู่ในงบเลย ให้บอกตรงๆ ว่าไม่มี พร้อมแนะนำตัวเลือกที่ใกล้เคียงงบที่สุด (เกินงบไม่มาก) แทนที่จะไม่ตอบอะไร"
  if (combinedRecommendations.length === 0) {
    isOverBudgetFallback = true;
    const allCandidates: RecommendedProperty[] = [];

    if (intent.property_type === 'condo' || intent.property_type === 'both') {
      CONDOS_DATA.forEach((c) => {
        const totalPrice = c.priceSqm * assumptions.condoRoomSizeSqm;
        const matchLoc = matchesLocation(c.district, intent.location_hint);
        if (matchLoc && totalPrice > maxAffordablePriceTHB) {
          const loanForProp = totalPrice * (1 - assumptions.downPaymentPercent / 100);
          const monthlyPmt = calculateMonthlyPayment(
            loanForProp,
            assumptions.annualInterestRate,
            assumptions.loanTermYears
          );
          allCandidates.push({
            id: `condo-${c.id}`,
            type: 'condo',
            title: c.name,
            location: `เขต${c.district}, กรุงเทพฯ`,
            districtOrNeighborhood: c.district,
            totalPriceTHB: totalPrice,
            unitPriceTHB: c.priceSqm,
            roomSizeSqm: assumptions.condoRoomSizeSqm,
            distToTransitKm: c.distTran1,
            distToShopKm: c.distShop1,
            ageYears: c.bldAge,
            amenities: [c.pool ? 'สระว่ายน้ำ' : '', c.gym ? 'ฟิตเนส' : '', c.parking ? 'ที่จอดรถ' : ''].filter(Boolean),
            latitude: c.latitude,
            longitude: c.longitude,
            monthlyInstallmentAtAssumption: monthlyPmt,
            isOverBudget: true,
          });
        }
      });
    }

    if (intent.property_type === 'house' || intent.property_type === 'both') {
      HOUSES_DATA.forEach((h) => {
        const totalPrice = h.salePrice_THB;
        const neighInfo = NEIGHBORHOOD_INFO[h.neighborhood];
        const neighName = neighInfo ? neighInfo.nameTh : h.neighborhood;
        const matchLoc =
          matchesLocation(h.neighborhood, intent.location_hint) ||
          matchesLocation(neighName, intent.location_hint);
        if (matchLoc && totalPrice > maxAffordablePriceTHB) {
          const loanForProp = totalPrice * (1 - assumptions.downPaymentPercent / 100);
          const monthlyPmt = calculateMonthlyPayment(
            loanForProp,
            assumptions.annualInterestRate,
            assumptions.loanTermYears
          );
          allCandidates.push({
            id: `house-${h.id}`,
            type: 'house',
            title: `บ้านเดี่ยว Ames #${h.id} (${neighName})`,
            location: `${neighName} (${h.neighborhood})`,
            districtOrNeighborhood: h.neighborhood,
            totalPriceTHB: totalPrice,
            livingAreaSqFt: h.grLivArea,
            bedroomCount: h.bedroomAbvGr,
            bathCount: h.fullBath,
            ageYears: 2024 - h.yearBuilt,
            qualityRating: h.overallQual,
            amenities: [`${h.bedroomAbvGr} นอน`, `${h.fullBath} น้ำ`],
            latitude: h.latitude,
            longitude: h.longitude,
            monthlyInstallmentAtAssumption: monthlyPmt,
            isOverBudget: true,
          });
        }
      });
    }

    // Sort by smallest distance above budget (ascending price)
    allCandidates.sort((a, b) => a.totalPriceTHB - b.totalPriceTHB);
    combinedRecommendations = allCandidates.slice(0, 8);
  }

  // 4) Summary Message
  let summaryMessage = "";
  if (isOverBudgetFallback) {
    summaryMessage = `ไม่พบอสังหาฯ ที่อยู่ในงบ ${isMonthly ? `ผ่อน ${budget.toLocaleString()} บ./ด.` : `ราคา ${budget.toLocaleString()} บ.`} แต่ขอแนะนำ ${combinedRecommendations.length} รายการที่มีราคาใกล้เคียงงบที่สุด`;
  } else {
    const propName = intent.property_type === 'condo' ? 'คอนโด' : intent.property_type === 'house' ? 'บ้าน' : 'อสังหาริมทรัพย์';
    const locNote = intent.location_hint ? ` ย่าน ${intent.location_hint}` : '';
    summaryMessage = `พบ ${combinedRecommendations.length} ${propName}${locNote} ในงบของคุณ (งบซื้อสูงสุด ~${(maxAffordablePriceTHB / 1000000).toFixed(2)} ล้านบาท)`;
  }

  return {
    intent,
    assumptions,
    maxAffordablePriceTHB,
    loanPrincipalTHB,
    downPaymentTHB,
    recommendedProperties: combinedRecommendations,
    summaryMessage,
    isOverBudgetFallback,
  };
}
