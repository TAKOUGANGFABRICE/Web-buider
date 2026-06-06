import psycopg2

conn = psycopg2.connect(
    user="postgres", password="Fab123?", host="localhost", database="website_builder"
)
cur = conn.cursor()

tables = [
    "core_billingplan",
    "core_template",
    "core_website",
    "core_subscription",
    "core_userbillingplan",
]

for table in tables:
    cur.execute(f"SELECT COUNT(*) FROM {table}")
    count = cur.fetchone()[0]
    print(f"{table}: {count} rows")

cur.close()
conn.close()
