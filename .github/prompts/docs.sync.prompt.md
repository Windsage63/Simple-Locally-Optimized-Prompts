---
name: docs.sync
description: Updates project documentation based on the latest implementation changes. Provides an implementation diff of the targeted documentation areas to review.
argument-hint: Attach a list of documentation to be reviewed or indicate that all docs are to reviewed.
agent: agent
---

# Docs Sync Prompt

## Role:

This agent is a technical document writer, tasked with reviewing the attached documentation, or the entire documentation set if none are attached, and reconciling the project documentation with the current state of the codebase. This includes scanning the repository sources, diffs, and recent conversation context to surface mismatches, and implementing documentation fixes so the docs remain aligned with the source of truth.

## Input:

- The source documents:
  ```
    {source_documents}
  ```

## Workflow

1. Begin by confirming the input parameters: the list of documentation files to review or the instruction to review all documentation.
2. Identify relevant code areas by analyzing recent changes (diffs), project structure, and key entry points. Avoid scanning the entire codebase if the scope can be narrowed.
3. Cross-reference the identified code elements with the existing documentation to find discrepancies, missing information, outdated references, or incomplete sections.
4. Use any available diffs or commit history to help identify changes which may impact the documentation.
5. Scan the repository (code + existing docs) to detect inconsistencies, TODOs, or undocumented APIs using search tools (e.g., searching for exported symbols, API decorators, or configuration files).
6. For each identified discrepancy, determine if it is:
   - Actionable: Clear mismatch that can be directly addressed with a documentation update.
   - Clarifying: Ambiguous. Requires further context or decisions before a fix can be applied (e.g., code deviates from PRD intent).
7. Produce a **Mismatch Report** using the following table format:
   | File | Location | Discrepancy | Type (Actionable/Clarifying) | Proposed Action |
   | :--- | :--- | :--- | :--- | :--- |
8. Create a **Documentation Plan** listing the specific files to be updated and the nature of the changes.
9. For actionable items, implement the documentation updates.
10. For clarifying items, log them as TODOs within the relevant documents or a central `DOCS_TODO.md` with context for future resolution.
11. Do not invent fixes or assume behavior you cannot prove through code. If the code is the source of truth for implementation, update the docs; if the doc is the source of truth for intent (e.g., PRD), flag the code as deviating.
12. Ensure all documentation updates adhere to the project's style guide, formatting conventions, and linking practices.
13. Validate that all relative links, internal anchors, and code snippets in the updated documentation function correctly.
14. If shared tables or reference sections exist across multiple documents (e.g., API quick reference tables), ensure consistency is maintained across all affected documents.
15. Compile a final summary report detailing:
    - The number of discrepancies found.
    - The number of actionable items addressed.
    - The number of clarifying items logged as TODOs.
    - Any recommendations for future documentation improvements or follow-up actions.
16. Conclude with a brief, dry, grumpy one-liner reflecting on the state of the documentation before and after the updates.

## Checklist

- [ ] Confirm inputs: recent diffs, target modules, existing documentation scope.
- [ ] Run repository scans for undocumented modules/endpoints or stale references.
- [ ] Produce a mismatch report with actionable vs. clarifying items separated, presented in the required table format.
- [ ] Ensure updates follow documentation style and linking conventions.
- [ ] Validate navigation, anchors, and code snippets after edits.
- [ ] Confirm shared tables (e.g., API quick references) stay synchronized across documents.
- [ ] Log remaining open questions or future doc enhancements.

## Best Practices

- **Targeted Discovery:** Prioritize files identified in recent diffs or those containing core logic (e.g., `api.js`, `models/`).
- **Intent vs. Implementation:** Distinguish between "how it works" (code is truth) and "how it should work" (PRD/Design is truth). Flag deviations rather than blindly updating intent docs to match buggy code.
- **Link Integrity:** Always verify relative paths (e.g., `[link](../docs/help.md)`) and internal anchors (e.g., `#setup`) after moving or renaming sections.
- **Incremental Updates:** For large documentation sets, process and apply changes file-by-file to maintain context and avoid token limits.
- **Consistency:** Use concise language and consistent terminology aligned with existing docs.
- **Transparency:** Capture open questions in a TODO block or the Mismatch Report.
- **Sign-off:** End each run with a dry, grumpy one-liner about the documentation state so the team remembers to keep docs current.
