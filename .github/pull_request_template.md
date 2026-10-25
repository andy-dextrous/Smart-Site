
> Docs-check retirement (2026-10-18): automatic documentation-harness checks and their Python scripts have been removed at the owner’s request. Older commands or results below are historical, not required steps. Review the affected documentation and links directly; keep normal application tests and build checks. Do not restore docs-check CI.

## Summary

- Describe the slice in 1-3 sentences.

## Harness Check

- [ ] This change updates the relevant active ExecPlan, or I am explicitly treating this as trivial work that does not require one.
- [ ] `docs/exec-plans/active/index.md` is current for this slice.
- [ ] The canonical durable docs for this slice were updated, or I explicitly verified they are unchanged.
- [ ] I updated `docs/workflows/` if this change introduced or changed an official repeated procedure.
- [ ] I ran the relevant verification commands and recorded the result below.

## Verification

- `python3 scripts/check_docs_harness.py`
- Add the project-specific verification commands you ran if the change affected material app or runtime behavior.

## Notes

- Include any deliberate follow-ups, accepted limitations, or checks you did not run.
