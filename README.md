# PRISM — Conversational Business Intelligence

**PRISM** is a conversational BI dashboard that lets you explore a dataset using natural-language questions. Upload a CSV or Excel file, ask a business question, and the backend uses Groq's Llama model to propose SQLite queries and return chart-ready results for the dashboard.

**Live demo:** [conversational-bi-zasg.vercel.app](https://conversational-bi-zasg.vercel.app/)

> The live frontend is deployed separately from the backend. For local development, follow the setup below. The dashboard currently defines its backend URL as `http://localhost:8000` in `frontend/app/components/Dashboard.tsx`, so hosted end-to-end functionality may require deployment configuration changes.

## What It Does

- **Ask questions about data** in natural language, such as asking for category comparisons, distributions, or trends.
- **Upload datasets** in CSV, XLSX, or XLS format.
- **Inspect dataset structure** through row/column counts and detected numeric and categorical columns.
- **Generate visualizations** from model-generated SQL results, including bar, pie, line, and area charts.
- **Explore insights** through a dashboard with separate panels and sheet tabs.
- **Export results** as CSV, PNG, or PDF; the export utilities also support exporting multiple sheets.
- **Use the bundled BMW sample data** to try the application without preparing a dataset first.
- **Reduce repeated model requests** with an in-memory prompt cache and a basic rate limiter/retry flow.
- **Filter clearly unrelated questions** with a keyword-based topic guard so the assistant stays focused on BI and analytics.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Charts and visualization | Recharts |
| Styling and icons | Tailwind CSS 4, Lucide React |
| Export | html2canvas, jsPDF, CSV generation |
| Backend API | Python, FastAPI, Uvicorn |
| Data processing | pandas, SQLite (in-memory query execution) |
| AI query generation | Groq API, Llama 3.3 70B Versatile |
| File support | python-multipart, openpyxl, xlrd |

## Architecture

```text
Browser
  |
  v
Next.js / React dashboard
  |  Upload file / ask question
  v
FastAPI backend (:8000)
  |-- Parse CSV or Excel with pandas
  |-- Summarize columns and sample rows
  |-- Ask Groq to generate BI-oriented SQLite SQL
  |-- Execute SQL against an in-memory SQLite table
  |-- Return chart data and a summary
  v
Recharts dashboard + CSV / PNG / PDF exports
```

The current backend keeps the active uploaded dataset and query cache in process memory and stores uploaded files under its local `storage/` directory. This is a prototype-style architecture: restarting the backend clears its in-memory dataset state and cache.

## Repository Structure

```text
conversational-bi/
├── backend/
│   ├── main.py               # FastAPI endpoints and query workflow
│   ├── requirements.txt      # Python dependencies
│   └── *_*.py                # Local debugging and test scripts
├── frontend/
│   ├── app/
│   │   ├── components/       # Dashboard panels, charts, auth UI, exports
│   │   ├── context/          # Authentication and theme contexts
│   │   ├── hooks/            # Sheet state
│   │   └── utils/             # Data processing and export helpers
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── sample_bmw_data.csv       # Small sample dataset
├── BMW_Sample_Clean.csv      # Additional cleaned sample data
└── 4. BMW Vehicle Inventory... # Source dataset archive and data dictionary
```

## Prerequisites

- Python 3.10+ (a modern Python version compatible with the listed dependencies)
- Node.js and npm
- A [Groq API key](https://console.groq.com/) for natural-language query generation
- Git

## Run Locally

Run the backend and frontend in separate terminals.

### 1. Clone the repository

```bash
git clone https://github.com/Sandeep-aegula/conversational-bi.git
cd conversational-bi
```

### 2. Configure and start the backend

**Windows PowerShell**

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**macOS / Linux**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create a file named `.env` inside `backend/`:

```env
GROQ_API_KEY=your_groq_api_key
```

Start the API from the `backend/` directory:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at [http://localhost:8000](http://localhost:8000). FastAPI's interactive documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 3. Configure and start the frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Copy the example environment file to `.env.local` if you need to configure the documented frontend setting:

**Windows PowerShell**
```powershell
Copy-Item .env.example .env.local
```

**macOS / Linux**
```bash
cp .env.example .env.local
```

Start Next.js:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Backend URL note:** `frontend/.env.example` defines `NEXT_PUBLIC_BACKEND_URL`, but the current dashboard component uses a hard-coded `http://localhost:8000` URL. The variable will not change that component until the code is updated to read it. For local development, make sure the backend is running on port 8000.

## Using PRISM

1. Start both the backend and frontend.
2. Upload a CSV or Excel dataset, or use the sample BMW dataset.
3. Review the detected columns and dataset summary.
4. Ask a question about the uploaded data, such as:
   - “Show the top categories by count.”
   - “Compare the average value across groups.”
   - “Show the trend over time.”
5. Review the generated summary and chart(s).
6. Export a sheet or its data using the available CSV, PNG, or PDF export options.

The query workflow is designed for a single flat dataset named `data` and generates bounded aggregate queries rather than unrestricted row dumps.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/sample-csv` | Download the bundled sample CSV |
| `POST` | `/api/upload` | Upload a CSV or Excel file and return dataset metadata |
| `POST` | `/api/query` | Ask a BI question and receive a text summary or chart data |

### Example query request

After uploading a dataset, send a JSON request to `POST /api/query`:

```json
{
  "query": "Show the top 10 categories by count",
  "history": []
}
```

The backend expects the uploaded dataset to be active before a query is submitted. The `history` field is optional.

## Available Scripts

From `frontend/`:

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build the production frontend |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

Backend dependencies are listed in `backend/requirements.txt`. The repository also contains debugging and test scripts; no automated test suite or CI result is claimed here.

## Configuration and Security Notes

- Keep `GROQ_API_KEY` in `backend/.env`; never commit real credentials.
- Treat uploaded datasets as potentially sensitive. Use only data you are authorized to process.
- The backend currently enables permissive CORS and stores the current dataset path in process-global state. Review these choices before exposing the API publicly or serving multiple users.
- The query workflow uses model-generated SQL. Validate inputs, isolate users' datasets, and add appropriate authorization, upload limits, and SQL safeguards before production use.
- The backend uses a local `storage/` directory for uploaded files. Filesystem persistence and cleanup depend on the host environment.

## Current Limitations

- The backend's active dataset state is global to the running process, rather than isolated per user/session.
- The prompt cache and rate limiter are in-memory and reset when the process restarts.
- The frontend dashboard currently hard-codes the local backend URL, so production deployment requires additional configuration.
- Generated SQL and visualizations depend on the uploaded file's schema and the AI response; results should be checked before being used for business decisions.

## License

No repository-level license file was identified during this review. Until a license is added, do not assume the project is available for unrestricted reuse or redistribution.
