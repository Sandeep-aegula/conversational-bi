import pandas as pd
import io

def parse_robust(path):
    with open(path, "rb") as f:
        file_bytes = f.read()
    
    try:
        decoded = file_bytes.decode('utf-8-sig', errors='replace')
    except Exception:
        decoded = file_bytes.decode('latin-1', errors='replace')

    lines = decoded.split('\n')
    start_line = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if (
            ',' in stripped
            and len(stripped) < 500
            and stripped.count('\x00') == 0
            and not stripped.startswith('bplist')
            and not stripped.startswith('\x00')
        ):
            start_line = i
            print(f"Found CSV start at line {i}: {stripped[:50]}")
            break
    
    clean_content = '\n'.join(lines[start_line:])
    
    delimiters = [',', ';', '\t', '|']
    for delimiter in delimiters:
        try:
            df = pd.read_csv(
                io.StringIO(clean_content),
                sep=delimiter,
                engine='python',
                on_bad_lines='skip',
                skipinitialspace=True,
                encoding_errors='replace',
            )
            if len(df.columns) >= 2 and len(df) > 0:
                print(f"Parsed with delimiter '{delimiter}': {len(df.columns)} columns")
                print(f"Columns: {df.columns.tolist()}")
                return df
        except Exception as e:
            continue
    return None

path = r"d:\project\GFG_hackathon\4. BMW Vehicle Inventory-20260307T060831Z-1-001\4. BMW Vehicle Inventory\BMW Vehicle Inventory.csv"
df = parse_robust(path)
if df is not None:
    print("Success")
else:
    print("Failed")
