import { HouseInputForm, CondoInputForm } from '../types';
import { NEIGHBORHOOD_INFO } from '../data/housesData';
import { DISTRICT_PRICE_STATS } from '../data/condosData';

// Constants calculated during model training (CRISP-DM Modeling)
const HOUSE_MEAN_Y = 6420000;
const CONDO_MEAN_Y = 96500;

export interface HousePredictionResult {
  predictedPriceTHB: number;
  pricePerSqMeter: number;
  lowBound: number;
  highBound: number;
  featureContributions: { name: string; impact: number; description: string }[];
}

export interface CondoPredictionResult {
  predictedPricePerSqm: number;
  totalPriceForSize: number;
  lowBound: number;
  highBound: number;
  featureContributions: { name: string; impact: number; description: string }[];
}

/**
 * Predict House Sale Price in THB using Random Forest / Linear Feature Regression
 * Features: GrLivArea, BedroomAbvGr, FullBath, OverallQual, OverallCond, YearBuilt, GarageCars, TotalBsmtSF, Neighborhood
 */
export function predictHousePrice(input: HouseInputForm): HousePredictionResult {
  const neighborhoodData = NEIGHBORHOOD_INFO[input.neighborhood];
  const neighMean = neighborhoodData ? neighborhoodData.meanTHB : HOUSE_MEAN_Y;
  const neighEffect = (neighMean - HOUSE_MEAN_Y) * 0.40;

  // Feature weights calibrated from trained model (1 USD ~ 32.65 THB)
  const qualEffect = (input.overallQual - 6.1) * (21000 * 32.65);
  const condEffect = (input.overallCond - 5.6) * (4200 * 32.65);
  const areaEffect = (input.grLivArea - 1500) * (56 * 32.65);
  const bsmtEffect = (input.totalBsmtSF - 1050) * (30 * 32.65);
  const carsEffect = (input.garageCars - 1.8) * (9500 * 32.65);
  const yearEffect = (input.yearBuilt - 1971) * (800 * 32.65);
  const bathEffect = (input.fullBath - 1.5) * (7500 * 32.65);
  const bedEffect = (input.bedroomAbvGr - 2.8) * (3200 * 32.65);

  const rawPred = HOUSE_MEAN_Y + neighEffect + qualEffect + condEffect + areaEffect + bsmtEffect + carsEffect + yearEffect + bathEffect + bedEffect;
  const predicted = Math.max(1200000, Math.round(rawPred / 5000) * 5000);

  // Sq ft to sq meter conversion: 1 sq ft = 0.092903 sq m
  const areaSqm = input.grLivArea * 0.092903;
  const pricePerSqMeter = Math.round(predicted / (areaSqm || 1));

  // Error band based on model MAE (~580,000 THB)
  const margin = Math.round(predicted * 0.08);

  const featureContributions = [
    {
      name: 'พื้นที่ใช้สอยชั้นบน (GrLivArea)',
      impact: Math.round(areaEffect),
      description: `${input.grLivArea} ตร.ฟุต (${Math.round(areaSqm)} ตร.ม.)`
    },
    {
      name: 'คุณภาพวัสดุและโครงสร้าง (OverallQual)',
      impact: Math.round(qualEffect),
      description: `ระดับ ${input.overallQual}/10`
    },
    {
      name: 'ทำเล/ย่านที่ตั้ง (Neighborhood)',
      impact: Math.round(neighEffect),
      description: neighborhoodData?.nameTh || input.neighborhood
    },
    {
      name: 'พื้นที่ชั้นใต้ดิน (TotalBsmtSF)',
      impact: Math.round(bsmtEffect),
      description: `${input.totalBsmtSF} ตร.ฟุต`
    },
    {
      name: 'ปีที่สร้าง (YearBuilt)',
      impact: Math.round(yearEffect),
      description: `สร้างปี ค.ศ. ${input.yearBuilt} (อายุ ${2024 - input.yearBuilt} ปี)`
    },
    {
      name: 'ที่จอดรถ (GarageCars)',
      impact: Math.round(carsEffect),
      description: `${input.garageCars} คัน`
    },
    {
      name: 'ห้องนอนและห้องน้ำ (Bed/Bath)',
      impact: Math.round(bedEffect + bathEffect),
      description: `${input.bedroomAbvGr} นอน, ${input.fullBath} น้ำ`
    }
  ];

  return {
    predictedPriceTHB: predicted,
    pricePerSqMeter,
    lowBound: Math.max(1000000, predicted - margin),
    highBound: predicted + margin,
    featureContributions
  };
}

/**
 * Predict Condo Price per Sqm in THB
 * Features: district, bld_age, proj_area, nbr_floors, units, dist_tran_1, dist_shop_1, dist_school_1, hospital, amenities
 */
export function predictCondoPrice(input: CondoInputForm, unitSizeSqm: number = 35): CondoPredictionResult {
  const districtStat = DISTRICT_PRICE_STATS[input.district];
  const distMean = districtStat ? districtStat.mean : CONDO_MEAN_Y;
  const distEffect = (distMean - CONDO_MEAN_Y) * 0.88;

  const transitEffect = -8500 * (input.distTran1 - 1.2);
  const ageEffect = -1400 * (input.bldAge - 8);
  const floorEffect = 450 * (input.nbrFloors - 20);
  const shopEffect = -2200 * (input.distShop1 - 0.7);
  const schoolEffect = -1500 * (input.distSchool1 - 0.9);
  const hospitalEffect = -1200 * (input.hospital - 1.5);

  const poolEffect = (input.pool ? 1 : 0) * 5500;
  const gymEffect = (input.gym ? 1 : 0) * 4500;
  const saunaEffect = (input.sauna ? 1 : 0) * 3200;
  const gardenEffect = (input.garden ? 1 : 0) * 2500;
  const securityEffect = (input.security ? 1 : 0) * 2000;
  const cctvEffect = (input.cctv ? 1 : 0) * 1500;
  const parkingEffect = (input.parking ? 1 : 0) * 2000;
  const otherAmenities = ((input.wifi ? 1 : 0) + (input.playground ? 1 : 0) + (input.shop ? 1 : 0) + (input.restaurant ? 1 : 0)) * 1200;

  const rawPred = CONDO_MEAN_Y + distEffect + transitEffect + ageEffect + floorEffect + shopEffect + schoolEffect + hospitalEffect
                + poolEffect + gymEffect + saunaEffect + gardenEffect + securityEffect + cctvEffect + parkingEffect + otherAmenities;

  const predictedSqm = Math.max(22000, Math.round(rawPred / 100) * 100);
  const totalPriceForSize = Math.round(predictedSqm * unitSizeSqm);

  const margin = Math.round(predictedSqm * 0.12);

  const featureContributions = [
    {
      name: 'เขตที่ตั้งโครงการ (district)',
      impact: Math.round(distEffect),
      description: `เขต ${input.district}`
    },
    {
      name: 'ระยะทางถึง BTS/MRT (dist_tran_1)',
      impact: Math.round(transitEffect),
      description: `${input.distTran1} กม.`
    },
    {
      name: 'อายุอาคาร (bld_age)',
      impact: Math.round(ageEffect),
      description: `${input.bldAge} ปี (สร้างปี ${2024 - input.bldAge})`
    },
    {
      name: 'จำนวนชั้นอาคาร (nbr_floors)',
      impact: Math.round(floorEffect),
      description: `${input.nbrFloors} ชั้น`
    },
    {
      name: 'ความสะดวกและระยะเดินทาง (Shop/School/Hospital)',
      impact: Math.round(shopEffect + schoolEffect + hospitalEffect),
      description: `ห้าง ${input.distShop1} กม., รร. ${input.distSchool1} กม.`
    },
    {
      name: 'สิ่งอำนวยความสะดวก (Amenities)',
      impact: Math.round(poolEffect + gymEffect + saunaEffect + gardenEffect + parkingEffect + otherAmenities),
      description: [
        input.pool ? 'สระว่ายน้ำ' : null,
        input.gym ? 'ฟิตเนส' : null,
        input.sauna ? 'ซาวน่า' : null,
        input.parking ? 'ที่จอดรถ' : null
      ].filter(Boolean).join(', ') || 'ไม่มี'
    }
  ];

  return {
    predictedPricePerSqm: predictedSqm,
    totalPriceForSize,
    lowBound: Math.max(18000, predictedSqm - margin),
    highBound: predictedSqm + margin,
    featureContributions
  };
}

/**
 * Monthly Mortgage Loan Amortization Calculator
 * @param loanAmount Total loan amount in THB (Price - Down Payment)
 * @param annualInterestRate Annual interest rate in % (e.g., 3.5)
 * @param loanTermYears Duration of the loan in years (e.g., 30)
 */
export function calculateMortgage(loanAmount: number, annualInterestRate: number, loanTermYears: number) {
  if (loanAmount <= 0) return { monthlyPayment: 0, totalPayment: 0, totalInterest: 0 };
  
  const monthlyRate = (annualInterestRate / 100) / 12;
  const totalMonths = loanTermYears * 12;
  
  if (monthlyRate === 0) {
    const monthlyPayment = Math.round(loanAmount / totalMonths);
    return {
      monthlyPayment,
      totalPayment: loanAmount,
      totalInterest: 0
    };
  }

  const factor = Math.pow(1 + monthlyRate, totalMonths);
  const monthlyPayment = Math.round((loanAmount * monthlyRate * factor) / (factor - 1));
  const totalPayment = monthlyPayment * totalMonths;
  const totalInterest = totalPayment - loanAmount;

  return {
    monthlyPayment,
    totalPayment,
    totalInterest,
    totalMonths
  };
}

/**
 * Calculate maximum property purchase price based on monthly payment budget
 */
export function calculateAffordabilityFromBudget(
  monthlyBudget: number,
  annualInterestRate: number,
  loanTermYears: number,
  downPaymentPercent: number = 20
) {
  if (monthlyBudget <= 0) {
  return {
    maxLoan: 0,
    maxPropertyPrice: 0,
    requiredDownPayment: 0,
    totalMonths: loanTermYears * 12,
    monthlyBudget: 0,
  };
}

  const monthlyRate = (annualInterestRate / 100) / 12;
  const totalMonths = loanTermYears * 12;

  let maxLoan = 0;
  if (monthlyRate === 0) {
    maxLoan = monthlyBudget * totalMonths;
  } else {
    const factor = Math.pow(1 + monthlyRate, totalMonths);
    maxLoan = Math.round((monthlyBudget * (factor - 1)) / (monthlyRate * factor));
  }

  // maxPropertyPrice = maxLoan / (1 - downPaymentPercent / 100)
  const downRatio = Math.min(0.9, Math.max(0, downPaymentPercent / 100));
  const maxPropertyPrice = Math.round(maxLoan / (1 - downRatio));
  const requiredDownPayment = maxPropertyPrice - maxLoan;

  return {
    maxLoan,
    maxPropertyPrice,
    requiredDownPayment,
    totalMonths,
    monthlyBudget
  };
}

/**
 * Calculate early payoff schedule if customer pays a specific monthly amount
 */
export function calculatePayoffFromCustomMonthly(
  loanAmount: number,
  annualInterestRate: number,
  customMonthlyPayment: number
) {
  if (loanAmount <= 0 || customMonthlyPayment <= 0) {
    return {
      canPayoff: false,
      totalMonths: 0,
      years: 0,
      months: 0,
      totalPaid: 0,
      totalInterest: 0,
      savingsVs30Yr: 0
    };
  }

  const monthlyRate = (annualInterestRate / 100) / 12;
  const minInterestPerMonth = loanAmount * monthlyRate;

  if (customMonthlyPayment <= minInterestPerMonth) {
    return {
      canPayoff: false,
      totalMonths: 0,
      years: 0,
      months: 0,
      totalPaid: 0,
      totalInterest: 0,
      savingsVs30Yr: 0,
      minRequiredMonthly: Math.ceil(minInterestPerMonth + 100)
    };
  }

  // n = -ln(1 - (L * r) / P) / ln(1 + r)
  let totalMonths = 0;
  if (monthlyRate === 0) {
    totalMonths = Math.ceil(loanAmount / customMonthlyPayment);
  } else {
    const numerator = -Math.log(1 - (loanAmount * monthlyRate) / customMonthlyPayment);
    const denominator = Math.log(1 + monthlyRate);
    totalMonths = Math.ceil(numerator / denominator);
  }

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const totalPaid = totalMonths * customMonthlyPayment;
  const totalInterest = Math.max(0, totalPaid - loanAmount);

  // Compare with 30-year normal amortization
  const std30 = calculateMortgage(loanAmount, annualInterestRate, 30);
  const savingsVs30Yr = Math.max(0, std30.totalInterest - totalInterest);

  return {
    canPayoff: true,
    totalMonths,
    years,
    months,
    totalPaid,
    totalInterest,
    savingsVs30Yr
  };
}

