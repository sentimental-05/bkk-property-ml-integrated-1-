"""
ml_core.py — ตรรกะโมเดล/ข้อมูลทั้งหมด แยกจากเว็บเฟรมเวิร์ก
(เขียนให้ทดสอบได้โดยไม่ต้องมี FastAPI)

โครงสร้างไฟล์ที่ใช้ร่วมกับ notebook (bkk_property_model_local.ipynb):
  <BASE_DIR>/data/condo_master.csv, house_master.csv
  <BASE_DIR>/models/model_latest_{condo|house}.pkl, model_{ptype}_{ชื่อโมเดล}.pkl,
                     knn_reference_{ptype}.csv
  <BASE_DIR>/model_registry.csv   (8 คอลัมน์เดิมของ notebook — ไม่เพิ่มคอลัมน์)
"""
from __future__ import annotations

import datetime
import json
import os
import re
import shutil
import threading
import traceback
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

BASE_DIR = Path(os.environ.get("ML_BASE_DIR", Path(__file__).resolve().parent.parent))
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"
REGISTRY_PATH = BASE_DIR / "model_registry.csv"
TRAIN_LOG_PATH = MODEL_DIR / "training_log.json"
INGEST_LOG_PATH = DATA_DIR / "ingest_log.csv"
COLUMN_MAP_PATH = Path(__file__).resolve().parent / "column_map.json"

TARGET = "price_sqm"
PTYPES = ("condo", "house")
CAT_COLS = {"condo": ["district"], "house": ["city", "furnished"]}
REGISTRY_COLS = ["version", "property_type", "trained_at", "n_rows", "r2", "mae", "rmse", "model_path"]

_lock = threading.RLock()
_model_cache: dict[str, tuple[float, object]] = {}
_defaults_cache: dict[str, tuple[float, dict]] = {}


# ───────────────────────── helpers ─────────────────────────
def _check(ptype: str) -> str:
    if ptype not in PTYPES:
        raise ValueError(f"property_type ต้องเป็น 'condo' หรือ 'house' (ได้รับ '{ptype}')")
    return ptype


def slug(name: str) -> str:
    return name.lower().replace("+", "_").replace(" ", "_")


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(s).lower())


def _py(v):
    """numpy -> python ธรรมดา และ NaN -> None (ให้ JSON ได้)"""
    if v is None:
        return None
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating, float)):
        return None if np.isnan(v) else float(v)
    if isinstance(v, (np.bool_,)):
        return bool(v)
    return v


def load_column_map() -> dict:
    try:
        return json.loads(COLUMN_MAP_PATH.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return {}


def xgboost_available() -> bool:
    try:
        import xgboost  # noqa: F401
        return True
    except Exception:
        return False


# ───────────────────────── master data ─────────────────────────
def master_path(ptype: str) -> Path:
    return DATA_DIR / f"{_check(ptype)}_master.csv"


def read_master(ptype: str) -> pd.DataFrame:
    path = master_path(ptype)
    if not path.exists():
        raise FileNotFoundError(
            f"ไม่พบ {path} — รัน notebook ให้ถึงเซลล์ 'เซฟ master dataset' ก่อน "
            f"(ต้องรัน notebook จากโฟลเดอร์โปรเจกต์นี้ หรือตั้งค่า ML_BASE_DIR)"
        )
    return pd.read_csv(path)


def defaults(ptype: str) -> dict:
    """ค่า default ต่อคอลัมน์ (median/mode จาก master) ใช้เติมช่องที่ผู้ใช้ไม่ได้กรอก"""
    path = master_path(ptype)
    mtime = path.stat().st_mtime if path.exists() else 0
    cached = _defaults_cache.get(ptype)
    if cached and cached[0] == mtime:
        return cached[1]
    df = read_master(ptype).drop(columns=[TARGET], errors="ignore")
    out: dict = {}
    for col in df.columns:
        s = df[col].dropna()
        if s.empty:
            out[col] = None
        elif col in CAT_COLS[ptype] or s.dtype == object:
            out[col] = _py(s.mode().iloc[0])
        else:
            out[col] = float(s.median())
    _defaults_cache[ptype] = (mtime, out)
    return out


def options(ptype: str) -> dict:
    """ข้อมูลสำหรับสร้างฟอร์มแบบไดนามิก: ชนิดคอลัมน์ ช่วงค่า ค่าที่เลือกได้"""
    df = read_master(ptype)
    feats = df.drop(columns=[TARGET], errors="ignore")
    dflt = defaults(ptype)
    cols = []
    for c in feats.columns:
        s = feats[c].dropna()
        if c in CAT_COLS[ptype] or feats[c].dtype == object:
            cols.append({"name": c, "kind": "categorical",
                         "values": sorted(str(v) for v in s.unique())[:500],
                         "default": None if dflt.get(c) is None else str(dflt[c])})
        else:
            uniq = set(s.unique().tolist())
            is_bin = bool(uniq) and uniq <= {0, 1, 0.0, 1.0, True, False}
            cols.append({"name": c, "kind": "binary" if is_bin else "numeric",
                         "min": _py(s.min()) if len(s) else None,
                         "max": _py(s.max()) if len(s) else None,
                         "default": dflt.get(c)})
    geo = {}
    cat_for_geo = next((c for c in CAT_COLS[ptype] if c in df.columns and {"latitude", "longitude"} <= set(df.columns)), None)
    if cat_for_geo:
        g = df.groupby(cat_for_geo)[["latitude", "longitude"]].median()
        geo = {str(k): {"latitude": float(r.latitude), "longitude": float(r.longitude)} for k, r in g.iterrows()}
    t = df[TARGET].dropna() if TARGET in df.columns else pd.Series(dtype=float)
    return {"property_type": ptype, "n_rows": int(len(df)), "columns": cols, "geo_by_category": geo,
            "target": {"name": TARGET, "median": _py(t.median()) if len(t) else None,
                       "min": _py(t.min()) if len(t) else None, "max": _py(t.max()) if len(t) else None}}


# ───────────────────────── models / prediction ─────────────────────────
def model_path(ptype: str, name: str | None = None) -> Path:
    _check(ptype)
    return MODEL_DIR / (f"model_latest_{ptype}.pkl" if not name else f"model_{ptype}_{slug(name)}.pkl")


def _load(path: Path):
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"ไม่พบไฟล์โมเดล {path} — รัน notebook ให้ถึงเซลล์บันทึกโมเดล หรือกด 'เทรนใหม่' ในหน้าแอดมิน")
    mtime = path.stat().st_mtime
    c = _model_cache.get(str(path))
    if c and c[0] == mtime:
        return c[1]
    obj = joblib.load(path)
    _model_cache[str(path)] = (mtime, obj)
    return obj


def model_columns(pipe) -> list[str]:
    return list(pipe.named_steps["prep"].feature_names_in_)


def _coerce(val, default):
    if isinstance(val, bool):
        val = int(val)
    if isinstance(default, str):
        return str(val)
    if isinstance(val, str):
        try:
            return float(val) if "." in val else int(val)
        except ValueError:
            return val
    return val


def _row_for(ptype: str, cols: list[str], features: dict):
    """สร้างแถวป้อนโมเดลให้ตรงคอลัมน์ที่โมเดลเรียนมา -> (df, คอลัมน์ที่ใช้ค่า default, key ที่ไม่มีคอลัมน์รองรับ)"""
    d = defaults(ptype)
    cmap = load_column_map().get(ptype, {})
    row = {c: d.get(c) for c in cols}
    by_norm = {norm(c): c for c in cols}
    used, unmatched = set(), []
    for key, val in features.items():
        if val is None or key.startswith("_"):
            continue
        targets = cmap.get(key)
        if targets is None:
            targets = [by_norm[norm(key)]] if norm(key) in by_norm else []
        if isinstance(targets, str):
            targets = [targets]
        targets = [t for t in targets if t in row]
        if not targets:
            unmatched.append(key)
            continue
        for t in targets:
            row[t] = _coerce(val, d.get(t))
            used.add(t)
    # ไม่ได้ส่งพิกัดมา -> ใช้ค่ากลางของเขต/เมืองที่เลือก แม่นกว่าค่ากลางทั้งเมือง
    if {"latitude", "longitude"} <= set(cols) and not ({"latitude", "longitude"} & used):
        geo = _geo_medians(ptype)
        for cc in CAT_COLS[ptype]:
            g = geo.get(cc, {}).get(str(row.get(cc)))
            if g:
                row["latitude"], row["longitude"] = g
                used |= {"latitude", "longitude"}
                break
    defaulted = [c for c in cols if c not in used]
    return pd.DataFrame([row], columns=cols), defaulted, unmatched


_geo_cache: dict[str, tuple[float, dict]] = {}


def _geo_medians(ptype: str) -> dict:
    path = master_path(ptype)
    mtime = path.stat().st_mtime if path.exists() else 0
    c = _geo_cache.get(ptype)
    if c and c[0] == mtime:
        return c[1]
    df = read_master(ptype)
    out: dict = {}
    if {"latitude", "longitude"} <= set(df.columns):
        for cc in CAT_COLS[ptype]:
            if cc in df.columns:
                g = df.groupby(cc)[["latitude", "longitude"]].median()
                out[cc] = {str(k): (float(r.latitude), float(r.longitude)) for k, r in g.iterrows()}
    _geo_cache[ptype] = (mtime, out)
    return out


def read_registry() -> pd.DataFrame:
    if not REGISTRY_PATH.exists():
        return pd.DataFrame(columns=REGISTRY_COLS)
    return pd.read_csv(REGISTRY_PATH)


def latest_metrics(ptype: str) -> dict | None:
    reg = read_registry()
    reg = reg[reg["property_type"] == ptype]
    if reg.empty:
        return None
    r = reg.iloc[-1]
    return {"version": str(r["version"]), "r2": _py(r["r2"]), "mae": _py(r["mae"]),
            "rmse": _py(r["rmse"]), "n_rows": _py(r["n_rows"]), "trained_at": str(r["trained_at"])}


def predict(ptype: str, features: dict, model: str | None = None) -> dict:
    pipe = _load(model_path(ptype, model))
    X, defaulted, unmatched = _row_for(ptype, model_columns(pipe), features)
    y = float(pipe.predict(X)[0])
    m = latest_metrics(ptype)
    return {"price_sqm": y, "model": model or "latest", "metrics": m,
            "defaulted_columns": defaulted, "unmatched_inputs": unmatched}


def predict_all(ptype: str, features: dict) -> dict:
    out = {}
    for p in sorted(MODEL_DIR.glob(f"model_{ptype}_*.pkl")):
        name = p.stem.replace(f"model_{ptype}_", "")
        try:
            pipe = _load(p)
            X, _, _ = _row_for(ptype, model_columns(pipe), features)
            out[name] = float(pipe.predict(X)[0])
        except Exception as e:  # โมเดลเก่าที่คอลัมน์ไม่ตรง ไม่ควรทำให้ทั้งหน้าพัง
            out[name] = None
            out.setdefault("_errors", {})[name] = str(e)
    return out


def similar(ptype: str, features: dict, n: int = 5) -> list[dict]:
    pipe = _load(model_path(ptype, "knn"))
    ref_path = MODEL_DIR / f"knn_reference_{ptype}.csv"
    if not ref_path.exists():
        raise FileNotFoundError(f"ไม่พบ {ref_path}")
    ref = pd.read_csv(ref_path)
    X, _, _ = _row_for(ptype, model_columns(pipe), features)
    Xt = pipe.named_steps["prep"].transform(X)
    _, idx = pipe.named_steps["model"].kneighbors(Xt, n_neighbors=n)
    rows = ref.iloc[idx[0]].to_dict(orient="records")
    return [{k: _py(v) for k, v in r.items()} for r in rows]


def status() -> dict:
    out = {"xgboost": xgboost_available(), "base_dir": str(BASE_DIR), "types": {}}
    for p in PTYPES:
        out["types"][p] = {
            "model_ready": model_path(p).exists(),
            "master_rows": int(len(read_master(p))) if master_path(p).exists() else None,
            "latest": latest_metrics(p),
            "available_models": sorted(x.stem.replace(f"model_{p}_", "") for x in MODEL_DIR.glob(f"model_{p}_*.pkl")),
        }
    return out


# ───────────────────────── ingestion (หลังบ้านเพิ่มข้อมูล) ─────────────────────────
def engineer_condo(df: pd.DataFrame) -> pd.DataFrame:
    """ทำ feature engineering เหมือน notebook เมื่อไฟล์ใหม่เป็นข้อมูลดิบ (มี dist_shop_1 ฯลฯ)"""
    df = df.copy()
    groups = {g: [c for c in df.columns if c.startswith(f"{g}_") and not c.endswith(("_mean", "_min"))]
              for g in ("dist_shop", "dist_school", "dist_food", "dist_tran")}
    if not any(groups.values()):
        return df
    drop = ["name", "id"]
    for g, cols in groups.items():
        if cols:
            df[f"{g}_mean"] = df[cols].mean(axis=1)
            df[f"{g}_min"] = df[cols].min(axis=1)
        drop += cols
    drop += [c for c in df.columns if c.startswith("tran_type") or c.startswith("tran_name")]
    return df.drop(columns=[c for c in drop if c in df.columns])


def _prepare_new_rows(ptype: str, new_df: pd.DataFrame):
    master = read_master(ptype)
    mcols = list(master.columns)
    if ptype == "condo":
        new_df = engineer_condo(new_df)
    missing = [c for c in mcols if c not in new_df.columns]
    if missing:
        raise ValueError("ข้อมูลใหม่ขาดคอลัมน์ที่ master ต้องมี: " + ", ".join(missing))
    extra = [c for c in new_df.columns if c not in mcols]
    new_df = new_df[mcols].copy()
    for c in mcols:
        if pd.api.types.is_numeric_dtype(master[c]):
            new_df[c] = pd.to_numeric(new_df[c], errors="coerce")
    rejected, keep = [], []
    for i, r in new_df.iterrows():
        t = r[TARGET]
        if pd.isna(t) or t <= 0:
            rejected.append({"row": int(i) + 1, "reason": f"{TARGET} ว่างหรือไม่เป็นตัวเลขบวก"})
        else:
            keep.append(i)
    return new_df.loc[keep], rejected, extra


def _log_ingest(ptype: str, n_added: int, source: str):
    INGEST_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    row = pd.DataFrame([{"timestamp": datetime.datetime.now().isoformat(timespec="seconds"),
                         "property_type": ptype, "rows_added": n_added, "source": source}])
    row.to_csv(INGEST_LOG_PATH, mode="a", header=not INGEST_LOG_PATH.exists(), index=False)


def append_dataframe(ptype: str, new_df: pd.DataFrame, source: str = "admin") -> dict:
    with _lock:
        good, rejected, extra = _prepare_new_rows(ptype, new_df)
        master = read_master(ptype)
        before = len(master)
        combined = pd.concat([master, good], ignore_index=True).drop_duplicates()
        added = len(combined) - before
        if added > 0:
            backup_dir = DATA_DIR / "backup"
            backup_dir.mkdir(parents=True, exist_ok=True)
            ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            shutil.copy2(master_path(ptype), backup_dir / f"{ptype}_master_{ts}.csv")
            tmp = master_path(ptype).with_suffix(".tmp")
            combined.to_csv(tmp, index=False)
            os.replace(tmp, master_path(ptype))
            _log_ingest(ptype, added, source)
        return {"received": int(len(new_df)), "added": int(added),
                "duplicates_skipped": int(len(good) - added), "rejected": rejected,
                "ignored_extra_columns": extra, "total_rows": int(len(combined)),
                "note": "เพิ่มข้อมูลแล้ว แต่โมเดลยังไม่เปลี่ยนจนกว่าจะกดเทรนใหม่" if added else "ไม่มีแถวใหม่ที่เพิ่มได้"}


def append_records(ptype: str, records: list[dict], source: str = "admin-form") -> dict:
    if not records:
        raise ValueError("ไม่มีข้อมูลให้เพิ่ม")
    if len(records) > 5000:
        raise ValueError("ส่งได้ครั้งละไม่เกิน 5,000 แถว")
    return append_dataframe(ptype, pd.DataFrame(records), source)


def append_csv_text(ptype: str, csv_text: str, source: str = "admin-csv") -> dict:
    from io import StringIO
    df = pd.read_csv(StringIO(csv_text))
    if df.empty:
        raise ValueError("ไฟล์ CSV ไม่มีข้อมูล")
    return append_dataframe(ptype, df, source)


def preview(ptype: str, n: int = 20) -> dict:
    df = read_master(ptype)
    tail = df.tail(n)
    return {"n_rows": int(len(df)), "columns": list(df.columns),
            "rows": [{k: _py(v) for k, v in r.items()} for r in tail.to_dict(orient="records")]}


def ingest_log(n: int = 30) -> list[dict]:
    if not INGEST_LOG_PATH.exists():
        return []
    return pd.read_csv(INGEST_LOG_PATH).tail(n).iloc[::-1].to_dict(orient="records")


# ───────────────────────── training (เหมือน notebook) ─────────────────────────
def _make_prep(cat_cols, num_cols, scale=True):
    from sklearn.compose import ColumnTransformer
    from sklearn.impute import SimpleImputer
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import OneHotEncoder, StandardScaler
    steps = [("imp", SimpleImputer(strategy="median"))] + ([("sc", StandardScaler())] if scale else [])
    return ColumnTransformer([
        ("cat", Pipeline([("imp", SimpleImputer(strategy="most_frequent")),
                          ("ohe", OneHotEncoder(handle_unknown="ignore"))]), cat_cols),
        ("num", Pipeline(steps), num_cols),
    ])


def _plain_prep(cat_cols, num_cols):
    from sklearn.compose import ColumnTransformer
    from sklearn.preprocessing import OneHotEncoder
    return ColumnTransformer([("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
                              ("num", "passthrough", num_cols)])


def _candidates(ptype, cat_cols, num_cols, X):
    from sklearn.cluster import KMeans
    from sklearn.compose import ColumnTransformer, TransformedTargetRegressor
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.impute import SimpleImputer
    from sklearn.neighbors import KNeighborsRegressor
    from sklearn.neural_network import MLPRegressor
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import OneHotEncoder, StandardScaler
    from sklearn.tree import DecisionTreeRegressor

    leaf = 2 if ptype == "condo" else 3
    c = {"RandomForest": (RandomForestRegressor(n_estimators=400, min_samples_leaf=leaf, random_state=42, n_jobs=-1),
                          _plain_prep(cat_cols, num_cols))}
    if xgboost_available():
        from xgboost import XGBRegressor
        mk = lambda: XGBRegressor(n_estimators=500, max_depth=6, learning_rate=0.05, subsample=0.8,
                                  colsample_bytree=0.8, random_state=42, n_jobs=-1)
        c["XGBoost"] = (mk(), _plain_prep(cat_cols, num_cols))
        gcols = [x for x in ("latitude", "longitude") if x in X.columns] or \
                [x for x in X.columns if x.startswith("dist_") and x.endswith(("_mean", "_min"))]
        if gcols:
            k = 6
            prep = ColumnTransformer([
                ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
                ("num", "passthrough", num_cols),
                ("geo", Pipeline([("imp", SimpleImputer(strategy="median")), ("sc", StandardScaler()),
                                  ("km", KMeans(n_clusters=k, n_init=10, random_state=42))]), gcols)])
            c["XGBoost+KMeans"] = (mk(), prep)
    c["KNN"] = (KNeighborsRegressor(n_neighbors=10, weights="distance", n_jobs=-1), _make_prep(cat_cols, num_cols, True))
    c["DecisionTree"] = (DecisionTreeRegressor(max_depth=12, min_samples_leaf=5, random_state=42),
                         _make_prep(cat_cols, num_cols, False))
    c["ANN"] = (TransformedTargetRegressor(
        regressor=MLPRegressor(hidden_layer_sizes=(128, 64), early_stopping=True, max_iter=500, random_state=42),
        transformer=StandardScaler()), _make_prep(cat_cols, num_cols, True))
    return c


def retrain(ptype: str, only: list[str] | None = None, log=lambda s: None) -> dict:
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
    from sklearn.model_selection import train_test_split
    from sklearn.pipeline import Pipeline

    df = read_master(ptype).dropna(subset=[TARGET])
    if len(df) < 50:
        raise ValueError(f"ข้อมูลน้อยเกินไปที่จะเทรน ({len(df)} แถว)")
    X, y = df.drop(columns=[TARGET]), df[TARGET]
    cat_cols = [c for c in CAT_COLS[ptype] if c in X.columns]
    num_cols = [c for c in X.columns if c not in cat_cols]
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42)

    results: dict[str, tuple] = {}
    for name, (model, prep) in _candidates(ptype, cat_cols, num_cols, X).items():
        if only and name not in only:
            continue
        try:
            log(f"เทรน {name} ...")
            pipe = Pipeline([("prep", prep), ("model", model)]).fit(Xtr, ytr)
            pred = pipe.predict(Xte)
            r2 = float(r2_score(yte, pred))
            mae = float(mean_absolute_error(yte, pred))
            rmse = float(np.sqrt(mean_squared_error(yte, pred)))
            results[name] = (pipe, r2, mae, rmse)
            log(f"  {name}: R2={r2:.4f} MAE={mae:,.0f} RMSE={rmse:,.0f}")
        except Exception as e:
            log(f"  {name} ล้มเหลว: {e}")
    if not results:
        raise RuntimeError("ไม่มีโมเดลใดเทรนสำเร็จ")

    best = max(results, key=lambda k: results[k][1])
    pipe, r2, mae, rmse = results[best]

    with _lock:
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        old = list(MODEL_DIR.glob(f"model_{ptype}_*.pkl"))
        if old:  # เก็บชุดเก่าไว้ ไม่ปล่อยให้ปนกับชุดใหม่
            arch = MODEL_DIR / "archive" / ts
            arch.mkdir(parents=True, exist_ok=True)
            for f in old:
                shutil.move(str(f), arch / f.name)
        for name, (p, *_rest) in results.items():
            joblib.dump(p, MODEL_DIR / f"model_{ptype}_{slug(name)}.pkl")
        version = f"{ptype}_{ts}"
        vpath = MODEL_DIR / f"{version}.pkl"
        joblib.dump(pipe, vpath)
        joblib.dump(pipe, model_path(ptype))
        Xtr.assign(**{TARGET: ytr}).reset_index(drop=True).to_csv(MODEL_DIR / f"knn_reference_{ptype}.csv", index=False)

        reg = read_registry()
        reg = reg.reindex(columns=REGISTRY_COLS)
        reg.loc[len(reg)] = [version, ptype, ts, len(df), r2, mae, rmse, str(vpath)]
        reg.to_csv(REGISTRY_PATH, index=False)

        comparison = {n: {"r2": v[1], "mae": v[2], "rmse": v[3]} for n, v in results.items()}
        try:
            hist = json.loads(TRAIN_LOG_PATH.read_text(encoding="utf-8"))
        except Exception:
            hist = []
        hist.append({"version": version, "property_type": ptype, "best_model": best, "n_rows": len(df),
                     "comparison": comparison, "xgboost_available": xgboost_available()})
        TRAIN_LOG_PATH.write_text(json.dumps(hist[-50:], ensure_ascii=False, indent=2), encoding="utf-8")
        _model_cache.clear()
    log(f"เสร็จ: ใช้ {best} (R2={r2:.4f}) เป็นเวอร์ชัน {version}")
    return {"version": version, "best_model": best, "r2": r2, "mae": mae, "rmse": rmse,
            "n_rows": int(len(df)), "comparison": comparison}


# ───────────────────────── background job ─────────────────────────
_job = {"state": "idle", "property_type": None, "log": [], "result": None, "error": None, "started_at": None}


def job_status() -> dict:
    return dict(_job, log=list(_job["log"][-60:]))


def start_retrain(ptype: str, only: list[str] | None = None) -> bool:
    _check(ptype)
    with _lock:
        if _job["state"] == "running":
            return False
        _job.update(state="running", property_type=ptype, log=[], result=None, error=None,
                    started_at=datetime.datetime.now().isoformat(timespec="seconds"))

    def run():
        try:
            _job["result"] = retrain(ptype, only, log=lambda s: _job["log"].append(s))
            _job["state"] = "done"
        except Exception as e:
            _job["error"] = str(e)
            _job["log"].append(traceback.format_exc(limit=3))
            _job["state"] = "error"

    threading.Thread(target=run, daemon=True).start()
    return True
