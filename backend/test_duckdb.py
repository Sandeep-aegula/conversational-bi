import duckdb
print(duckdb.query("SELECT * FROM read_csv_auto('storage/good.csv') LIMIT 1").df())
