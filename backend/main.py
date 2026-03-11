import os
import json
import shutil
import pandas as pd
import sqlite3
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    global global_file_path, global_columns, global_data_summary
    try:
        if not file.filename or not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are supported.")
        
        os.makedirs("storage", exist_ok=True)
        file_path = f"storage/{file.filename}"
        
        # Read file and ensure it is saved as UTF-8
        raw_data = await file.read()
        try:
            text_data = raw_data.decode('utf-8')
        except UnicodeDecodeError:
            try:
                text_data = raw_data.decode('utf-16')
            except UnicodeDecodeError:
                text_data = raw_data.decode('latin1')
                
        with open(file_path, "w", encoding="utf-8", newline="") as buffer:
            buffer.write(text_data)
            
        global_file_path = file_path
        
        # Load schema correctly using Pandas
        try:
            df_full = pd.read_csv(file_path)
        except Exception as e:
            raise ValueError(f"The uploaded CSV is empty or incorrectly formatted. Error: {e}")
            
        if df_full.empty and len(df_full.columns) == 0:
            raise ValueError("The uploaded CSV is empty or incorrectly formatted.")
            
        global_columns = list(df_full.columns)
        
        # Calculate summary statistics for text-based insights
        try:
            sample_desc = df_full.head(3).to_string()
            stats_desc = df_full.describe(include='all').to_string()
            global_data_summary = f"First 3 Rows:\n{sample_desc}\n\nStatistics Summary:\n{stats_desc}"
            # Truncate summary if excessively large to avoid token limits
            if len(global_data_summary) > 8000:
                global_data_summary = global_data_summary[:8000] + "\n...(Summary truncated)"
        except Exception:
            global_data_summary = "Data summary not available."
        
        row_count = len(df_full)
        
        return {
            "filename": file.filename,
            "rows": row_count,
            "columns": len(global_columns),
            "headers": global_columns
        }
    except Exception as e:
        error_msg = str(e)
        # If Pandas cannot parse the CSV format
        if "ParserError" in error_msg or "empty" in error_msg or "decode" in error_msg:
            raise HTTPException(status_code=400, detail="The file could not be parsed as a valid CSV. Please ensure it is correctly formatted.")
        
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/api/query")
async def query_data(request: QueryRequest):
    global global_file_path, global_columns, global_data_summary
    
    if not global_file_path or not os.path.exists(global_file_path):
        raise HTTPException(status_code=400, detail="Please upload a dataset first.")
        
    prompt = f"""
### ROLE
Senior Data Engineer & Conversational BI Expert.

### CONTEXT
- You are querying a dataset loaded into an SQLite database via Pandas.
- Table Name: 'data'
- Strategy: If the user asks for general insights (like an initial summary and key findings), you should analyze the DATA SUMMARY, provide a comprehensive, friendly text overview (using Markdown formatting without wrapping the whole response in a string), suggest exactly 3 questions they can ask, and leave the `sql` field empty ("").
- Strategy: If the user asks to visualize or compute something specific, use standard SQL compatible with SQLite3. Always AGGREGATE data (SUM, AVG, COUNT, GROUP BY) so the resulting dataset is small enough for a web dashboard (less than 100 rows).

### OBJECTIVE
1. For qualitative / text overview questions: Return JSON containing a text string in `explanation` that explains the dataset effectively. Leave `sql` empty. Let your text be detailed and insightful based on the DATA SUMMARY.
2. For quantitative questions: Translate the user's prompt into an SQLite SQL query.

### OUTPUT FORMAT
Return ONLY JSON:
{{
  "sql": "SELECT column_name as label, SUM(value) as value FROM data GROUP BY 1",
  "chart_type": "bar",
  "explanation": "Briefly explain the chart OR (if sql is empty) write an insightful text overview based on the data summary with 3 suggested questions.",
  "xAxisKey": "label",
  "yAxisKeys": ["value"]
}}

RULES:
- `chart_type` can be 'bar', 'line', 'pie', 'area'
- Ensure your markdown output handles newlines correctly inside the JSON `explanation` string (e.g., using \\n).
- If the user's question cannot be answered, return:
{{
  "sql": "",
  "explanation": "I cannot answer this question based on the current dataset."
}}

### SCHEMA (Columns)
{global_columns}

### DATA SUMMARY (Sample & Stats)
{global_data_summary}

### USER PROMPT
{request.query}

### CHAT HISTORY
{request.history}
"""
    
    try:
        if not genai_client:
            raise ValueError("Gemini API Key is not configured.")
        response = genai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        text = response.text
        
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
        # Run using pandas and sqlite3
        conn = sqlite3.connect(':memory:')
        
        # Load the CSV purely using Pandas
        df = pd.read_csv(global_file_path)
        
        # Transfer df to SQLite to run the SQL query
        df.to_sql('data', conn, index=False)
        results_df = pd.read_sql_query(sql, conn)
        conn.close()
        
        # Serialize datetime safely
        for col in results_df.select_dtypes(include=['datetime64', 'datetime', 'datetimetz']).columns:
            results_df[col] = results_df[col].astype(str)
            
        data = results_df.to_dict(orient="records")
        chart_type = parsed.get("chart_type", "bar")
        x_axis = parsed.get("xAxisKey")
        y_axes = parsed.get("yAxisKeys", [])
        
        if not x_axis and len(results_df.columns) > 0:
            x_axis = results_df.columns[0]
        if not y_axes and len(results_df.columns) > 1:
            y_axes = list(results_df.columns[1:])
            
        chart_config = {
            "title": parsed.get("explanation", "Data Visualization")[:55] + ("..." if len(parsed.get("explanation", "")) > 55 else ""),
            "type": chart_type,
            "xAxisKey": x_axis,
            "yAxisKeys": y_axes,
            "nameKey": x_axis,
            "valueKey": y_axes[0] if y_axes else "value",
            "data": data
        }
        
        return {
            "type": "dashboard",
            "summary": parsed.get("explanation", "Here is your data."),
            "charts": [chart_config],
            "rawData": data
        }
        
    except Exception as e:
        print("Error executing model or query:", str(e))
        return {
            "type": "error",
            "summary": "I encountered an error trying to analyze this data. " + str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
