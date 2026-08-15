# Cardiovascular Risk Screening System

# Unsupervised Learning --- Final Technical Report

## 1. Purpose of This Report

The main goal is to discover patient groups using unsupervised learning
and convert them into three project-level population tiers:

-   **Low Risk**
-   **Moderate Risk**
-   **High Risk**

The clustering is intended for population segmentation and screening
support. The risk tiers are **not medical diagnoses** and the
project-specific clinical risk index is **not a clinically validated
cardiovascular risk score**.

------------------------------------------------------------------------

# 2. What the Unsupervised Part Does

The workflow can be summarized as:

Raw Patient Dataset
        |
        v
Data Understanding
        |
        v
Data Cleaning
        |
        v
Feature Engineering
(Age, BMI, Pulse Pressure, BP Ratio)
        |
        v
Remove ID + cardio from clustering inputs
        |
        v
StandardScaler
        |
        v
Elbow Method + Silhouette Score
        |
        v
K = 3
        |
        v
K-Means Clustering
        |
        v
Cluster Profiling
        |
        v
Clinical Risk Index
        |
        v
Cluster → Risk Tier
        |
        +--------------------+
        |                    |
        v                    v
External Validation        GMM
using cardio                |
                             v
                     GMM probabilities
        |                    |
        +---------+----------+
                  |
                  v
             PCA / Visualizations
                  |
                  v
          Dashboard CSV + Models
```

The notebook explicitly removes `cardio` from the clustering features
and uses it only after clustering for external validation.

------------------------------------------------------------------------

# 3. Notebook Workflow

## 3.1 Libraries

The notebook uses:

-   NumPy
-   Pandas
-   Matplotlib
-   Seaborn
-   StandardScaler
-   KMeans
-   GaussianMixture
-   silhouette_score

The models use `random_state=42` for reproducibility.

------------------------------------------------------------------------

# 4. Dataset Cleaning

The notebook performs the following cleaning operations:

### Duplicate removal

Duplicate patient records are removed.

### Age conversion

The original age is stored in days and is converted to years:

``` text
age_years = age / 365.25
```

### BMI calculation

BMI is calculated from weight and height:

``` text
BMI = weight / (height in metres)^2
```

### Clinical validity checks

The notebook keeps only clinically plausible values using these ranges:

-   Age: 18--100 years
-   Height: 120--220 cm
-   Weight: 30--250 kg
-   Systolic BP: 70--250
-   Diastolic BP: 40--150
-   Diastolic BP \<= Systolic BP
-   BMI: 15--60

It also creates:

pulse_pressure = ap_hi - ap_lo
bp_ratio       = ap_hi / ap_lo

The executed notebook version available in the uploaded file reports:

-   Original rows: **4,584**
-   Duplicate rows removed: **0**
-   Invalid clinical records removed: **100**
-   Final cleaned rows: **4,484**

The notebook therefore documents a cleaned working dataset of 4,484
records in that version.

------------------------------------------------------------------------

# 5. Features Used for Unsupervised Learning

The notebook's main clustering feature set is:

age_years
gender
BMI
ap_hi
ap_lo
cholesterol
gluc
smoke
alco
active


The executed notebook reports a feature matrix of:

4,484 patients × 10 features

The important rule is:

> `id` is an identifier and is not used for clustering.

> `cardio` is the disease label and is not used for clustering.

The `cardio` column is used later only for external validation.

------------------------------------------------------------------------

# 6. Why `cardio` Is Removed

This is one of the most important points in the project.

`cardio` already tells whether the patient has cardiovascular disease.

If `cardio` were given to K-Means or GMM, the algorithm could use the
known disease label when forming groups. That would weaken the
unsupervised-learning objective.

Therefore the project follows:

Clinical + Lifestyle Features
            |
            v
       Clustering
            |
            v
       Risk Tiers
            |
            v
External validation using cardio

This allows the project to answer a different question from supervised
learning.

### Supervised learning

> "How likely is cardiovascular disease?"

### Unsupervised learning

> "What types of patients naturally exist in this population?"

------------------------------------------------------------------------

# 7. Feature Scaling

The notebook applies:

StandardScaler()

before clustering.

This is important because the features have different numerical ranges.

For example:

-   Age is measured in years.
-   BMI is around tens.
-   Blood pressure is around hundreds.
-   Cholesterol/glucose are coded levels.
-   Smoke/alcohol/activity are binary values.

K-Means is distance-based, so unscaled features could allow large-valued
variables to dominate the distance calculation.

The scaler is saved as:

scaler.pkl

------------------------------------------------------------------------

# 8. Elbow Method

The notebook evaluates K values from 1 to 10 using K-Means inertia/WCSS.

The purpose is to observe where increasing the number of clusters
provides diminishing improvement.

The project documentation identifies an elbow around **K = 3** and uses
three final population tiers.

------------------------------------------------------------------------

# 9. Silhouette Score

Silhouette Score is used to evaluate how well-separated the clusters
are.

General interpretation:

``` text
+1  → very well separated
 0  → overlapping clusters
-1  → poorly assigned clusters
```

The notebook evaluates multiple values of K.

The project intentionally uses:

``` text
K = 3
```

because the project objective requires three interpretable risk tiers:

``` text
Low Risk
Moderate Risk
High Risk
```

Important:

> Cluster IDs such as 0, 1 and 2 do not inherently mean Low, Moderate or
> High Risk.

The clusters must first be profiled clinically.

------------------------------------------------------------------------

# 10. Final K-Means Model

The notebook creates:

``` python
KMeans(
    n_clusters=3,
    random_state=42,
    n_init=10
)
```

The ZIP artifact contains a K-Means model with:

``` text
n_clusters = 3
n_init     = 10
random_state = 42
```

The saved model is:

``` text
kmeans_model.pkl
```

The model assigns each patient a numerical cluster:

``` text
0
1
2
```

------------------------------------------------------------------------

# 11. Cluster Profiling

After K-Means clustering, the project calculates average clinical and
lifestyle characteristics for each cluster.

The important profile variables include:

-   Age
-   BMI
-   Systolic blood pressure
-   Diastolic blood pressure
-   Cholesterol
-   Glucose
-   Smoking
-   Alcohol
-   Physical activity

This step is necessary because K-Means itself does not know that a
cluster should be called "High Risk."

The project interprets the clusters using these characteristics.

------------------------------------------------------------------------

# 12. Clinical Risk Index and Risk Mapping

The notebook creates a **project-specific clinical risk index** to order
the clusters.

Higher values of:

-   Age
-   BMI
-   Blood pressure
-   Cholesterol
-   Glucose
-   Smoking
-   Alcohol

are treated as higher-risk directions.

Physical activity is treated in the opposite direction.

The score is used only to order the clusters:

``` text
Lowest score     → Low Risk
Middle score     → Moderate Risk
Highest score    → High Risk
```

The ZIP contains the resulting mapping:

``` python
{
    2: "Low Risk",
    1: "Moderate Risk",
    0: "High Risk"
}
```

This mapping is saved as:

``` text
risk_mapping.pkl
```

### Important limitation

The clinical risk index is a **project-specific cluster interpretation
mechanism**.

It is not a medically validated cardiovascular risk calculator.

------------------------------------------------------------------------

# 13. Final ZIP Dataset

The ZIP archive contains:

``` text
cardiovascular_risk_clusters (1).csv
```

The actual CSV contains:

``` text
68,601 rows
19 columns
```

The columns are:

``` text
id
age_years
gender
height
weight
BMI
ap_hi
ap_lo
cholesterol
gluc
smoke
alco
active
kmeans_cluster
risk_tier
clinical_risk_index
gmm_cluster
gmm_confidence
cardio
```

This CSV is the most important deployment-oriented output because it
combines the patient information with the unsupervised-learning results.

------------------------------------------------------------------------

# 14. Important Version Difference Found During Analysis

There is an important difference between the uploaded notebook and the
uploaded ZIP artifact.

### Notebook version

The executed notebook reports:

``` text
Original rows: 4,584
Final cleaned rows: 4,484
```

and its dashboard output is reported as:

``` text
4,484 rows × 19 columns
```

### ZIP artifact

The actual CSV inside `ZipFiles(1).zip` contains:

``` text
68,601 rows × 19 columns
```

Therefore, the ZIP appears to have been generated from a
**different/larger dataset version or a different execution of the
workflow** than the uploaded notebook execution.

This should **not be silently merged into one number**.

For deployment/reporting, the safest statement is:

> "The uploaded notebook demonstrates the workflow on a 4,584-row source
> version and produces 4,484 cleaned records, while the supplied
> deployment ZIP contains a 68,601-row final risk-tier CSV."

This is important for reproducibility.

------------------------------------------------------------------------

# 15. Actual ZIP Risk-Tier Distribution

The actual `cardiovascular_risk_clusters (1).csv` was inspected.

The final K-Means cluster counts are:

    K-Means Cluster Risk Tier           Patients   Percentage
  ----------------- --------------- ------------ ------------
                  0 High Risk             20,210       29.46%
                  1 Moderate Risk          7,185       10.47%
                  2 Low Risk              41,206       60.07%
          **Total**                   **68,601**     **100%**

Therefore, in the actual ZIP output:

-   **Low Risk:** 41,206 patients
-   **Moderate Risk:** 7,185 patients
-   **High Risk:** 20,210 patients

The largest population group is Low Risk.

------------------------------------------------------------------------

# 16. Actual Clinical Profile From ZIP

The final ZIP dataset gives the following average profiles:

  ----------------------------------------------------------------------------------------------------
  Risk Tier      Age     BMI   Systolic   Diastolic   Cholesterol   Glucose   Smoke   Alcohol   Active
                                     BP          BP                                           
  ---------- ------- ------- ---------- ----------- ------------- --------- ------- --------- --------
  Low Risk     52.30   25.78     118.20       78.19           ---      1.13    0.00      0.00     0.80

  Moderate     52.14   26.81     125.64       81.38           ---      1.20    0.79      0.46     0.84
  Risk                                                                                        

  High Risk    55.73   31.08     144.29       87.62           ---      1.42    0.02      0.02     0.80
  ----------------------------------------------------------------------------------------------------

The cholesterol mean was not included in this compact calculated table
because it was omitted from the final displayed aggregation used for
this artifact summary. The source CSV itself contains the cholesterol
feature.

The important pattern is that the High Risk group has substantially
higher:

-   Age
-   BMI
-   Systolic BP
-   Diastolic BP
-   Glucose

than the Low Risk group.

------------------------------------------------------------------------

# 17. External Validation With `cardio`

The `cardio` column is present in the final ZIP CSV.

It was not used as a K-Means input in the intended unsupervised
workflow.

After clustering, the project compares risk tiers with `cardio`.

For the actual ZIP dataset:

  Risk Tier         No Disease   Disease
  --------------- ------------ ---------
  Low Risk              63.97%    36.03%
  Moderate Risk         55.53%    44.47%
  High Risk             21.35%    78.65%

Disease prevalence therefore increases from:

``` text
Low Risk       → 36.03%
Moderate Risk  → 44.47%
High Risk      → 78.65%
```

This is strong evidence of an association between the discovered
population groups and the original disease label.

However:

> This is external validation/association, not proof that K-Means is a
> medical diagnostic model.

------------------------------------------------------------------------

# 18. Gaussian Mixture Model

GMM is used as the second unsupervised method.

The notebook uses:

``` python
GaussianMixture(
    n_components=3,
    covariance_type="full",
    random_state=42,
    n_init=5
)
```

The ZIP model confirms:

``` text
n_components = 3
covariance_type = full
random_state = 42
n_init = 5
```

The saved model is:

``` text
gmm_model.pkl
```

------------------------------------------------------------------------

# 19. Why GMM Is Useful

K-Means gives a hard assignment:

``` text
Patient → Cluster 0
```

GMM provides probabilities:

``` text
Patient
   |
   +-- Cluster 0 probability
   +-- Cluster 1 probability
   +-- Cluster 2 probability
```

This is useful when a patient is near the boundary between groups.

The final CSV stores the highest GMM membership probability as:

``` text
gmm_confidence
```

------------------------------------------------------------------------

# 20. GMM Confidence in the ZIP

The actual ZIP data contains:

``` text
gmm_confidence
```

Statistics from the supplied CSV show:

``` text
Minimum confidence  ≈ 0.5029
Mean confidence     ≈ 0.9991
Median confidence   = 1.0000
Maximum confidence  = 1.0000
```

This means most patients have very high GMM membership confidence, while
a smaller number of patients are closer to a cluster boundary.

------------------------------------------------------------------------

# 21. Saved File 1 --- `cardiovascular_risk_clusters.csv`

### Purpose

This is the **main final patient-level output**.

It contains the original/engineered patient features together with:

-   K-Means cluster
-   Risk tier
-   Clinical risk index
-   GMM cluster
-   GMM confidence
-   `cardio` for validation

### Used by

-   Population Risk Dashboard
-   Backend/API
-   Data analysis
-   Project demonstration
-   Risk-tier visualization

Example structure:

``` text
patient
   |
   +-- clinical features
   |
   +-- kmeans_cluster
   |
   +-- risk_tier
   |
   +-- clinical_risk_index
   |
   +-- gmm_cluster
   |
   +-- gmm_confidence
```

------------------------------------------------------------------------

# 22. Saved File 2 --- `scaler.pkl`

### What it is

The trained `StandardScaler`.

### Purpose

When a new patient comes into the application, the patient's features
must be transformed using the **same scaler** used during model
training.

Conceptually:

``` text
New Patient
     |
     v
Same feature order
     |
     v
scaler.pkl
     |
     v
Scaled features
     |
     v
K-Means / GMM
```

### Why it is necessary

You must not create a new scaler for every prediction.

The production application should load:

``` text
scaler.pkl
```

and call:

``` python
scaler.transform(...)
```

------------------------------------------------------------------------

# 23. Saved File 3 --- `kmeans_model.pkl`

### What it is

The trained K-Means clustering model.

Configuration in the supplied artifact:

``` text
n_clusters = 3
n_init = 10
random_state = 42
```

### Purpose

For a new patient:

``` text
New Patient
    |
    v
Feature Engineering
    |
    v
scaler.pkl
    |
    v
kmeans_model.pkl
    |
    v
Cluster 0 / 1 / 2
    |
    v
risk_mapping.pkl
    |
    v
High / Moderate / Low Risk
```

------------------------------------------------------------------------

# 24. Saved File 4 --- `gmm_model.pkl`

### What it is

The trained Gaussian Mixture Model.

### Purpose

It provides:

1.  A GMM cluster
2.  Membership probabilities

The application can use it as a second clustering result or confidence
signal.

Conceptually:

``` text
Scaled Patient Features
          |
          v
     gmm_model.pkl
          |
          +------> GMM Cluster
          |
          +------> Cluster Probabilities
                         |
                         v
                    Confidence
```

------------------------------------------------------------------------

# 25. Saved File 5 --- `risk_mapping.pkl`

The supplied artifact contains:

``` python
{
    2: "Low Risk",
    1: "Moderate Risk",
    0: "High Risk"
}
```

### Purpose

K-Means returns numerical cluster IDs.

The frontend does not want to display:

``` text
Cluster 2
```

It wants:

``` text
Low Risk
```

Therefore:

``` python
cluster = kmeans.predict(...)
risk = risk_mapping[cluster]
```

This keeps the cluster-to-risk interpretation consistent between
training and deployment.

------------------------------------------------------------------------

# 26. Saved File 6 --- `cluster_features.pkl`

The supplied artifact contains the feature order:

``` python
[
    "age_years",
    "height",
    "weight",
    "BMI",
    "ap_hi",
    "ap_lo",
    "cholesterol",
    "gluc",
    "smoke",
    "alco",
    "active",
    "pulse_pressure",
    "bp_ratio"
]
```

### Why this file is important

Feature order must remain exactly the same during inference.

For example, if training expects:

``` text
age → height → weight → BMI → BP → ...
```

but the application sends:

``` text
BMI → age → BP → height → ...
```

the model receives the wrong values in the wrong positions.

Therefore:

``` text
cluster_features.pkl
```

acts as the model's feature-order reference.

------------------------------------------------------------------------

# 27. How All Six Files Work Together

The six files form a deployment pipeline.

``` text
                  New Patient
                       |
                       v
             Feature Engineering
                       |
                       v
             cluster_features.pkl
                       |
                       v
                  scaler.pkl
                       |
                       v
              Scaled Feature Vector
                       |
            +----------+----------+
            |                     |
            v                     v
      kmeans_model.pkl       gmm_model.pkl
            |                     |
            v                     v
     K-Means Cluster         GMM Cluster
            |                     |
            v                     v
      risk_mapping.pkl       GMM Probability
            |                     |
            +----------+----------+
                       |
                       v
                Final Dashboard
```

The CSV is the stored output for the existing patient population.

------------------------------------------------------------------------

# 28. K-Means vs GMM

The notebook evaluates both models using Silhouette Score.

The important conceptual difference is:

  K-Means                           GMM
  --------------------------------- -----------------------------------
  Hard cluster assignment           Probabilistic assignment
  Centroid-based                    Gaussian distribution-based
  Easy to explain                   Gives membership probabilities
  Good for dashboard segmentation   Useful for uncertainty/confidence

The project keeps K-Means as the main risk-tier model and uses GMM as a
second unsupervised method.

------------------------------------------------------------------------

# 29. PCA Visualization

The notebook also uses PCA for visualization.

PCA is not the main clustering algorithm.

Its role is to reduce the high-dimensional feature space to two
dimensions so that patient groups can be visualized.

``` text
13-dimensional / scaled feature space
             |
             v
            PCA
             |
             v
          PC1 + PC2
             |
             v
       2D visualization
```

This helps demonstrate whether the discovered patient groups have
visible structure or overlap.

------------------------------------------------------------------------

# 30. Population Risk Dashboard

The final CSV is suitable for the project's Population Risk Dashboard.

The dashboard can show:

### Patient-level information

-   Patient ID
-   Age
-   BMI
-   Blood pressure
-   Cholesterol
-   Glucose
-   Lifestyle indicators

### Unsupervised results

-   K-Means cluster
-   Risk tier
-   Clinical risk index
-   GMM cluster
-   GMM confidence

### Population-level charts

-   Low/Moderate/High Risk distribution
-   Average BMI by tier
-   Average blood pressure by tier
-   Cholesterol distribution
-   Glucose distribution
-   Disease prevalence by discovered tier
-   PCA cluster visualization

------------------------------------------------------------------------

# 31. Recommended Backend Inference Logic

For a new patient, the backend should follow this order:

``` text
1. Receive patient data
2. Calculate age_years
3. Calculate BMI
4. Calculate pulse_pressure
5. Calculate bp_ratio
6. Arrange features according to cluster_features.pkl
7. Load scaler.pkl
8. scaler.transform(features)
9. Load kmeans_model.pkl
10. Predict K-Means cluster
11. Load risk_mapping.pkl
12. Convert cluster to risk tier
13. Load gmm_model.pkl
14. Predict GMM cluster/probabilities
15. Return results to frontend
```

Pseudo-code:

``` python
features = [
    age_years,
    height,
    weight,
    BMI,
    ap_hi,
    ap_lo,
    cholesterol,
    gluc,
    smoke,
    alco,
    active,
    pulse_pressure,
    bp_ratio
]

X = np.array(features).reshape(1, -1)

X_scaled = scaler.transform(X)

cluster = kmeans_model.predict(X_scaled)[0]

risk = risk_mapping[cluster]

gmm_cluster = gmm_model.predict(X_scaled)[0]

gmm_probabilities = gmm_model.predict_proba(X_scaled)[0]

confidence = gmm_probabilities.max()
```

------------------------------------------------------------------------

# 32. Final Output Example

The application can conceptually return:

``` json
{
    "kmeans_cluster": 0,
    "risk_tier": "High Risk",
    "gmm_cluster": 0,
    "gmm_confidence": 0.99
}
```

The exact JSON format should be aligned with the existing backend
implementation.

------------------------------------------------------------------------

# 33. Validation Checks

The notebook includes final validation checks to verify:

-   Dataset is not empty.
-   Clustering features contain no missing values.
-   Three K-Means clusters exist.
-   All expected risk tiers exist.
-   `cardio` contains valid 0/1 values.
-   Scaled feature matrix contains finite values.

These checks are useful before exporting the models.

------------------------------------------------------------------------

# 34. Generated Files --- Final Explanation

The required files are:

``` text
1. cardiovascular_risk_clusters.csv
   → Final patient-level risk-tier dataset

2. scaler.pkl
   → StandardScaler used before clustering

3. kmeans_model.pkl
   → Trained K-Means model

4. gmm_model.pkl
   → Trained Gaussian Mixture Model

5. risk_mapping.pkl
   → Converts K-Means cluster IDs to Low/Moderate/High Risk

6. cluster_features.pkl
   → Stores the exact feature names/order expected by the models
```

Together, these files are enough to support the model-side part of the
project's unsupervised risk-tier pipeline.

------------------------------------------------------------------------

# 35. Main Findings From the Supplied ZIP

The actual supplied ZIP contains **68,601 patient records**.

The K-Means risk distribution is:

``` text
Low Risk       60.07%
Moderate Risk  10.47%
High Risk      29.46%
```

The High Risk group has noticeably higher average:

``` text
Age
BMI
Systolic BP
Diastolic BP
Glucose
```

The external `cardio` validation shows:

``` text
Low Risk       → 36.03% disease
Moderate Risk  → 44.47% disease
High Risk      → 78.65% disease
```

The strong increase in disease prevalence from Low to High Risk supports
the usefulness of the cluster interpretation.

------------------------------------------------------------------------

# 36. Important Technical Caveats

## 36.1 Dataset version mismatch

The notebook execution supplied in this conversation reports **4,484
cleaned records**, while the ZIP contains **68,601 final records**.

Do not present both numbers as if they came from one execution.

For a final project submission, the team should identify which
dataset/version was used to generate the ZIP and use that version
consistently.

## 36.2 Cluster labels are arbitrary

K-Means cluster 0 is not inherently High Risk.

The project creates the mapping separately using the clinical risk
index.

## 36.3 Risk tier is not diagnosis

"High Risk" means the patient belongs to the population cluster with the
highest project-specific risk profile.

It does not mean that the patient has cardiovascular disease.

## 36.4 GMM confidence is not medical probability

`gmm_confidence` is the model's cluster-membership confidence.

It is not the probability that a patient has cardiovascular disease.

------------------------------------------------------------------------

# 37. Final Conclusion

The unsupervised-learning component successfully creates a complete
patient-segmentation pipeline.

The project performs:

``` text
Data Cleaning
      ↓
Feature Engineering
      ↓
Feature Selection
      ↓
Standardization
      ↓
K Selection
      ↓
K-Means
      ↓
Cluster Profiling
      ↓
Clinical Risk Index
      ↓
Risk Tier Mapping
      ↓
External Validation
      ↓
GMM
      ↓
GMM Confidence
      ↓
PCA Visualization
      ↓
Dashboard Dataset
      ↓
Reusable Model Files
```

The most important deployment idea is that the model files are not
independent files. They work together:

``` text
cluster_features.pkl
        ↓
scaler.pkl
        ↓
kmeans_model.pkl
        ↓
risk_mapping.pkl
        ↓
Risk Tier
```

while:

``` text
scaler.pkl
    ↓
gmm_model.pkl
    ↓
GMM Cluster + Confidence
```

The final `cardiovascular_risk_clusters.csv` stores these outputs for
the existing patient population.

Overall, the unsupervised component provides **patient segmentation**,
while the supervised component of the larger cardiovascular project can
provide **disease prediction**. Combining both approaches gives the
system two complementary capabilities:

> **Supervised learning:** predict cardiovascular disease risk.

> **Unsupervised learning:** discover and characterize naturally
> occurring patient groups.
