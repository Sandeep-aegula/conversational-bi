import pandas as pd, sqlite3, json, math, sys

def sanitize_for_json(obj):
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize_for_json(item) for item in obj]
    return obj

df = pd.read_csv('storage/costs.csv')
print('Columns:', df.columns.tolist())
print('Dtypes:')
for c, d in df.dtypes.items():
    print(f'  {c}: {d}')
print()

conn = sqlite3.connect(':memory:')
df.to_sql('data', conn, index=False)

# Simulate what the LLM might generate for costs.csv
queries = [
    ('COUNT by Service', 'SELECT "Service" AS label, COUNT(*) AS value FROM data GROUP BY "Service" ORDER BY value DESC LIMIT 10'),
    ('SUM Total costs', 'SELECT "Service" AS label, SUM("Total costs($)") AS total FROM data GROUP BY "Service" ORDER BY total DESC LIMIT 10'),
    ('AVG EC2', 'SELECT "Service" AS label, AVG("EC2-Instances($)") AS avg_cost FROM data GROUP BY "Service" LIMIT 10'),
    ('SELECT *', 'SELECT * FROM data LIMIT 5'),
]

for name, sql in queries:
    try:
        r = pd.read_sql_query(sql, conn)
        raw = r.to_dict(orient='records')
        has_nan = any(
            isinstance(v, float) and (math.isnan(v) or math.isinf(v))
            for row in raw for v in row.values()
        )
        clean = sanitize_for_json(raw)
        serialized = json.dumps(clean)
        print(f'[OK] {name} | NaN in raw: {has_nan} | rows: {len(clean)}')
        print(f'     Preview: {serialized[:120]}')
    except Exception as e:
        print(f'[FAIL] {name}: {e}')

print()
# Test NaN round-trip
print('=== NaN round-trip test ===')
r2 = pd.read_sql_query('SELECT * FROM data LIMIT 3', conn)
raw2 = r2.to_dict(orient='records')
nan_vals = [(k, v) for row in raw2 for k, v in row.items() if isinstance(v, float) and math.isnan(v)]
print(f'NaN values in raw dict: {nan_vals[:5]}')
clean2 = sanitize_for_json(raw2)
try:
    print(f'json.dumps after sanitize: OK ({len(json.dumps(clean2))} chars)')
except Exception as e:
    print(f'json.dumps FAILED: {e}')

# Check if there are numpy nan types that math.isnan misses
print()
print('=== numpy NaN test ===')
import numpy as np
for row in raw2:
    for k, v in row.items():
        if v is not None and not isinstance(v, (str, int, bool)):
            print(f'  {k}: type={type(v).__name__}, value={v}, isNaN={pd.isna(v)}')

conn.close()
print('Done.')
