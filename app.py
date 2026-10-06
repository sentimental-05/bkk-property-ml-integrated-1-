"""
BKK Real Estate - Web Application Prototype (Streamlit)
แนะนำและพยากรณ์ราคาบ้าน/คอนโด ในกรุงเทพฯ พร้อมฟังก์ชันประเมินความสามารถในการผ่อนตามเกณฑ์ DSR
รันคำสั่ง: streamlit run app.py
"""

import streamlit as st
import pandas as pd
import folium
from folium.plugins import MarkerCluster

try:
    from streamlit_folium import st_folium
    HAS_STREAMLIT_FOLIUM = True
except ImportError:
    HAS_STREAMLIT_FOLIUM = False

# -----------------------------------------------------------------------------
# 1. การตั้งค่าหน้าเว็บ (Page Config)
# -----------------------------------------------------------------------------
st.set_page_config(
    page_title="BKK Real Estate - แนะนำและพยากรณ์ราคาบ้าน/คอนโด",
    page_icon="🏡",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# -----------------------------------------------------------------------------
# 2. ปรับแต่งสไตล์ CSS ให้สวยงามเหมือนเว็บอสังหาริมทรัพย์ชั้นนำ (โทน ขาว-เขียวมรกต-น้ำเงินเข้ม)
# -----------------------------------------------------------------------------
st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Prompt', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    /* ซ่อน Streamlit branding ส่วนเกิน */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    
    /* Top Navbar */
    .bkk-navbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.8rem 1.5rem;
        background: #ffffff;
        border-bottom: 1px solid #e2e8f0;
        margin-bottom: 0.5rem;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .bkk-logo {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-size: 1.4rem;
        font-weight: 700;
        color: #065f46;
        text-decoration: none;
    }
    .bkk-nav-link {
        display: inline-block;
        background: #059669;
        color: #ffffff !important;
        font-weight: 500;
        padding: 0.5rem 1.2rem;
        border-radius: 8px;
        text-decoration: none;
        transition: all 0.2s ease;
        box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25);
    }
    .bkk-nav-link:hover {
        background: #047857;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35);
    }
    
    /* Hero Banner */
    .hero-container {
        position: relative;
        width: 100%;
        height: 380px;
        border-radius: 16px;
        overflow: hidden;
        margin-bottom: 2rem;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
    }
    .hero-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: brightness(0.65);
    }
    .hero-content {
        position: absolute;
        top: 50%;
        left: 5%;
        transform: translateY(-50%);
        color: #ffffff;
        max-width: 680px;
        z-index: 2;
    }
    .hero-badge {
        display: inline-block;
        background: rgba(16, 185, 129, 0.9);
        color: #ffffff;
        font-size: 0.85rem;
        font-weight: 600;
        padding: 0.3rem 0.8rem;
        border-radius: 20px;
        margin-bottom: 0.8rem;
        letter-spacing: 0.5px;
    }
    .hero-title {
        font-size: 2.2rem;
        font-weight: 700;
        line-height: 1.25;
        margin-bottom: 0.6rem;
        text-shadow: 0 2px 6px rgba(0,0,0,0.4);
    }
    .hero-subtitle {
        font-size: 1.05rem;
        color: #f1f5f9;
        margin-bottom: 1.2rem;
        line-height: 1.5;
        text-shadow: 0 1px 4px rgba(0,0,0,0.4);
    }

    /* Property Card */
    .prop-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        margin-bottom: 1.5rem;
        display: flex;
        flex-direction: column;
        height: 100%;
    }
    .prop-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px -8px rgba(0,0,0,0.12);
        border-color: #10b981;
    }
    .prop-card.selected-card {
        border: 2.5px solid #059669;
        background: #f0fdf4;
    }
    .prop-img-wrapper {
        position: relative;
        height: 180px;
        width: 100%;
        overflow: hidden;
    }
    .prop-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .prop-type-badge {
        position: absolute;
        top: 12px;
        left: 12px;
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(4px);
        color: #ffffff;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.25rem 0.65rem;
        border-radius: 6px;
    }
    .prop-price-tag {
        position: absolute;
        bottom: 12px;
        right: 12px;
        background: #059669;
        color: #ffffff;
        font-size: 0.95rem;
        font-weight: 700;
        padding: 0.3rem 0.75rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    }
    .prop-body {
        padding: 1rem;
        flex: 1;
        display: flex;
        flex-direction: column;
    }
    .prop-title {
        font-size: 1.05rem;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 0.25rem;
    }
    .prop-loc {
        font-size: 0.85rem;
        color: #64748b;
        margin-bottom: 0.75rem;
        display: flex;
        align-items: center;
        gap: 0.3rem;
    }
    .prop-specs {
        display: flex;
        gap: 0.8rem;
        font-size: 0.8rem;
        color: #475569;
        padding-top: 0.5rem;
        border-top: 1px solid #f1f5f9;
        margin-top: auto;
    }

    /* Selected House Banner */
    .selected-summary-box {
        background: linear-gradient(135deg, #065f46 0%, #047857 100%);
        color: white;
        padding: 1.25rem 1.5rem;
        border-radius: 12px;
        margin-bottom: 1.5rem;
        box-shadow: 0 4px 16px rgba(4, 120, 87, 0.25);
    }

    /* Metrics & Result Badges */
    .result-box-pass {
        background: #ecfdf5;
        border: 2px solid #10b981;
        border-radius: 12px;
        padding: 1.25rem;
        color: #065f46;
    }
    .result-box-warn {
        background: #fffbeb;
        border: 2px solid #f59e0b;
        border-radius: 12px;
        padding: 1.25rem;
        color: #92400e;
    }
    .result-box-danger {
        background: #fef2f2;
        border: 2px solid #ef4444;
        border-radius: 12px;
        padding: 1.25rem;
        color: #991b1b;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# -----------------------------------------------------------------------------
# 3. ข้อมูล Mock Data อสังหาริมทรัพย์ในกรุงเทพฯ (12 รายการ กระจายทำเลและประเภท)
# -----------------------------------------------------------------------------
PROPERTIES_DATA = [
    {
        "id": 1,
        "title": "Life Asoke Hype",
        "type": "คอนโด",
        "district": "ราชเทวี / อโศก-พระราม 9",
        "price": 3890000,
        "area_sqm": 32.0,
        "price_sqm": 121562,
        "bedrooms": 1,
        "bathrooms": 1,
        "lat": 13.7548,
        "lng": 100.5638,
        "image": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
        "distance_bts_km": 0.4,
    },
    {
        "id": 2,
        "title": "The Base Sukhumvit 50",
        "type": "คอนโด",
        "district": "คลองเตย / พระโขนง",
        "price": 2790000,
        "area_sqm": 31.5,
        "price_sqm": 88571,
        "bedrooms": 1,
        "bathrooms": 1,
        "lat": 13.7065,
        "lng": 100.5982,
        "image": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
        "distance_bts_km": 0.9,
    },
    {
        "id": 3,
        "title": "Ashton Silom",
        "type": "คอนโด",
        "district": "บางรัก / สีลม",
        "price": 7900000,
        "area_sqm": 34.0,
        "price_sqm": 232352,
        "bedrooms": 1,
        "bathrooms": 1,
        "lat": 13.7258,
        "lng": 100.5284,
        "image": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
        "distance_bts_km": 0.35,
    },
    {
        "id": 4,
        "title": "Siri Place Charan-Pin Klao",
        "type": "ทาวน์โฮม",
        "district": "บางพลัด / จรัญสนิทวงศ์",
        "price": 3490000,
        "area_sqm": 118.0,
        "price_sqm": 29576,
        "bedrooms": 3,
        "bathrooms": 2,
        "lat": 13.7915,
        "lng": 100.4950,
        "image": "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80",
        "distance_bts_km": 1.8,
    },
    {
        "id": 5,
        "title": "Pleno Srinakarin-Bangna",
        "type": "ทาวน์โฮม",
        "district": "ประเวศ / บางนา",
        "price": 2890000,
        "area_sqm": 106.0,
        "price_sqm": 27264,
        "bedrooms": 3,
        "bathrooms": 2,
        "lat": 13.6702,
        "lng": 100.6515,
        "image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        "distance_bts_km": 3.2,
    },
    {
        "id": 6,
        "title": "Grande Pleno Suksawat-Rama 3",
        "type": "ทาวน์โฮม",
        "district": "ราษฎร์บูรณะ / สุขสวัสดิ์",
        "price": 4290000,
        "area_sqm": 145.0,
        "price_sqm": 29586,
        "bedrooms": 3,
        "bathrooms": 3,
        "lat": 13.6795,
        "lng": 100.5090,
        "image": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
        "distance_bts_km": 2.5,
    },
    {
        "id": 7,
        "title": "Centro Rama 9-Motorway",
        "type": "บ้านเดี่ยว",
        "district": "สะพานสูง / กรุงเทพกรีฑา",
        "price": 6890000,
        "area_sqm": 190.0,
        "price_sqm": 36263,
        "bedrooms": 4,
        "bathrooms": 3,
        "lat": 13.7431,
        "lng": 100.6720,
        "image": "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
        "distance_bts_km": 4.5,
    },
    {
        "id": 8,
        "title": "Bangkok Boulevard Sathorn-Pinklao",
        "type": "บ้านเดี่ยว",
        "district": "ตลิ่งชัน / ราชพฤกษ์",
        "price": 9500000,
        "area_sqm": 248.0,
        "price_sqm": 38306,
        "bedrooms": 4,
        "bathrooms": 4,
        "lat": 13.7845,
        "lng": 100.4432,
        "image": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
        "distance_bts_km": 3.8,
    },
    {
        "id": 9,
        "title": "Narasiri Krungthep Kreetha",
        "type": "บ้านเดี่ยว",
        "district": "บางกะปิ / กรุงเทพกรีฑา",
        "price": 18500000,
        "area_sqm": 360.0,
        "price_sqm": 51388,
        "bedrooms": 4,
        "bathrooms": 5,
        "lat": 13.7510,
        "lng": 100.6905,
        "image": "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80",
        "distance_bts_km": 5.0,
    },
    {
        "id": 10,
        "title": "Ideo Mobi Rama 9",
        "type": "คอนโด",
        "district": "ห้วยขวาง / พระราม 9",
        "price": 3290000,
        "area_sqm": 30.0,
        "price_sqm": 109666,
        "bedrooms": 1,
        "bathrooms": 1,
        "lat": 13.7570,
        "lng": 100.5662,
        "image": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
        "distance_bts_km": 0.25,
    },
    {
        "id": 11,
        "title": "Baan Klang Muang Ladprao 71",
        "type": "ทาวน์โฮม",
        "district": "ลาดพร้าว / นาคนิวาส",
        "price": 4690000,
        "area_sqm": 150.0,
        "price_sqm": 31266,
        "bedrooms": 3,
        "bathrooms": 3,
        "lat": 13.8055,
        "lng": 100.6090,
        "image": "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=800&q=80",
        "distance_bts_km": 2.2,
    },
    {
        "id": 12,
        "title": "Setthasiri Pattanakarn",
        "type": "บ้านเดี่ยว",
        "district": "ประเวศ / พัฒนาการ",
        "price": 11500000,
        "area_sqm": 260.0,
        "price_sqm": 44230,
        "bedrooms": 4,
        "bathrooms": 4,
        "lat": 13.7225,
        "lng": 100.6550,
        "image": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
        "distance_bts_km": 3.0,
    },
]

# -----------------------------------------------------------------------------
# 4. ฟังก์ชันพยากรณ์ราคา (Mock Machine Learning Formula)
# -----------------------------------------------------------------------------
def predict_ml_price(prop_dict):
    """
    # TODO: แทนด้วยโมเดล Machine Learning จริงในอนาคต (เช่น XGBoost, Random Forest 
    # หรือ Scikit-learn Pipeline ที่ train ด้วยชุดข้อมูลราคาประเมินจริงในกรุงเทพฯ)
    """
    base_price = prop_dict["price"]
    # Mock adjustment: คำนวณความคลาดเคลื่อนสมมติ +/- 3% จากปัจจัยระยะห่างรถไฟฟ้าและพื้นที่
    adjustment_factor = 1.0 + (0.02 if prop_dict["distance_bts_km"] < 1.0 else -0.01)
    predicted_val = round(base_price * adjustment_factor / 10000) * 10000
    return predicted_val

# -----------------------------------------------------------------------------
# 5. ฟังก์ชันคำนวณทางการเงิน (Amortization & DSR)
# -----------------------------------------------------------------------------
def calculate_monthly_installment(principal, annual_interest_rate_percent, loan_term_years):
    """คำนวณค่างวดรายเดือนด้วยสูตร Amortization มาตรฐานธนาคาร"""
    if principal <= 0:
        return 0
    monthly_rate = (annual_interest_rate_percent / 100.0) / 12.0
    total_months = loan_term_years * 12
    if monthly_rate == 0:
        return principal / total_months
    # M = P * [r(1+r)^n] / [(1+r)^n - 1]
    monthly_payment = principal * (monthly_rate * (1 + monthly_rate) ** total_months) / ((1 + monthly_rate) ** total_months - 1)
    return round(monthly_payment)

def get_color_by_sqm(price_sqm):
    """
    ช่วงสีตามราคาต่อ ตร.ม.:
    เขียว < 60,000 | น้ำเงิน 60,000-110,000 | ม่วง 110,000-180,000 | แดง > 180,000
    """
    if price_sqm < 60000:
        return "green"
    elif price_sqm <= 110000:
        return "blue"
    elif price_sqm <= 180000:
        return "purple"
    else:
        return "red"

def get_color_hex(price_sqm):
    if price_sqm < 60000:
        return "#10b981"
    elif price_sqm <= 110000:
        return "#2563eb"
    elif price_sqm <= 180000:
        return "#8b5cf6"
    else:
        return "#ef4444"

# -----------------------------------------------------------------------------
# 6. จัดการ Session State
# -----------------------------------------------------------------------------
if "selected_property_id" not in st.session_state:
    st.session_state["selected_property_id"] = PROPERTIES_DATA[0]["id"]

# หาข้อมูลของบ้านที่ถูกเลือก
selected_prop = next(
    (p for p in PROPERTIES_DATA if p["id"] == st.session_state["selected_property_id"]),
    PROPERTIES_DATA[0]
)

# =============================================================================
# === ส่วนที่ 1: HERO SECTION (บนสุด) ===
# =============================================================================

# Navbar ด้านบนสุด
st.markdown(
    """
    <div class="bkk-navbar">
        <div class="bkk-logo">
            <span>🏢</span>
            <span>BKK Living & Price Predictor</span>
        </div>
        <div>
            <a href="#property-section" class="bkk-nav-link">มีอะไรให้เลือกบ้าง ▾</a>
        </div>
    </div>
    """,
    unsafe_allow_html=True,
)

# รูปภาพ hero เต็มความกว้างจอด้านล่างเมนู (Unsplash Bangkok skyline placeholder)
st.markdown(
    """
    <div class="hero-container">
        <img class="hero-img" src="https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1600&q=80" alt="Bangkok Cityscape">
        <div class="hero-content">
            <span class="hero-badge">Bangkok Real Estate Intelligence</span>
            <h1 class="hero-title">ค้นหาบ้านและคอนโดที่ใช่<br>พร้อมคำนวณความสามารถในการผ่อนจริง</h1>
            <p class="hero-subtitle">
                แนะนำโครงการอสังหาริมทรัพย์ชั้นนำทั่วกรุงเทพฯ พร้อมโมเดลประมาณการราคา 
                และเกณฑ์ DSR 40% ให้คุณวางแผนการกู้ซื้อบ้านได้อย่างมั่นใจ
            </p>
        </div>
    </div>
    """,
    unsafe_allow_html=True,
)

# =============================================================================
# === ส่วนที่ 2: รายการบ้าน/คอนโด (การ์ด Grid 4 คอลัมน์) ===
# =============================================================================
st.markdown('<div id="property-section"></div>', unsafe_allow_html=True)
st.markdown("### 🏘️ รายการบ้านและคอนโดแนะนำในกรุงเทพฯ")
st.caption("คลิกเลือกการ์ดอสังหาริมทรัพย์เพื่อนำข้อมูลไปคำนวณค่างวดและความสามารถในการกู้")

# แสดงการ์ด 4 คอลัมน์
cols_per_row = 4
for i in range(0, len(PROPERTIES_DATA), cols_per_row):
    row_props = PROPERTIES_DATA[i : i + cols_per_row]
    cols = st.columns(cols_per_row)
    
    for idx, prop in enumerate(row_props):
        with cols[idx]:
            is_selected = (prop["id"] == st.session_state["selected_property_id"])
            card_class = "prop-card selected-card" if is_selected else "prop-card"
            
            # การ์ดแสดงผล
            st.markdown(
                f"""
                <div class="{card_class}">
                    <div class="prop-img-wrapper">
                        <img class="prop-img" src="{prop['image']}" alt="{prop['title']}">
                        <div class="prop-type-badge">{prop['type']}</div>
                        <div class="prop-price-tag">฿{prop['price']:,}</div>
                    </div>
                    <div class="prop-body">
                        <div class="prop-title">{prop['title']}</div>
                        <div class="prop-loc">📍 {prop['district']}</div>
                        <div class="prop-specs">
                            <span>📐 {prop['area_sqm']} ตร.ม.</span>
                            <span>🛏️ {prop['bedrooms']} นอน</span>
                            <span>🚿 {prop['bathrooms']} น้ำ</span>
                        </div>
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )
            
            # ปุ่มเลือกการ์ด
            button_label = "✅ กำลังเลือกหลังนี้" if is_selected else "ดูรายละเอียด / คำนวณ"
            if st.button(button_label, key=f"btn_select_{prop['id']}", use_container_width=True):
                st.session_state["selected_property_id"] = prop["id"]
                st.rerun()

st.write("---")

# =============================================================================
# === ส่วนที่ 3 & 4: ฟอร์มคำนวณความสามารถในการผ่อน & ผลลัพธ์ DSR ===
# =============================================================================
st.markdown('<div id="calculator-section"></div>', unsafe_allow_html=True)
st.markdown("### 🧮 คำนวณความสามารถในการผ่อน (DSR & Amortization)")
st.caption("ระบบจะใช้เกณฑ์มาตรฐานภาระหนี้ไม่เกิน 40% ของรายได้ เพื่อความปลอดภัยทางการเงิน")

# กล่องแสดงข้อมูลอสังหาริมทรัพย์ที่ผู้ใช้กำลังเลือก
ml_price = predict_ml_price(selected_prop)

st.markdown(
    f"""
    <div class="selected-summary-box">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
                <span style="background: rgba(255,255,255,0.2); padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.8rem;">
                    {selected_prop['type']} ที่เลือก
                </span>
                <h3 style="margin: 0.3rem 0; font-size: 1.4rem; color: #ffffff;">{selected_prop['title']}</h3>
                <p style="margin: 0; opacity: 0.9; font-size: 0.95rem;">📍 {selected_prop['district']} | ขนาด {selected_prop['area_sqm']} ตร.ม. (฿{selected_prop['price_sqm']:,}/ตร.ม.)</p>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 0.85rem; opacity: 0.85;">ราคาเริ่มต้นโครงการ</div>
                <div style="font-size: 1.6rem; font-weight: 700; color: #fef08a;">฿{selected_prop['price']:,}</div>
                <div style="font-size: 0.75rem; opacity: 0.8;">💡 ราคาประเมินแบบจำลอง: ฿{ml_price:,}</div>
            </div>
        </div>
    </div>
    """,
    unsafe_allow_html=True,
)

calc_col1, calc_col2 = st.columns([1, 1], gap="large")

with calc_col1:
    st.markdown("#### 📝 ข้อมูลทางการเงินของผู้กู้")
    with st.form("loan_calculator_form"):
        salary = st.number_input(
            "เงินเดือนปัจจุบัน (บาท/เดือน):",
            min_value=15000,
            max_value=2000000,
            value=65000,
            step=5000,
            format="%d",
            help="รายได้ประจำสุทธิต่อเดือน",
        )
        
        other_debt = st.number_input(
            "ภาระหนี้สินอื่นต่อเดือน (บาท/เดือน ถ้ามี):",
            min_value=0,
            max_value=1000000,
            value=8000,
            step=1000,
            format="%d",
            help="เช่น ค่างวดรถ บัตรเครดิต สินเชื่อส่วนบุคคลเดิม",
        )
        
        down_payment_pct = st.slider(
            "เงินดาวน์ที่มี (% ของราคาบ้าน):",
            min_value=0,
            max_value=50,
            value=10,
            step=5,
            format="%d%%",
        )
        
        loan_years = st.slider(
            "ระยะเวลาผ่อน (ปี):",
            min_value=5,
            max_value=35,
            value=30,
            step=1,
            format="%d ปี",
        )
        
        interest_rate = st.number_input(
            "อัตราดอกเบี้ยเฉลี่ย (% ต่อปี):",
            min_value=1.0,
            max_value=15.0,
            value=6.5,
            step=0.25,
            format="%.2f",
            help="อัตราดอกเบี้ยเฉลี่ยตลอดอายุสัญญา (ทั่วไป 6-7%)",
        )
        
        calc_submitted = st.form_submit_button("🚀 คำนวณความสามารถในการผ่อน", use_container_width=True)

# คำนวณตัวเลข
down_payment_amount = selected_prop["price"] * (down_payment_pct / 100.0)
loan_principal = max(0, selected_prop["price"] - down_payment_amount)

# 1. ค่างวดจริงของบ้าน
actual_monthly_installment = calculate_monthly_installment(
    principal=loan_principal,
    annual_interest_rate_percent=interest_rate,
    loan_term_years=loan_years,
)

# 2. ความสามารถในการผ่อนสูงสุดตามเกณฑ์ DSR 40%
# สูตร: ยอดผ่อนสูงสุดที่แนะนำ = (เงินเดือน x 0.4) - ภาระหนี้เดิม
max_affordable_dsr = round((salary * 0.40) - other_debt)

with calc_col2:
    st.markdown("#### 📊 ผลลัพธ์การประเมินความสามารถในการผ่อน")
    
    # การ์ดแสดงเมทริกซ์คู่กัน
    metric_col_a, metric_col_b = st.columns(2)
    with metric_col_a:
        st.metric(
            label="ค่างวดโดยประมาณของบ้านนี้",
            value=f"฿{actual_monthly_installment:,}/เดือน",
            help=f"คำนวณจากยอดกู้ ฿{loan_principal:,.0f} (หักเงินดาวน์ {down_payment_pct}%)",
        )
    with metric_col_b:
        st.metric(
            label="ความสามารถในการผ่อนสูงสุดของคุณ",
            value=f"฿{max_affordable_dsr:,}/เดือน",
            delta=f"DSR 40% หักหนี้เดิม ฿{other_debt:,}",
            delta_color="off",
            help="เกณฑ์แนะนำไม่เกิน 40% ของเงินเดือน หักภาระหนี้เดิม",
        )
    
    st.write("")
    
    # กล่องแจ้งเตือนผลลัพธ์
    if max_affordable_dsr <= 0:
        st.markdown(
            f"""
            <div class="result-box-danger">
                <h4 style="margin:0 0 0.5rem 0;">⚠️ ภาระหนี้เดิมเกินเกณฑ์ DSR 40%</h4>
                <p style="margin:0; font-size:0.95rem;">
                    ภาระหนี้เดิม (฿{other_debt:,}/เดือน) เกินหรือเท่ากับ 40% ของเงินเดือน 
                    แนะนำให้ปิดยอดหนี้เดิมก่อนยื่นขอสินเชื่อที่อยู่อาศัย
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )
    elif actual_monthly_installment <= max_affordable_dsr:
        diff = max_affordable_dsr - actual_monthly_installment
        st.markdown(
            f"""
            <div class="result-box-pass">
                <h4 style="margin:0 0 0.5rem 0;">✅ อยู่ในเกณฑ์ที่ผ่อนไหว</h4>
                <p style="margin:0; font-size:0.95rem;">
                    ค่างวดบ้านนี้ (฿{actual_monthly_installment:,}) ไม่เกินเพดานที่แนะนำ (฿{max_affordable_dsr:,}) 
                    โดยคุณยังมีสภาพคล่องเหลืองวดละ <strong>฿{diff:,} บาท</strong>
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )
    else:
        diff = actual_monthly_installment - max_affordable_dsr
        st.markdown(
            f"""
            <div class="result-box-warn">
                <h4 style="margin:0 0 0.5rem 0;">⚠️ เกินความสามารถในการผ่อน</h4>
                <p style="margin:0; font-size:0.95rem;">
                    ค่างวดบ้านนี้สูงกว่าเกณฑ์ปลอดภัยอยู่ <strong>฿{diff:,} บาท/เดือน</strong><br>
                    💡 คำแนะนำ: ลองเลือกบ้านที่ราคาต่ำกว่านี้ หรือเพิ่มเงินดาวน์เป็น {down_payment_pct + 10}% - {down_payment_pct + 20}% 
                    หรือขยายระยะเวลาผ่อนเพื่อลดค่างวดต่อเดือน
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )
    
    # รายละเอียดการคำนวณย่อย
    with st.expander("🔍 ดูรายละเอียดตัวเลขการคำนวณ"):
        st.write(f"- **ราคาอสังหาริมทรัพย์:** ฿{selected_prop['price']:,} บาท")
        st.write(f"- **เงินดาวน์ ({down_payment_pct}%):** ฿{down_payment_amount:,.0f} บาท")
        st.write(f"- **ยอดขอสินเชื่อสุทธิ:** ฿{loan_principal:,.0f} บาท")
        st.write(f"- **ระยะเวลาผ่อน:** {loan_years} ปี ({loan_years * 12} งวด)")
        st.write(f"- **อัตราดอกเบี้ย:** {interest_rate:.2f}% ต่อปี")
        st.write(f"- **เพดานหนี้สูงสุด (40% ของเงินเดือน):** ฿{(salary * 0.4):,.0f} บาท/เดือน")
        st.write(f"- **หักภาระหนี้เดิม:** -฿{other_debt:,} บาท/เดือน")

st.write("---")

# =============================================================================
# === ส่วนที่ 5: แผนที่ INTERACTIVE (FOLIUM) ===
# =============================================================================
st.markdown('<div id="map-section"></div>', unsafe_allow_html=True)
st.markdown("### 🗺️ แผนที่พิกัดอสังหาริมทรัพย์ในกรุงเทพฯ")
st.caption("จุดสีแสดงช่วงราคาต่อ ตารางเมตร | หมุดสีทองพิเศษคือตำแหน่งอสังหาริมทรัพย์ที่คุณกำลังเลือก")

# สร้าง Legend แถบสี
st.markdown(
    """
    <div style="display:flex; flex-wrap:wrap; gap:1rem; margin-bottom:1rem; font-size:0.85rem; align-items:center;">
        <span style="font-weight:600;">ช่วงราคา/ตร.ม.:</span>
        <span><span style="color:#10b981; font-weight:700;">●</span> &lt; 60,000 บ./ตร.ม.</span>
        <span><span style="color:#2563eb; font-weight:700;">●</span> 60,000 - 110,000 บ./ตร.ม.</span>
        <span><span style="color:#8b5cf6; font-weight:700;">●</span> 110,000 - 180,000 บ./ตร.ม.</span>
        <span><span style="color:#ef4444; font-weight:700;">●</span> &gt; 180,000 บ./ตร.ม.</span>
        <span><span style="color:#f59e0b; font-weight:700;">⭐</span> หมุดที่เลือกปัจจุบัน</span>
    </div>
    """,
    unsafe_allow_html=True,
)

# สร้าง Folium Map กลางกรุงเทพฯ
bkk_center = [selected_prop["lat"], selected_prop["lng"]]
m = folium.Map(
    location=bkk_center,
    zoom_start=11,
    tiles="CartoDB positron",
)

# วนลูปปักหมุดโครงการทั้งหมด
for prop in PROPERTIES_DATA:
    color = get_color_by_sqm(prop["price_sqm"])
    color_hex = get_color_hex(prop["price_sqm"])
    is_this_selected = (prop["id"] == selected_prop["id"])
    
    popup_html = f"""
    <div style="font-family:'Prompt',sans-serif; width:220px;">
        <h4 style="margin:0 0 4px 0; color:#1e293b;">{prop['title']}</h4>
        <span style="background:{color_hex}; color:white; padding:2px 6px; border-radius:4px; font-size:11px;">{prop['type']}</span>
        <div style="margin-top:6px; font-size:12px; color:#475569;">📍 {prop['district']}</div>
        <div style="font-size:14px; font-weight:bold; color:#059669; margin:4px 0;">฿{prop['price']:,}</div>
        <div style="font-size:11px; color:#64748b;">(฿{prop['price_sqm']:,}/ตร.ม. | {prop['area_sqm']} ตร.ม.)</div>
    </div>
    """
    
    if is_this_selected:
        # ปักหมุดเด่นสีทองพร้อมไอคอนดาว
        folium.Marker(
            location=[prop["lat"], prop["lng"]],
            popup=folium.Popup(popup_html, max_width=260),
            tooltip=f"⭐ [เลือกอยู่] {prop['title']} (฿{prop['price']:,})",
            icon=folium.Icon(color="orange", icon="star", prefix="fa"),
        ).add_to(m)
        
        # วงรัศมีไฮไลต์รอบหมุดที่เลือก
        folium.CircleMarker(
            location=[prop["lat"], prop["lng"]],
            radius=16,
            color="#f59e0b",
            weight=3,
            fill=True,
            fill_color="#fef3c7",
            fill_opacity=0.6,
        ).add_to(m)
    else:
        # ปักหมุดวงกลมสีตามช่วงราคา/ตร.ม.
        folium.CircleMarker(
            location=[prop["lat"], prop["lng"]],
            radius=9,
            color=color_hex,
            weight=2,
            fill=True,
            fill_color=color_hex,
            fill_opacity=0.85,
            popup=folium.Popup(popup_html, max_width=260),
            tooltip=f"{prop['title']} - ฿{prop['price_sqm']:,}/ตร.ม.",
        ).add_to(m)

# แสดงแผนที่ใน Streamlit
if HAS_STREAMLIT_FOLIUM:
    st_folium(m, width="100%", height=500, returned_objects=[])
else:
    # Fallback กรณีไม่ได้ลง streamlit-folium
    st.components.v1.html(m._repr_html_(), height=520, scrolling=False)

st.caption("หมายเหตุ: ข้อมูลราคาและพิกัดจำลองขึ้นเพื่อการสาธิตระบบ Prototype การกู้ซื้อที่อยู่อาศัยจริงขึ้นอยู่กับนโยบายของแต่ละสถาบันการเงิน")
