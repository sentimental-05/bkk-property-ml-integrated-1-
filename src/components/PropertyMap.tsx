import React, { useEffect, useRef, useState, useMemo } from 'react';
import { getTileConfig } from '../utils/mapTiles';
import { PropertyMode, CondoProperty, HouseProperty, RecommendedProperty } from '../types';
import { CONDOS_DATA, BANGKOK_DISTRICTS } from '../data/condosData';
import { HOUSES_DATA, NEIGHBORHOODS_LIST, NEIGHBORHOOD_INFO } from '../data/housesData';
import {
  MapPin,
  Filter,
  Search,
  RotateCcw,
  Building2,
  Home,
  Sliders,
  Sparkles,
  DollarSign,
  X
} from 'lucide-react';
import L from 'leaflet';

interface PropertyMapProps {
  mode: PropertyMode;
  onSelectProperty?: (priceTHB: number) => void;
  targetFocusLocation?: string;
  highlightedProperties?: RecommendedProperty[];
  onClearHighlights?: () => void;
}

export const PropertyMap: React.FC<PropertyMapProps> = ({
  mode,
  onSelectProperty,
  targetFocusLocation,
  highlightedProperties,
  onClearHighlights,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('all');

  // Price range in THB
  // For condo: total price estimated as priceSqm * 35 sq.m. Or filtered by priceSqm
  const [minPrice, setMinPrice] = useState<number>(() => (mode === 'condo' ? 30000 : 2000000));
  const [maxPrice, setMaxPrice] = useState<number>(() => (mode === 'condo' ? 300000 : 18000000));

  // Reset price range when switching mode
  useEffect(() => {
    if (mode === 'condo') {
      setMinPrice(30000);
      setMaxPrice(300000);
    } else {
      setMinPrice(2000000);
      setMaxPrice(18000000);
    }
    setSelectedAreaFilter('all');
    setSearchQuery('');
  }, [mode]);

  // If parent requests focus on a location
  useEffect(() => {
    if (targetFocusLocation) {
      setSelectedAreaFilter(targetFocusLocation);
    }
  }, [targetFocusLocation]);

  // Filtered properties
  const filteredCondos = useMemo(() => {
    if (mode !== 'condo') return [];
    return CONDOS_DATA.filter((c) => {
      const matchSearch =
        searchQuery === '' ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.district.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDistrict = selectedAreaFilter === 'all' || c.district === selectedAreaFilter;
      const matchPrice = c.priceSqm >= minPrice && c.priceSqm <= maxPrice;
      return matchSearch && matchDistrict && matchPrice;
    });
  }, [mode, searchQuery, selectedAreaFilter, minPrice, maxPrice]);

  const filteredHouses = useMemo(() => {
    if (mode !== 'house') return [];
    return HOUSES_DATA.filter((h) => {
      const neighInfo = NEIGHBORHOOD_INFO[h.neighborhood];
      const matchSearch =
        searchQuery === '' ||
        h.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (neighInfo && neighInfo.nameTh.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchNeigh = selectedAreaFilter === 'all' || h.neighborhood === selectedAreaFilter;
      const matchPrice = h.salePrice_THB >= minPrice && h.salePrice_THB <= maxPrice;
      return matchSearch && matchNeigh && matchPrice;
    });
  }, [mode, searchQuery, selectedAreaFilter, minPrice, maxPrice]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const initialCenter: [number, number] =
      mode === 'condo' ? [13.745, 100.545] : [42.030, -93.630];
    const initialZoom = mode === 'condo' ? 12 : 13;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true,
    });

    const tiles = getTileConfig();
    L.tileLayer(tiles.url, tiles.options).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mode]);

  // Helper color functions
  const getCondoColor = (priceSqm: number) => {
    if (priceSqm < 60000) return '#10b981'; // green (economy)
    if (priceSqm < 110000) return '#3b82f6'; // blue (mid)
    if (priceSqm < 180000) return '#8b5cf6'; // purple (premium)
    return '#ef4444'; // red (luxury)
  };

  const getHouseColor = (priceTHB: number) => {
    if (priceTHB < 4500000) return '#10b981'; // green
    if (priceTHB < 7500000) return '#3b82f6'; // blue
    if (priceTHB < 11000000) return '#8b5cf6'; // purple
    return '#ef4444'; // red
  };

  // Render markers whenever filtered items change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();

    const bounds = L.latLngBounds([]);

    if (mode === 'condo') {
      filteredCondos.forEach((condo) => {
        const color = getCondoColor(condo.priceSqm);
        const marker = L.circleMarker([condo.latitude, condo.longitude], {
          radius: 6,
          fillColor: color,
          color: '#ffffff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.85,
        });

        const popupContent = `
          <div style="font-family: sans-serif; min-width: 200px; padding: 4px;">
            <div style="font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 2px;">
              ${condo.name}
            </div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">
              เขต${condo.district} &bull; อายุ ${condo.bldAge} ปี (${condo.nbrFloors} ชั้น)
            </div>
            <div style="background: #f1f5f9; padding: 6px 8px; border-radius: 6px; margin-bottom: 6px;">
              <span style="font-size: 11px; color: #475569;">ราคาต่อ ตร.ม.:</span><br/>
              <span style="font-size: 15px; font-weight: 800; color: ${color};">
                ${condo.priceSqm.toLocaleString()} บาท/ตร.ม.
              </span>
            </div>
            <div style="font-size: 11px; color: #334155; line-height: 1.4;">
              <div>🚇 รถไฟฟ้า: ${condo.distTran1} กม.</div>
              <div>🛍️ ห้าง/ร้านค้า: ${condo.distShop1} กม.</div>
              <div>🏊 สิ่งอำนวยความสะดวก: ${[condo.pool ? 'สระ' : '', condo.gym ? 'ฟิตเนส' : '', condo.parking ? 'ที่จอดรถ' : ''].filter(Boolean).join(', ') || 'ทั่วไป'}</div>
            </div>
            <div style="margin-top: 8px; font-size: 10px; color: #94a3b8;">
              พิกัด: ${condo.latitude}, ${condo.longitude}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(layer);
        bounds.extend([condo.latitude, condo.longitude]);
      });
    } else {
      filteredHouses.forEach((house) => {
        const color = getHouseColor(house.salePrice_THB);
        const marker = L.circleMarker([house.latitude, house.longitude], {
          radius: 6,
          fillColor: color,
          color: '#ffffff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.85,
        });

        const neighInfo = NEIGHBORHOOD_INFO[house.neighborhood];
        const popupContent = `
          <div style="font-family: sans-serif; min-width: 200px; padding: 4px;">
            <div style="font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 2px;">
              บ้านเดี่ยว #${house.id} (${house.neighborhood})
            </div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">
              ${neighInfo ? neighInfo.nameTh : house.neighborhood}
            </div>
            <div style="background: #f1f5f9; padding: 6px 8px; border-radius: 6px; margin-bottom: 6px;">
              <span style="font-size: 11px; color: #475569;">ราคาขายจริง:</span><br/>
              <span style="font-size: 15px; font-weight: 800; color: ${color};">
                ${house.salePrice_THB.toLocaleString()} บาท
              </span>
            </div>
            <div style="font-size: 11px; color: #334155; line-height: 1.4;">
              <div>📐 พื้นที่ใช้สอย: ${house.grLivArea} ตร.ฟุต (${Math.round(house.grLivArea * 0.092903)} ตร.ม.)</div>
              <div>🛏️ ${house.bedroomAbvGr} นอน | 🚿 ${house.fullBath} น้ำ | 🚗 ${house.garageCars} คัน</div>
              <div>⭐ คุณภาพ: ${house.overallQual}/10 | ปีที่สร้าง: ${house.yearBuilt}</div>
            </div>
            <div style="margin-top: 8px; font-size: 10px; color: #94a3b8;">
              พิกัด: ${house.latitude}, ${house.longitude}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(layer);
        bounds.extend([house.latitude, house.longitude]);
      });
    }

    // If highlighted properties exist from natural language search, render them with prominent styling
    if (highlightedProperties && highlightedProperties.length > 0) {
      const highlightBounds = L.latLngBounds([]);
      highlightedProperties.forEach((prop, idx) => {
        const isSelectedCondo = prop.type === 'condo';
        // Draw an outer glowing ring
        const outerPulse = L.circleMarker([prop.latitude, prop.longitude], {
          radius: 12,
          fillColor: '#f59e0b',
          color: '#d97706',
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.35,
        });
        outerPulse.addTo(layer);

        // Core marker
        const coreMarker = L.circleMarker([prop.latitude, prop.longitude], {
          radius: 8,
          fillColor: '#b45309',
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 1,
        });

        const popupContent = `
          <div style="font-family: sans-serif; min-width: 220px; padding: 4px;">
            <div style="display: inline-block; background: #fef3c7; color: #92400e; font-weight: 800; font-size: 10px; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px;">
              ⭐ AI แนะนำอันดับที่ ${idx + 1}
            </div>
            <div style="font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 2px;">
              ${prop.title}
            </div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">
              ${prop.location}
            </div>
            <div style="background: #f8fafc; padding: 6px 8px; border-radius: 6px; margin-bottom: 6px; border: 1px solid #e2e8f0;">
              <span style="font-size: 11px; color: #475569;">ราคาประเมิน:</span><br/>
              <span style="font-size: 16px; font-weight: 800; color: #2563eb;">
                ${prop.totalPriceTHB.toLocaleString()} บาท
              </span>
              <div style="font-size: 11px; color: #059669; font-weight: 600; margin-top: 2px;">
                ค่างวดผ่อน: ~${prop.monthlyInstallmentAtAssumption.toLocaleString()} บาท/เดือน
              </div>
            </div>
            ${prop.distToTransitKm !== undefined ? `<div style="font-size: 11px; color: #334155;">🚇 BTS/MRT: ${prop.distToTransitKm} กม.</div>` : ''}
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
              จุดเด่น: ${prop.amenities.join(', ') || 'ทำเลดี'}
            </div>
          </div>
        `;

        coreMarker.bindPopup(popupContent);
        coreMarker.addTo(layer);

        // Open popup for the first highlighted property
        if (idx === 0) {
          setTimeout(() => {
            coreMarker.openPopup();
          }, 300);
        }

        highlightBounds.extend([prop.latitude, prop.longitude]);
      });

      if (highlightBounds.isValid()) {
        mapInstanceRef.current.fitBounds(highlightBounds, { padding: [50, 50], maxZoom: 15 });
        return;
      }
    }

    if (bounds.isValid() && (filteredCondos.length > 0 || filteredHouses.length > 0)) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    }
  }, [filteredCondos, filteredHouses, mode, highlightedProperties]);

  const totalFilteredCount = mode === 'condo' ? filteredCondos.length : filteredHouses.length;
  const totalAvailableCount = mode === 'condo' ? CONDOS_DATA.length : HOUSES_DATA.length;

  return (
    <div className="space-y-4">
      {/* Highlighted Properties Banner */}
      {highlightedProperties && highlightedProperties.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              {highlightedProperties.length}
            </span>
            <div>
              <h3 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                <span>กำลังปักหมุด {highlightedProperties.length} รายการที่คัดเลือกจากการค้นหา</span>
              </h3>
              <p className="text-xs text-amber-800/80">
                แสดงหมุดสีทองพร้อมวงแหวนรัศมี คลิกที่หมุดเพื่อดูข้อมูลราคาและค่างวดผ่อน
              </p>
            </div>
          </div>

          {onClearHighlights && (
            <button
              type="button"
              onClick={onClearHighlights}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 flex items-center gap-1 cursor-pointer transition-all shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>ล้างหมุดไฮไลต์</span>
            </button>
          )}
        </div>
      )}

      {/* Top Filter Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <span>แผนที่พิกัดอสังหาริมทรัพย์ ({mode === 'condo' ? 'คอนโด กทม.' : 'บ้านเดี่ยว Ames'})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ปักหมุดพิกัดจริงตาม Latitude / Longitude พร้อมแยกสีตามระดับราคา
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-between">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              พบ {totalFilteredCount.toLocaleString()} จาก {totalAvailableCount.toLocaleString()} {mode === 'condo' ? 'โครงการ' : 'หลัง'}
            </span>
            <button
              type="button"
              id="map-reset-filters"
              onClick={() => {
                setSearchQuery('');
                setSelectedAreaFilter('all');
                if (mode === 'condo') {
                  setMinPrice(30000);
                  setMaxPrice(300000);
                } else {
                  setMinPrice(2000000);
                  setMaxPrice(18000000);
                }
              }}
              title="ล้างตัวกรองทั้งหมด"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="map-search-input"
              type="text"
              placeholder={mode === 'condo' ? 'ค้นหาชื่อโครงการ หรือ เขต...' : 'ค้นหาย่านที่ตั้ง (Neighborhood)...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
            />
          </div>

          {/* Area / District Dropdown */}
          <div className="md:col-span-3">
            <select
              id="map-area-filter-select"
              value={selectedAreaFilter}
              onChange={(e) => setSelectedAreaFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
            >
              <option value="all">ทุกพื้นที่ ({mode === 'condo' ? '42 เขต กทม.' : '25 ย่าน'})</option>
              {mode === 'condo'
                ? BANGKOK_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      เขต {d}
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

          {/* Price Range Controls with Direct Numeric Inputs */}
          <div className="md:col-span-5 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                กรองงบประมาณราคา {mode === 'condo' ? '(บาท/ตร.ม.)' : '(บาท)'}:
              </span>
              <span className="font-bold text-emerald-700">
                {minPrice.toLocaleString()} - {maxPrice.toLocaleString()} {mode === 'condo' ? 'บ./ตร.ม.' : 'บาท'}
              </span>
            </div>

            {/* Direct Number Input Boxes for Free-Text Editing */}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  id="map-min-price-input"
                  type="number"
                  min={0}
                  step={mode === 'condo' ? 1000 : 100000}
                  value={minPrice}
                  onChange={(e) => setMinPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-2 pr-10 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 bg-white"
                  placeholder="ราคาต่ำสุด"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium">
                  {mode === 'condo' ? 'บ./ตร.ม.' : 'บาท'}
                </span>
              </div>
              <div className="relative">
                <input
                  id="map-max-price-input"
                  type="number"
                  min={minPrice}
                  step={mode === 'condo' ? 1000 : 100000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Math.max(minPrice, Number(e.target.value)))}
                  className="w-full pl-2 pr-10 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 bg-white"
                  placeholder="ราคาสูงสุด"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium">
                  {mode === 'condo' ? 'บ./ตร.ม.' : 'บาท'}
                </span>
              </div>
            </div>

            {/* Dual Range Sliders */}
            <div className="flex items-center gap-2">
              <input
                id="map-min-price-slider"
                type="range"
                min={mode === 'condo' ? 20000 : 1000000}
                max={mode === 'condo' ? 200000 : 10000000}
                step={mode === 'condo' ? 5000 : 250000}
                value={minPrice}
                onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice - 1000))}
                className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <input
                id="map-max-price-slider"
                type="range"
                min={mode === 'condo' ? 50000 : 5000000}
                max={mode === 'condo' ? 400000 : 25000000}
                step={mode === 'condo' ? 5000 : 500000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice + 1000))}
                className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Quick Presets (e.g. งบ 50,000 บ./ตร.ม.) */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] text-slate-400">งบยอดนิยม:</span>
              {mode === 'condo' ? (
                <>
                  <button
                    type="button"
                    onClick={() => { setMinPrice(20000); setMaxPrice(50000); }}
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                  >
                    งบ &le; 50,000 บ./ตร.ม.
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMinPrice(50000); setMaxPrice(90000); }}
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                  >
                    50,000 - 90,000
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMinPrice(90000); setMaxPrice(150000); }}
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                  >
                    90,000 - 150,000
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { setMinPrice(2000000); setMaxPrice(5000000); }}
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                  >
                    งบ 2 - 5 ล้าน
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMinPrice(5000000); setMaxPrice(8500000); }}
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                  >
                    5 - 8.5 ล้าน
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMinPrice(8500000); setMaxPrice(20000000); }}
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                  >
                    บ้านหรู &gt; 8.5 ล้าน
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Map Container & Legend */}
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Leaflet Map Target Element */}
        <div
          ref={mapContainerRef}
          id="leaflet-property-map"
          className="w-full h-[520px] z-10"
        />

        {/* Floating Map Legend */}
        <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-lg text-xs space-y-1.5 max-w-[220px]">
          <p className="font-bold text-slate-800 pb-1 border-b border-slate-100 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            ระดับราคา
          </p>

          {mode === 'condo' ? (
            <>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-slate-600">&lt; 60,000 บ./ตร.ม. (ประหยัด)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                <span className="text-slate-600">60,000 - 110,000 บ. (ปานกลาง)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500 shrink-0" />
                <span className="text-slate-600">110,000 - 180,000 บ. (พรีเมียม)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                <span className="text-slate-600">&gt; 180,000 บ./ตร.ม. (ลักชัวรี)</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-slate-600">&lt; 4.5 ล้านบาท</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                <span className="text-slate-600">4.5 - 7.5 ล้านบาท</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500 shrink-0" />
                <span className="text-slate-600">7.5 - 11.0 ล้านบาท</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                <span className="text-slate-600">&gt; 11.0 ล้านบาท (บ้านหรู)</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
