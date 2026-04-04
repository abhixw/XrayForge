import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Connecting to: {DATABASE_URL}")

engine = create_engine(DATABASE_URL)

df = pd.read_sql("SELECT * FROM feedback", engine)

print(f"Total feedback records: {len(df)}")
print(df)

if len(df) > 0:
    df.to_csv("feedback_dataset.csv", index=False)
    print("✅ Saved to feedback_dataset.csv")
else:
    print("⚠️ No feedback records found. Go to Doctor dashboard and click 'Mark Incorrect' on a case first.")