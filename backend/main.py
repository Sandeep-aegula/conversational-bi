import os
import json
import re
import shutil
import pandas as pd
import sqlite3
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
from google import genai
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

api_key = os.getenv("GEMINI_API_KEY")
genai_client = None
if api_key:
    genai_client = genai.Client(api_key=api_key)

class QueryRequest(BaseModel):
    query: str
    history: Optional[List[dict]] = []

global_file_path = None
global_columns = []
global_data_summary = ""

def load_df(file_path: str) -> pd.DataFrame:
    """Load CSV with auto-delimiter detection."""
    for sep in [',', ';', '\t', '|']:
        try:
            _df = pd.read_csv(file_path, sep=sep, nrows=5)
            if len(_df.columns) > 1:
                df = pd.read_csv(file_path, sep=sep)
                df.columns = [str(c).strip() for c in df.columns]
                return df
        except Exception:
            continue
    # fallback
    df = pd.read_csv(file_path)
    df.columns = [str(c).strip() for c in df.columns]
    return df

SAMPLE_CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "sample_bmw_data.csv")

@app.get("/api/sample-csv")
def get_sample_csv():
    path = os.path.abspath(SAMPLE_CSV_PATH)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Sample CSV not found.")
    return FileResponse(path, media_type="text/csv", filename="sample_bmw_data.csv")

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    global global_file_path, global_columns, global_data_summary
    try:
        if not file.filename or not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are supported.")
        
        os.makedirs("storage", exist_ok=True)
        file_path = f"storage/{file.filename}"
        
        raw_data = await file.read()
        
        # Detect binary files (bplist, zip, etc.) — not real CSVs
        if raw_data[:6] in (b'bplist', b'PK\x03\x04', b'\x89PNG\r') or raw_data[:4] in (b'\x00\x00\x00\x00', b'%PDF'):
            raise HTTPException(status_code=400, detail="The uploaded file is not a plain text CSV. It appears to be a binary file (e.g., Safari WebKit archive, ZIP, PDF). Please export your data as a plain CSV (.csv) file from Excel, Google Sheets, or a database tool.")
        
        try:
            text_data = raw_data.decode('utf-8')
        except UnicodeDecodeError:
            try:
                text_data = raw_data.decode('utf-16')
            except UnicodeDecodeError:
                text_data = raw_data.decode('latin1')
        
        # Extra guard: check if file starts with binary plist marker
        if text_data.startswith('bplist') or '\x00' in text_data[:100]:
            raise HTTPException(status_code=400, detail="The uploaded file appears to be a binary/WebKit archive rather than a plain CSV. Please save the file as a plain CSV and try again.")

                
        with open(file_path, "w", encoding="utf-8", newline="") as buffer:
            buffer.write(text_data)
            
        global_file_path = file_path
        
        df_full = load_df(file_path)
            
        if df_full.empty and len(df_full.columns) == 0:
            raise ValueError("The uploaded CSV is empty or incorrectly formatted.")
        
        global_columns = list(df_full.columns)
        
        # Detect column types
        numeric_cols = df_full.select_dtypes(include='number').columns.tolist()
        cat_cols = [c for c in df_full.columns if c not in numeric_cols]
        
        # Build data summary
        try:
            sample_desc = df_full.head(5).to_string()
            stats_desc = df_full.describe(include='all').to_string()
            global_data_summary = f"Columns: {list(df_full.columns)}\n\nFirst 5 Rows:\n{sample_desc}\n\nStatistics Summary:\n{stats_desc}"
            if len(global_data_summary) > 8000:
                global_data_summary = global_data_summary[:8000] + "\n...(truncated)"
        except Exception:
            global_data_summary = "Data summary not available."
        
        row_count = len(df_full)
        
        return {
            "filename": file.filename,
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

@app.post("/api/query")
async def query_data(request: QueryRequest):
    global global_file_path, global_columns, global_data_summary
    
    if not global_file_path or not os.path.exists(global_file_path):
        raise HTTPException(status_code=400, detail="Please upload a dataset first.")
    
    # Build column reference string with quoted names
    col_list = ', '.join([f'"{c}"' for c in global_columns])
    
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

### TEXT OVERVIEW RULE:
If the user asks for a general overview or summary (not a specific chart), return:
{{"sql": "", "chart_type": "", "explanation": "Your insight text here.", "xAxisKey": "", "yAxisKeys": []}}

### VALID SQL EXAMPLES:
- Bar chart: SELECT "category" AS label, COUNT(*) AS value FROM data GROUP BY "category" ORDER BY value DESC LIMIT 20
- Avg by group: SELECT "group_col" AS label, AVG("numeric_col") AS avg_val FROM data GROUP BY "group_col" ORDER BY avg_val DESC LIMIT 15
- Pie: SELECT "status" AS label, COUNT(*) AS value FROM data GROUP BY "status"
- Trend: SELECT "year" AS label, SUM("sales") AS total FROM data GROUP BY "year" ORDER BY "year"

### OUTPUT FORMAT (return ONLY valid JSON, no markdown code fences):
{{
  "sql": "SELECT ... FROM data GROUP BY ...",
  "chart_type": "bar",
  "explanation": "One sentence describing the chart.",
  "xAxisKey": "label",
  "yAxisKeys": ["value"]
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
        if not genai_client:
            raise ValueError("Gemini API Key is not configured.")
        
        # Try models in order — fall back if one hits rate limits
        models_to_try = ["gemini-1.5-flash"]
        response = None
        last_error = None
        
        for model_name in models_to_try:
            for attempt in range(3):  # up to 3 retries per model
                try:
                    response = genai_client.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                    print(f"Success with model: {model_name}")
                    break  # success — exit retry loop
                except Exception as model_err:
                    err_s = str(model_err)
                    last_error = model_err
                    if "429" in err_s or "RESOURCE_EXHAUSTED" in err_s:
                        # Extract retry delay
                        m = re.search(r'retryDelay.*?(\d+)s', err_s)
                        wait = int(m.group(1)) if m else 5
                        wait = min(wait, 15)  # cap at 15s wait
                        print(f"Rate limit on {model_name} attempt {attempt+1}, waiting {wait}s...")
                        import time; time.sleep(wait)
                        continue
                    else:
                        raise model_err  # non-rate-limit error — don't retry
            if response:
                break  # got a response — skip remaining models
        
        if not response:
            raise last_error  # all models exhausted
        
        text = response.text
        
        # Strip markdown fences if present
        if "```json" in text:
            json_str = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            json_str = text.split("```")[1].split("```")[0].strip()
        else:
            json_str = text.strip()
            
        parsed = json.loads(json_str)
        
        if not parsed.get("sql"):
            return {
                "type": "text",
                "summary": parsed.get("explanation", "I couldn't generate a query for this request.")
            }
            
        sql = parsed["sql"]
        
        # Load with auto-delimiter
        conn = sqlite3.connect(':memory:')
        df = load_df(global_file_path)
        df.to_sql('data', conn, index=False)
        
        results_df = pd.read_sql_query(sql, conn)
        conn.close()
        
        # Serialize datetime columns safely
        for col in results_df.select_dtypes(include=['datetime64', 'datetime', 'datetimetz']).columns:
            results_df[col] = results_df[col].astype(str)
            
        data = results_df.to_dict(orient="records")
        chart_type = parsed.get("chart_type", "bar")
        x_axis = parsed.get("xAxisKey") or (results_df.columns[0] if len(results_df.columns) > 0 else "label")
        y_axes = parsed.get("yAxisKeys") or [c for c in results_df.columns if c != x_axis]
        
        explanation = parsed.get("explanation", "Data Visualization")
        chart_config = {
            "title": explanation[:80] + ("..." if len(explanation) > 80 else ""),
            "type": chart_type,
            "xAxisKey": x_axis,
            "yAxisKeys": y_axes,
            "nameKey": x_axis,
            "valueKey": y_axes[0] if y_axes else "value",
            "data": data
        }
        
        return {
            "type": "dashboard",
            "summary": explanation,
            "charts": [chart_config],
            "rawData": data
        }
        
    except Exception as e:
        err_str = str(e)
        print("Error:", err_str)
        
        # Parse rate-limit errors cleanly
        if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
            m = re.search(r'retryDelay.*?(\d+)s', err_str)
            retry_secs = m.group(1) if m else "60"
            return {
                "type": "error",
                "summary": f"⏳ All Gemini models hit their rate limit. The free tier allows limited daily requests.\n\nOptions:\n• Wait {retry_secs}s and try again (quota resets at midnight IST)\n• Get a new API key at https://aistudio.google.com\n• Add GEMINI_API_KEY in backend/.env and restart the server"
            }
        
        return {
            "type": "error",
            "summary": f"❌ Error analyzing data: {err_str[:200]}"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
