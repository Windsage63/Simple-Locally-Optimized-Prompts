---
name: docs.sync
description: Updates project documentation based on the latest implementation changes. Provides an implementation diff of the targeted documentation areas to review.
argument-hint: Attach a list of documentation to be reviewed or indicate that all docs are to reviewed.
agent: agent
---
# Docs Sync Prompt

## Role:

Review the attached documentation, or the entire documentation set if none are attached, and reconcile the project documentation with the current state of the codebase. This scan the repository sources, diffs, and recent conversation context to surface mismatches, and implements documentation fixes so docs remain aligned with the source of truth.

## Input:

- The source documents:
  ```
    {source_documents}
  ```

## Workflow

1. Review codebase to understand the scope.
2. Use any provided diffs or commit history to help identify changes which may impact the documentation, but also perform a full, independent scan of the entire codebase and documentation set to ensure comprehensive coverage.
3. Scan the repository (code + existing docs) to detect inconsistencies, TODOs, or undocumented APIs using `search`, `search/codebase`, `changes`, and `usages`.
4. Compile a tabular mismatch report with columns for `Doc File`, `Source of Truth` (specific code path or implementation plan), `Discrepancy`, and `Proposed Action`. Highlight severity and keep references copy-pasteable.

5. Log any ambiguous items, but proceed with the assumption that the code is authoritative. 
6. If a discrepancy cannot be resolved due to ambiguity, lack of context, or tool limitations, log it as a high-priority TODO in the summary and continue processing other items. 
7. Do not invent fixes or assume behavior you cannot prove through code, but proceed to update the documentation with the known information.
8. Draft documentation updates for each actionable item, previewing diffs in small batches and confirming formatting conventions.
9. Apply the updates via `edit/editFiles` (docs only), ensure shared tables remain consistent across all affected docs, and record any unresolved questions as TODOs in the documentation or summary.
10. Deliver a final summary covering addressed items, outstanding questions, and recommended follow-up checkpoints.
11. Close with a single-line synopsis of starting vs. ending doc coverage in the voice of a grumpy senior developer. Make this the final line and separate it from the preceding summary with a blank line.

## Checklist

- [ ] Confirm inputs: recent diffs, target modules, existing documentation scope.
- [ ] Run repository scans for undocumented modules/endpoints or stale references.
- [ ] Produce a mismatch report with actionable vs. clarifying items separated, presented in the required table format.
- [ ] Ensure updates follow documentation style and linking conventions.
- [ ] Validate navigation, anchors, and code snippets after edits.
- [ ] Confirm shared tables (e.g., API quick references) stay synchronized across documents.
- [ ] Log remaining open questions or future doc enhancements.

## Best Practices

- Prioritize clarity and accuracy; avoid introducing new ambiguities.
- Use concise language and consistent terminology aligned with existing docs.
- Maintain tone and style consistent with existing docs.
- Capture open questions in a TODO block.
- Sign off each run with a dry, grumpy one-liner about the documentation state so the team remembers to keep docs current.
