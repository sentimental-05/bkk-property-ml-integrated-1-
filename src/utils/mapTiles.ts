// ตั้งค่า tile ของแผนที่ที่เดียว ใช้ร่วมกันทุกหน้า
// เลือกผู้ให้บริการผ่านไฟล์ .env.local (ตัวแปรต้องขึ้นต้น VITE_ และต้องรีสตาร์ท npm run dev หลังแก้)
//   VITE_MAP_PROVIDER = osm (ค่าเริ่มต้น, ไม่ต้องมี key) | maptiler | stadia | mapbox
//   VITE_MAP_API_KEY  = key ของผู้ให้บริการที่เลือก
//   VITE_MAP_TILE_URL = (ไม่บังคับ) URL แบบเต็มของคุณเอง ใช้แทนทั้งหมด

export interface TileConfig {
  url: string;
  options: { attribution: string; maxZoom: number; tileSize?: number; zoomOffset?: number };
}

const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const env = (import.meta as any).env || {};

export function getTileConfig(): TileConfig {
  const provider = String(env.VITE_MAP_PROVIDER || 'osm').toLowerCase();
  const key = String(env.VITE_MAP_API_KEY || '');
  const custom = String(env.VITE_MAP_TILE_URL || '');

  if (custom) return { url: custom, options: { attribution: OSM_ATTR, maxZoom: 19 } };

  if (provider === 'maptiler' && key) {
    return {
      url: `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${encodeURIComponent(key)}`,
      options: { attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> ' + OSM_ATTR, maxZoom: 19 },
    };
  }
  if (provider === 'stadia' && key) {
    return {
      url: `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=${encodeURIComponent(key)}`,
      options: { attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> ' + OSM_ATTR, maxZoom: 19 },
    };
  }
  if (provider === 'mapbox' && key) {
    return {
      url: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${encodeURIComponent(key)}`,
      options: { attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> ' + OSM_ATTR, maxZoom: 19 },
    };
  }
  // ค่าเริ่มต้น: OpenStreetMap (ไม่ต้องใช้ key เหมาะกับทดสอบ/ทราฟฟิกน้อย)
  return { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', options: { attribution: OSM_ATTR, maxZoom: 19 } };
}
