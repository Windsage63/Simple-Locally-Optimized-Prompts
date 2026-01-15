# Extraction & Processing Logic

## 1. Metadata Heuristics

- **Customer:** Default to "International Paper" unless "Riverdale Mill" is replaced by another site name.
- **Unit:** Look for "Recovery Boiler #1", "RB1", "RB2", etc., in the first 100 lines.
- **Report #:** Scan for pattern `TRK Report # [A-Z0-9]+`.

## 2. Findings Extraction

- **Finding Pattern:** Lines beginning with `Item #\d+` or `(Header/Bold) [List Paragraph]`.
- **Resolution Split:** If an "Item" paragraph contains keywords like "repaired", "replaced", "instructions were provided", "welded", or "cleaned", the sentence containing these keywords is categorized as the `resolution`.
- **Recommendations:** Any text under a header matching `*Recommendation*` that is not already tagged as a finding.

## 3. Vision Extraction

- **Proximity Search:** When an image is found, search +/- 1 paragraph index for text containing "Figure" or "Table".
- **Image Naming:** `[REPORT_ID]_[IMG_INDEX].[EXT]`
- **Auto-Labeling Keywords:**
  - `rapper` -> Category: Rapper
  - `plate`, `bowed` -> Category: Collecting Plate
  - `insulator`, `boot` -> Category: Insulator
  - `wet bottom`, `agitator` -> Category: Wet Bottom
  - `tr`, `transformer` -> Category: TR Unit

## 4. Vision Training Output Format

Standard JSONL format for VLMs (Vision Language Models):

```json
{"image": "abspath/to/img.jpg", "text": "Figure Description", "metadata": {"unit": "RB1", "component": "Rapper"}}
```
