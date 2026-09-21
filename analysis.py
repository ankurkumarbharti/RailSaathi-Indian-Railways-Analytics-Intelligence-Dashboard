#!/usr/bin/env python3
"""
🚂 Indian Railways Offline Analytics & Exploratory Data Analysis (EDA) Script
This script performs core statistical processing on 16 years of historical railway metrics.
It cross-validates the client-side JavaScript engine calculations and serves as a
reproducible analysis pipeline for data analyst portfolios.

Dependencies: pandas, numpy, scipy, matplotlib, seaborn (optional, with standard library fallbacks)
"""

import sys
import math

# Try importing data science libraries, providing clean instructions if missing
try:
    import pandas as pd
    import numpy as np
    from scipy import stats
    import matplotlib.pyplot as plt
    HAS_LIBS = True
except ImportError:
    HAS_LIBS = False

# Raw historical dataset
DATASET = {
    "Year": [2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    "Fiscal_Year": [
        "FY2008-09", "FY2009-10", "FY2010-11", "FY2011-12", "FY2012-13", "FY2013-14",
        "FY2014-15", "FY2015-16", "FY2016-17", "FY2017-18", "FY2018-19", "FY2019-20",
        "FY2020-21", "FY2021-22", "FY2022-23", "FY2023-24"
    ],
    "Passengers_M": [7203, 7627, 8090, 8421, 8421, 8397, 8107, 8231, 8284, 8439, 8089, 1252, 4768, 6670, 7440, 7500],
    "Total_Revenue_Cr": [83303, 94688, 108571, 119458, 129405, 142677, 147300, 155260, 168203, 184296, 197808, 141594, 169322, 212500, 239800, 257500],
    "Operating_Ratio_Pct": [95.3, 94.1, 90.4, 88.5, 90.2, 91.8, 107.4, 96.5, 97.0, 98.5, 97.3, 176.3, 131.5, 98.8, 95.3, 98.4],
    "Freight_Loading_MT": [791, 857, 921, 975, 1015, 1051, 1101, 1109, 1160, 1160, 1210, 1070, 1226, 1418, 1510, 1588],
    "Electrified_Route_KM": [18274, 19000, 20884, 22224, 23541, 25367, 27999, 30802, 33977, 39399, 45881, 51235, 58000, 63000, 65141, 68000],
    "Accidents_Total": [141, 136, 130, 118, 117, 118, 107, 96, 94, 73, 79, 48, 43, 35, 40, 33],
    "Punctuality_Pct": [74.5, 75.2, 76.3, 74.9, 76.2, 78.5, 76.9, 77.4, 77.0, 71.4, 73.2, 86.5, 85.2, 82.4, 83.8, 87.3]
}

def calculate_cagr(start_val, end_val, periods):
    if start_val <= 0 or end_val <= 0 or periods <= 0: return 0
    return (math.pow(end_val / start_val, 1.0 / periods) - 1.0) * 100.0

def run_pure_python_stats():
    """Calculates summary statistics using standard Python library components."""
    print("=" * 70)
    print("[*] INDIAN RAILWAYS CORE STATISTICAL EXAMINER (Standard Library)")
    print("=" * 70)
    
    # 1. Descriptive stats for Accidents
    acc = DATASET["Accidents_Total"]
    acc_mean = sum(acc) / len(acc)
    acc_sorted = sorted(acc)
    acc_median = acc_sorted[8]  # (16 elements, mid points are index 7 and 8)
    acc_median = (acc_sorted[7] + acc_sorted[8]) / 2.0
    
    print(f"Historical Accidents (Accidents_Total):")
    print(f"  - Observations count: {len(acc)}")
    print(f"  - Mean annual rate:   {acc_mean:.2f}")
    print(f"  - Median rate:         {acc_median:.2f}")
    print(f"  - Maximum recorded:   {max(acc)} (FY2009)")
    print(f"  - Minimum recorded:   {min(acc)} (FY2024)")
    
    # 2. CAGR Calculations
    rev = DATASET["Total_Revenue_Cr"]
    rev_cagr = calculate_cagr(rev[0], rev[-1], len(rev) - 1)
    elec = DATASET["Electrified_Route_KM"]
    elec_cagr = calculate_cagr(elec[0], elec[-1], len(elec) - 1)
    
    print("\nCompound Annual Growth Rates (CAGR) (FY2009 to FY2024):")
    print(f"  - Gross Annual Revenues:  {rev_cagr:.2f}% per year")
    print(f"  - Network Electrification: {elec_cagr:.2f}% per year")

    # 3. Pearson correlation calculation: Electrification vs Accidents
    x = elec
    y = acc
    n = len(x)
    mean_x = sum(x) / n
    mean_y = sum(y) / n
    
    num = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y))
    den_x = sum((xi - mean_x) ** 2 for xi in x)
    den_y = sum((yi - mean_y) ** 2 for yi in y)
    r = num / math.sqrt(den_x * den_y) if den_x and den_y else 0
    
    print(f"\nHypothesis Test: Electrification vs Total Accidents")
    print(f"  - Electrification (X) mean: {mean_x:.1f} KM")
    print(f"  - Accidents (Y) mean:       {mean_y:.1f}")
    print(f"  - Pearson r coefficient:    {r:.4f}")
    if r < -0.8:
        print("  - Interpretation: Extremely strong inverse correlation. Safety increases linearly with electrification infrastructure upgrades.")
    else:
        print(f"  - Interpretation: Weak or moderate relationship.")

def run_scientific_stats():
    """Runs advanced analytics using Pandas, SciPy, and Matplotlib."""
    print("\n" + "=" * 70)
    print("[*] ADVANCED STATISTICAL PIPELINE (Pandas & SciPy)")
    print("=" * 70)
    
    df = pd.DataFrame(DATASET)
    print("Dataframe loaded successfully. Structure snapshot:")
    print(df.head(4).to_string(index=False))
    
    # Pearson Correlation Matrix
    corr_matrix = df.corr(numeric_only=True)
    print("\nPearson Correlation Coefficients Matrix (Select Pairs):")
    pairs = [
        ("Electrified_Route_KM", "Accidents_Total"),
        ("Freight_Loading_MT", "Total_Revenue_Cr"),
        ("Passengers_M", "Operating_Ratio_Pct")
    ]
    for col1, col2 in pairs:
        coef = corr_matrix.loc[col1, col2]
        print(f"  - {col1} vs {col2}: r = {coef:.4f}")

    # Ordinary Least Squares Linear Regression: Electrification vs Accidents
    x = df["Electrified_Route_KM"]
    y = df["Accidents_Total"]
    slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
    r_squared = r_value ** 2
    
    print("\nOrdinary Least Squares (OLS) Linear Regression Fit details:")
    print(f"  - Dependent Variable (Y):  Accidents_Total")
    print(f"  - Independent Variable (X): Electrified_Route_KM")
    print(f"  - Slope (m):               {slope:.6f}")
    print(f"  - Intercept (c):           {intercept:.2f}")
    print(f"  - Equation:                y = {slope:.6f}x + {intercept:.2f}")
    print(f"  - R-squared (R²):          {r_squared:.4f} (Explains {r_squared*100:.1f}% of model variance)")
    print(f"  - P-value:                 {p_value:.2e} (Significance limit: p < 0.05)")
    if p_value < 0.05:
        print("  - Result: Statistically significant linear relationship.")
    else:
        print("  - Result: No statistically significant linear relationship detected.")

    # Generate Matplotlib plot and save as image
    plot_regression_and_save(df, slope, intercept, r_value)

def plot_regression_and_save(df, slope, intercept, r_value):
    try:
        plt.style.use('dark_background')
    except:
        pass # fallback to default if dark style not available

    fig, ax = plt.subplots(figsize=(8, 5))
    
    # Plot scatter points
    ax.scatter(df["Electrified_Route_KM"], df["Accidents_Total"], color='#f39c12', s=50, label='Annual Data (FY09-FY24)')
    
    # Annotate COVID anomalies
    covid_2021 = df[df["Year"] == 2021]
    if not covid_2021.empty:
        ax.annotate('FY21 (COVID)', 
                    xy=(covid_2021["Electrified_Route_KM"].values[0], covid_2021["Accidents_Total"].values[0]),
                    xytext=(covid_2021["Electrified_Route_KM"].values[0] - 10000, covid_2021["Accidents_Total"].values[0] + 15),
                    arrowprops=dict(facecolor='#e74c3c', shrink=0.08, width=1, headwidth=6))

    # Plot trendline
    x_vals = np.linspace(df["Electrified_Route_KM"].min(), df["Electrified_Route_KM"].max(), 100)
    y_vals = slope * x_vals + intercept
    ax.plot(x_vals, y_vals, color='#2563d4', linewidth=2, label=f'Regression Fit (R={r_value:.3f})')
    
    ax.set_title("Indian Railways: Electrification vs Train Accidents", fontsize=13, fontweight='bold', pad=15)
    ax.set_xlabel("Electrified Route KM", fontsize=10, labelpad=8)
    ax.set_ylabel("Total Train Accidents", fontsize=10, labelpad=8)
    ax.legend(loc='upper right')
    ax.grid(True, alpha=0.15)
    
    output_png = "electrification_vs_accidents_fit.png"
    plt.tight_layout()
    plt.savefig(output_png, dpi=150)
    print(f"\n[*] Regression scatter plot generated and saved as '{output_png}'.")
    plt.close()

if __name__ == '__main__':
    run_pure_python_stats()
    
    if HAS_LIBS:
        run_scientific_stats()
    else:
        print("\n" + "=" * 70)
        print("[*] NOTE FOR PYTHON USERS:")
        print("To run the advanced data science pipeline (Pandas, SciPy, Matplotlib) and generate charts:")
        print("  pip install pandas scipy matplotlib")
        print("=" * 70)
