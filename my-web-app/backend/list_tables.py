import psycopg2

conn = psycopg2.connect(
    user="postgres", password="Fab123?", host="localhost", database="website_builder"
)
cur = conn.cursor()
cur.execute(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
)
tables = cur.fetchall()
for t in tables:
    print(t[0])
cur.close()
conn.close()
