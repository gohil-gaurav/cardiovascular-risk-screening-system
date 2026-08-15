# Student D — LLM Integration & Full-Stack Deployment
## NovusAI Cardiovascular Risk Screening — Project Report

---

## 1. My role in this project

While Student A, B, and C each built and trained one model (XGBoost classification, KMeans clustering, PyTorch MLP + SHAP), my job was not to build a fourth model — it was to **integrate all three into one coherent, non-technical result** that a doctor or patient can actually understand, and to **deploy the full stack**.

Concretely, my work covers:
1. Combining A, B, and C's model outputs into one consistent result
2. Prompt-engineering a local LLM to translate that result into plain language
3. Building the production backend service and API endpoint that ties everything together
4. Organizing the backend architecture into clean, modular files (`supervised.py`, `deep_learning.py`, `clustering.py`, `main.py`)
5. Integrating the new 5-file clustering package (K-Means & GMM soft clustering) alongside existing classifiers
6. Fixing frontend data binding inconsistencies so that all pages read from the unified `risk_tier` and correctly display similarity cohorts

---

## 2. The full data flow

```
Patient fills form (React)
        │
        ▼
POST /api/screen  (FastAPI — my orchestrator endpoint)
        │
        ▼
Calls the modular prediction functions in the backend
        │
        ├── XGBoost Classifier (supervised.py) → risk_score (%), prediction (Disease/No Disease)
        ├── PyTorch MLP (deep_learning.py)     → mlp_risk_score (%)
        ├── SHAP TreeExplainer (supervised.py) → shap_values → primary_drivers (ranked factors)
        └── KMeans & GMM (clustering.py)        → clustering.risk_tier & clustering_confidence (%)
        │
        ▼
My code: build_combined_from_predict_response()
  - averages XGBoost % + MLP % → one final_risk_pct
  - derives risk_tier FROM final_risk_pct (not from KMeans directly)
  - keeps KMeans' tier separately as population_comparison_tier
  - maps GMM soft-clustering confidence percentages to standard tiers
  - takes top 3 SHAP factors and simplifies them
        │
        ▼
My code: get_llm_explanation()
  - sends the combined result to a local LLM (Ollama, llama3.2:3b)
  - LLM returns plain-language patient_summary, key_factors, suggested_next_step
  - validates JSON, retries on failure, falls back to a safe template if needed
        │
        ▼
Final ScreeningReport JSON → returned to frontend
        │
        ▼
Frontend renders TWO views from the SAME data:
  - Patient view: risk_tier, patient_summary, key_factors, suggested_next_step
  - Doctor view: + population_comparison_tier, clustering_confidence, raw top_factors, model_info
```

---

## 3. What's in `llm_integration.ipynb`

This notebook is my equivalent of A/B/C's experiment notebooks — it documents the *process* of designing and testing the LLM integration, separate from the clean production code.

| Section | What it does |
|---|---|
| Setup | Connects to a local Ollama model (`llama3.2:3b`) — no API key, free, runs offline |
| Mock A/B/C outputs | Lets me test the pipeline before real models were ready |
| `combine_model_outputs()` | Early version of the combine logic (later replaced by the real adapter once A/B/C's `/predict` was finished) |
| System prompt design | The core prompt-engineering deliverable — see Section 5 below |
| `get_llm_explanation()` | Calls the LLM, validates JSON, retries, falls back safely |
| OpenAI comparison (optional) | Same prompt tested against a hosted model (`gpt-4o-mini`) to compare consistency vs. the free local model |
| Multi-scenario testing | Low / Moderate / High risk patients tested through the full pipeline |
| Regression test (real payloads) | Same 3 scenarios sent to the *live* `/api/screen` endpoint once the backend was built, to catch integration bugs |
| Review checklist + iteration notes | Manual QA criteria and a log of prompt versions/changes |

**Why this matters for the mentor review:** it shows iterative development — mock data → prompt v1 → testing → prompt refinement → real integration testing — the same discipline A/B/C applied to model tuning, applied here to prompt design instead.

---

## 4. What's in the production files

To ensure clean separation of concerns and maintainability, I refactored the backend into the following modular files:

### `supervised.py`
- **Role**: Handles binary classification and SHAP explainability calculations.
- **Key Functions**:
  - `load_supervised_model(models_dir)`: Loads the XGBoost binary (`best_model.pkl`) and starts `shap.TreeExplainer`.
  - `predict_supervised(df, input_dict, height_m, bmi)`: Runs XGBoost and extracts SHAP log-odds and primary factors.

### `deep_learning.py`
- **Role**: Manages the PyTorch deep learning neural network.
- **Key Functions**:
  - `load_deep_learning_model(models_dir)`: Loads MLP model weights (`mlp_best.pt`) and standard scaler (`scaler.pkl`).
  - `predict_deep_learning(df)`: Normalizes features and runs inference through the `CVDRiskMLP` network.

### `clustering.py`
- **Role**: Segments patients using the new 5-file clustering package.
- **Key Functions**:
  - `load_clustering_models(models_dir)`: Loads `cluster_features.pkl`, `kmean_scaler.pkl`, `kmeans_model.pkl`, `gmm_model.pkl`, and `risk_mapping.pkl` defensively.
  - `predict_clustering(input_dict, df_scaled)`: Computes derived features, standardizes using the cluster-specific scaler, runs K-Means cluster grouping, and returns GMM probabilities under `clustering_confidence`.

### `llm_service.py`
- **Role**: The text explanation engine.
- **Key Functions**:
  - `_risk_tier_from_pct(risk_pct)`: Derives risk tiers using standardized thresholds (≥75% High, ≥45% Moderate, else Low).
  - `build_combined_from_predict_response(predict_response, patient)`: Adapts predict metrics for system prompts.
  - `get_llm_explanation(combined)`: Commands Ollama's `llama3.2:3b` text parser with retry/fallback routines.

### `main.py`
- **Role**: FastAPI core script. Orchestrates startup model loads and handles routing calls to `supervised`, `deep_learning`, and `clustering`.

---

## 5. How I combine A, B, and C's outputs

The key challenge: **A and C each produce their own risk percentage**, and they don't always agree (e.g. 80.16% vs 84.01%). Showing both to a doctor as separate numbers would be confusing, so:

- **`final_risk_pct`** = average of XGBoost's and MLP's risk percentages — one number, one source of truth
- **`risk_tier`** = derived from that averaged number using fixed thresholds — never taken directly from KMeans
- **`population_comparison_tier`** = KMeans' independent cluster label, kept as a *separate* field for the doctor's technical view, clearly explained as "how this patient compares to broader population groups" rather than shown as a competing verdict

This fixed a real bug I caught during testing: a patient scoring 82% was initially shown as "Moderate Risk" because the tier was pulled straight from KMeans instead of the averaged score.

---

## 6. How the deep learning (SHAP) output becomes something readable

Student C's SHAP TreeExplainer produces raw numeric contributions per feature (e.g. `ap_hi: +1.18`, `cholesterol: +0.60`) — meaningful to a data scientist, meaningless to a patient. My pipeline turns this into something usable in two stages:

**Stage 1 — already done by C/A's backend code (`supervised.py`):**
Raw SHAP values are converted into `primary_drivers` — human-readable phrases with a contribution weight and an `importance_pct` (0–100 scale), e.g.:
```json
{"factor": "High Systolic Blood Pressure (140 mmHg)", "contribution": "+1.18", "importance_pct": 100}
```

**Stage 2 — my adapter (`build_combined_from_predict_response`):**
- Takes the top 3 `primary_drivers`
- Classifies each as `high` / `moderate` / `low` impact based on `importance_pct` (≥50 = high, ≥20 = moderate, else low)
- Passes these into the LLM prompt as plain factor descriptions — not raw SHAP numbers

**Stage 3 — the LLM:**
Turns "High Systolic Blood Pressure (140 mmHg), high impact" into a sentence like *"Your blood pressure is a bit higher than it should be"* — no jargon, no numbers dumped on the patient, but the underlying SHAP ranking still drives what gets mentioned first.

The doctor's technical view still shows the raw `top_factors` with their weights, so nothing is hidden — it's layered, not replaced.

---

## 7. The LLM part in detail (prompt engineering, not training)

I did **not train a model** — I prompt-engineered an existing one (Llama 3.2 3B, running locally and free via Ollama; also tested against OpenAI's `gpt-4o-mini` for comparison). The deliverable is the prompt design and the surrounding validation logic, not model weights.

**System prompt rules enforced:**
- No technical terms (no "model," "SHAP," "cluster," "algorithm," "probability")
- No diagnosis — screening only
- Only explain data given — never invent numbers
- Under 100 words, calm and supportive tone
- Strict JSON output: `patient_summary`, `key_factors`, `suggested_next_step`

**Safety/reliability layer I built around the prompt:**
- JSON validation after every call
- Automatic retry (up to 2 attempts) if the model returns malformed output
- Hardcoded fallback response if both attempts fail, so the app never shows a broken result to a doctor or patient
- Logged which responses used the fallback (`fallback_used` field) so this can be tracked/reported on

**Testing performed:**
- 3 full risk scenarios (Low/Moderate/High) run through the real live pipeline via the regression test cell
- Verified `risk_tier` always agreed with `final_risk_pct` in every test
- Verified tone stayed calm and non-alarming even in the High Risk case
- Compared local (free) vs. OpenAI output quality as documented evidence for the report

---

## 8. Current status

All project deliverables have been successfully finalized and integrated:

| Piece | Status |
|---|---|
| Prompt design + local testing (notebook) | ✅ Done |
| `llm_service.py` (production) | ✅ Done |
| `schemas.py` | ✅ Done |
| `screen.py` orchestrator endpoint | ✅ Done |
| Risk tier consistency bug | ✅ Fixed (backend + frontend unified) |
| Regression testing (Low/Moderate/High, live endpoint) | ✅ Done |
| Frontend wiring to `/api/screen` | ✅ Done |
| Frontend risk-label consistency bug (3 conflicting labels resolved) | ✅ Done (bound to `risk_tier`) |
| 5-File Clustering Package Integration | ✅ Done |
| GMM soft-clustering probability support | ✅ Done |
| Modular backend service architecture refactoring | ✅ Done |

---

## 9. Open item to resolve before deployment

Ollama runs locally on `localhost:11434`. Once deployed to Render, the backend server won't have access to my laptop's Ollama instance. Before deployment, I need to decide between:
- Running Ollama on the same Render server/container as the backend
- Falling back to a hosted API (OpenAI) for the deployed version only, keeping Ollama for local dev/testing