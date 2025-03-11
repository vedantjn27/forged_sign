
import pandas as pd

# Read the CSV with detected encoding
df = pd.read_csv("train_data_utf8.csv", encoding="cp1252")

# Save it again with utf-8 encoding
df.to_csv("train_data_utf8.csv", encoding="utf-8", index=False)

