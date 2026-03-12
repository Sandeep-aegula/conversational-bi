import os
import json
import re
import hashlib
import time
import asyncio
import pandas as pd
import sqlite3
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

groq_api_key = os.getenv("GROQ_API_KEY")
groq_client = None
if groq_api_key:
    groq_client = Groq(api_key=groq_api_key)

# ---------------------------------------------------------------------------
# PROMPT CACHE — same prompt = zero API calls
# ---------------------------------------------------------------------------
_prompt_cache: dict[str, str] = {}

def cache_key(prompt: str) -> str:
    return hashlib.md5(prompt.encode()).hexdigest()

def get_cached(prompt: str) -> str | None:
    return _prompt_cache.get(cache_key(prompt))

def set_cached(prompt: str, response_text: str) -> None:
    _prompt_cache[cache_key(prompt)] = response_text

# ---------------------------------------------------------------------------
# RATE LIMITER — 2.5 seconds between calls (~24 RPM, safe under Groq's 30 RPM)
# ---------------------------------------------------------------------------
_last_call_time: float = 0.0
_MIN_INTERVAL: float = 2.5  # 2.5 seconds between Groq calls

async def wait_for_rate_limit() -> None:
    global _last_call_time
    now = time.time()
    elapsed = now - _last_call_time
    if elapsed < _MIN_INTERVAL:
        wait_secs = _MIN_INTERVAL - elapsed
        print(f"⏳ Rate limiter: waiting {wait_secs:.1f}s before next call")
        await asyncio.sleep(wait_secs)
    _last_call_time = time.time()

# ---------------------------------------------------------------------------
# DATA MODELS
# ---------------------------------------------------------------------------
class QueryRequest(BaseModel):
    query: str
    history: Optional[List[dict]] = []

global_file_path: str | None = None
global_columns: list[str] = []
global_data_summary: str = ""

def load_df(file_path: str) -> pd.DataFrame:
    """Robust load for CSV/Text including those with binary junk headers."""
    import io
    try:
        with open(file_path, "rb") as f:
            file_bytes = f.read()
        
        # Try different encodings
        decoded = None
        for enc in ['utf-8-sig', 'latin-1', 'cp1252', 'iso-8859-1']:
            try:
                decoded = file_bytes.decode(enc)
                break
            except:
                continue
        
        if decoded is None:
            decoded = file_bytes.decode('latin-1', errors='replace')

        # Find where actual CSV data starts (skip bplist and other binary junk)
        lines = decoded.split('\n')
        start_line = 0
        for i, line in enumerate(lines):
            stripped = line.strip()
            # A valid header usually has at least one comma/delimiter and isn't binary
            if (
                (',' in stripped or ';' in stripped or '\t' in stripped)
                and len(stripped) < 1000
                and stripped.count('\x00') == 0
                and not stripped.startswith('bplist')
                and i < 50 # Don't search forever
            ):
                start_line = i
                break
        
        clean_content = '\n'.join(lines[start_line:])
        
        # Auto-detect delimiter
        for sep in [',', ';', '\t', '|']:
            try:
                df = pd.read_csv(io.StringIO(clean_content), sep=sep, engine='python', on_bad_lines='skip', nrows=5)
                if len(df.columns) >= 2:
                    # Reload full with this sep
                    df = pd.read_csv(io.StringIO(clean_content), sep=sep, engine='python', on_bad_lines='skip')
                    df.columns = [str(c).strip() for c in df.columns]
                    return df
            except:
                continue
        
        # Last resort default
        df = pd.read_csv(io.StringIO(clean_content), on_bad_lines='skip')
        df.columns = [str(c).strip() for c in df.columns]
        return df
    except Exception as e:
        print(f"❌ Error in load_df: {e}")
        # Return empty df as fallback
        return pd.DataFrame()

SAMPLE_CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "sample_bmw_data.csv")

@app.get("/api/sample-csv")
def get_sample_csv():
    path = os.path.abspath(SAMPLE_CSV_PATH)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Sample CSV not found.")
    return FileResponse(path, media_type="text/csv", filename="sample_bmw_data.csv")

# ---------------------------------------------------------------------------
# UPLOAD ENDPOINT — zero Gemini calls, pure data processing
# ---------------------------------------------------------------------------
@app.post("/api/upload")
async def upload_file(
    file: Optional[UploadFile] = File(None),
    UPLOAD_SOURCE: Optional[UploadFile] = File(None)
):
    global global_file_path, global_columns, global_data_summary
    
    # Identify which field contains the file (support both 'file' and 'UPLOAD_SOURCE')
    actual_file = file or UPLOAD_SOURCE
    
    try:
        if not actual_file:
            raise HTTPException(status_code=400, detail="No file uploaded. Please use 'file' or 'UPLOAD_SOURCE_FILE' as the file field.")
        
        filename = actual_file.filename or "uploaded_data.csv"
        filename_lower = filename.lower()
        is_excel = filename_lower.endswith('.xlsx') or filename_lower.endswith('.xls')
        
        os.makedirs("storage", exist_ok=True)
        file_path = f"storage/{filename}"
        
        raw_data = await actual_file.read()
        df_full = None
        
        if is_excel:
            try:
                import io
                df_full = pd.read_excel(io.BytesIO(raw_data))
                # Save as CSV for consistency in downstream steps
                csv_path = file_path.rsplit('.', 1)[0] + ".csv"
                df_full.to_csv(csv_path, index=False)
                file_path = csv_path
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to read Excel: {str(e)}")
        else:
            # Fallback for CSV/Text
            text_data = None
            # Extended list of encodings to try
            encodings = ['utf-8-sig', 'utf-16', 'utf-8', 'latin1', 'cp1252', 'ascii', 'iso-8859-1']
            for enc in encodings:
                try:
                    text_data = raw_data.decode(enc)
                    break
                except Exception:
                    continue
            
            if text_data is None:
                # Last resort: decode as latin1 with replacement to avoid hard failure
                text_data = raw_data.decode('latin1', errors='replace')

            with open(file_path, "w", encoding="utf-8", newline="") as buffer:
                buffer.write(text_data)
            
            df_full = load_df(file_path)

        if df_full is None or (df_full.empty and len(df_full.columns) == 0):
            raise ValueError("The uploaded file is empty or incorrectly formatted.")
            
        # Add UPLOAD_SOURCE tracking column
        src_val = filename
        if 'UPLOAD_SOURCE' not in [str(c).upper() for c in df_full.columns]:
            df_full['UPLOAD_SOURCE'] = src_val
            # Update the saved file with the new column
            df_full.to_csv(file_path, index=False)

        global_file_path = file_path
        global_columns = [str(c).strip() for c in df_full.columns]
        numeric_cols = df_full.select_dtypes(include='number').columns.tolist()
        cat_cols = [c for c in df_full.columns if c not in numeric_cols]
        
        try:
            sample_desc = df_full.head(15).to_string()
            stats_desc = df_full.describe(include='all').to_string()
            global_data_summary = f"Columns: {global_columns}\n\nFirst 15 Rows:\n{sample_desc}\n\nStatistics Summary:\n{stats_desc}"
            if len(global_data_summary) > 10000:
                global_data_summary = global_data_summary[:10000] + "\n...(truncated)"
        except Exception:
            global_data_summary = "Data summary not available."
        
        # Clear cache for the new dataset
        _prompt_cache.clear()
        row_count = len(df_full)
        print(f"✅ Upload: {filename} — {row_count} rows. UPLOAD_SOURCE column verified. Cache cleared.")
        
        return {
            "filename": filename,
            "rows": row_count,
            "columns": len(global_columns),
            "headers": global_columns,
            "numeric_cols": numeric_cols,
            "cat_cols": cat_cols
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------------------------
# GROQ CALL — cache → rate limit → exponential backoff retry
# ---------------------------------------------------------------------------
async def call_llm(prompt: str) -> str:
    """Single Groq call with cache, rate limit, and retry."""
    
    # 1. Check cache — zero cost
    cached = get_cached(prompt)
    if cached:
        print("✅ Cache HIT — skipping API call entirely")
        return cached

    if not groq_client:
        raise ValueError("Groq API Key is not configured. Set GROQ_API_KEY in backend/.env")

    # 2. Rate limit — enforce minimum spacing
    await wait_for_rate_limit()

    # 3. Retry with exponential backoff
    max_retries = 3
    for attempt in range(max_retries):
        try:
            print(f"🔄 Calling Groq (attempt {attempt + 1}/{max_retries})")
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a SQL expert. Return ONLY valid JSON, no markdown code fences, no extra text."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.1,
                max_completion_tokens=2048,
            )
            text = response.choices[0].message.content
            print(f"✅ Groq responded successfully")
            
            # Cache the result for future identical queries
            set_cached(prompt, text)
            return text

        except Exception as err:
            err_s = str(err)
            print(f"❌ Groq error (attempt {attempt + 1}): {err_s[:150]}")
            
            if "429" in err_s or "rate_limit" in err_s.lower():
                wait = (attempt + 1) * 10
                print(f"⏳ Rate limit hit. Waiting {wait}s...")
                await asyncio.sleep(wait)
                continue
            else:
                if attempt == max_retries - 1:
                    raise
                await asyncio.sleep(3)

    raise Exception("All Groq retry attempts failed.")

# ---------------------------------------------------------------------------
# QUERY ENDPOINT — 1 Gemini call per user query
# ---------------------------------------------------------------------------
@app.post("/api/query")
async def query_data(request: QueryRequest):
    global global_file_path, global_columns, global_data_summary
    
    if not global_file_path or not os.path.exists(global_file_path):
        raise HTTPException(status_code=400, detail="Please upload a dataset first.")
    
    prompt = f"""### ROLE
You are a SQLite3 SQL expert for a Conversational BI Dashboard.

### DATABASE
- Table name: data
- Available columns (use EXACTLY these names, always double-quoted): {global_columns}

### STRICT SQLITE3 RULES (violations will cause runtime errors):
1. INSTR(str, substr) takes EXACTLY 2 arguments — never 3.
2. Do NOT use CTEs (WITH ... AS (...)) for simple aggregations.
3. Do NOT use window functions (OVER, PARTITION BY, ROW_NUMBER).
4. Do NOT use PIVOT.
5. Only reference columns from the column list above.
6. All column names must be double-quoted: "column name"
7. Use LIMIT to cap results: maximum 30 rows.
8. Always aggregate (GROUP BY) — never return raw rows.
9. For date/time columns, use strftime() if needed.
10. Use simple joins-free queries — it's a single flat table.

### CHART TYPES
- Use "bar" for categorical comparisons and rankings.
- Use "pie" for distributions and proportions.
- Use "area" or "line" for trends over time/numerical sequences.

### TEXT OVERVIEW RULE:
If the user asks for a general overview or summary (not a specific chart), return:
{{"sql": "", "chart_type": "", "explanation": "Your insight text here.", "xAxisKey": "", "yAxisKeys": []}}

### VALID SQL EXAMPLES:
- Bar chart: SELECT "category" AS label, COUNT(*) AS value FROM data GROUP BY "category" ORDER BY value DESC LIMIT 20
- Avg by group: SELECT "group_col" AS label, AVG("numeric_col") AS avg_val FROM data GROUP BY "group_col" ORDER BY avg_val DESC LIMIT 15
- Pie: SELECT "status" AS label, COUNT(*) AS value FROM data GROUP BY "status"
- Trend: SELECT "year" AS label, SUM("sales") AS total FROM data GROUP BY "year" ORDER BY "year"

### OUTPUT FORMAT (return ONLY valid JSON):
{{
  "explanation": "Summary of insights.",
  "charts": [
    {{
      "sql": "SELECT ... FROM data GROUP BY ...",
      "chart_type": "bar",
      "explanation": "Description of this specific chart.",
      "xAxisKey": "label",
      "yAxisKeys": ["value"]
    }},
    ...
  ]
}}
OR for a single chart:
{{
  "sql": "SELECT ... FROM data GROUP BY ...",
  "chart_type": "bar",
  "explanation": "...",
  "xAxisKey": "label",
  "yAxisKeys": ["value"]
}}
}}

### SCHEMA
Columns: {global_columns}

### DATA SAMPLE
{global_data_summary}

### USER REQUEST
{request.query}

### CHAT HISTORY
{request.history}
"""
    
    try:
        text = await call_llm(prompt)
        
        # Strip markdown fences if present
        if "```json" in text:
            json_str = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            json_str = text.split("```")[1].split("```")[0].strip()
        else:
            json_str = text.strip()

        def clean_json(t: str):
            t = t.strip()
            # Remove markdown code blocks if any
            if "```" in t:
                import re
                p = r'```(?:json)?\s*([\s\S]*?)```'
                ms = re.findall(p, t)
                if ms: t = ms[0].strip()

            # Extract only the JSON object part
            start = t.find('{')
            end = t.rfind('}')
            if start != -1 and end != -1:
                t = t[start:end+1]

            # Fix unescaped backslashes
            import re
            t = re.sub(r'\\(?![\\"/bfnrtu])', r'\\\\', t)

            # Replace special unicode characters
            t = t.replace('\u2013', '-').replace('\u2014', '-')
            t = t.replace('\u2018', "'").replace('\u2019', "'")
            t = t.replace('\u201c', '"').replace('\u201d', '"')

            # Remove control characters
            t = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', t)

            try:
                return json.loads(t)
            except json.JSONDecodeError as de:
                # If still fails, try to fix truncated JSON
                try:
                    open_braces = t.count('{') - t.count('}')
                    open_brackets = t.count('[') - t.count(']')
                    t += ']' * open_brackets + '}' * open_braces
                    return json.loads(t)
                except:
                    raise de

        try:
            parsed = clean_json(json_str)
        except Exception as parse_err:
            print(f"❌ JSON Parse Error: {parse_err}")
            print(f"RAW TEXT: {json_str[:500]}...")
            raise HTTPException(status_code=500, detail=f"Invalid JSON format from AI: {str(parse_err)}")
        
        raw_charts = []
        if "charts" in parsed and isinstance(parsed["charts"], list):
            raw_charts = parsed["charts"]
        elif parsed.get("sql"):
            raw_charts = [parsed]
        
        if not raw_charts:
            return {
                "type": "text",
                "summary": parsed.get("explanation", "I couldn't generate a query for this request.")
            }
            
        conn = sqlite3.connect(':memory:')
        df = load_df(global_file_path)
        df.to_sql('data', conn, index=False)
        
        final_charts = []
        last_data = []

        for c_info in raw_charts:
            try:
                sql = c_info.get("sql")
                if not sql: continue
                
                results_df = pd.read_sql_query(sql, conn)
                for col in results_df.select_dtypes(include=['datetime64', 'datetime', 'datetimetz']).columns:
                    results_df[col] = results_df[col].astype(str)
                
                data = results_df.to_dict(orient="records")
                last_data = data
                
                chart_type = c_info.get("chart_type", "bar")
                x_axis = c_info.get("xAxisKey") or (results_df.columns[0] if len(results_df.columns) > 0 else "label")
                y_axes = c_info.get("yAxisKeys") or [c for c in results_df.columns if c != x_axis]
                
                expl = c_info.get("explanation", "Data Visualization")
                final_charts.append({
                    "title": expl[:80] + ("..." if len(expl) > 80 else ""),
                    "type": chart_type,
                    "xAxisKey": x_axis,
                    "yAxisKeys": y_axes,
                    "nameKey": x_axis,
                    "valueKey": y_axes[0] if y_axes else "value",
                    "data": data
                })
            except Exception as e:
                print(f"⚠️ Error executing sub-query: {e}")
                continue
                
        conn.close()
        
        if not final_charts:
            return {"type": "text", "summary": "Failed to generate visualizations from the SQL provided."}

        return {
            "type": "dashboard",
            "summary": parsed.get("explanation", "Data Analysis complete."),
            "charts": final_charts,
            "rawData": last_data
        }
        
    except Exception as e:
        err_str = str(e)
        print(f"❌ Query error: {err_str[:200]}")
        
        if "429" in err_str or "rate_limit" in err_str.lower():
            return {
                "type": "error",
                "summary": "⏳ Rate limit reached. Please wait 15–30 seconds and try again. Repeated queries are cached and won't count against your quota."
            }
        
        return {
            "type": "error",
            "summary": f"❌ Error: {err_str[:200]}"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
