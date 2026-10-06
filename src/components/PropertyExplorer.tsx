import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getTileConfig } from '../utils/mapTiles';
import { PropertyMode } from '../types';
import { CONDOS_DATA, BANGKOK_DISTRICTS } from '../data/condosData';
import { HOUSES_DATA, NEIGHBORHOODS_LIST, NEIGHBORHOOD_INFO } from '../data/housesData';
import {
  MapPin,
  Search,
  Building2,
  Train,
  Calculator,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Eye,
  X
} from 'lucide-react';
import L from 'leaflet';

interface PropertyExplorerProps {
  mode: PropertyMode;
  onModeChange: (mode: PropertyMode) => void;
  onSendToMortgage: (priceTHB: number) => void;
  onSendToValuation: (districtOrNeigh: string) => void;
  targetFocusLocation?: string;
}

const FEATURED_CONDO_ITEMS = [
  {
    id: 101,
    title: "Life Asoke-Rama 9",
    district: "Ratchathewi",
    districtTh: "ราชเทวี / อโศก-พระราม 9",
    price: 3890000,
    priceSqm: 121500,
    areaSqm: 32,
    floors: 42,
    bldAge: 3,
    distBtsKm: 0.4,
    lat: 13.7548,
    lng: 100.5638,
    image: "/images/condo_modern_interior_1790155522928.jpg",
    highlight: "ใกล้ MRT พระราม 9 เพียง 400 ม.",
  },
  {
    id: 102,
    title: "The Base Sukhumvit 50",
    district: "Khlong Toei",
    districtTh: "คลองเตย / พระโขนง",
    price: 2790000,
    priceSqm: 88500,
    areaSqm: 31.5,
    floors: 8,
    bldAge: 4,
    distBtsKm: 0.9,
    lat: 13.7065,
    lng: 100.5982,
    image: "/images/condo_modern_interior_1790155522928.jpg",
    highlight: "ราคาเริ่มต้นดี เข้าเมืองสะดวก",
  },
  {
    id: 103,
    title: "Ashton Silom Residence",
    district: "Bang Rak",
    districtTh: "บางรัก / สีลม",
    price: 7900000,
    priceSqm: 232000,
    areaSqm: 34,
    floors: 48,
    bldAge: 2,
    distBtsKm: 0.35,
    lat: 13.7258,
    lng: 100.5284,
    image: "/images/hero_bkk_skyline_1790155511168.jpg",
    highlight: "Ultra Luxury ใจกลาง CBD สีลม",
  },
  {
    id: 104,
    title: "Ideo Mobi Rama 9",
    district: "Huai Khwang",
    districtTh: "ห้วยขวาง / พระราม 9",
    price: 3290000,
    priceSqm: 109600,
    areaSqm: 30,
    floors: 28,
    bldAge: 5,
    distBtsKm: 0.25,
    lat: 13.7570,
    lng: 100.5662,
    image: "/images/condo_modern_interior_1790155522928.jpg",
    highlight: "ห่าง MRT เพียง 250 ม.",
  },
];

const FEATURED_HOUSE_ITEMS = [
  {
    id: 201,
    title: "Centro Krungthep Kreetha",
    district: "CollgCr",
    districtTh: "กรุงเทพกรีฑา / สะพานสูง",
    price: 6890000,
    priceSqm: 36200,
    areaSqm: 190,
    floors: 2,
    bldAge: 2,
    distBtsKm: 4.5,
    lat: 13.7431,
    lng: 100.6720,
    image: "/images/house_contemporary_thai_1790155534877.jpg",
    highlight: "บ้านเดี่ยว 4 ห้องนอน ทำเลศักยภาพ",
  },
  {
    id: 202,
    title: "Setthasiri Pattanakarn",
    district: "Veenker",
    districtTh: "พัฒนาการ / ประเวศ",
    price: 11500000,
    priceSqm: 44200,
    areaSqm: 260,
    floors: 2,
    bldAge: 3,
    distBtsKm: 3.0,
    lat: 13.7225,
    lng: 100.6550,
    image: "/images/house_contemporary_thai_1790155534877.jpg",
    highlight: "บ้านหรูแปลงมุม ใกล้ทางด่วน",
  },
  {
    id: 203,
    title: "Narasiri Luxury Estate",
    district: "NoRidge",
    districtTh: "บางกะปิ / หัวหมาก",
    price: 18500000,
    priceSqm: 51300,
    areaSqm: 360,
    floors: 2,
    bldAge: 1,
    distBtsKm: 5.0,
    lat: 13.7510,
    lng: 100.6905,
    image: "/images/house_contemporary_thai_1790155534877.jpg",
    highlight: "คฤหาสน์ส่วนตัว สวนร่มรื่น",
  },
  {
    id: 204,
    title: "Siri Place Charan-Pin Klao",
    district: "OldTown",
    districtTh: "บางพลัด / จรัญสนิทวงศ์",
    price: 3490000,
    priceSqm: 29500,
    areaSqm: 118,
    floors: 2,
    bldAge: 4,
    distBtsKm: 1.8,
    lat: 13.7915,
    lng: 100.4950,
    image: "/images/house_contemporary_thai_1790155534877.jpg",
    highlight: "ใกล้รถไฟฟ้าสายสีน้ำเงิน",
  },
];

export const PropertyExplorer: React.FC<PropertyExplorerProps> = ({
  mode,
  onModeChange,
  onSendToMortgage,
  onSendToValuation,
  targetFocusLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(mode === 'condo' ? 250000 : 15000000);
  const [btsDistanceFilter, setBtsDistanceFilter] = useState<number>(10);
  const [selectedPinInfo, setSelectedPinInfo] = useState<{
    title: string;
    location: string;
    price: number;
    priceSqm: number;
    area?: number;
    lat: number;
    lng: number;
  } | null>(null);

  // Filtered dataset
  const filteredCondos = useMemo(() => {
    if (mode !== 'condo') return [];
    return CONDOS_DATA.filter((c) => {
      const matchSearch =
        searchTerm === '' ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.district.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDistrict = selectedDistrict === 'all' || c.district === selectedDistrict;
      const matchPrice = c.priceSqm <= maxPriceFilter;
      const matchBts = c.distTran1 <= btsDistanceFilter;
      return matchSearch && matchDistrict && matchPrice && matchBts;
    });
  }, [mode, searchTerm, selectedDistrict, maxPriceFilter, btsDistanceFilter]);

  const filteredHouses = useMemo(() => {
    if (mode !== 'house') return [];
    return HOUSES_DATA.filter((h) => {
      const neighInfo = NEIGHBORHOOD_INFO[h.neighborhood];
      const matchSearch =
        searchTerm === '' ||
        h.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (neighInfo && neighInfo.nameTh.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchDistrict = selectedDistrict === 'all' || h.neighborhood === selectedDistrict;
      const matchPrice = h.salePrice_THB <= maxPriceFilter;
      return matchSearch && matchDistrict && matchPrice;
    });
  }, [mode, searchTerm, selectedDistrict, maxPriceFilter]);

  // Marker colors - White & Blue / Navy Spectrum
  const getMarkerColor = (price: number) => {
    if (mode === 'condo') {
      if (price < 60000) return '#38BDF8';
      if (price < 110000) return '#2563EB';
      if (price < 180000) return '#1D4ED8';
      return '#0F172A';
    } else {
      if (price < 4500000) return '#38BDF8';
      if (price < 7500000) return '#2563EB';
      if (price < 11000000) return '#1D4ED8';
      return '#0F172A';
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const center: [number, number] = mode === 'condo' ? [13.745, 100.545] : [42.030, -93.630];
    const zoom = mode === 'condo' ? 11 : 12;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: true,
    });

    const tiles = getTileConfig();
    L.tileLayer(tiles.url, tiles.options).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mode]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;
    const markers = markersGroupRef.current;
    markers.clearLayers();

    if (mode === 'condo') {
      const itemsToRender = filteredCondos.slice(0, 300);
      itemsToRender.forEach((condo) => {
        const color = getMarkerColor(condo.priceSqm);
        const marker = L.circleMarker([condo.latitude, condo.longitude], {
          radius: 6,
          fillColor: color,
          color: '#ffffff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.85,
        });

        marker.on('click', () => {
          setSelectedPinInfo({
            title: condo.name,
            location: `เขต${condo.district}`,
            price: Math.round(condo.priceSqm * 35),
            priceSqm: condo.priceSqm,
            area: 35,
            lat: condo.latitude,
            lng: condo.longitude,
          });
        });

        marker.addTo(markers);
      });
    } else {
      const itemsToRender = filteredHouses.slice(0, 250);
      itemsToRender.forEach((house) => {
        const color = getMarkerColor(house.salePrice_THB);
        const neighInfo = NEIGHBORHOOD_INFO[house.neighborhood];
        const marker = L.circleMarker([house.latitude, house.longitude], {
          radius: 6,
          fillColor: color,
          color: '#ffffff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.85,
        });

        marker.on('click', () => {
          setSelectedPinInfo({
            title: `บ้านเดี่ยวใน ${neighInfo ? neighInfo.nameTh : house.neighborhood}`,
            location: neighInfo ? neighInfo.nameTh : house.neighborhood,
            price: house.salePrice_THB,
            priceSqm: Math.round(house.salePrice_THB / (house.grLivArea / 10.764)),
            area: Math.round(house.grLivArea / 10.764),
            lat: house.latitude,
            lng: house.longitude,
          });
        });

        marker.addTo(markers);
      });
    }
  }, [mode, filteredCondos, filteredHouses]);

  const featuredItems = mode === 'condo' ? FEATURED_CONDO_ITEMS : FEATURED_HOUSE_ITEMS;

  const focusPropertyOnMap = (lat: number, lng: number, title: string, price: number, priceSqm: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 14, { duration: 1.2 });
      setSelectedPinInfo({
        title,
        location: mode === 'condo' ? 'กรุงเทพฯ' : 'ชานเมือง',
        price,
        priceSqm,
        lat,
        lng,
      });
      // Scroll to map smoothly on mobile so user sees the focused pin
      const el = document.getElementById('interactive-map-card');
      if (el && window.innerWidth < 1024) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Hero Skyline Banner - Mobile-Optimized */}
      <section className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md sm:shadow-xl min-h-[220px] sm:min-h-[320px] flex items-center">
        <img
          src="/images/hero_bkk_skyline_1790155511168.jpg"
          alt="Bangkok Skyline Condominium"
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071326] via-[#0B1E38]/90 to-[#071326]/60" />

        <div className="relative z-10 max-w-3xl p-4 sm:p-8 text-white space-y-2.5 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-sky-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bangkok Real Estate Intelligence</span>
          </div>

          <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            สำรวจอสังหาฯ และทำนายราคา <br className="hidden sm:inline" />
            <span className="text-sky-400">ด้วย Machine Learning และข้อมูลจริง</span>
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl font-normal hidden sm:block">
            ฐานข้อมูลจริง 1,019 คอนโดมิเนียมทั่วกรุงเทพฯ และบ้านเดี่ยว 1,460 ยูนิต
            ประเมินราคาด้วย Machine Learning ความแม่นยำสูง (R² 93.3%) พร้อมแผนที่และเครื่องคำนวณค่างวดผ่อนชำระ
          </p>

          {/* Clean Editorial Stats (Mobile friendly grid) */}
          <div className="pt-1 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-x-6 text-[11px] sm:text-xs text-slate-300">
            <div className="bg-white/10 sm:bg-transparent px-2.5 py-1 rounded-lg">
              <span className="font-extrabold text-white tabular-nums text-xs sm:text-sm">1,019</span> โครงการคอนโด
            </div>
            <div className="bg-white/10 sm:bg-transparent px-2.5 py-1 rounded-lg">
              <span className="font-extrabold text-white tabular-nums text-xs sm:text-sm">1,460</span> บ้านเดี่ยว
            </div>
            <div className="bg-white/10 sm:bg-transparent px-2.5 py-1 rounded-lg">
              <span className="font-extrabold text-sky-400 tabular-nums text-xs sm:text-sm">93.3%</span> ความแม่นยำ R²
            </div>
            <div className="bg-white/10 sm:bg-transparent px-2.5 py-1 rounded-lg">
              <span className="font-extrabold text-white tabular-nums text-xs sm:text-sm">40%</span> เพดาน DSR หนี้
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Map & Controls Section */}
      <section id="interactive-map-card" className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden scroll-mt-20">
        {/* Section Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm lg:text-base">
                แผนที่พิกัดจริงโครงการ ({mode === 'condo' ? 'คอนโด กทม. 1,019 แห่ง' : 'บ้านเดี่ยว 1,460 ยูนิต'})
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500">แตะที่หมุดบนแผนที่เพื่อดูราคาและส่งไปคำนวณผ่อน</p>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3.5 sm:p-5 border-b border-slate-200/80 bg-slate-50/70 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={mode === 'condo' ? 'ค้นหาชื่อโครงการ หรือเขตในกรุงเทพฯ...' : 'ค้นหาทำเลบ้านเดี่ยว...'}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* District Filter Dropdown */}
            <div className="w-full sm:w-56">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full py-2 px-3 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
              >
                <option value="all">ทุกพื้นที่ ({mode === 'condo' ? 'ทุกเขตใน กทม.' : 'ทุกทำเล'})</option>
                {mode === 'condo'
                  ? BANGKOK_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        เขต{d}
                      </option>
                    ))
                  : NEIGHBORHOODS_LIST.map((n) => {
                      const info = NEIGHBORHOOD_INFO[n];
                      return (
                        <option key={n} value={n}>
                          {info ? info.nameTh : n}
                        </option>
                      );
                    })}
              </select>
            </div>
          </div>

          {/* Price Filter slider */}
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-200/60">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">ราคาสูงสุด:</span>
              <span className="text-xs font-bold text-blue-700 tabular-nums">
                {mode === 'condo'
                  ? `฿${maxPriceFilter.toLocaleString()}/ตร.ม.`
                  : `฿${(maxPriceFilter / 1000000).toFixed(1)} ล้าน`}
              </span>
            </div>
            <input
              type="range"
              min={mode === 'condo' ? 40000 : 2000000}
              max={mode === 'condo' ? 300000 : 18000000}
              step={mode === 'condo' ? 5000 : 500000}
              value={maxPriceFilter}
              onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
              className="w-36 sm:w-48 accent-blue-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Map Canvas + Selected Property Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[360px] sm:min-h-[460px]">
          <div className="lg:col-span-3 relative h-[300px] sm:h-[400px] lg:h-[500px]">
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* Floating Map Legend (Compact for Mobile) */}
            <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow-md border border-slate-200 text-[10px] text-slate-600 flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                <span>ประหยัด</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                <span>ปานกลาง</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-800 inline-block" />
                <span>พรีเมียม</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-900 inline-block" />
                <span>ลักชัวรี</span>
              </div>
            </div>
          </div>

          {/* Selected Pin Details / Quick Action Panel (Touch Optimized) */}
          <div className="p-4 sm:p-5 border-t lg:border-t-0 lg:border-l border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            {selectedPinInfo ? (
              <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-slate-200 pb-2.5 flex items-start justify-between">
                  <div>
                    <div className="text-[10px] sm:text-[11px] font-bold text-blue-600 mb-0.5">
                      โครงการที่เลือกบนแผนที่
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                      {selectedPinInfo.title}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{selectedPinInfo.location}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPinInfo(null)}
                    className="lg:hidden p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                    aria-label="ปิดกล่องข้อมูล"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 text-xs">
                  <div className="p-2 bg-white rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 block">ราคาประเมินรวม</span>
                    <span className="font-extrabold text-slate-900 tabular-nums text-sm text-blue-700">
                      ฿{selectedPinInfo.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 block">ราคาต่อ ตร.ม.</span>
                    <span className="font-bold text-slate-800 tabular-nums">
                      ฿{selectedPinInfo.priceSqm.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-2 grid grid-cols-2 lg:grid-cols-1 gap-2">
                  <button
                    onClick={() => onSendToMortgage(selectedPinInfo.price)}
                    className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>คำนวณผ่อน DSR</span>
                  </button>
                  <button
                    onClick={() => onSendToValuation(selectedPinInfo.location)}
                    className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                    <span>ทำนายราคา ML</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-6 text-slate-400 space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-blue-500 shadow-xs">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 text-xs">แตะหมุดใดๆ บนแผนที่</h4>
                  <p className="text-[11px] text-slate-500 max-w-[200px] mt-0.5">
                    เพื่อดูราคาและส่งต่อไปยังเครื่องคำนวณค่างวด
                  </p>
                </div>
                <div className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
                  แสดง {mode === 'condo' ? filteredCondos.length : filteredHouses.length} รายการ
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 text-[10px] sm:text-[11px] text-slate-500 flex items-center justify-between">
              <span>ฐานข้อมูลจริง AI Studio</span>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDistrict('all');
                  setMaxPriceFilter(mode === 'condo' ? 250000 : 15000000);
                }}
                className="hover:text-blue-600 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>รีเซ็ตตัวกรอง</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Projects Grid Section - Mobile Friendly */}
      <section className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 border-b border-slate-200/80 pb-2.5">
          <div>
            <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <span>โครงการเด่นแนะนำในกรุงเทพฯ</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              คัดสรรโครงการคุณภาพ ทำเลรถไฟฟ้า พร้อมค่าความสามารถในการกู้ซื้อจริง
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {featuredItems.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-2xl sm:rounded-3xl border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 flex flex-col overflow-hidden"
            >
              {/* Image Container with Fallback */}
              <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-900">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent" />

                <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-end justify-between text-white">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-sky-300 font-bold">
                      {mode === 'condo' ? 'คอนโดมิเนียม' : 'บ้านเดี่ยว'}
                    </div>
                    <div className="text-base sm:text-lg font-black tabular-nums leading-tight">
                      ฿{item.price.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-200 font-medium tabular-nums">
                    ฿{item.priceSqm.toLocaleString()}/ตร.ม.
                  </div>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <span>{item.districtTh}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.areaSqm} ตร.ม.</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.floors} ชั้น</span>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 border border-blue-100">
                    <Train className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="line-clamp-1">{item.highlight}</span>
                  </div>
                </div>

                {/* Quick Action Buttons (Touch Friendly) */}
                <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100">
                  <button
                    onClick={() => focusPropertyOnMap(item.lat, item.lng, item.title, item.price, item.priceSqm)}
                    className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-semibold text-xs transition-all flex items-center justify-center gap-1 active:scale-95"
                  >
                    <Eye className="w-3 h-3 text-slate-500" />
                    <span>ดูบนแผนที่</span>
                  </button>
                  <button
                    onClick={() => onSendToMortgage(item.price)}
                    className="py-2 px-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1 shadow-xs active:scale-95"
                  >
                    <Calculator className="w-3 h-3" />
                    <span>คำนวณผ่อน</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
