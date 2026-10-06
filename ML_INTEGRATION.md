# เชื่อมโมเดล ML + หลังบ้านเพิ่มข้อมูล

## สถาปัตยกรรม
```
เบราว์เซอร์ ──► Express (server.ts, :3000) ──► FastAPI (ml_service, 127.0.0.1:8000) ──► models/*.pkl + data/*_master.csv
                 └ /api/ml/*     (สาธารณะ: ทำนาย, options)
                 └ /api/admin/*  (ต้องมี ADMIN_TOKEN: เพิ่มข้อมูล, เทรนใหม่)
```

## ขั้นตอนติดตั้ง
1. **รัน notebook จากโฟลเดอร์โปรเจกต์นี้** (cwd = โฟลเดอร์ที่มี server.ts) เพื่อให้ได้ `data/condo_master.csv`, `data/house_master.csv`,
   `models/model_latest_*.pkl`, `models/model_*_*.pkl`, `models/knn_reference_*.csv`, `model_registry.csv` ในที่ที่บริการหาเจอ
   (ถ้าเก็บที่อื่น ตั้ง `ML_BASE_DIR=/path/to/folder`)
2. **Python** — ใช้ environment เดียวกับที่รัน notebook (หรือเวอร์ชัน scikit-learn / xgboost เท่ากัน ไม่งั้นโหลด .pkl ไม่ได้หรือผลเพี้ยน):
   `pip install -r ml_service/requirements.txt` แล้ว `npm run ml`
3. **เว็บ** — คัดลอก `.env.example` เป็น `.env.local` ตั้ง `ADMIN_TOKEN` (เช่น `openssl rand -hex 24`) แล้ว `npm install && npm run dev`
4. เปิดหน้าแอดมินที่ `/#admin` หรือลิงก์ "สำหรับผู้ดูแล" ท้ายเว็บ

## ตรวจว่าจับคู่ตัวแปรถูกไหม (สำคัญ)
ฟอร์มคอนโดของเว็บส่งชื่อ field แบบ camelCase (`bldAge`, `distTran1` …) ระบบจับคู่กับคอลัมน์ที่โมเดลเรียนมาให้อัตโนมัติ
(ไม่สนตัวพิมพ์และ `_`) และมี `ml_service/column_map.json` ไว้แก้กรณีชื่อไม่ตรง
เปิด `http://127.0.0.1:8000/docs` ลองยิง `/predict` ดูฟิลด์ `unmatched_inputs` (ค่าจากเว็บที่โมเดลไม่มีคอลัมน์รองรับ)
และ `defaulted_columns` (คอลัมน์ของโมเดลที่เว็บไม่ได้ถาม จึงใช้ค่ากลางจาก master)

## หลังบ้านทำอะไรได้
- กรอกข้อมูลทีละรายการ — ฟอร์มสร้างจากคอลัมน์ของ master จริง
- อัปโหลด CSV (คอนโดรับไฟล์ดิบที่มี `dist_shop_1…` ได้ ระบบแปลงเป็น mean/min เหมือน notebook)
- ตรวจแถวเสีย/ซ้ำ, สำรอง master ก่อนเขียนทุกครั้ง (`data/backup/`), บันทึกประวัติ (`data/ingest_log.csv`)
- สั่งเทรนใหม่ (RandomForest, XGBoost, XGBoost+KMeans, KNN, DecisionTree, ANN) เลือกตัวที่ R² สูงสุด เหมือน notebook
  โมเดลชุดเก่าย้ายไป `models/archive/<เวลา>/`, ลง `model_registry.csv` รูปแบบเดิม 8 คอลัมน์ (notebook ยังเขียนต่อได้)

## ข้อจำกัดที่ควรรู้
- ชุดทดสอบของแต่ละรอบเทรนเป็น random split 80/20 — เมื่อข้อมูลเปลี่ยน ตัวเลข R² ไม่เทียบกันตรง ๆ ข้ามเวอร์ชัน
- ช่วงราคาที่เว็บแสดงคือ ± MAE ของโมเดล ไม่ใช่ confidence interval จริง
- "อิทธิพลของแต่ละปัจจัย" ในฟอร์มคอนโดยังเป็นสูตรประมาณเดิมของเว็บ (ไม่ใช่ SHAP) — มีข้อความแจ้งบนหน้าจอ
- ถ้าบริการ Python ล่ม ฟอร์มคอนโดจะ fallback ไปสูตรเดิมพร้อมแจ้งผู้ใช้ ส่วนฟอร์มบ้านไม่มี fallback (สูตรเดิมเป็นของข้อมูล Ames, Iowa)
