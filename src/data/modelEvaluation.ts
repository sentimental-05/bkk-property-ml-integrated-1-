import { ModelMetrics } from '../types';

export const HOUSE_MODEL_METRICS: ModelMetrics = {
  mae: 580455,
  r2: 0.9334,
  rmse: 696855,
  trainCount: 1168,
  testCount: 292,
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
  validationPoints: [
  {
    "actual": 7830000,
    "predicted": 8350000,
    "name": "Veenker (#2)"
  },
  {
    "actual": 6050000,
    "predicted": 6579000,
    "name": "Mitchel (#5)"
  },
  {
    "actual": 4395000,
    "predicted": 4617000,
    "name": "NAmes (#12)"
  },
  {
    "actual": 4295000,
    "predicted": 4297000,
    "name": "MeadowV (#15)"
  },
  {
    "actual": 7000000,
    "predicted": 7657000,
    "name": "Blmngtn (#22)"
  },
  {
    "actual": 6660000,
    "predicted": 7151000,
    "name": "Blueste (#25)"
  },
  {
    "actual": 10975000,
    "predicted": 10894000,
    "name": "NWAmes (#32)"
  },
  {
    "actual": 4155000,
    "predicted": 4289000,
    "name": "Sawyer (#35)"
  },
  {
    "actual": 8395000,
    "predicted": 9448000,
    "name": "Timber (#42)"
  },
  {
    "actual": 4815000,
    "predicted": 5741000,
    "name": "ClearCr (#45)"
  },
  {
    "actual": 8735000,
    "predicted": 9187000,
    "name": "Veenker (#52)"
  },
  {
    "actual": 6885000,
    "predicted": 7405000,
    "name": "Mitchel (#55)"
  },
  {
    "actual": 5055000,
    "predicted": 5923000,
    "name": "NAmes (#62)"
  },
  {
    "actual": 3075000,
    "predicted": 3287000,
    "name": "MeadowV (#65)"
  },
  {
    "actual": 6830000,
    "predicted": 7650000,
    "name": "Blmngtn (#72)"
  },
  {
    "actual": 5415000,
    "predicted": 5983000,
    "name": "Blueste (#75)"
  },
  {
    "actual": 8795000,
    "predicted": 9278000,
    "name": "NWAmes (#82)"
  },
  {
    "actual": 8380000,
    "predicted": 8958000,
    "name": "Sawyer (#85)"
  },
  {
    "actual": 9760000,
    "predicted": 10472000,
    "name": "Timber (#92)"
  },
  {
    "actual": 10990000,
    "predicted": 11687000,
    "name": "ClearCr (#95)"
  },
  {
    "actual": 10275000,
    "predicted": 10737000,
    "name": "Veenker (#102)"
  },
  {
    "actual": 8030000,
    "predicted": 8344000,
    "name": "Mitchel (#105)"
  },
  {
    "actual": 6225000,
    "predicted": 6769000,
    "name": "NAmes (#112)"
  },
  {
    "actual": 8905000,
    "predicted": 9073000,
    "name": "MeadowV (#115)"
  },
  {
    "actual": 11470000,
    "predicted": 12508000,
    "name": "Blmngtn (#122)"
  },
  {
    "actual": 7995000,
    "predicted": 8343000,
    "name": "Blueste (#125)"
  },
  {
    "actual": 5815000,
    "predicted": 7180000,
    "name": "NWAmes (#132)"
  },
  {
    "actual": 8820000,
    "predicted": 8723000,
    "name": "Sawyer (#135)"
  },
  {
    "actual": 11885000,
    "predicted": 12772000,
    "name": "Timber (#142)"
  },
  {
    "actual": 5430000,
    "predicted": 6480000,
    "name": "ClearCr (#145)"
  },
  {
    "actual": 13615000,
    "predicted": 14737000,
    "name": "Veenker (#152)"
  },
  {
    "actual": 8240000,
    "predicted": 8436000,
    "name": "Mitchel (#155)"
  },
  {
    "actual": 4685000,
    "predicted": 5198000,
    "name": "NAmes (#162)"
  },
  {
    "actual": 2185000,
    "predicted": 2442000,
    "name": "MeadowV (#165)"
  },
  {
    "actual": 6890000,
    "predicted": 8059000,
    "name": "Blmngtn (#172)"
  },
  {
    "actual": 5755000,
    "predicted": 6237000,
    "name": "Blueste (#175)"
  },
  {
    "actual": 8925000,
    "predicted": 9268000,
    "name": "NWAmes (#182)"
  },
  {
    "actual": 5710000,
    "predicted": 5737000,
    "name": "Sawyer (#185)"
  },
  {
    "actual": 9855000,
    "predicted": 10477000,
    "name": "Timber (#192)"
  },
  {
    "actual": 11975000,
    "predicted": 12872000,
    "name": "ClearCr (#195)"
  },
  {
    "actual": 13225000,
    "predicted": 14443000,
    "name": "Veenker (#202)"
  },
  {
    "actual": 6005000,
    "predicted": 6796000,
    "name": "Mitchel (#205)"
  },
  {
    "actual": 5340000,
    "predicted": 5396000,
    "name": "NAmes (#212)"
  },
  {
    "actual": 2105000,
    "predicted": 2145000,
    "name": "MeadowV (#215)"
  },
  {
    "actual": 9360000,
    "predicted": 10007000,
    "name": "Blmngtn (#222)"
  },
  {
    "actual": 3935000,
    "predicted": 4502000,
    "name": "Blueste (#225)"
  },
  {
    "actual": 6610000,
    "predicted": 7442000,
    "name": "NWAmes (#232)"
  },
  {
    "actual": 6300000,
    "predicted": 6606000,
    "name": "Sawyer (#235)"
  },
  {
    "actual": 12395000,
    "predicted": 13462000,
    "name": "Timber (#242)"
  },
  {
    "actual": 10420000,
    "predicted": 11481000,
    "name": "ClearCr (#245)"
  },
  {
    "actual": 10025000,
    "predicted": 10609000,
    "name": "Veenker (#252)"
  },
  {
    "actual": 7505000,
    "predicted": 7562000,
    "name": "Mitchel (#255)"
  },
  {
    "actual": 7925000,
    "predicted": 8600000,
    "name": "NAmes (#262)"
  },
  {
    "actual": 1370000,
    "predicted": 1406000,
    "name": "MeadowV (#265)"
  },
  {
    "actual": 5875000,
    "predicted": 7034000,
    "name": "Blmngtn (#272)"
  },
  {
    "actual": 4815000,
    "predicted": 5496000,
    "name": "Blueste (#275)"
  },
  {
    "actual": 8955000,
    "predicted": 9558000,
    "name": "NWAmes (#282)"
  },
  {
    "actual": 8320000,
    "predicted": 8575000,
    "name": "Sawyer (#285)"
  },
  {
    "actual": 9660000,
    "predicted": 10612000,
    "name": "Timber (#292)"
  },
  {
    "actual": 9855000,
    "predicted": 11008000,
    "name": "ClearCr (#295)"
  },
  {
    "actual": 10995000,
    "predicted": 11992000,
    "name": "Veenker (#302)"
  },
  {
    "actual": 2750000,
    "predicted": 3185000,
    "name": "Mitchel (#305)"
  },
  {
    "actual": 6495000,
    "predicted": 6843000,
    "name": "NAmes (#312)"
  },
  {
    "actual": 5235000,
    "predicted": 5483000,
    "name": "MeadowV (#315)"
  },
  {
    "actual": 8745000,
    "predicted": 9890000,
    "name": "Blmngtn (#322)"
  },
  {
    "actual": 7000000,
    "predicted": 7563000,
    "name": "Blueste (#325)"
  },
  {
    "actual": 7170000,
    "predicted": 7822000,
    "name": "NWAmes (#332)"
  },
  {
    "actual": 4000000,
    "predicted": 4174000,
    "name": "Sawyer (#335)"
  },
  {
    "actual": 10595000,
    "predicted": 11822000,
    "name": "Timber (#342)"
  },
  {
    "actual": 10720000,
    "predicted": 11457000,
    "name": "ClearCr (#345)"
  },
  {
    "actual": 10320000,
    "predicted": 11241000,
    "name": "Veenker (#352)"
  },
  {
    "actual": 10015000,
    "predicted": 10379000,
    "name": "Mitchel (#355)"
  },
  {
    "actual": 6625000,
    "predicted": 7086000,
    "name": "NAmes (#362)"
  },
  {
    "actual": 2875000,
    "predicted": 3041000,
    "name": "MeadowV (#365)"
  },
  {
    "actual": 11280000,
    "predicted": 12175000,
    "name": "Blmngtn (#372)"
  },
  {
    "actual": 5345000,
    "predicted": 5903000,
    "name": "Blueste (#375)"
  },
  {
    "actual": 9615000,
    "predicted": 10101000,
    "name": "NWAmes (#382)"
  },
  {
    "actual": 6840000,
    "predicted": 7117000,
    "name": "Sawyer (#385)"
  },
  {
    "actual": 11555000,
    "predicted": 12595000,
    "name": "Timber (#392)"
  },
  {
    "actual": 7395000,
    "predicted": 8542000,
    "name": "ClearCr (#395)"
  },
  {
    "actual": 7750000,
    "predicted": 8200000,
    "name": "Veenker (#402)"
  },
  {
    "actual": 4555000,
    "predicted": 4717000,
    "name": "Mitchel (#405)"
  },
  {
    "actual": 5945000,
    "predicted": 6740000,
    "name": "NAmes (#412)"
  },
  {
    "actual": 5690000,
    "predicted": 5888000,
    "name": "MeadowV (#415)"
  },
  {
    "actual": 6720000,
    "predicted": 7601000,
    "name": "Blmngtn (#422)"
  },
  {
    "actual": 6270000,
    "predicted": 6770000,
    "name": "Blueste (#425)"
  },
  {
    "actual": 7950000,
    "predicted": 8569000,
    "name": "NWAmes (#432)"
  },
  {
    "actual": 7290000,
    "predicted": 7513000,
    "name": "Sawyer (#435)"
  },
  {
    "actual": 9650000,
    "predicted": 10667000,
    "name": "Timber (#442)"
  },
  {
    "actual": 9695000,
    "predicted": 10638000,
    "name": "ClearCr (#445)"
  },
  {
    "actual": 10375000,
    "predicted": 11059000,
    "name": "Veenker (#452)"
  },
  {
    "actual": 7915000,
    "predicted": 8384000,
    "name": "Mitchel (#455)"
  },
  {
    "actual": 4985000,
    "predicted": 5259000,
    "name": "NAmes (#462)"
  },
  {
    "actual": 2025000,
    "predicted": 1998000,
    "name": "MeadowV (#465)"
  },
  {
    "actual": 4365000,
    "predicted": 5143000,
    "name": "Blmngtn (#472)"
  },
  {
    "actual": 5225000,
    "predicted": 5818000,
    "name": "Blueste (#475)"
  },
  {
    "actual": 6415000,
    "predicted": 6764000,
    "name": "NWAmes (#482)"
  },
  {
    "actual": 7290000,
    "predicted": 7531000,
    "name": "Sawyer (#485)"
  },
  {
    "actual": 10910000,
    "predicted": 11105000,
    "name": "Timber (#492)"
  },
  {
    "actual": 10820000,
    "predicted": 11186000,
    "name": "ClearCr (#495)"
  }
]
};

export const CONDO_MODEL_METRICS: ModelMetrics = {
  mae: 16621,
  r2: 0.8314,
  rmse: 18955,
  trainCount: 815,
  testCount: 204,
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
  validationPoints: [
  {
    "actual": 58000,
    "predicted": 82386,
    "name": "Ideo Bang Khae"
  },
  {
    "actual": 36500,
    "predicted": 58882,
    "name": "Ashton Bang Khun Thian"
  },
  {
    "actual": 51700,
    "predicted": 86551,
    "name": "Life Bueng Kum"
  },
  {
    "actual": 91400,
    "predicted": 112265,
    "name": "Whizdom Din Daeng"
  },
  {
    "actual": 49400,
    "predicted": 68021,
    "name": "Modiz Lak Si"
  },
  {
    "actual": 35600,
    "predicted": 37966,
    "name": "The Line Min Buri"
  },
  {
    "actual": 73300,
    "predicted": 97276,
    "name": "Supalai Prime Rat Burana"
  },
  {
    "actual": 134800,
    "predicted": 143676,
    "name": "Casa Condo Samphanthawong"
  },
  {
    "actual": 112100,
    "predicted": 135361,
    "name": "City Home Yan Nawa"
  },
  {
    "actual": 49200,
    "predicted": 75875,
    "name": "Elio Del Bang Khen 2"
  },
  {
    "actual": 88400,
    "predicted": 94740,
    "name": "Lumpini Ville Bangkok Noi 2"
  },
  {
    "actual": 78600,
    "predicted": 78030,
    "name": "Rhythm Chatuchak 2"
  },
  {
    "actual": 122100,
    "predicted": 126896,
    "name": "Centric Khlong San 2"
  },
  {
    "actual": 54900,
    "predicted": 83408,
    "name": "Chateau In Town Lat Krabang 2"
  },
  {
    "actual": 108500,
    "predicted": 128113,
    "name": "Chapter One Pom Prap Sattru Phai 2"
  },
  {
    "actual": 143800,
    "predicted": 163422,
    "name": "Lumpini Place Ratchathewi 2"
  },
  {
    "actual": 48100,
    "predicted": 58804,
    "name": "Chewathai Wang Thonglang 2"
  },
  {
    "actual": 55800,
    "predicted": 79160,
    "name": "The Base Bang Kapi 3"
  },
  {
    "actual": 97600,
    "predicted": 144280,
    "name": "Park Origin Bang Rak 3"
  },
  {
    "actual": 56900,
    "predicted": 67021,
    "name": "The Tree Bangkok Yai 3"
  },
  {
    "actual": 98400,
    "predicted": 104783,
    "name": "Noble Huai Khwang 3"
  },
  {
    "actual": 149200,
    "predicted": 163713,
    "name": "Plum Condo Khlong Toei 3"
  },
  {
    "actual": 119200,
    "predicted": 125116,
    "name": "U Delight Phaya Thai 3"
  },
  {
    "actual": 54500,
    "predicted": 77375,
    "name": "The Room Prawet 3"
  },
  {
    "actual": 82400,
    "predicted": 102903,
    "name": "Ideo Taling Chan 3"
  },
  {
    "actual": 152200,
    "predicted": 173488,
    "name": "Ashton Watthana 3"
  },
  {
    "actual": 73100,
    "predicted": 77583,
    "name": "Life Bang Na 4"
  },
  {
    "actual": 99100,
    "predicted": 108698,
    "name": "Whizdom Bang Sue 4"
  },
  {
    "actual": 46300,
    "predicted": 74486,
    "name": "Modiz Don Mueang 4"
  },
  {
    "actual": 46400,
    "predicted": 67858,
    "name": "The Line Khan Na Yao 4"
  },
  {
    "actual": 267600,
    "predicted": 254941,
    "name": "Supalai Prime Pathum Wan 4"
  },
  {
    "actual": 96300,
    "predicted": 102914,
    "name": "Casa Condo Phra Khanong 4"
  },
  {
    "actual": 139100,
    "predicted": 163135,
    "name": "City Home Sathon 4"
  },
  {
    "actual": 86900,
    "predicted": 95314,
    "name": "Elio Del Thon Buri 4"
  },
  {
    "actual": 88000,
    "predicted": 123687,
    "name": "Lumpini Ville Bang Kho Laem 5"
  },
  {
    "actual": 73700,
    "predicted": 96296,
    "name": "Rhythm Bang Phlat 5"
  },
  {
    "actual": 65100,
    "predicted": 81085,
    "name": "Centric Chom Thong 5"
  },
  {
    "actual": 83200,
    "predicted": 108590,
    "name": "Chateau In Town Dusit 5"
  },
  {
    "actual": 91900,
    "predicted": 114366,
    "name": "Chapter One Lat Phrao 5"
  },
  {
    "actual": 66200,
    "predicted": 84504,
    "name": "Lumpini Place Phasi Charoen 5"
  },
  {
    "actual": 42500,
    "predicted": 70808,
    "name": "Chewathai Sai Mai 5"
  },
  {
    "actual": 74900,
    "predicted": 85472,
    "name": "The Base Suan Luang 5"
  },
  {
    "actual": 46400,
    "predicted": 62637,
    "name": "Park Origin Bang Khae 6"
  },
  {
    "actual": 43200,
    "predicted": 63324,
    "name": "The Tree Bang Khun Thian 6"
  },
  {
    "actual": 46600,
    "predicted": 74610,
    "name": "Noble Bueng Kum 6"
  },
  {
    "actual": 103900,
    "predicted": 107288,
    "name": "Plum Condo Din Daeng 6"
  },
  {
    "actual": 64100,
    "predicted": 85568,
    "name": "U Delight Lak Si 6"
  },
  {
    "actual": 43500,
    "predicted": 73575,
    "name": "The Room Min Buri 6"
  },
  {
    "actual": 45300,
    "predicted": 60159,
    "name": "Ideo Rat Burana 6"
  },
  {
    "actual": 125400,
    "predicted": 150736,
    "name": "Ashton Samphanthawong 6"
  },
  {
    "actual": 103600,
    "predicted": 106260,
    "name": "Life Yan Nawa 6"
  },
  {
    "actual": 49500,
    "predicted": 66460,
    "name": "Whizdom Bang Khen 7"
  },
  {
    "actual": 79000,
    "predicted": 90177,
    "name": "Modiz Bangkok Noi 7"
  },
  {
    "actual": 98800,
    "predicted": 115320,
    "name": "The Line Chatuchak 7"
  },
  {
    "actual": 118900,
    "predicted": 128804,
    "name": "Supalai Prime Khlong San 7"
  },
  {
    "actual": 47700,
    "predicted": 64041,
    "name": "Casa Condo Lat Krabang 7"
  },
  {
    "actual": 103600,
    "predicted": 111681,
    "name": "City Home Pom Prap Sattru Phai 7"
  },
  {
    "actual": 178900,
    "predicted": 157324,
    "name": "Elio Del Ratchathewi 7"
  },
  {
    "actual": 58500,
    "predicted": 74590,
    "name": "Lumpini Ville Wang Thonglang 7"
  },
  {
    "actual": 59600,
    "predicted": 72992,
    "name": "Rhythm Bang Kapi 8"
  },
  {
    "actual": 120400,
    "predicted": 133831,
    "name": "Centric Bang Rak 8"
  },
  {
    "actual": 65500,
    "predicted": 81174,
    "name": "Chateau In Town Bangkok Yai 8"
  },
  {
    "actual": 112300,
    "predicted": 126672,
    "name": "Chapter One Huai Khwang 8"
  },
  {
    "actual": 174500,
    "predicted": 169677,
    "name": "Lumpini Place Khlong Toei 8"
  },
  {
    "actual": 130300,
    "predicted": 151680,
    "name": "Chewathai Phaya Thai 8"
  },
  {
    "actual": 61000,
    "predicted": 90392,
    "name": "The Base Prawet 8"
  },
  {
    "actual": 51400,
    "predicted": 55759,
    "name": "Park Origin Taling Chan 8"
  },
  {
    "actual": 149300,
    "predicted": 165856,
    "name": "The Tree Watthana 8"
  },
  {
    "actual": 85700,
    "predicted": 105110,
    "name": "Noble Bang Na 9"
  },
  {
    "actual": 96000,
    "predicted": 111261,
    "name": "Plum Condo Bang Sue 9"
  },
  {
    "actual": 56200,
    "predicted": 96323,
    "name": "U Delight Don Mueang 9"
  },
  {
    "actual": 40300,
    "predicted": 45668,
    "name": "The Room Khan Na Yao 9"
  },
  {
    "actual": 252000,
    "predicted": 255337,
    "name": "Ideo Pathum Wan 9"
  },
  {
    "actual": 95300,
    "predicted": 99770,
    "name": "Ashton Phra Khanong 9"
  },
  {
    "actual": 149000,
    "predicted": 157990,
    "name": "Life Sathon 9"
  },
  {
    "actual": 74100,
    "predicted": 100972,
    "name": "Whizdom Thon Buri 9"
  },
  {
    "actual": 133800,
    "predicted": 132627,
    "name": "Modiz Bang Kho Laem 10"
  },
  {
    "actual": 74500,
    "predicted": 90411,
    "name": "The Line Bang Phlat 10"
  },
  {
    "actual": 64000,
    "predicted": 69890,
    "name": "Supalai Prime Chom Thong 10"
  },
  {
    "actual": 93700,
    "predicted": 110294,
    "name": "Casa Condo Dusit 10"
  },
  {
    "actual": 85800,
    "predicted": 101062,
    "name": "City Home Lat Phrao 10"
  },
  {
    "actual": 67000,
    "predicted": 90780,
    "name": "Elio Del Phasi Charoen 10"
  },
  {
    "actual": 42200,
    "predicted": 68357,
    "name": "Lumpini Ville Sai Mai 10"
  },
  {
    "actual": 70200,
    "predicted": 79587,
    "name": "Rhythm Suan Luang 10"
  },
  {
    "actual": 73800,
    "predicted": 101925,
    "name": "Centric Bang Khae 11"
  },
  {
    "actual": 40800,
    "predicted": 60476,
    "name": "Chateau In Town Bang Khun Thian 11"
  },
  {
    "actual": 42500,
    "predicted": 55086,
    "name": "Chapter One Bueng Kum 11"
  },
  {
    "actual": 72600,
    "predicted": 86078,
    "name": "Lumpini Place Din Daeng 11"
  },
  {
    "actual": 65100,
    "predicted": 77663,
    "name": "Chewathai Lak Si 11"
  },
  {
    "actual": 35000,
    "predicted": 54549,
    "name": "The Base Min Buri 11"
  },
  {
    "actual": 61700,
    "predicted": 77106,
    "name": "Park Origin Rat Burana 11"
  },
  {
    "actual": 136200,
    "predicted": 144931,
    "name": "The Tree Samphanthawong 11"
  },
  {
    "actual": 102000,
    "predicted": 104094,
    "name": "Noble Yan Nawa 11"
  },
  {
    "actual": 51300,
    "predicted": 74746,
    "name": "Plum Condo Bang Khen 12"
  },
  {
    "actual": 56100,
    "predicted": 62432,
    "name": "U Delight Bangkok Noi 12"
  },
  {
    "actual": 73100,
    "predicted": 92443,
    "name": "The Room Chatuchak 12"
  },
  {
    "actual": 124700,
    "predicted": 142073,
    "name": "Ideo Khlong San 12"
  },
  {
    "actual": 56500,
    "predicted": 78742,
    "name": "Ashton Lat Krabang 12"
  },
  {
    "actual": 108600,
    "predicted": 126969,
    "name": "Life Pom Prap Sattru Phai 12"
  },
  {
    "actual": 155500,
    "predicted": 154391,
    "name": "Whizdom Ratchathewi 12"
  }
]
};
