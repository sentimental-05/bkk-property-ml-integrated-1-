import express from "express";
import path from "path";
import dotenv from "dotenv";
import crypto from "crypto";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// อัปโหลด CSV หลังบ้านอาจใหญ่กว่า 100kb — ตั้ง limit เฉพาะ /api/admin (ต้องมาก่อน parser ตัวหลัก)
app.use("/api/admin", express.json({ limit: "25mb" }));
app.use(express.json());

// API health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Helper for Gemini AI Client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Fallback regex / keyword intent parser
function parseIntentFallback(query: string) {
  const q = query.trim().toLowerCase();
  
  // Extract number
  let budgetAmount: number | null = null;
  
  // Look for million patterns (e.g. 3 ล้าน, 1.5 ล้าน, 3ล้าน)
  const millionMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:ล้าน|m|million)/i);
  if (millionMatch) {
    budgetAmount = Math.round(parseFloat(millionMatch[1]) * 1000000);
  } else {
    // Look for comma-separated or plain numbers
    const numMatches = q.match(/(\d{1,3}(?:,\d{3})+|\d{4,9})/g);
    if (numMatches && numMatches.length > 0) {
      const cleanNum = numMatches[0].replace(/,/g, '');
      budgetAmount = parseInt(cleanNum, 10);
    }
  }

  // Determine budget_type based on explicit prompt rules
  let budgetType: 'monthly_installment' | 'total_price' = 'monthly_installment';
  let needsConfirmation = false;
  let clarificationQuestion: string | null = null;

  const hasMonthlyWords = /ผ่อน|เดือนละ|ต่อเดือน|ค่างวด|ผ่อนไหว|งวดละ|monthly/i.test(q);
  const hasTotalPriceWords = /มีเงิน|งบซื้อ|ราคาไม่เกิน|ซื้อสด|เงินก้อน|งบรวม|total/i.test(q);

  if (hasMonthlyWords) {
    budgetType = 'monthly_installment';
  } else if (hasTotalPriceWords && budgetAmount && budgetAmount >= 200000) {
    budgetType = 'total_price';
  } else if (budgetAmount !== null) {
    if (budgetAmount < 200000) {
      // Prompt rule: ถ้าตัวเลขต่ำกว่า 200,000 บาท ให้ตีความเป็น "monthly_installment" เป็นค่าเริ่มต้น
      budgetType = 'monthly_installment';
    } else if (budgetAmount >= 500000) {
      budgetType = 'total_price';
    } else {
      // 200,000 - 500,000 is borderline
      needsConfirmation = true;
      clarificationQuestion = `คุณหมายถึง 'งบผ่อน ${budgetAmount.toLocaleString()} บาท/เดือน' หรือ 'งบซื้อเต็มจำนวน ${budgetAmount.toLocaleString()} บาท'?`;
    }
  }

  // Determine property type
  let propertyType: 'house' | 'condo' | 'both' = 'both';
  const hasHouse = /บ้าน|house|home|เดี่ยว|townhome|ทาวน์โฮม/i.test(q);
  const hasCondo = /คอนโด|condo|ห้องชุด|apartment|อพาร์ทเมนท์/i.test(q);
  if (hasHouse && !hasCondo) {
    propertyType = 'house';
  } else if (hasCondo && !hasHouse) {
    propertyType = 'condo';
  } else {
    propertyType = 'both';
  }

  // Extract location hint
  let locationHint: string | null = null;
  const knownLocations = [
    'จตุจักร', 'chatuchak', 'วัฒนา', 'watthana', 'สาทร', 'sathon',
    'สุขุมวิท', 'sukhumvit', 'บางแค', 'bang khae', 'บางกะปิ', 'bang kapi',
    'ห้วยขวาง', 'huai khwang', 'ดินแดง', 'din daeng', 'ดอนเมือง', 'don mueang',
    'พญาไท', 'phaya thai', 'ราชเทวี', 'ratchathewi', 'พระโขนง', 'phra khanong',
    'คลองเตย', 'khlong toei', 'ปทุมวัน', 'pathum wan', 'บางนา', 'bang na',
    'สายไหม', 'sai mai', 'ลาดพร้าว', 'lat phrao', 'อารีย์', 'ari', 'พร้อมพงษ์',
    'ทองหล่อ', 'thong lor', 'อ่อนนุช', 'on nut', 'ames', 'collgcr', 'veenker', 'crawfor'
  ];
  for (const loc of knownLocations) {
    if (q.includes(loc)) {
      locationHint = loc;
      break;
    }
  }

  // Room size
  let roomSizeSqm: number | null = null;
  const sizeMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:ตร\.ม\.|ตรม|ตร\.ม|sqm|sq\.m)/i);
  if (sizeMatch) {
    roomSizeSqm = parseFloat(sizeMatch[1]);
  }

  // Other preferences
  const otherPreferences: string[] = [];
  if (/bts|mrt|รถไฟฟ้า|สถานี/i.test(q)) otherPreferences.push('ใกล้รถไฟฟ้า BTS/MRT');
  if (/สระ|pool|swimming/i.test(q)) otherPreferences.push('มีสระว่ายน้ำ');
  if (/ฟิตเนส|gym|fitness/i.test(q)) otherPreferences.push('มีฟิตเนส');
  if (/จอดรถ|parking/i.test(q)) otherPreferences.push('มีที่จอดรถ');
  if (/นอน|bed|bedroom/i.test(q)) otherPreferences.push('ระบุห้องนอน');

  return {
    budget_amount: budgetAmount,
    budget_type: budgetType,
    property_type: propertyType,
    location_hint: locationHint,
    other_preferences: otherPreferences,
    room_size_sqm: roomSizeSqm,
    needs_confirmation: needsConfirmation,
    clarification_question: clarificationQuestion,
    interpreted_summary: budgetAmount
      ? `วิเคราะห์งบ: ${budgetType === 'monthly_installment' ? 'ผ่อนเดือนละ' : 'งบซื้อ'} ${budgetAmount.toLocaleString()} บาท (${propertyType === 'condo' ? 'คอนโด' : propertyType === 'house' ? 'บ้าน' : 'บ้านและคอนโด'})`
      : 'กรุณาระบุจำนวนเงินงบประมาณ เช่น 50,000 บาท หรือ 3 ล้านบาท'
  };
}

// 1) Natural Language Property Search Intent Extraction API
app.post("/api/ai-search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Missing query parameter" });
    }

    const ai = getGeminiClient();

    if (!ai) {
      // Fallback parser if API key is not configured in local environment
      const fallbackResult = parseIntentFallback(query);
      return res.json({
        success: true,
        source: "rule_engine",
        intent: fallbackResult
      });
    }

    // Call Gemini 3.8 Flash with structured JSON schema
    const prompt = `คุณคือผู้เชี่ยวชาญวิเคราะห์ความต้องการของผู้ซื้ออสังหาริมทรัพย์ (Intent Extraction)
จงวิเคราะห์ข้อความค้นหาภาษาธรรมชาติของผู้ใช้ต่อไปนี้:
"${query}"

และสกัดข้อมูลให้อยู่ในรูปแบบ JSON ตามกฎเกณฑ์อย่างเคร่งครัด:
1. budget_amount: ตัวเลขจำนวนเงินที่ผู้ใช้ระบุ (เช่น "50,000 บาท" -> 50000, "3 ล้าน" -> 3000000, "15,000" -> 15000) หากไม่ระบุให้ใส่ null
2. budget_type: ต้องจำแนกให้ได้ว่าเป็น "monthly_installment" (ค่าผ่อนต่อเดือน) หรือ "total_price" (ราคาซื้อเต็มจำนวน) โดยใช้กฎต่อไปนี้:
   - ถ้าตัวเลขต่ำกว่า 200,000 บาท ให้ตีความเป็น "monthly_installment" เป็นค่าเริ่มต้น (เพราะราคาบ้าน/คอนโดจริงไม่มีทางต่ำขนาดนั้น เช่น 50,000 บาท คือผ่อนเดือนละ 50,000)
   - ถ้าผู้ใช้พูดคำที่บ่งชัดเจน เช่น "ผ่อนเดือนละ", "ต่อเดือน", "ผ่อนไหว", "ค่างวด" ให้ใช้ "monthly_installment" เสมอ
   - ถ้าผู้ใช้พูดคำว่า "มีเงิน", "งบซื้อ", "ราคาไม่เกิน", "ซื้อสด" พร้อมตัวเลขหลักแสนถึงหลักล้าน ให้ใช้ "total_price"
   - ถ้าตัวเลขอยู่ระหว่าง 200,000 ถึง 500,000 และไม่มีคำระบุชัดเจน ให้ตั้ง needs_confirmation เป็น true และสร้าง clarification_question ถามยืนยัน
3. property_type: "house", "condo", หรือ "both" (ถ้าไม่ระบุเจาะจง ให้เป็น "both")
4. location_hint: ชื่อเขต ย่าน หรือสถานี เช่น "จตุจักร", "บางกะปิ", "สาทร", "สุขุมวิท" (ถ้าไม่มีให้ใส่ null)
5. other_preferences: อาเรย์ของเงื่อนไขอื่น เช่น ["ใกล้ BTS", "มีสระว่ายน้ำ", "2 ห้องนอน"]
6. room_size_sqm: ขนาดห้องเป็น ตร.ม. ถ้ามีพูดถึง (ถ้าไม่มีให้ใส่ null)
7. needs_confirmation: boolean (true ถ้าไม่แน่ใจเรื่องประเภทงบประมาณ)
8. clarification_question: คำถามสั้นๆ ให้ผู้ใช้ยืนยัน (ถ้า needs_confirmation เป็น true มิฉะนั้นใส่ null)
9. interpreted_summary: ข้อความสรุปสั้นๆ เป็นภาษาไทยสุภาพที่เข้าใจง่าย เช่น "พบความต้องการ: งบผ่อน 50,000 บาท/เดือน สนใจคอนโด"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            budget_amount: {
              type: Type.NUMBER,
              description: "The extracted budget amount in THB, or null if none",
            },
            budget_type: {
              type: Type.STRING,
              description: "monthly_installment or total_price",
            },
            property_type: {
              type: Type.STRING,
              description: "house, condo, or both",
            },
            location_hint: {
              type: Type.STRING,
              description: "District, neighborhood, or area name mentioned, or null",
            },
            other_preferences: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Additional preferences like near BTS, pool, etc.",
            },
            room_size_sqm: {
              type: Type.NUMBER,
              description: "Room size in square meters if specified, or null",
            },
            needs_confirmation: {
              type: Type.BOOLEAN,
              description: "True if ambiguous whether budget is monthly or total",
            },
            clarification_question: {
              type: Type.STRING,
              description: "Confirmation question if needs_confirmation is true",
            },
            interpreted_summary: {
              type: Type.STRING,
              description: "A clear, concise Thai summary of the user's intent",
            },
          },
          required: ["budget_type", "property_type", "needs_confirmation", "interpreted_summary"],
        },
      },
    });

    const text = response.text ? response.text.trim() : "";
    let parsedJson = null;
    try {
      parsedJson = JSON.parse(text);
    } catch {
      parsedJson = parseIntentFallback(query);
    }

    // Safety checks on budget_type
    if (parsedJson.budget_amount && parsedJson.budget_amount < 200000 && !parsedJson.budget_type) {
      parsedJson.budget_type = "monthly_installment";
    }

    return res.json({
      success: true,
      source: "gemini-3.8-flash",
      intent: parsedJson,
    });
  } catch (error: any) {
    console.error("AI Search Error:", error);
    // Fallback to rule engine so the user experience is never broken
    const fallback = parseIntentFallback(req.body?.query || "");
    return res.json({
      success: true,
      source: "fallback_recovery",
      intent: fallback,
      warning: "Gemini service momentarily unavailable, using rule-based parsing"
    });
  }
});


// ───────────────────────── ML service bridge ─────────────────────────
const ML_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
const ML_KEY = process.env.ML_INTERNAL_KEY || "";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

async function callMl(pathname: string, opts: { method?: string; body?: unknown } = {}) {
  const resp = await fetch(ML_URL + pathname, {
    method: opts.method || "GET",
    headers: { "Content-Type": "application/json", ...(ML_KEY ? { "x-internal-key": ML_KEY } : {}) },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: AbortSignal.timeout(30_000),
  });
  const data: any = await resp.json().catch(() => ({}));
  return { status: resp.status, data };
}

function forward(method: "GET" | "POST", mlPath: (req: express.Request) => string) {
  return async (req: express.Request, res: express.Response) => {
    try {
      const r = await callMl(mlPath(req), { method, body: method === "POST" ? req.body : undefined });
      res.status(r.status).json(r.data);
    } catch {
      // ML service ปิดอยู่/ติดต่อไม่ได้ — ฝั่งหน้าเว็บจะ fallback ไปสูตรเดิมเอง
      res.status(503).json({ detail: "ML service ไม่พร้อมใช้งาน", fallback: true });
    }
  };
}

const okType = (t: string) => t === "condo" || t === "house";

// Public: ใช้โดยฟอร์มทำนาย
app.get("/api/ml/status", forward("GET", () => "/health"));
app.get("/api/ml/options/:ptype", (req, res, next) =>
  okType(req.params.ptype) ? forward("GET", (r) => `/options/${r.params.ptype}`)(req, res) : res.status(400).json({ detail: "bad type" }));
app.post("/api/ml/predict", forward("POST", () => "/predict"));
app.post("/api/ml/similar", forward("POST", () => "/similar"));
app.get("/api/ml/registry", forward("GET", () => "/registry"));

// Admin: ต้องมี ADMIN_TOKEN (ไม่ตั้ง = ปิดหลังบ้านทั้งหมด)
const failedAttempts = new Map<string, { n: number; resetAt: number }>();
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!ADMIN_TOKEN) return res.status(503).json({ detail: "ยังไม่ได้ตั้งค่า ADMIN_TOKEN บนเซิร์ฟเวอร์ — หลังบ้านถูกปิดไว้" });
  const ip = req.ip || "unknown";
  const rec = failedAttempts.get(ip);
  if (rec && rec.resetAt > Date.now() && rec.n >= 5) return res.status(429).json({ detail: "ลองผิดหลายครั้ง รอ 1 นาทีแล้วลองใหม่" });
  const given = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(ADMIN_TOKEN).digest();
  if (!crypto.timingSafeEqual(a, b)) {
    const now = Date.now();
    const cur = rec && rec.resetAt > now ? rec : { n: 0, resetAt: now + 60_000 };
    cur.n += 1;
    failedAttempts.set(ip, cur);
    return res.status(401).json({ detail: "token ไม่ถูกต้อง" });
  }
  failedAttempts.delete(ip);
  next();
}
app.use("/api/admin", requireAdmin);
app.get("/api/admin/check", (_req, res) => res.json({ ok: true }));
app.get("/api/admin/preview/:ptype", (req, res) =>
  okType(req.params.ptype)
    ? forward("GET", (r) => `/admin/preview/${r.params.ptype}?n=${Number(r.query.n) || 20}`)(req, res)
    : res.status(400).json({ detail: "bad type" }));
app.post("/api/admin/records", forward("POST", () => "/admin/records"));
app.post("/api/admin/upload-csv", forward("POST", () => "/admin/upload-csv"));
app.post("/api/admin/retrain", forward("POST", () => "/admin/retrain"));
app.get("/api/admin/retrain-status", forward("GET", () => "/admin/retrain-status"));
app.get("/api/admin/ingest-log", forward("GET", () => "/admin/ingest-log"));
app.get("/api/admin/training-log", forward("GET", () => "/admin/training-log"));

// Serve Streamlit source files
app.get("/app.py", (req, res) => {
  res.sendFile(path.join(process.cwd(), "app.py"));
});

app.get("/requirements.txt", (req, res) => {
  res.sendFile(path.join(process.cwd(), "requirements.txt"));
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Real Estate AI Valuation Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
