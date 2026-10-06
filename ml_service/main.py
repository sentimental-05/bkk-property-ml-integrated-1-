"""
FastAPI ครอบ ml_core  —  รันจากโฟลเดอร์โปรเจกต์:
    uvicorn ml_service.main:app --host 127.0.0.1 --port 8000
ฟังที่ 127.0.0.1 เท่านั้น ให้ Express (server.ts) เป็นด่านหน้าและตรวจสิทธิ์แอดมิน
"""
import os
from typing import Any, Optional

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel

from . import ml_core as core

app = FastAPI(title="BKK Property ML Service")
INTERNAL_KEY = os.environ.get("ML_INTERNAL_KEY", "")


def guard(x_internal_key: Optional[str] = Header(default=None)):
    if INTERNAL_KEY and x_internal_key != INTERNAL_KEY:
        raise HTTPException(status_code=403, detail="forbidden")


def handle(fn, *a, **kw):
    try:
        return fn(*a, **kw)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


class PredictIn(BaseModel):
    property_type: str
    features: dict[str, Any]
    model: Optional[str] = None
    n: int = 5


class RecordsIn(BaseModel):
    property_type: str
    records: list[dict[str, Any]]


class CsvIn(BaseModel):
    property_type: str
    csv: str


class RetrainIn(BaseModel):
    property_type: str
    models: Optional[list[str]] = None


@app.get("/health", dependencies=[Depends(guard)])
def health():
    return {"status": "ok", **handle(core.status)}


@app.get("/options/{ptype}", dependencies=[Depends(guard)])
def options(ptype: str):
    return handle(core.options, ptype)


@app.post("/predict", dependencies=[Depends(guard)])
def predict(body: PredictIn):
    return handle(core.predict, body.property_type, body.features, body.model)


@app.post("/predict-all", dependencies=[Depends(guard)])
def predict_all(body: PredictIn):
    return handle(core.predict_all, body.property_type, body.features)


@app.post("/similar", dependencies=[Depends(guard)])
def similar(body: PredictIn):
    return {"items": handle(core.similar, body.property_type, body.features, max(1, min(body.n, 20)))}


@app.get("/registry", dependencies=[Depends(guard)])
def registry():
    df = core.read_registry().tail(50).iloc[::-1]
    return {"items": [{k: core._py(v) for k, v in r.items()} for r in df.to_dict(orient="records")]}


# ── admin (Express ตรวจ token ก่อนส่งต่อมาที่นี่) ──
@app.get("/admin/preview/{ptype}", dependencies=[Depends(guard)])
def admin_preview(ptype: str, n: int = 20):
    return handle(core.preview, ptype, max(1, min(n, 200)))


@app.post("/admin/records", dependencies=[Depends(guard)])
def admin_records(body: RecordsIn):
    return handle(core.append_records, body.property_type, body.records)


@app.post("/admin/upload-csv", dependencies=[Depends(guard)])
def admin_upload(body: CsvIn):
    return handle(core.append_csv_text, body.property_type, body.csv)


@app.post("/admin/retrain", dependencies=[Depends(guard)])
def admin_retrain(body: RetrainIn):
    ok = handle(core.start_retrain, body.property_type, body.models)
    if not ok:
        raise HTTPException(status_code=409, detail="มีงานเทรนกำลังทำงานอยู่")
    return {"started": True}


@app.get("/admin/retrain-status", dependencies=[Depends(guard)])
def admin_retrain_status():
    return core.job_status()


@app.get("/admin/ingest-log", dependencies=[Depends(guard)])
def admin_ingest_log():
    return {"items": core.ingest_log()}


@app.get("/admin/training-log", dependencies=[Depends(guard)])
def admin_training_log():
    import json
    try:
        return {"items": json.loads(core.TRAIN_LOG_PATH.read_text(encoding="utf-8"))[::-1][:20]}
    except FileNotFoundError:
        return {"items": []}
