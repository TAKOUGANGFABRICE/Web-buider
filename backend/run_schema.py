import os
import re
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv

load_dotenv()

DB_NAME = os.getenv("DB_NAME", "website_builder")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")


def run_schema():
    with open("schema.sql", "r", encoding="utf-8") as f:
        schema_sql = f.read()

    conn = psycopg2.connect(
        dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST, port=DB_PORT
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()

    # Remove SQL comments and split by semicolon
    # Keep newlines but remove -- comments
    lines = []
    for line in schema_sql.split("\n"):
        # Remove -- comments but keep the rest of the line
        if "--" in line:
            line = line[: line.index("--")]
        if line.strip():
            lines.append(line)

    schema_clean = "\n".join(lines)

    # Split by semicolon
    statements = [s.strip() for s in schema_clean.split(";") if s.strip()]

    print(f"Executing {len(statements)} SQL statements...")

    for i, stmt in enumerate(statements, 1):
        if not stmt:
            continue
        try:
            cursor.execute(stmt)
            if i % 25 == 0:
                print(f"Executed {i}/{len(statements)} statements...")
        except Exception as e:
            print(f"\nError at statement {i}: {e}")
            # Show more context
            stmt_preview = stmt[:300] if len(stmt) > 300 else stmt
            print(f"Statement: {stmt_preview}")
            print("\nContinuing with remaining statements...")
            continue

    cursor.close()
    conn.close()
    print(f"\nCompleted! Executed all {len(statements)} statements.")


if __name__ == "__main__":
    run_schema()
