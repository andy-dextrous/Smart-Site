---
description: Create a Git commit with proper message based on changes
allowed_tools:
  - Bash
---

# Create Git Commit

Analyze changes and create a commit with an appropriate message.

## Step 1: Check Git Status

Get current repository status:
```bash
git status --short
```

## Step 2: Analyze Changes

Review what has been modified:
```bash
# Show detailed diff of staged and unstaged changes
git diff HEAD

# Show just file statistics
git diff HEAD --stat
```

## Step 3: Review Recent Commits

Check recent commit messages for style consistency:
```bash
git log --oneline -10
```

## Step 4: Stage Changes

Add all changes to staging:
```bash
git add -A
```

Or selectively stage if needed:
```bash
git add [specific files]
```

## Step 5: Generate Commit Message

Based on the changes, create a commit message following conventional commits format:

**Format**: `type(scope): description`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc)
- `refactor`: Code refactoring without changing functionality
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system or dependency changes
- `ci`: CI/CD configuration changes
- `chore`: Maintenance tasks
- `revert`: Reverting a previous commit

**Message Guidelines**:
- First line: 50 characters or less
- Use imperative mood ("add" not "added")
- Focus on what and why, not how
- Reference issues if applicable

## Step 6: Create Commit

Execute the commit:
```bash
git commit -m "type(scope): clear description of changes

- Additional detail if needed
- Another change detail
- Fixes #123 (if applicable)"
```

## Step 7: Verify Commit

Confirm the commit was created:
```bash
git log -1 --stat
```

## Summary

Show what was committed:
- Files changed
- Insertions/deletions
- Commit hash
- Commit message