import json
import re

def clean_json(text):
    # This regex looks for backslashes that are NOT part of a valid JSON escape sequence (\", \\, \/, \b, \f, \n, \r, \t, \uXXXX)
    # and escapes them.
    # A bit tricky to do perfectly with regex, but we can try common ones.
    
    # Simple approach: if json.loads fails, try to escape backslashes.
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        if "Invalid \\escape" in str(e):
            # Escape backslashes that aren't already escaped or part of a valid escape
            # This is a bit naive but better than nothing.
            # We look for \ that is NOT followed by ["\/bfnrtu]
            fixed = re.sub(r'\\(?![\\"/bfnrtu])', r'\\\\', text)
            try:
                return json.loads(fixed)
            except:
                raise e
        raise e

# Example of what might be failing
bad_json = '{"sql": "SELECT \"col\\name\" FROM data", "explanation": "test"}'
# In JSON, a backslash must be escaped. If the LLM sends "col\name", it's invalid.
bad_json_raw = '{"sql": "SELECT \\"col\\name\\" FROM data"}' 
# Wait, backslash in python string literal is tricky.
# Let's say the LLM returns: {"sql": "SELECT \"bplist00\x\" ..."}

print("Testing clean_json...")
try:
    # Simulating raw string from LLM with invalid escape \x
    raw = '{"sql": "SELECT \\"bplist00\\x\\" FROM data"}'
    print(f"Raw: {raw}")
    print(f"Parsed: {clean_json(raw)}")
except Exception as e:
    print(f"Error: {e}")
