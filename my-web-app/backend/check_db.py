import sqlite3
import os

db_path = r"C:\Users\admin\Desktop\WEB and App development\Website Builder\my-web-app\backend\db.sqlite3"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check if table exists
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='core_userprofile';"
    )
    result = cursor.fetchone()
    print(f"Table core_userprofile exists: {result is not None}")

    if result:
        # Get column info
        cursor.execute("PRAGMA table_info(core_userprofile)")
        columns = [row[1] for row in cursor.fetchall()]
        print(f"Current columns: {columns}")

        # Check important columns exist
        expected = [
            "id", "user_id", "is_email_verified", "password_reset_token",
            "password_reset_expires", "google_id", "facebook_id", "avatar",
            "phone", "bio", "date_of_birth", "email_notifications",
            "marketing_emails", "created_at", "updated_at"
        ]
        for col in expected:
            status = "✓" if col in columns else "✗ MISSING"
            print(f"  {col}: {status}")

    conn.close()
else:
    print("Database file not found")

print("\nNote: email_verification_code, email_code_expires, email_verification_token were removed in migration 0014")

