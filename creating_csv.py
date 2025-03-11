import os
import pandas as pd
import random

# Define dataset path
dataset_path = "CEDAR_Signatures"  # Adjust if different

# Define genuine and forged paths
genuine_dir = os.path.join(dataset_path, "genuine")
forged_dir = os.path.join(dataset_path, "forged")

# Get file names
genuine_files = sorted(os.listdir(genuine_dir))
forged_files = sorted(os.listdir(forged_dir))

# Ensure we pair correctly (modify if necessary)
data = []
for gen_file, forg_file in zip(genuine_files, forged_files):
    data.append([os.path.join("genuine", gen_file), os.path.join("forged", forg_file), 1])

# Shuffle and split data into train/test (80% train, 20% test)
random.shuffle(data)
split_idx = int(0.8 * len(data))
train_data = data[:split_idx]
test_data = data[split_idx:]

# Save to CSV
train_df = pd.DataFrame(train_data, columns=["genuine_path", "forged_path", "label"])
test_df = pd.DataFrame(test_data, columns=["genuine_path", "forged_path", "label"])

train_df.to_csv("train_data.csv", index=False)
test_df.to_csv("test_data.csv", index=False)

print("CSV files created successfully.")
