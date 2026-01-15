---
name: report-engine
description: "Processes ESP inspection reports to extract history, vision training data, and styling. Triggers on: process report, index inspection, extract images from docx, equipment history."
---

# Report Engine

The Report Engine skill is designed to transform unstructured `.docx` inspection reports into a structured technical database and a high-fidelity vision training dataset.

## The Job

1. **Analyze Structure:** Identify the report format version (era) and layout.
2. **Extract Data:** Pull metadata, technical findings, and recommendations.
3. **Database:** Index everything into the ESP History SQLite database.
4. **Vision Pipeline:** Extract images and associate them with expert captions for model training.

---

## 1. Database Schema

All processing must adhere to the schema defined in [`references/report_schema.md`](references/report_schema.md). This ensures cross-report compatibility for longitudinal equipment tracking.

## 2. Extraction Workflow

Follow the logic patterns defined in [`references/extraction_rules.md`](references/extraction_rules.md).

### Step 1: Initial Scan

- Run a structural analysis to identify Font/Size/Style combinations.
- Save these to the `document_structure` table to preserve formatting history.

### Step 2: Content Parsing

- **Findings:** Categorize every "Item #" into the `findings` table.
- **Resolutions:** Use the resolution-splitting logic to identify what work was completed vs. what was only observed.
- **Equipment History:** Ensure the `equipment_unit` (e.g., RB1) is correctly tagged to allow historical trend analysis.

### Step 3: Vision Extraction

- Extract images from the binary.
- Pair images with captions using proximity logic.
- Output a `.jsonl` file formatted for vision-language model training.

---

## Stopping Rules & Constraints

- **DO NOT** overwrite existing records without checking the `report_identifier`.
- **DO NOT** lose font information; it is vital for future report generation.
- **DO NOT** ignore "Deferred" or "Future" items; these must be flagged as `is_recommendation = 1`.
- **MAX IMAGE SIZE:** Avoid resizing images during extraction; keep raw quality for training.

---

## Checklist for New Report Entry

- [ ] Report metadata (Mill, Unit, Date) correctly parsed.
- [ ] All "Item #" findings extracted as individual records.
- [ ] Images extracted to a unique subfolder.
- [ ] Captions correctly associated with corresponding images.
- [ ] SQL database updated and verified.
- [ ] JSONL training file appended with new data.
