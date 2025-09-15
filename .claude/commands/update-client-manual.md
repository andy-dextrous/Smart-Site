---
description: Manually copy Smart-Site admin to a client for rapid development iterations
allowed_tools:
  - Bash
  - Read
  - MultiEdit
---

# Manual Update Client: $ARGUMENTS

Quickly copy the current Smart-Site admin folder to client "$ARGUMENTS" and sync dependencies. This is for rapid development when working on Smart-Site and testing changes on a client simultaneously.

## Purpose

This command is for **development workflow only** when you're:
- Actively developing Smart-Site features
- Testing fixes on a real client site
- Need instant feedback without GitHub releases
- Working on both Smart-Site and client in parallel

**Workflow**: Fix in Smart-Site → Manual copy to client → Test immediately

## Prerequisites

Before running:
1. Ensure you're in the monorepo root directory
2. Have uncommitted Smart-Site changes you want to test
3. The client site exists in `apps/clients/$ARGUMENTS`
4. The CLI is built (if not: `cd packages/cli && pnpm build && cd ../..`)

## Step 1: Verify Smart-Site Changes

First, check what Smart-Site changes you're about to copy:
```bash
# See uncommitted changes in Smart-Site admin
git status apps/smart-site/src/admin/

# Review specific changes
git diff apps/smart-site/src/admin/
```

## Step 2: Copy Admin Folder

Replace the client's admin folder with Smart-Site's current version:
```bash
# Remove existing admin and copy from Smart-Site
rm -rf apps/clients/$ARGUMENTS/src/admin
cp -r apps/smart-site/src/admin apps/clients/$ARGUMENTS/src/admin
```

This instantly applies your Smart-Site changes to the client.

## Step 3: Sync Dependencies

Run the SmartSite CLI with manual-transfer flag to sync dependencies:
```bash
# Sync sharedDependencies from admin to client's package.json
pnpm smartsite update $ARGUMENTS --manual-transfer --force --no-install
```

The `--manual-transfer` flag tells the CLI to:
- Skip downloading from GitHub
- Skip removing/copying the admin folder
- Use the admin folder already in place
- Check peer dependency compatibility
- Sync sharedDependencies to main package.json

## Step 4: Install Dependencies (if needed)

If new packages were added:
```bash
# Install the synced dependencies
cd apps/clients/$ARGUMENTS
pnpm install
cd ../../..
```

## Step 5: Test the Changes

Start the client dev server to test your changes:
```bash
# Run from monorepo root
pnpm dev --filter=$ARGUMENTS

# Or navigate to client directory
cd apps/clients/$ARGUMENTS
pnpm dev
```

Test areas:
- Admin panel functionality
- Frontend rendering
- New features you added
- Bug fixes you implemented

## Step 6: Iterate Quickly

For subsequent changes, repeat the cycle:

### Quick iteration loop:
```bash
# 1. Make changes in Smart-Site
# ... edit files in apps/smart-site/src/admin ...

# 2. Copy to client (one-liner)
rm -rf apps/clients/$ARGUMENTS/src/admin && cp -r apps/smart-site/src/admin apps/clients/$ARGUMENTS/src/admin

# 3. If dependencies changed, sync them
pnpm smartsite update $ARGUMENTS --manual-transfer --force --no-install

# 4. Test immediately
# Dev server hot-reloads most changes
```

## One-Line Commands

For maximum speed, use these one-liners:

### Full update (admin + dependencies):
```bash
rm -rf apps/clients/$ARGUMENTS/src/admin && cp -r apps/smart-site/src/admin apps/clients/$ARGUMENTS/src/admin && pnpm smartsite update $ARGUMENTS --manual-transfer --force --no-install
```

### Admin only (no dependency changes):
```bash
rm -rf apps/clients/$ARGUMENTS/src/admin && cp -r apps/smart-site/src/admin apps/clients/$ARGUMENTS/src/admin
```

### Check what will be synced:
```bash
diff -r apps/smart-site/src/admin apps/clients/$ARGUMENTS/src/admin --brief
```

## Step 7: Commit Smart-Site Changes

Once tested and working, commit the Smart-Site changes:
```bash
# In Smart-Site
cd apps/smart-site
git add src/admin/
git commit -m "fix: [description of fix tested on $ARGUMENTS]"
```

## Step 8: Decide on Client Update Strategy

After Smart-Site changes are committed:

### Option A: Keep Manual Changes (During Development)
```bash
# Client keeps the manually copied admin
# Good for continuing development
cd apps/clients/$ARGUMENTS
git add src/admin/
git commit -m "chore: manual Smart-Site admin update for testing"
```

### Option B: Revert and Use Official Update (For Production)
```bash
# Revert manual changes
cd apps/clients/$ARGUMENTS
git checkout -- src/admin/

# Later, use official update when Smart-Site is released
pnpm smartsite update $ARGUMENTS
```

## Common Scenarios

### Scenario 1: Testing a Bug Fix
```bash
# 1. Fix bug in Smart-Site
vi apps/smart-site/src/admin/lib/some-file.ts

# 2. Copy to client immediately
rm -rf apps/clients/$ARGUMENTS/src/admin && cp -r apps/smart-site/src/admin apps/clients/$ARGUMENTS/src/admin

# 3. Test the fix works
pnpm dev --filter=$ARGUMENTS
# Test in browser...

# 4. If it works, commit Smart-Site change
cd apps/smart-site && git add -A && git commit -m "fix: resolved issue with X"
```

### Scenario 2: Adding New Feature
```bash
# 1. Add feature to Smart-Site admin
# ... develop new feature ...

# 2. Copy and sync dependencies (new feature might need new packages)
rm -rf apps/clients/$ARGUMENTS/src/admin && cp -r apps/smart-site/src/admin apps/clients/$ARGUMENTS/src/admin
pnpm smartsite update $ARGUMENTS --manual-transfer --force

# 3. Install and test
cd apps/clients/$ARGUMENTS && pnpm install && pnpm dev
```

### Scenario 3: Comparing Behavior
```bash
# Test with old admin
cd apps/clients/$ARGUMENTS && pnpm dev
# Note the behavior...

# Copy new admin
rm -rf src/admin && cp -r ../../smart-site/src/admin src/admin

# Test with new admin (same server session)
# Compare the behavior difference
```

## Important Notes

### When to Use This Command
✅ Active Smart-Site development
✅ Testing fixes before committing
✅ Rapid iteration on features
✅ Debugging client-specific issues
✅ Testing dependency changes before release

### When NOT to Use This Command
❌ Production deployments
❌ Official client updates
❌ After Smart-Site releases (use regular `update-client` command)
❌ When changes are already committed and released

### Development Best Practices
1. Always fix bugs in Smart-Site first, then copy to client
2. Don't fix directly in client's admin folder (will be lost on updates)
3. Test on one client before updating all clients
4. Commit Smart-Site changes once verified working
5. Use proper update flow for production: commit → release → official update

### Dependency Management
- Admin package.json is now a pure manifest (empty `dependencies`, all in `sharedDependencies`)
- CLI syncs sharedDependencies to client's main package.json automatically
- Version control: Admin declares required versions, CLI updates them
- New packages are added, existing versions are updated as needed

## Troubleshooting

**"Module not found" errors after copy**:
```bash
# Dependencies probably need syncing
pnpm smartsite update $ARGUMENTS --manual-transfer --force --no-install
cd apps/clients/$ARGUMENTS && pnpm install && cd ../../..
```

**Hot reload not picking up changes**:
```bash
# Restart the dev server
# Ctrl+C to stop, then:
pnpm dev --filter=$ARGUMENTS
```

**Type errors after copying**:
```bash
# Regenerate types
cd apps/clients/$ARGUMENTS
rm src/admin/payload/payload-types.ts
pnpm dev  # Types regenerate on startup
```

**Want to see what changed**:
```bash
# Detailed diff
diff -r apps/smart-site/src/admin apps/clients/$ARGUMENTS/src/admin

# Just list changed files
diff -r apps/smart-site/src/admin apps/clients/$ARGUMENTS/src/admin --brief
```

## Summary Output

After successful manual update:
```
✅ Manual Smart-Site Update Complete

Client: $ARGUMENTS
Source: apps/smart-site/src/admin (working copy)
Method: Direct file copy (development mode)

Changes Applied:
- Admin folder replaced with Smart-Site working copy
- Dependencies synced: X added, Y updated (if any)

Next Steps:
1. Test your changes in the client
2. Iterate as needed
3. Commit Smart-Site changes once verified
4. Decide on client update strategy (keep manual or revert for official)

Quick Re-run:
rm -rf apps/clients/$ARGUMENTS/src/admin && cp -r apps/smart-site/src/admin apps/clients/$ARGUMENTS/src/admin
```

## Quick Reference Card

```bash
# Copy admin only (most common)
rm -rf apps/clients/$ARGUMENTS/src/admin && cp -r apps/smart-site/src/admin apps/clients/$ARGUMENTS/src/admin

# Copy admin + sync dependencies
rm -rf apps/clients/$ARGUMENTS/src/admin && cp -r apps/smart-site/src/admin apps/clients/$ARGUMENTS/src/admin && pnpm smartsite update $ARGUMENTS --manual-transfer --force --no-install

# Check differences
diff -rq apps/smart-site/src/admin apps/clients/$ARGUMENTS/src/admin

# Test immediately
pnpm dev --filter=$ARGUMENTS

# Revert if needed
cd apps/clients/$ARGUMENTS && git checkout -- src/admin/
```

Remember: This is for DEVELOPMENT ONLY. Production updates should always use the official `pnpm smartsite update` command with published releases.