"""
Data Visualization for Project Dataset

- Generates correlation heatmap and various plots for feature analysis.
- Helps in understanding relationships and distributions for modeling.

Dependencies: pandas, matplotlib, seaborn, numpy
"""

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

# Load the dataset
df = pd.read_csv("big_dataset.csv")

# Clean column names
df.columns = [col.strip() for col in df.columns]

# Convert relevant columns to numeric
for col in ["Estimated Task Duration (hrs)", "Project Duration (hrs)", "Complexity Score"]:
    df[col] = pd.to_numeric(df[col], errors="coerce")

# Encode categorical features for correlation
df["Complexity_num"] = df["Complexity"].map({"Low": 0, "Medium": 1, "High": 2, "Very High": 3, "Critical": 4})
df["Risk_num"] = df["Risk"].map({"Low": 0, "Medium": 1, "High": 2, "Very High": 3, "Critical": 4})

# Select numeric columns for correlation
corr_cols = [
    "Estimated Task Duration (hrs)",
    "Project Duration (hrs)",
    "Complexity Score",
    "Complexity_num",
    "Risk_num"
]
corr_matrix = df[corr_cols].corr()

# --- Correlation Heatmap ---
plt.figure(figsize=(8,6))
sns.heatmap(corr_matrix, annot=True, cmap="coolwarm", fmt=".2f")
plt.title("Correlation Heatmap")
plt.tight_layout()
plt.savefig("correlation_heatmap.png")
plt.show()

# --- Distribution Plots ---
for col in ["Estimated Task Duration (hrs)", "Project Duration (hrs)", "Complexity Score"]:
    plt.figure()
    sns.histplot(df[col].dropna(), kde=True, bins=20)
    plt.title(f"Distribution of {col}")
    plt.tight_layout()
    plt.savefig(f"{col.replace(' ', '_').lower()}_dist.png")
    plt.show()

# --- Boxplots by Complexity ---
plt.figure(figsize=(8,6))
sns.boxplot(x="Complexity", y="Estimated Task Duration (hrs)", data=df)
plt.title("Task Duration by Complexity")
plt.tight_layout()
plt.savefig("duration_by_complexity.png")
plt.show()

# --- Boxplots by Risk ---
plt.figure(figsize=(8,6))
sns.boxplot(x="Risk", y="Estimated Task Duration (hrs)", data=df)
plt.title("Task Duration by Risk")
plt.tight_layout()
plt.savefig("duration_by_risk.png")
plt.show()


print("All visualizations saved as PNG files in the current directory.")