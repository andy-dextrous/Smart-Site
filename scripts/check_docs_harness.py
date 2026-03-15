#!/usr/bin/env python3

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse


REPO_ROOT = Path(__file__).resolve().parent.parent
ACTIVE_INDEX = REPO_ROOT / "docs/exec-plans/active/index.md"
ACTIVE_DIR = REPO_ROOT / "docs/exec-plans/active"
COMPLETED_DIR = REPO_ROOT / "docs/exec-plans/completed"

HEADING_RE = re.compile(r"^##\s+")
ACTIVE_PLAN_LINK_RE = re.compile(r"`(docs/exec-plans/active/[^`\s]+\.md)`")
MARKDOWN_LINK_RE = re.compile(r"(!)?\[[^\]]*\]\(([^)]+)\)")
UNCHECKED_ITEM_RE = re.compile(r"^\s*[-*]\s+\[\s\]\s+")
SKIP_DIRS = {
    ".git",
    ".next",
    "node_modules",
    "tmp",
}


def main() -> int:
    errors: list[str] = []

    errors.extend(check_active_plan_index())
    errors.extend(check_completed_plan_closeout())
    errors.extend(check_local_markdown_links())

    if errors:
        print("Docs harness check failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Docs harness check passed.")
    return 0


def check_active_plan_index() -> list[str]:
    if not ACTIVE_INDEX.exists():
        return [f"Missing active-plan index: {ACTIVE_INDEX.relative_to(REPO_ROOT)}"]

    active_plan_files = {
        path.relative_to(REPO_ROOT).as_posix()
        for path in ACTIVE_DIR.glob("*.md")
        if path.name != "index.md"
    }

    index_text = ACTIVE_INDEX.read_text(encoding="utf-8")
    indexed_plan_files = set(ACTIVE_PLAN_LINK_RE.findall(index_text))

    errors = []

    missing_from_index = sorted(active_plan_files - indexed_plan_files)
    stale_in_index = sorted(indexed_plan_files - active_plan_files)

    for path in missing_from_index:
        errors.append(
            f"Active ExecPlan is present on disk but missing from docs/exec-plans/active/index.md: {path}"
        )

    for path in stale_in_index:
        errors.append(
            f"docs/exec-plans/active/index.md references an active ExecPlan that does not exist: {path}"
        )

    return errors


def check_completed_plan_closeout() -> list[str]:
    errors: list[str] = []

    for path in sorted(COMPLETED_DIR.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        progress_section = extract_section(text, "## Progress")

        if progress_section is None:
            errors.append(
                f"Completed ExecPlan is missing a ## Progress section: {path.relative_to(REPO_ROOT).as_posix()}"
            )
            continue

        for line in progress_section.splitlines():
            if UNCHECKED_ITEM_RE.match(line):
                errors.append(
                    f"Completed ExecPlan still has unchecked Progress items: {path.relative_to(REPO_ROOT).as_posix()}"
                )
                break

    return errors


def check_local_markdown_links() -> list[str]:
    errors: list[str] = []

    for path in iter_markdown_files(REPO_ROOT):
        relative_path = path.relative_to(REPO_ROOT).as_posix()
        text = strip_fenced_code_blocks(path.read_text(encoding="utf-8"))

        for _, raw_target in MARKDOWN_LINK_RE.findall(text):
            target = raw_target.strip()

            if should_skip_link_target(target):
                continue

            path_part = target.split("#", 1)[0].strip()
            path_part = unquote(path_part)

            if not path_part:
                continue

            resolved = resolve_repo_local_target(path, path_part)
            if resolved is None:
                errors.append(f"Broken local Markdown link in {relative_path}: {target}")

    return errors


def iter_markdown_files(root: Path):
    for path in root.rglob("*.md"):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        yield path


def extract_section(text: str, heading: str) -> str | None:
    lines = text.splitlines()
    in_section = False
    collected: list[str] = []

    for line in lines:
        if line.strip() == heading:
            in_section = True
            continue

        if in_section and HEADING_RE.match(line):
            break

        if in_section:
            collected.append(line)

    if not in_section:
        return None

    return "\n".join(collected)


def strip_fenced_code_blocks(text: str) -> str:
    lines = text.splitlines()
    result: list[str] = []
    in_fence = False

    for line in lines:
        if line.strip().startswith("```"):
            in_fence = not in_fence
            continue

        if not in_fence:
            result.append(line)

    return "\n".join(result)


def should_skip_link_target(target: str) -> bool:
    if target.startswith("#"):
        return True

    parsed = urlparse(target)
    if parsed.scheme in {"http", "https", "mailto", "tel"}:
        return True

    return False


def resolve_repo_local_target(source_path: Path, target: str) -> Path | None:
    if target.startswith("/"):
        candidate = REPO_ROOT / target.lstrip("/")
    else:
        candidate = (source_path.parent / target).resolve()

    try:
        candidate.relative_to(REPO_ROOT)
    except ValueError:
        return None

    if candidate.exists():
        return candidate

    if candidate.suffix:
        return None

    markdown_candidate = candidate.with_suffix(".md")
    if markdown_candidate.exists():
        return markdown_candidate

    index_candidate = candidate / "index.md"
    if index_candidate.exists():
        return index_candidate

    return None


if __name__ == "__main__":
    sys.exit(main())
