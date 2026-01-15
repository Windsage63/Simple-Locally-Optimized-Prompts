# Report Engine Database Schema

This schema is designed to track both the physical structure of the report for template generation and the technical history for equipment tracking.

## 1. Core Reports Table

General metadata about the inspection event.

```sql
CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    customer TEXT,
    plant TEXT,
    equipment_unit TEXT, -- e.g., 'Recovery Boiler #1'
    inspection_date_range TEXT,
    inspector_name TEXT,
    reviewer_name TEXT,
    report_identifier TEXT, -- TRK Report #
    extraction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 2. Technical Findings Table

Individual issues, findings, and maintenance items.

```sql
CREATE TABLE IF NOT EXISTS findings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER,
    category TEXT, -- 'Rapper', 'TR Unit', 'Electrode', 'Wet Bottom', 'General'
    item_id TEXT, -- e.g., 'Item #1'
    description TEXT,
    resolution TEXT, -- Action taken or instruction provided
    is_recommendation BOOLEAN, -- 1 if it's a future recommendation, 0 if it's a finding
    priority TEXT, -- 'High', 'Medium', 'Low' (Inferred)
    FOREIGN KEY (report_id) REFERENCES reports(id)
);
```

## 3. Vision Dataset Table

Mappings for image-to-caption training data.

```sql
CREATE TABLE IF NOT EXISTS vision_dataset (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER,
    image_file_path TEXT,
    raw_caption TEXT,
    refined_caption TEXT, -- Human-edited or model-cleaned version
    label TEXT, -- 'Corrosion', 'Bowing', 'Broken Part', 'Alignment'
    equipment_component TEXT, -- 'Insulator', 'Plate', 'Shaft'
    FOREIGN KEY (report_id) REFERENCES reports(id)
);
```

## 4. Document Structure Table

Styling and formatting data for template generation.

```sql
CREATE TABLE IF NOT EXISTS document_structure (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER,
    paragraph_index INTEGER,
    style_name TEXT,
    font_name TEXT,
    font_size REAL,
    is_bold BOOLEAN,
    is_italic BOOLEAN,
    text_content TEXT,
    section_name TEXT,
    FOREIGN KEY (report_id) REFERENCES reports(id)
);
```
