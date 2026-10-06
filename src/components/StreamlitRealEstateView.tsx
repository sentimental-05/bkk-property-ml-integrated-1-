import React, { useState, useEffect, useRef } from 'react';
import { getTileConfig } from '../utils/mapTiles';
import {
  Building2,
  Home,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  ChevronDown,
  Sparkles,
  Download,
  Copy,
  Check,
  Code,
  Compass,
  ArrowRight,
  TrendingUp,
  Percent,
  Calendar,
  Wallet
} from 'lucide-react';
import L from 'leaflet';

export interface BkkProperty {
  id: number;
  title: string;
  type: 'คอนโด' | 'บ้านเดี่ยว' | 'ทาวน์โฮม';
  district: string;
  price: number;
  area_sqm: number;
  price_sqm: number;
  bedrooms: number;
  bathrooms: number;
  lat: number;
  lng: number;
  image: string;
  distance_bts_km: number;
}

export const PROPERTIES_DATA: BkkProperty[] = [
  {
    id: 1,
    title: "Life Asoke Hype",
    type: "คอนโด",
    district: "ราชเทวี / อโศก-พระราม 9",
    price: 3890000,
    area_sqm: 32.0,
    price_sqm: 121562,
    bedrooms: 1,
    bathrooms: 1,
    lat: 13.7548,
    lng: 100.5638,
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
    distance_bts_km: 0.4,
  },
  {
    id: 2,
    title: "The Base Sukhumvit 50",
    type: "คอนโด",
    district: "คลองเตย / พระโขนง",
    price: 2790000,
    area_sqm: 31.5,
    price_sqm: 88571,
    bedrooms: 1,
    bathrooms: 1,
    lat: 13.7065,
    lng: 100.5982,
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
    distance_bts_km: 0.9,
  },
  {
    id: 3,
    title: "Ashton Silom",
    type: "คอนโด",
    district: "บางรัก / สีลม",
    price: 7900000,
    area_sqm: 34.0,
    price_sqm: 232352,
    bedrooms: 1,
    bathrooms: 1,
    lat: 13.7258,
    lng: 100.5284,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    distance_bts_km: 0.35,
  },
  {
    id: 4,
    title: "Siri Place Charan-Pin Klao",
    type: "ทาวน์โฮม",
    district: "บางพลัด / จรัญสนิทวงศ์",
    price: 3490000,
    area_sqm: 118.0,
    price_sqm: 29576,
    bedrooms: 3,
    bathrooms: 2,
    lat: 13.7915,
    lng: 100.4950,
    image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80",
    distance_bts_km: 1.8,
  },
  {
    id: 5,
    title: "Pleno Srinakarin-Bangna",
    type: "ทาวน์โฮม",
    district: "ประเวศ / บางนา",
    price: 2890000,
    area_sqm: 106.0,
    price_sqm: 27264,
    bedrooms: 3,
    bathrooms: 2,
    lat: 13.6702,
    lng: 100.6515,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    distance_bts_km: 3.2,
  },
  {
    id: 6,
    title: "Grande Pleno Suksawat-Rama 3",
    type: "ทาวน์โฮม",
    district: "ราษฎร์บูรณะ / สุขสวัสดิ์",
    price: 4290000,
    area_sqm: 145.0,
    price_sqm: 29586,
    bedrooms: 3,
    bathrooms: 3,
    lat: 13.6795,
    lng: 100.5090,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
    distance_bts_km: 2.5,
  },
  {
    id: 7,
    title: "Centro Rama 9-Motorway",
    type: "บ้านเดี่ยว",
    district: "สะพานสูง / กรุงเทพกรีฑา",
    price: 6890000,
    area_sqm: 190.0,
    price_sqm: 36263,
    bedrooms: 4,
    bathrooms: 3,
    lat: 13.7431,
    lng: 100.6720,
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
    distance_bts_km: 4.5,
  },
  {
    id: 8,
    title: "Bangkok Boulevard Sathorn-Pinklao",
    type: "บ้านเดี่ยว",
    district: "ตลิ่งชัน / ราชพฤกษ์",
    price: 9500000,
    area_sqm: 248.0,
    price_sqm: 38306,
    bedrooms: 4,
    bathrooms: 4,
    lat: 13.7845,
    lng: 100.4432,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
    distance_bts_km: 3.8,
  },
  {
    id: 9,
    title: "Narasiri Krungthep Kreetha",
    type: "บ้านเดี่ยว",
    district: "บางกะปิ / กรุงเทพกรีฑา",
    price: 18500000,
    area_sqm: 360.0,
    price_sqm: 51388,
    bedrooms: 4,
    bathrooms: 5,
    lat: 13.7510,
    lng: 100.6905,
    image: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80",
    distance_bts_km: 5.0,
  },
  {
    id: 10,
    title: "Ideo Mobi Rama 9",
    type: "คอนโด",
    district: "ห้วยขวาง / พระราม 9",
    price: 3290000,
    area_sqm: 30.0,
    price_sqm: 109666,
    bedrooms: 1,
    bathrooms: 1,
    lat: 13.7570,
    lng: 100.5662,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    distance_bts_km: 0.25,
  },
  {
    id: 11,
    title: "Baan Klang Muang Ladprao 71",
    type: "ทาวน์โฮม",
    district: "ลาดพร้าว / นาคนิวาส",
    price: 4690000,
    area_sqm: 150.0,
    price_sqm: 31266,
    bedrooms: 3,
    bathrooms: 3,
    lat: 13.8055,
    lng: 100.6090,
    image: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=800&q=80",
    distance_bts_km: 2.2,
  },
  {
    id: 12,
    title: "Setthasiri Pattanakarn",
    type: "บ้านเดี่ยว",
    district: "ประเวศ / พัฒนาการ",
    price: 11500000,
    area_sqm: 260.0,
    price_sqm: 44230,
    bedrooms: 4,
    bathrooms: 4,
    lat: 13.7225,
    lng: 100.6550,
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
    distance_bts_km: 3.0,
  },
];

export const StreamlitRealEstateView: React.FC = () => {
  const [selectedProperty, setSelectedProperty] = useState<BkkProperty>(PROPERTIES_DATA[0]);
  const [salary, setSalary] = useState<number>(65000);
  const [otherDebt, setOtherDebt] = useState<number>(8000);
  const [downPaymentPct, setDownPaymentPct] = useState<number>(10);
  const [loanYears, setLoanYears] = useState<number>(30);
  const [interestRate, setInterestRate] = useState<number>(6.5);
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Smooth scroll helper
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Mock ML prediction:
  // TODO: แทนด้วยโมเดล ML จริง (เช่น XGBoost, Random Forest หรือ Scikit-learn Pipeline)
  const predictMlPrice = (prop: BkkProperty) => {
    const factor = prop.distance_bts_km < 1.0 ? 1.02 : 0.99;
    return Math.round((prop.price * factor) / 10000) * 10000;
  };

  // Amortization calculation:
  const downPaymentAmount = selectedProperty.price * (downPaymentPct / 100);
  const loanPrincipal = Math.max(0, selectedProperty.price - downPaymentAmount);
  const monthlyInterestRate = interestRate / 100 / 12;
  const totalMonths = loanYears * 12;

  const actualMonthlyInstallment =
    loanPrincipal <= 0
      ? 0
      : monthlyInterestRate === 0
      ? Math.round(loanPrincipal / totalMonths)
      : Math.round(
          (loanPrincipal *
            (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalMonths))) /
            (Math.pow(1 + monthlyInterestRate, totalMonths) - 1)
        );

  // DSR standard 40% of salary minus existing debts:
  // สูตร: ยอดผ่อนสูงสุดที่แนะนำ = (เงินเดือน x 0.4) - ภาระหนี้เดิม
  const maxAffordableDsr = Math.round(salary * 0.4 - otherDebt);
  const isAffordable = actualMonthlyInstallment <= maxAffordableDsr && maxAffordableDsr > 0;

  // Initialize and update Leaflet Map (Folium equivalent)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [selectedProperty.lat, selectedProperty.lng],
        zoom: 11,
      });

      const tiles = getTileConfig();
      L.tileLayer(tiles.url, tiles.options).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      markersRef.current = markersGroup;
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    PROPERTIES_DATA.forEach((prop) => {
      const isSelected = prop.id === selectedProperty.id;

      // Color scheme based on price/sqm:
      // เขียว < 60,000, น้ำเงิน 60,000-110,000, ม่วง 110,000-180,000, แดง > 180,000 บ./ตร.ม.
      let color = '#10b981';
      if (prop.price_sqm >= 180000) color = '#ef4444';
      else if (prop.price_sqm >= 110000) color = '#8b5cf6';
      else if (prop.price_sqm >= 60000) color = '#2563eb';

      if (isSelected) {
        // High-prominence selected marker with star
        const customIcon = L.divIcon({
          className: 'custom-selected-pin',
          html: `
            <div style="position:relative; display:flex; align-items:center; justify-content:center; width:38px; height:38px; background:#f59e0b; border:3px solid #ffffff; border-radius:50%; box-shadow:0 0 15px rgba(245,158,11,0.8); cursor:pointer;">
              <span style="color:#ffffff; font-size:18px; font-weight:bold;">★</span>
              <div style="position:absolute; width:52px; height:52px; border:2px solid #f59e0b; border-radius:50%; animation:ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite; opacity:0.6;"></div>
            </div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });

        const marker = L.marker([prop.lat, prop.lng], { icon: customIcon, zIndexOffset: 1000 })
          .addTo(markersGroup)
          .bindPopup(`
            <div style="font-family:sans-serif; min-width:200px; padding:4px;">
              <div style="font-weight:bold; color:#1e293b; font-size:14px;">⭐ ${prop.title}</div>
              <div style="font-size:12px; color:#64748b; margin-top:2px;">📍 ${prop.district}</div>
              <div style="font-size:15px; font-weight:bold; color:#059669; margin:6px 0;">฿${prop.price.toLocaleString()}</div>
              <div style="font-size:11px; color:#475569;">฿${prop.price_sqm.toLocaleString()}/ตร.ม. | ${prop.area_sqm} ตร.ม.</div>
              <div style="margin-top:4px; font-size:11px; background:#fef3c7; color:#92400e; padding:2px 6px; border-radius:4px; font-weight:600;">กำลังเลือกเพื่อคำนวณ</div>
            </div>
          `);

        marker.openPopup();
      } else {
        // Colored circle marker
        const circleMarker = L.circleMarker([prop.lat, prop.lng], {
          radius: 9,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85,
        })
          .addTo(markersGroup)
          .bindPopup(`
            <div style="font-family:sans-serif; min-width:190px; padding:4px;">
              <div style="font-weight:bold; color:#1e293b; font-size:13px;">${prop.title}</div>
              <span style="display:inline-block; font-size:10px; background:${color}; color:white; padding:1px 5px; border-radius:3px; margin:2px 0;">${prop.type}</span>
              <div style="font-size:11px; color:#64748b;">📍 ${prop.district}</div>
              <div style="font-size:14px; font-weight:bold; color:#059669; margin:4px 0;">฿${prop.price.toLocaleString()}</div>
              <div style="font-size:11px; color:#475569;">฿${prop.price_sqm.toLocaleString()}/ตร.ม.</div>
            </div>
          `);

        circleMarker.on('click', () => {
          setSelectedProperty(prop);
          scrollToSection('calculator-section');
        });
      }
    });

    map.panTo([selectedProperty.lat, selectedProperty.lng]);
  }, [selectedProperty]);

  const pythonRequirementsText = `streamlit>=1.32.0\nfolium>=0.16.0\nstreamlit-folium>=0.19.0\npandas>=2.0.0\nnumpy>=1.24.0`;

  const copyPythonCode = () => {
    fetch('/app.py')
      .then((r) => r.text())
      .then((code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2500);
      })
      .catch(() => {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2500);
      });
  };

  const downloadAppPy = () => {
    fetch('/app.py')
      .then((r) => r.text())
      .then((text) => {
        const blob = new Blob([text], { type: 'text/x-python' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'app.py';
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* ========================================================================= */}
      {/* ส่วนที่ 1: HERO SECTION (บนสุด) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm font-bold text-xl">
              🏢
            </div>
            <div>
              <div className="font-bold text-slate-900 text-lg leading-tight tracking-tight">
                BKK Living & Price Predictor
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Streamlit Prototype Preview • แนะนำ & พยากรณ์ราคาอสังหาฯ กรุงเทพฯ
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCodeModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200"
              title="ดูโค้ด Streamlit app.py และ requirements.txt"
            >
              <Code className="w-4 h-4 text-emerald-600" />
              <span>ดูโค้ด Streamlit (app.py)</span>
            </button>

            {/* เมนูขวาบนเขียนว่า "มีอะไรให้เลือกบ้าง" */}
            <button
              onClick={() => scrollToSection('property-section')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all transform active:scale-95"
            >
              <span>มีอะไรให้เลือกบ้าง</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner เต็มความกว้าง */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="relative rounded-2xl overflow-hidden shadow-xl h-[380px] bg-slate-900">
          <img
            src="https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1600&q=80"
            alt="Bangkok Cityscape Skyline"
            className="w-full h-full object-cover opacity-60 filter contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/60 to-transparent flex items-center">
            <div className="max-w-2xl px-8 sm:px-12 text-white">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/90 text-white mb-4 backdrop-blur tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                Bangkok Real Estate Intelligence
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-3 drop-shadow-md">
                ค้นหาบ้านและคอนโดที่ใช่ <br />
                <span className="text-emerald-400">พร้อมคำนวณความสามารถในการผ่อนจริง</span>
              </h1>
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-6 max-w-xl">
                แนะนำโครงการอสังหาริมทรัพย์ชั้นนำทั่วกรุงเทพฯ พร้อมแบบจำลองราคาและเกณฑ์ DSR 40%
                ประเมินความปลอดภัยทางการเงินก่อนตัดสินใจกู้ซื้อ
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => scrollToSection('property-section')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2"
                >
                  <span>สำรวจโครงการแนะนำ</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollToSection('map-section')}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur border border-white/20 transition-all flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-emerald-300" />
                  <span>ดูแผนที่พิกัดราคา</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ส่วนที่ 2: รายการบ้าน/คอนโด (การ์ดแนวนอน scroll ลงมาเจอ - Grid 4 คอลัมน์) */}
      {/* ========================================================================= */}
      <div id="property-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-emerald-600" />
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                รายการบ้านและคอนโดแนะนำในกรุงเทพฯ
              </h2>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              คลิกที่การ์ดเพื่อเลือกบ้านไปประเมินความสามารถในการผ่อน และปักหมุดบนแผนที่
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 mt-2 sm:mt-0 bg-slate-100 px-3 py-1 rounded-full">
            แสดงทั้งหมด {PROPERTIES_DATA.length} โครงการ
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PROPERTIES_DATA.map((prop) => {
            const isSelected = prop.id === selectedProperty.id;
            return (
              <div
                key={prop.id}
                onClick={() => {
                  setSelectedProperty(prop);
                  scrollToSection('calculator-section');
                }}
                className={`group cursor-pointer rounded-2xl overflow-hidden border transition-all duration-200 flex flex-col bg-white shadow-xs hover:shadow-xl hover:-translate-y-1 ${
                  isSelected
                    ? 'ring-3 ring-emerald-600 border-emerald-500 bg-emerald-50/20'
                    : 'border-slate-200 hover:border-emerald-300'
                }`}
              >
                {/* Image & Badges */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={prop.image}
                    alt={prop.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-bold text-white bg-slate-900/80 backdrop-blur">
                    {prop.type}
                  </div>
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-sm font-extrabold text-white bg-emerald-600 shadow-md">
                    ฿{prop.price.toLocaleString()}
                  </div>
                  {isSelected && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-bold text-emerald-950 bg-amber-400 flex items-center gap-1 shadow-md">
                      <span>★ เลือกอยู่</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {prop.title}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="line-clamp-1">{prop.district}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-600 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-1">
                        <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{prop.area_sqm} ตร.ม.</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bed className="w-3.5 h-3.5 text-slate-400" />
                        <span>{prop.bedrooms} นอน</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bath className="w-3.5 h-3.5 text-slate-400" />
                        <span>{prop.bathrooms} น้ำ</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500">
                      ฿{prop.price_sqm.toLocaleString()}/ตร.ม.
                    </div>
                    <button
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-700'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>เลือกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <span>ดูรายละเอียด</span>
                          <ArrowRight className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ส่วนที่ 3 & 4: ฟอร์มคำนวณความสามารถในการผ่อน & ผลลัพธ์ DSR === */}
      {/* ========================================================================= */}
      <div id="calculator-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          {/* ข้อมูลบ้านที่เลือกแสดงไว้ด้านบนของฟอร์ม */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-2xl p-5 sm:p-6 text-white mb-8 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-white/20 backdrop-blur mb-2">
                  <span>{selectedProperty.type} ที่กำลังวิเคราะห์</span>
                </div>
                <h3 className="text-2xl font-bold tracking-tight">{selectedProperty.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-emerald-100 mt-1">
                  <span>📍 {selectedProperty.district}</span>
                  <span>•</span>
                  <span>พื้นที่ {selectedProperty.area_sqm} ตร.ม.</span>
                  <span>•</span>
                  <span>ราคา ฿{selectedProperty.price_sqm.toLocaleString()}/ตร.ม.</span>
                </div>
              </div>
              <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-white/20">
                <div className="text-xs text-emerald-200">ราคาเริ่มต้นของโครงการ</div>
                <div className="text-3xl font-extrabold text-amber-300">
                  ฿{selectedProperty.price.toLocaleString()}
                </div>
                <div className="text-xs text-emerald-200 mt-1">
                  💡 ราคาประเมินแบบจำลอง ML: ฿{predictMlPrice(selectedProperty).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* ซ้าย: ฟอร์มกรอกข้อมูลลูกค้า */}
            <div className="lg:col-span-6 space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-slate-900 text-lg">ข้อมูลทางการเงินของผู้กู้</h4>
              </div>

              {/* เงินเดือน */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  เงินเดือนปัจจุบัน (บาท/เดือน)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={15000}
                    max={2000000}
                    step={5000}
                    value={salary}
                    onChange={(e) => setSalary(Number(e.target.value))}
                    className="w-full pl-3 pr-16 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-base font-semibold text-slate-900"
                  />
                  <div className="absolute right-3 top-3 text-xs font-semibold text-slate-400">
                    บาท/เดือน
                  </div>
                </div>
              </div>

              {/* ภาระหนี้สินอื่น */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ภาระหนี้สินอื่นต่อเดือน (ถ้ามี)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={1000000}
                    step={1000}
                    value={otherDebt}
                    onChange={(e) => setOtherDebt(Number(e.target.value))}
                    className="w-full pl-3 pr-16 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-base font-semibold text-slate-900"
                  />
                  <div className="absolute right-3 top-3 text-xs font-semibold text-slate-400">
                    บาท/เดือน
                  </div>
                </div>
                <span className="text-[11px] text-slate-400">เช่น ค่างวดรถ หนี้บัตรเครดิต หรือสินเชื่อเดิม</span>
              </div>

              {/* เงินดาวน์ */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1.5">
                  <span>เงินดาวน์ที่มี (% หรือจำนวนเงิน)</span>
                  <span className="text-emerald-600">
                    {downPaymentPct}% (฿{downPaymentAmount.toLocaleString()})
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={5}
                  value={downPaymentPct}
                  onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              {/* ระยะเวลาผ่อน */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1.5">
                  <span>ระยะเวลาผ่อน (ปี)</span>
                  <span className="text-emerald-600">{loanYears} ปี ({totalMonths} งวด)</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={35}
                  step={1}
                  value={loanYears}
                  onChange={(e) => setLoanYears(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              {/* อัตราดอกเบี้ย */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  อัตราดอกเบี้ยเฉลี่ย (% ต่อปี)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={15}
                    step={0.1}
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full pl-3 pr-16 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-base font-semibold text-slate-900"
                  />
                  <div className="absolute right-3 top-3 text-xs font-semibold text-slate-400">
                    % / ปี
                  </div>
                </div>
              </div>
            </div>

            {/* ขวา: ผลลัพธ์และการเปรียบเทียบ DSR */}
            <div className="lg:col-span-6 flex flex-col justify-between bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-slate-200 mb-6">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-slate-900 text-lg">
                    ผลลัพธ์การประเมินความสามารถในการผ่อน
                  </h4>
                </div>

                {/* กล่องเมทริกซ์คู่ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div className="text-xs font-medium text-slate-500 mb-1">
                      ค่างวดโดยประมาณของบ้านนี้
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900">
                      ฿{actualMonthlyInstallment.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      ยอดกู้ ฿{loanPrincipal.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div className="text-xs font-medium text-slate-500 mb-1">
                      ความสามารถในการผ่อนสูงสุดของคุณ
                    </div>
                    <div className="text-2xl font-extrabold text-emerald-700">
                      ฿{Math.max(0, maxAffordableDsr).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      เกณฑ์ DSR 40% หักหนี้เดิม
                    </div>
                  </div>
                </div>

                {/* กล่องสถานะประเมิน */}
                {maxAffordableDsr <= 0 ? (
                  <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-400 text-rose-900">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-base text-rose-800">
                          ⚠️ ภาระหนี้เดิมเกินเกณฑ์ DSR 40%
                        </div>
                        <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                          ภาระหนี้เดิมของคุณ (฿{otherDebt.toLocaleString()}/เดือน) เกิน 40%
                          ของเงินเดือน แนะนำให้ชำระหรือลดภาระหนี้เดิมก่อนยื่นกู้ซื้อบ้าน
                        </p>
                      </div>
                    </div>
                  </div>
                ) : isAffordable ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-base text-emerald-800">
                          ✅ อยู่ในเกณฑ์ที่ผ่อนไหว
                        </div>
                        <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                          ค่างวดของบ้านนี้ (฿{actualMonthlyInstallment.toLocaleString()})
                          ไม่เกินเพดานความสามารถในการผ่อนที่ปลอดภัยของคุณ โดยคุณยังมีเงินสภาพคล่องเหลือ
                          <strong>
                            {' '}
                            ฿{(maxAffordableDsr - actualMonthlyInstallment).toLocaleString()} บาท/เดือน
                          </strong>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-400 text-amber-950">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-base text-amber-900">
                          ⚠️ เกินความสามารถ แนะนำเลือกบ้านราคาต่ำกว่านี้ หรือเพิ่มเงินดาวน์
                        </div>
                        <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                          ค่างวดบ้านนี้สูงกว่าความสามารถในการผ่อนที่แนะนำอยู่{' '}
                          <strong>
                            ฿{(actualMonthlyInstallment - maxAffordableDsr).toLocaleString()} บาท/เดือน
                          </strong>
                          <br />
                          💡 คำแนะนำ: เพิ่มเงินดาวน์เป็น {downPaymentPct + 10}% หรือขยายระยะเวลาผ่อน
                          หรือพิจารณาโครงการในงบ ฿
                          {Math.round((maxAffordableDsr / actualMonthlyInstallment) * selectedProperty.price).toLocaleString()}{' '}
                          บาท
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* สูตรการคำนวณย่อ */}
              <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-1">
                <div>
                  • <strong>สูตร DSR:</strong> ยอดผ่อนสูงสุด = (เงินเดือน {salary.toLocaleString()} ×
                  0.4) - ภาระหนี้เดิม {otherDebt.toLocaleString()} ={' '}
                  <strong>{maxAffordableDsr.toLocaleString()} บ./ด.</strong>
                </div>
                <div>
                  • <strong>สูตร Amortization:</strong> คิดจากยอดกู้ {loanPrincipal.toLocaleString()} บ.
                  ดอกเบี้ย {interestRate}% ระยะเวลา {loanYears} ปี
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ส่วนที่ 5: แผนที่ (ใต้ผลลัพธ์ - Interactive Folium / Leaflet) */}
      {/* ========================================================================= */}
      <div id="map-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="w-6 h-6 text-emerald-600" />
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  แผนที่พิกัดอสังหาริมทรัพย์ในกรุงเทพฯ (Interactive Map)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                จุดสีแบ่งตามช่วงราคาต่อ ตารางเมตร | หมุดสีทองรูปดาวคือตำแหน่งโครงการที่คุณเลือก
              </p>
            </div>

            {/* Legend แถบสี */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <span className="text-slate-600">ช่วงราคา/ตร.ม.:</span>
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                &lt; 60k
              </span>
              <span className="inline-flex items-center gap-1 text-blue-700">
                <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
                60k - 110k
              </span>
              <span className="inline-flex items-center gap-1 text-purple-700">
                <span className="w-3 h-3 rounded-full bg-purple-500 inline-block"></span>
                110k - 180k
              </span>
              <span className="inline-flex items-center gap-1 text-rose-700">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                &gt; 180k
              </span>
              <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                <span>⭐</span> หมุดที่เลือก
              </span>
            </div>
          </div>

          <div
            ref={mapContainerRef}
            className="w-full h-[520px] rounded-2xl overflow-hidden border border-slate-200 z-10"
          />

          <div className="mt-4 text-xs text-slate-400 flex items-center justify-between">
            <span>คลิกที่หมุดบนแผนที่เพื่อดูข้อมูลโครงการ หรือคลิกที่การ์ดด้านบนเพื่อโฟกัส</span>
            <span>CartoDB Positron / Leaflet & Folium Integration</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Code Modal (app.py & requirements.txt) */}
      {/* ========================================================================= */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-lg">
                  ไฟล์โค้ด Streamlit (Python) ที่สร้างขึ้น
                </h3>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xl px-2"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 flex items-center gap-2">
                    <span>📄 app.py</span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-normal">
                      ไฟล์เดียวรันได้ทันที
                    </span>
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={copyPythonCode}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md flex items-center gap-1"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด'}</span>
                    </button>
                    <button
                      onClick={downloadAppPy}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ดาวน์โหลด app.py</span>
                    </button>
                  </div>
                </div>
                <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-64">
                  <pre>{`# รันด้วยคำสั่ง:
pip install -r requirements.txt
streamlit run app.py

# โครงสร้างใน app.py:
# 1. HERO SECTION (Navbar + Unsplash Bangkok Skyline)
# 2. รายการบ้าน/คอนโด (Grid 4 คอลัมน์ + st.session_state)
# 3. ฟอร์มคำนวณ DSR 40% & Amortization
# 4. ผลลัพธ์เปรียบเทียบ ✅ ผ่อนไหว vs ⚠️ เกินความสามารถ
# 5. แผนที่ Folium แสดงพิกัดสีตามราคา/ตร.ม. + หมุดเด่นที่เลือก`}</pre>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-2">📦 requirements.txt</span>
                <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs">
                  <pre>{pythonRequirementsText}</pre>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-900 text-xs leading-relaxed">
                <strong>💡 วิธีการรันในเครื่องของคุณ:</strong>
                <ol className="list-decimal pl-5 mt-2 space-y-1">
                  <li>บันทึกไฟล์ <code>app.py</code> และ <code>requirements.txt</code> ไว้ในโฟลเดอร์เดียวกัน</li>
                  <li>เปิด Terminal แล้วพิมพ์ <code>pip install -r requirements.txt</code></li>
                  <li>รันคำสั่ง <code>streamlit run app.py</code> หน้าเว็บจะเปิดขึ้นในเบราว์เซอร์ทันที</li>
                </ol>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowCodeModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
