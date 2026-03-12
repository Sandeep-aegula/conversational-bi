path = r"d:\project\GFG_hackathon\4. BMW Vehicle Inventory-20260307T060831Z-1-001\4. BMW Vehicle Inventory\BMW Vehicle Inventory.csv"
try:
    with open(path, "rb") as f:
        head = f.read(100)
        print(f"First 100 bytes: {head}")
except Exception as e:
    print(f"Error: {e}")
