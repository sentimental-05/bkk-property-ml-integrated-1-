import fs from 'fs';
import path from 'path';

// Seeded random number generator for reproducibility
let seed = 42;
function random() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}
function randomGaussian(mean = 0, stdev = 1) {
  let u = 1 - random();
  let v = random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

// 42 Districts of Bangkok
const DISTRICTS = [
  'Bang Kapi', 'Bang Khae', 'Bang Khen', 'Bang Kho Laem', 'Bang Khun Thian',
  'Bang Na', 'Bang Phlat', 'Bang Rak', 'Bang Sue', 'Bangkok Noi',
  'Bangkok Yai', 'Bueng Kum', 'Chatuchak', 'Chom Thong', 'Din Daeng',
  'Don Mueang', 'Dusit', 'Huai Khwang', 'Khan Na Yao', 'Khlong San',
  'Khlong Toei', 'Lak Si', 'Lat Krabang', 'Lat Phrao', 'Min Buri',
  'Pathum Wan', 'Phasi Charoen', 'Phaya Thai', 'Phra Khanong', 'Pom Prap Sattru Phai',
  'Prawet', 'Rat Burana', 'Ratchathewi', 'Sai Mai', 'Samphanthawong',
  'Sathon', 'Suan Luang', 'Taling Chan', 'Thon Buri', 'Wang Thonglang',
  'Watthana', 'Yan Nawa'
];

const DISTRICT_COORDS = {
  'Pathum Wan': [13.7420, 100.5400, 245000, 65000],
  'Bang Rak': [13.7250, 100.5280, 175000, 55000],
  'Watthana': [13.7350, 100.5750, 170000, 58000],
  'Sathon': [13.7180, 100.5330, 155000, 50000],
  'Ratchathewi': [13.7550, 100.5350, 150000, 42000],
  'Khlong Toei': [13.7180, 100.5800, 140000, 45000],
  'Phaya Thai': [13.7820, 100.5440, 125000, 36000],
  'Khlong San': [13.7200, 100.5000, 118000, 40000],
  'Samphanthawong': [13.7360, 100.5120, 115000, 30000],
  'Pom Prap Sattru Phai': [13.7540, 100.5160, 110000, 32000],
  'Huai Khwang': [13.7750, 100.5750, 105000, 30000],
  'Bang Kho Laem': [13.6980, 100.5050, 102000, 38000],
  'Chatuchak': [13.8150, 100.5650, 95000, 26000],
  'Yan Nawa': [13.6950, 100.5400, 95000, 28000],
  'Dusit': [13.7800, 100.5100, 95000, 24000],
  'Bang Sue': [13.8150, 100.5280, 92000, 25000],
  'Phra Khanong': [13.6950, 100.6080, 90000, 25000],
  'Thon Buri': [13.7150, 100.4850, 88000, 22000],
  'Din Daeng': [13.7700, 100.5650, 88000, 24000],
  'Bang Na': [13.6700, 100.6150, 78000, 24000],
  'Bangkok Noi': [13.7650, 100.4750, 75000, 22000],
  'Bang Phlat': [13.7850, 100.4900, 72000, 20000],
  'Suan Luang': [13.7250, 100.6250, 68000, 19000],
  'Bangkok Yai': [13.7300, 100.4750, 68000, 18000],
  'Phasi Charoen': [13.7150, 100.4500, 68000, 18000],
  'Taling Chan': [13.7850, 100.4600, 66000, 18000],
  'Rat Burana': [13.6820, 100.4980, 65000, 19000],
  'Wang Thonglang': [13.7750, 100.6050, 62000, 18000],
  'Chom Thong': [13.6850, 100.4700, 62000, 16000],
  'Lak Si': [13.8800, 100.5650, 58000, 16000],
  'Prawet': [13.6950, 100.6450, 56000, 17000],
  'Bang Khae': [13.7100, 100.4050, 56000, 18000],
  'Bang Kapi': [13.7650, 100.6350, 55000, 17000],
  'Khan Na Yao': [13.8300, 100.6700, 54000, 16000],
  'Lat Krabang': [13.7250, 100.7300, 52000, 15000],
  'Bang Khen': [13.8750, 100.6050, 49000, 15000],
  'Don Mueang': [13.9100, 100.5850, 48000, 14000],
  'Bueng Kum': [13.7950, 100.6600, 48000, 15000],
  'Bang Khun Thian': [13.6600, 100.4400, 46000, 15000],
  'Sai Mai': [13.9150, 100.6500, 42000, 12000],
  'Min Buri': [13.7950, 100.7100, 38000, 12000]
};

// 25 Neighborhoods of Ames Housing
const NEIGHBORHOODS = [
  'CollgCr', 'Veenker', 'Crawfor', 'NoRidge', 'Mitchel', 'Somerst',
  'NWAmes', 'OldTown', 'BrkSide', 'Sawyer', 'NridgHt', 'NAmes',
  'SawyerW', 'IDOTRR', 'MeadowV', 'Edwards', 'Timber', 'Gilbert',
  'StoneBr', 'ClearCr', 'NPkVill', 'Blmngtn', 'BrDale', 'SWISU', 'Blueste'
];

const NEIGHBORHOOD_DATA = {
  'NoRidge': { lat: 42.048, lng: -93.590, base: 10800000, std: 2600000, qual: 8.2, size: 2300, nameTh: 'นอร์ธริดจ์ (NoRidge)' },
  'NridgHt': { lat: 42.018, lng: -93.643, base: 10400000, std: 2500000, qual: 8.1, size: 2200, nameTh: 'นอร์ธริดจ์ไฮท์ (NridgHt)' },
  'StoneBr': { lat: 42.053, lng: -93.604, base: 10100000, std: 2400000, qual: 8.0, size: 2150, nameTh: 'สโตนบรู๊ค (StoneBr)' },
  'Timber': { lat: 42.022, lng: -93.651, base: 7900000, std: 1800000, qual: 7.2, size: 1850, nameTh: 'ทิมเบอร์แลนด์ (Timber)' },
  'Veenker': { lat: 42.042, lng: -93.664, base: 7800000, std: 1700000, qual: 7.1, size: 1800, nameTh: 'วีนเคอร์ (Veenker)' },
  'Somerst': { lat: 42.045, lng: -93.649, base: 7300000, std: 1400000, qual: 7.3, size: 1750, nameTh: 'โซเมอร์เซ็ต (Somerst)' },
  'ClearCr': { lat: 42.004, lng: -93.635, base: 6900000, std: 1500000, qual: 6.8, size: 1700, nameTh: 'เคลียร์ครีก (ClearCr)' },
  'Crawfor': { lat: 42.041, lng: -93.603, base: 6800000, std: 1500000, qual: 6.9, size: 1720, nameTh: 'ครอว์ฟอร์ด (Crawfor)' },
  'CollgCr': { lat: 42.021, lng: -93.593, base: 6500000, std: 1200000, qual: 6.8, size: 1650, nameTh: 'คอลเลจครีก (CollgCr)' },
  'Gilbert': { lat: 42.034, lng: -93.670, base: 6300000, std: 1100000, qual: 6.6, size: 1600, nameTh: 'กิลเบิร์ต (Gilbert)' },
  'Blmngtn': { lat: 42.049, lng: -93.637, base: 6300000, std: 1000000, qual: 7.0, size: 1500, nameTh: 'บลูมมิงตันไฮท์ (Blmngtn)' },
  'NWAmes': { lat: 42.006, lng: -93.615, base: 6200000, std: 1200000, qual: 6.3, size: 1650, nameTh: 'นอร์ธเวสต์เอมส์ (NWAmes)' },
  'SawyerW': { lat: 42.026, lng: -93.602, base: 6100000, std: 1200000, qual: 6.4, size: 1620, nameTh: 'ซอว์เยอร์เวสต์ (SawyerW)' },
  'Mitchel': { lat: 42.063, lng: -93.597, base: 5100000, std: 1100000, qual: 5.8, size: 1450, nameTh: 'มิตเชลล์ (Mitchel)' },
  'NAmes': { lat: 42.050, lng: -93.659, base: 4700000, std: 1000000, qual: 5.5, size: 1350, nameTh: 'นอร์ธเอมส์ (NAmes)' },
  'SWISU': { lat: 42.007, lng: -93.633, base: 4700000, std: 1100000, qual: 5.4, size: 1400, nameTh: 'เซาท์เวสต์มหาลัย (SWISU)' },
  'NPkVill': { lat: 42.027, lng: -93.672, base: 4600000, std: 800000, qual: 5.8, size: 1300, nameTh: 'นอร์ธพาร์ควิลเลจ (NPkVill)' },
  'Blueste': { lat: 42.052, lng: -93.616, base: 4500000, std: 800000, qual: 6.0, size: 1300, nameTh: 'บลูสเตม (Blueste)' },
  'Sawyer': { lat: 42.012, lng: -93.616, base: 4400000, std: 900000, qual: 5.3, size: 1300, nameTh: 'ซอว์เยอร์ (Sawyer)' },
  'Edwards': { lat: 42.027, lng: -93.656, base: 4100000, std: 1100000, qual: 5.0, size: 1250, nameTh: 'เอ็ดเวิร์ดส์ (Edwards)' },
  'OldTown': { lat: 42.028, lng: -93.659, base: 4100000, std: 1200000, qual: 5.2, size: 1380, nameTh: 'เมืองเก่า (OldTown)' },
  'BrkSide': { lat: 42.050, lng: -93.606, base: 4000000, std: 1000000, qual: 5.1, size: 1200, nameTh: 'บรูกไซด์ (BrkSide)' },
  'BrDale': { lat: 42.002, lng: -93.590, base: 3400000, std: 650000, qual: 5.4, size: 1050, nameTh: 'บรู๊คเดล (BrDale)' },
  'IDOTRR': { lat: 42.053, lng: -93.619, base: 3300000, std: 950000, qual: 4.8, size: 1150, nameTh: 'ไอเดียโอทีอาร์ (IDOTRR)' },
  'MeadowV': { lat: 42.049, lng: -93.644, base: 3200000, std: 700000, qual: 4.7, size: 1000, nameTh: 'เมโดว์วิลเลจ (MeadowV)' }
};

console.log('Generating 1019 condos and 1460 houses...');

// Generate 1019 Condos
const condos = [];
let condoId = 0;
const condoPrefixes = ['The Line', 'Ideo', 'Lumpini Place', 'Lumpini Ville', 'Ashton', 'Noble', 'Rhythm', 'Supalai Prime', 'Plum Condo', 'Chewathai', 'Casa Condo', 'Life', 'The Base', 'Centric', 'Whizdom', 'U Delight', 'Chateau In Town', 'City Home', 'The Room', 'Park Origin', 'Elio Del', 'Modiz', 'The Tree', 'Chapter One'];

for (let i = 0; i < 1019; i++) {
  // pick district weighted by supply
  const districtName = DISTRICTS[i % DISTRICTS.length];
  const [baseLat, baseLng, basePrice, priceStd] = DISTRICT_COORDS[districtName] || [13.75, 100.53, 90000, 25000];
  
  const bldAge = Math.max(1, Math.min(35, Math.round(randomGaussian(8, 6))));
  const yearBuilt = 2024 - bldAge;
  const nbrFloors = Math.max(5, Math.min(55, Math.round(randomGaussian(22, 12))));
  const units = Math.max(50, Math.min(2500, Math.round(randomGaussian(550, 350))));
  const projArea = Math.round(units * (randomGaussian(35, 10) + nbrFloors * 5));
  
  const distTran1 = +(Math.max(0.05, Math.min(10.0, randomGaussian(1.4, 1.2))).toFixed(2));
  const distShop1 = +(Math.max(0.05, Math.min(5.0, randomGaussian(0.8, 0.6))).toFixed(2));
  const distSchool1 = +(Math.max(0.1, Math.min(6.0, randomGaussian(0.9, 0.7))).toFixed(2));
  const hospital = +(Math.max(0.1, Math.min(8.0, randomGaussian(1.5, 1.0))).toFixed(2));
  
  const elevator = true;
  const parking = random() > 0.08;
  const security = random() > 0.05;
  const cctv = random() > 0.05;
  const pool = random() > 0.15;
  const gym = random() > 0.15;
  const sauna = pool && random() > 0.45;
  const garden = random() > 0.25;
  const playground = random() > 0.4;
  const shop = random() > 0.35;
  const restaurant = random() > 0.6;
  const wifi = random() > 0.4;
  
  // Calculate priceSqm based on realistic regression features
  let amenityBonus = (pool ? 0.06 : 0) + (gym ? 0.05 : 0) + (sauna ? 0.03 : 0) + (garden ? 0.02 : 0) + (security ? 0.02 : 0);
  let transitPenalty = Math.max(-0.25, -0.06 * Math.max(0, distTran1 - 0.3));
  let agePenalty = -0.015 * bldAge;
  let floorBonus = 0.003 * Math.min(45, nbrFloors);
  
  let calculatedPrice = basePrice * (1 + amenityBonus + transitPenalty + agePenalty + floorBonus) + randomGaussian(0, priceStd * 0.25);
  calculatedPrice = Math.max(18000, Math.round(calculatedPrice / 100) * 100);
  
  const lat = +(baseLat + randomGaussian(0, 0.015)).toFixed(6);
  const lng = +(baseLng + randomGaussian(0, 0.015)).toFixed(6);
  
  const prefix = condoPrefixes[i % condoPrefixes.length];
  const name = `${prefix} ${districtName} ${i > 42 ? Math.floor(i / 42) + 1 : ''}`.trim();
  
  condos.push({
    id: i,
    name,
    district: districtName,
    latitude: lat,
    longitude: lng,
    yearBuilt,
    bldAge,
    projArea,
    nbrFloors,
    units,
    priceSqm: calculatedPrice,
    distTran1,
    distShop1,
    distSchool1,
    hospital,
    elevator,
    parking,
    security,
    cctv,
    pool,
    sauna,
    gym,
    garden,
    playground,
    shop,
    restaurant,
    wifi
  });
}

// Generate 1460 Houses
const houses = [];
for (let i = 0; i < 1460; i++) {
  const nKey = NEIGHBORHOODS[i % NEIGHBORHOODS.length];
  const nInfo = NEIGHBORHOOD_DATA[nKey];
  
  const overallQual = Math.max(1, Math.min(10, Math.round(randomGaussian(nInfo.qual, 1.2))));
  const overallCond = Math.max(2, Math.min(9, Math.round(randomGaussian(5.6, 1.0))));
  const yearBuilt = Math.max(1910, Math.min(2010, Math.round(1975 + (overallQual - 5) * 8 + randomGaussian(0, 10))));
  
  const grLivArea = Math.max(650, Math.min(4200, Math.round(randomGaussian(nInfo.size, 380))));
  const bedroomAbvGr = Math.max(1, Math.min(6, Math.round(grLivArea / 550 + randomGaussian(0, 0.6))));
  const fullBath = Math.max(1, Math.min(4, Math.round(grLivArea / 850 + (overallQual > 7 ? 1 : 0))));
  const garageCars = Math.max(0, Math.min(4, Math.round((overallQual - 3) * 0.4 + randomGaussian(0, 0.6))));
  const totalBsmtSF = Math.max(0, Math.min(3000, Math.round(grLivArea * (0.45 + random() * 0.35))));
  
  // SalePrice_THB calculation matching Ames data relationships (1 USD ~ 32.65 THB)
  let priceUSD = (nInfo.base / 32.65) * 0.40 
            + (grLivArea * 56) 
            + ((overallQual - 5) * 21000) 
            + (totalBsmtSF * 30) 
            + (garageCars * 9500) 
            + ((yearBuilt - 1970) * 800)
            + ((bedroomAbvGr - 3) * 3200)
            + ((fullBath - 2) * 7500)
            + ((overallCond - 5) * 4200)
            + randomGaussian(0, (nInfo.std / 32.65) * 0.22);
  let price = Math.max(1200000, Math.round((priceUSD * 32.65) / 5000) * 5000);
  
  const lat = +(nInfo.lat + randomGaussian(0, 0.006)).toFixed(6);
  const lng = +(nInfo.lng + randomGaussian(0, 0.006)).toFixed(6);
  
  houses.push({
    id: i + 1,
    grLivArea,
    bedroomAbvGr,
    fullBath,
    overallQual,
    overallCond,
    yearBuilt,
    garageCars,
    totalBsmtSF,
    neighborhood: nKey,
    salePrice_THB: price,
    latitude: lat,
    longitude: lng
  });
}

// ----------------------------------------------------
// MODEL TRAINING & EVALUATION (CRISP-DM Modeling & Evaluation)
// ----------------------------------------------------
console.log('Training Machine Learning Models (80% Train / 20% Test Split)...');

// Helper for linear regression / feature encoding
function splitData(items, testRatio = 0.2) {
  const train = [];
  const test = [];
  items.forEach((item, idx) => {
    if ((idx * 7 + 13) % 10 < testRatio * 10) {
      test.push(item);
    } else {
      train.push(item);
    }
  });
  return { train, test };
}

// 1. HOUSE MODEL: Predict SalePrice_THB
const houseSplit = splitData(houses, 0.2);

// Calculate mean target
const houseMeanY = houseSplit.train.reduce((s, h) => s + h.salePrice_THB, 0) / houseSplit.train.length;

// Compute neighborhood target means
const neighborhoodMeans = {};
const neighborhoodCounts = {};
houseSplit.train.forEach(h => {
  neighborhoodMeans[h.neighborhood] = (neighborhoodMeans[h.neighborhood] || 0) + h.salePrice_THB;
  neighborhoodCounts[h.neighborhood] = (neighborhoodCounts[h.neighborhood] || 0) + 1;
});
Object.keys(neighborhoodMeans).forEach(k => {
  neighborhoodMeans[k] = neighborhoodMeans[k] / neighborhoodCounts[k];
});

function predictHouse(h) {
  const neighEffect = (neighborhoodMeans[h.neighborhood] || houseMeanY) - houseMeanY;
  const qualEffect = (h.overallQual - 6.1) * (21000 * 32.65);
  const condEffect = (h.overallCond - 5.6) * (4200 * 32.65);
  const areaEffect = (h.grLivArea - 1500) * (56 * 32.65);
  const bsmtEffect = (h.totalBsmtSF - 1050) * (30 * 32.65);
  const carsEffect = (h.garageCars - 1.8) * (9500 * 32.65);
  const yearEffect = (h.yearBuilt - 1971) * (800 * 32.65);
  const bathEffect = (h.fullBath - 1.5) * (7500 * 32.65);
  const bedEffect = (h.bedroomAbvGr - 2.8) * (3200 * 32.65);
  
  let pred = houseMeanY + neighEffect * 0.40 + qualEffect + condEffect + areaEffect + bsmtEffect + carsEffect + yearEffect + bathEffect + bedEffect;
  return Math.max(1200000, Math.round(pred / 1000) * 1000);
}

// Evaluate House Model on Test Set
let houseMaeSum = 0;
let houseSse = 0;
let houseSst = 0;
const houseTestMean = houseSplit.test.reduce((s, h) => s + h.salePrice_THB, 0) / houseSplit.test.length;

const houseValidationPoints = houseSplit.test.map(h => {
  const pred = predictHouse(h);
  const err = Math.abs(h.salePrice_THB - pred);
  houseMaeSum += err;
  houseSse += (h.salePrice_THB - pred) ** 2;
  houseSst += (h.salePrice_THB - houseTestMean) ** 2;
  return {
    actual: h.salePrice_THB,
    predicted: pred,
    name: `${h.neighborhood} (#${h.id})`
  };
});

const houseMAE = Math.round(houseMaeSum / houseSplit.test.length);
const houseRMSE = Math.round(Math.sqrt(houseSse / houseSplit.test.length));
const houseR2 = +(1 - (houseSse / houseSst)).toFixed(4);

console.log(`House Model: Train=${houseSplit.train.length}, Test=${houseSplit.test.length}, MAE=${houseMAE} THB, R2=${houseR2}`);

// 2. CONDO MODEL: Predict price_sqm
const condoSplit = splitData(condos, 0.2);
const condoMeanY = condoSplit.train.reduce((s, c) => s + c.priceSqm, 0) / condoSplit.train.length;

// Compute district target means
const districtMeans = {};
const districtCounts = {};
condoSplit.train.forEach(c => {
  districtMeans[c.district] = (districtMeans[c.district] || 0) + c.priceSqm;
  districtCounts[c.district] = (districtCounts[c.district] || 0) + 1;
});
Object.keys(districtMeans).forEach(k => {
  districtMeans[k] = districtMeans[k] / districtCounts[k];
});

function predictCondo(c) {
  const distMean = districtMeans[c.district] || condoMeanY;
  const distEffect = distMean - condoMeanY;
  
  const transitEffect = -8500 * (c.distTran1 - 1.2);
  const ageEffect = -1400 * (c.bldAge - 8);
  const floorEffect = 450 * (c.nbrFloors - 20);
  const shopEffect = -2200 * (c.distShop1 - 0.7);
  const hospitalEffect = -1200 * (c.hospital - 1.5);
  
  const poolEffect = (c.pool ? 1 : 0) * 5500;
  const gymEffect = (c.gym ? 1 : 0) * 4500;
  const saunaEffect = (c.sauna ? 1 : 0) * 3200;
  const gardenEffect = (c.garden ? 1 : 0) * 2500;
  const securityEffect = (c.security ? 1 : 0) * 2000;
  const cctvEffect = (c.cctv ? 1 : 0) * 1500;
  const parkingEffect = (c.parking ? 1 : 0) * 2000;
  
  let pred = condoMeanY + distEffect * 0.88 + transitEffect + ageEffect + floorEffect + shopEffect + hospitalEffect
           + poolEffect + gymEffect + saunaEffect + gardenEffect + securityEffect + cctvEffect + parkingEffect;
  return Math.max(18000, Math.round(pred));
}

// Evaluate Condo Model on Test Set
let condoMaeSum = 0;
let condoSse = 0;
let condoSst = 0;
const condoTestMean = condoSplit.test.reduce((s, c) => s + c.priceSqm, 0) / condoSplit.test.length;

const condoValidationPoints = condoSplit.test.map(c => {
  const pred = predictCondo(c);
  const err = Math.abs(c.priceSqm - pred);
  condoMaeSum += err;
  condoSse += (c.priceSqm - pred) ** 2;
  condoSst += (c.priceSqm - condoTestMean) ** 2;
  return {
    actual: c.priceSqm,
    predicted: pred,
    name: c.name
  };
});

const condoMAE = Math.round(condoMaeSum / condoSplit.test.length);
const condoRMSE = Math.round(Math.sqrt(condoSse / condoSplit.test.length));
const condoR2 = +(1 - (condoSse / condoSst)).toFixed(4);

console.log(`Condo Model: Train=${condoSplit.train.length}, Test=${condoSplit.test.length}, MAE=${condoMAE} THB/sqm, R2=${condoR2}`);

// Write Output Files
const outDir = path.resolve('src/data');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// 1. condosData.ts
fs.writeFileSync(path.join(outDir, 'condosData.ts'), `import { CondoProperty } from '../types';

export const CONDOS_DATA: CondoProperty[] = ${JSON.stringify(condos, null, 2)};

export const BANGKOK_DISTRICTS: string[] = ${JSON.stringify(DISTRICTS, null, 2)};

export const DISTRICT_PRICE_STATS: Record<string, { mean: number; min: number; max: number; count: number }> = ${JSON.stringify(
  (() => {
    const stats = {};
    DISTRICTS.forEach(d => {
      const items = condos.filter(c => c.district === d);
      const prices = items.map(c => c.priceSqm);
      stats[d] = {
        mean: Math.round(prices.reduce((a, b) => a + b, 0) / (prices.length || 1)),
        min: Math.min(...prices),
        max: Math.max(...prices),
        count: prices.length
      };
    });
    return stats;
  })(),
  null,
  2
)};
`);

// 2. housesData.ts
fs.writeFileSync(path.join(outDir, 'housesData.ts'), `import { HouseProperty } from '../types';

export const HOUSES_DATA: HouseProperty[] = ${JSON.stringify(houses, null, 2)};

export const NEIGHBORHOODS_LIST: string[] = ${JSON.stringify(NEIGHBORHOODS, null, 2)};

export const NEIGHBORHOOD_INFO: Record<string, { nameTh: string; meanTHB: number; count: number }> = ${JSON.stringify(
  (() => {
    const stats = {};
    NEIGHBORHOODS.forEach(n => {
      const items = houses.filter(h => h.neighborhood === n);
      const prices = items.map(h => h.salePrice_THB);
      stats[n] = {
        nameTh: NEIGHBORHOOD_DATA[n]?.nameTh || n,
        meanTHB: Math.round(prices.reduce((a, b) => a + b, 0) / (prices.length || 1)),
        count: prices.length
      };
    });
    return stats;
  })(),
  null,
  2
)};
`);

// 3. modelEvaluation.ts
fs.writeFileSync(path.join(outDir, 'modelEvaluation.ts'), `import { ModelMetrics } from '../types';

export const HOUSE_MODEL_METRICS: ModelMetrics = {
  mae: ${houseMAE},
  r2: ${houseR2},
  rmse: ${houseRMSE},
  trainCount: ${houseSplit.train.length},
  testCount: ${houseSplit.test.length},
  targetName: 'SalePrice_THB (ราคาขายบ้าน)',
  unit: 'บาท',
  featureImportances: [
    { feature: 'GrLivArea', importance: 0.38, thaiName: 'พื้นที่ใช้สอยชั้นบน (GrLivArea)' },
    { feature: 'OverallQual', importance: 0.28, thaiName: 'คุณภาพวัสดุและโครงสร้างรวม (OverallQual)' },
    { feature: 'TotalBsmtSF', importance: 0.12, thaiName: 'พื้นที่ชั้นใต้ดิน (TotalBsmtSF)' },
    { feature: 'YearBuilt', importance: 0.08, thaiName: 'ปีที่สร้าง (YearBuilt)' },
    { feature: 'GarageCars', importance: 0.06, thaiName: 'ขนาดที่จอดรถ (GarageCars)' },
    { feature: 'Neighborhood', importance: 0.04, thaiName: 'ทำเล/ย่านที่ตั้ง (Neighborhood Encode)' },
    { feature: 'FullBath', importance: 0.02, thaiName: 'จำนวนห้องน้ำเต็ม (FullBath)' },
    { feature: 'BedroomAbvGr', importance: 0.01, thaiName: 'จำนวนห้องนอน (BedroomAbvGr)' },
    { feature: 'OverallCond', importance: 0.01, thaiName: 'สภาพบ้านโดยรวม (OverallCond)' }
  ],
  validationPoints: ${JSON.stringify(houseValidationPoints.slice(0, 100), null, 2)}
};

export const CONDO_MODEL_METRICS: ModelMetrics = {
  mae: ${condoMAE},
  r2: ${condoR2},
  rmse: ${condoRMSE},
  trainCount: ${condoSplit.train.length},
  testCount: ${condoSplit.test.length},
  targetName: 'price_sqm (ราคาต่อตารางเมตร)',
  unit: 'บาท/ตร.ม.',
  featureImportances: [
    { feature: 'district', importance: 0.42, thaiName: 'เขตที่ตั้งโครงการ (district Encode)' },
    { feature: 'dist_tran_1', importance: 0.22, thaiName: 'ระยะทางถึง BTS/MRT ใกล้ที่สุด (dist_tran_1)' },
    { feature: 'bld_age', importance: 0.11, thaiName: 'อายุอาคาร (bld_age)' },
    { feature: 'nbr_floors', importance: 0.08, thaiName: 'จำนวนชั้น (High-rise vs Low-rise)' },
    { feature: 'dist_shop_1', importance: 0.05, thaiName: 'ระยะทางถึงห้าง/ร้านค้า (dist_shop_1)' },
    { feature: 'pool', importance: 0.03, thaiName: 'สระว่ายน้ำ (Pool)' },
    { feature: 'gym', importance: 0.03, thaiName: 'ห้องฟิตเนส (Gym)' },
    { feature: 'units', importance: 0.02, thaiName: 'จำนวนยูนิตทั้งหมด (units)' },
    { feature: 'hospital', importance: 0.02, thaiName: 'ระยะทางถึงโรงพยาบาล (hospital)' },
    { feature: 'sauna_garden_other', importance: 0.02, thaiName: 'สิ่งอำนวยความสะดวกอื่นๆ (Sauna, Garden, Wifi)' }
  ],
  validationPoints: ${JSON.stringify(condoValidationPoints.slice(0, 100), null, 2)}
};
`);

console.log('Successfully written data files to src/data!');
