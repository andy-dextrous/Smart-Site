---
description: Update a client site with latest Smart-Site admin code using the SmartSite CLI
allowed_tools:
  - Bash
  - Read
  - MultiEdit
---

# Update Client Site: $ARGUMENTS

Update the client site "$ARGUMENTS" with the latest Smart-Site admin code using the SmartSite CLI.

## Understanding the SmartSite CLI

The SmartSite CLI is a turborepo-only tool that:
- Downloads the latest Smart-Site from GitHub (private repository)
- Backs up the client's current `/src/admin` directory
- Replaces it with the latest admin code from Smart-Site
- Preserves all client customizations outside of `/src/admin`
- Provides rollback capability if something goes wrong

### What Gets Updated

**REPLACED COMPLETELY**:
- `/src/admin/` - Entire admin directory with latest Smart-Site code

**SYNCED AUTOMATICALLY**:
- Dependencies from `admin/package.json` sharedDependencies to main `package.json`
- New packages are added, existing versions are updated

**PRESERVED**:
- `smartsite.config.ts` - Client customizations
- `/src/components/` - Frontend components
- `/src/app/(frontend)/` - Frontend routes and styles
- `.env.local` - Environment variables
- All other client-specific files

## Prerequisites Check

Before updating, ensure:
1. You're in the monorepo root directory
2. GitHub authentication is configured (see Step 2)
3. You're on the correct client branch
4. All changes are committed (updates will modify files)

## Step 1: Check Current Status

First, check the current version and available updates:
```bash
pnpm smartsite status
```

This shows:
- Current Smart-Site version
- Latest available version
- Update recommendation

## Step 2: Verify GitHub Authentication

The SmartSite CLI uses OAuth device flow authentication for secure access to the private Smart-Site repository.

### Check Authentication Status

```bash
pnpm smartsite auth status
```

This shows:
- Current authentication status
- Authenticated user (if logged in)
- API rate limit information
- Access to Smart-Site repository

### Login with GitHub

If not authenticated, login using:
```bash
pnpm smartsite auth login
```

This will:
1. Display a verification code (e.g., `XXXX-XXXX`)
2. Open your browser to GitHub's device verification page
3. Enter the code when prompted
4. Authorize the SmartSite CLI application
5. Store the token securely in your system keychain

### Alternative: Environment Variable

For CI/CD or automated environments, use a GitHub personal access token:
```bash
# Check if token is set
echo $GITHUB_TOKEN  # or $GH_TOKEN

# If not set, create one at: https://github.com/settings/tokens
# Token needs 'repo' scope for private repository access

# Set temporarily (current session only):
export GITHUB_TOKEN="your-github-personal-access-token"

# Or set permanently in shell profile:
echo 'export GITHUB_TOKEN="your-token"' >> ~/.zshrc  # or ~/.bashrc
source ~/.zshrc
```

### Logout (if needed)

```bash
pnpm smartsite auth logout
```

This removes stored credentials from your system keychain.

## Step 3: Dry Run Preview

Always preview changes first with a dry run:
```bash
pnpm smartsite update $ARGUMENTS --dry-run
```

This shows:
- Files that will be changed
- Version you'll update to
- Backup location that will be created

Review the output carefully.

## Step 4: Understand Update Strategies

Choose your update strategy based on needs:

### Default: Latest Stable Release (Recommended for Production)
```bash
pnpm smartsite update $ARGUMENTS
```
- Updates to the latest tagged release
- Most stable and tested version
- Recommended for production sites

### Edge: Latest Master Branch (For Testing/Development)
```bash
pnpm smartsite update $ARGUMENTS --edge
```
- Updates to the latest commit on master
- Includes newest features not yet released
- May include untested changes
- Good for development/staging environments

### Specific Version (For Controlled Rollouts)
```bash
pnpm smartsite update $ARGUMENTS --version v1.2.0
```
- Updates to a specific version tag
- Useful for gradual rollouts
- Good when testing compatibility

## Step 5: Create Pre-Update Backup (Optional)

While the CLI creates automatic backups, you may want an additional git backup:
```bash
# Create a backup branch
git checkout -b backup/pre-update-$(date +%Y%m%d)
git add .
git commit -m "backup: pre Smart-Site update snapshot"
git checkout client/$ARGUMENTS
```

## Step 6: Execute the Update

Run the actual update:
```bash
pnpm smartsite update $ARGUMENTS
```

The CLI will:
1. Download the selected Smart-Site version from GitHub
2. Check framework compatibility (peer dependencies)
3. Remove current `/src/admin` directory
4. Copy new admin code from Smart-Site
5. Sync sharedDependencies from admin to main package.json
6. Optionally install dependencies (unless --no-install)
7. Display summary of changes

### Update Options

Additional flags you can use:
```bash
# Skip confirmation prompts (use with caution)
pnpm smartsite update $ARGUMENTS --force

# Skip automatic dependency installation
pnpm smartsite update $ARGUMENTS --no-install

# Manual transfer mode (admin already copied, just sync deps)
pnpm smartsite update $ARGUMENTS --manual-transfer

# Update all clients at once
pnpm smartsite update --all

# Combine options
pnpm smartsite update $ARGUMENTS --edge --force --no-install
```

## Step 7: Review Changes

After update completes, review what changed:
```bash
# See all modified files
git status

# Review detailed changes in admin directory
git diff apps/clients/$ARGUMENTS/src/admin/

# Check specific important files
git diff apps/clients/$ARGUMENTS/src/admin/payload/payload.config.ts
git diff apps/clients/$ARGUMENTS/src/admin/lib/
```

Pay special attention to:
- Payload configuration changes
- New collections or fields
- Breaking changes in data structures

## Step 8: Run Quality Checks

Ensure the update didn't break anything:
```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# If errors, try auto-fix
pnpm lint --fix
```

## Step 9: Test the Application

Start the development server and test thoroughly:
```bash
pnpm dev
```

### Critical Testing Areas

1. **Admin Panel** (http://localhost:3000/admin):
   - Login works
   - All collections load
   - Media uploads function
   - No console errors

2. **Frontend** (http://localhost:3000):
   - Pages render correctly
   - Sections display properly
   - Navigation works
   - Forms submit successfully

3. **Data Integrity**:
   - Existing content displays
   - Relationships intact
   - Media files accessible

## Step 10: Handle Migration Issues

If you encounter issues after updating:

### Type Errors
```bash
# Regenerate Payload types
cd apps/clients/$ARGUMENTS
rm -rf src/admin/payload/payload-types.ts
pnpm dev  # Types regenerate on startup
```

### Database Schema Changes
```bash
# If update includes schema changes
pnpm seed  # Re-seed if safe for development

# For production, you may need migrations
# Check release notes for migration instructions
```

### Dependency Issues
```bash
# Clean install dependencies
cd ../../..  # Back to monorepo root
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Step 11: Rollback if Needed

If the update causes critical issues:

### Git Rollback (Recommended)
```bash
# Revert all admin changes
git checkout -- apps/clients/$ARGUMENTS/src/admin/
git checkout -- apps/clients/$ARGUMENTS/package.json

# Or reset to previous commit
git reset --hard HEAD^
```

### Manual Recovery
```bash
# If you need to re-run the update
pnpm smartsite update $ARGUMENTS --force
```

Note: The CLI no longer maintains .smartsite-backup directories by default.

## Step 12: Commit the Update

Once verified, commit the changes:
```bash
# Review changes one more time
git status
git diff --stat

# Commit with descriptive message
git add apps/clients/$ARGUMENTS/src/admin/
git commit -m "chore: update Smart-Site admin to v$(cat apps/clients/$ARGUMENTS/src/admin/version.json | grep version | cut -d'"' -f4)

- Updated from v[old] to v[new]
- [Add any notable changes from release notes]
- All tests passing"

# Push to remote
git push origin client/$ARGUMENTS
```

## Step 13: Document the Update

Update client documentation if needed:
```bash
# Add to client README or CHANGELOG
echo "## $(date +%Y-%m-%d) - Smart-Site Update

- Updated to Smart-Site v$(cat apps/clients/$ARGUMENTS/src/admin/version.json | grep version | cut -d'"' -f4)
- [List any important changes]
- [Note any new features available]
" >> apps/clients/$ARGUMENTS/CHANGELOG.md
```

## Additional CLI Commands

### Validate Installation
Check if Smart-Site installation is valid:
```bash
pnpm smartsite validate
```

### Check Version Without Updating
```bash
pnpm smartsite status
```

### Rebuild CLI (if needed)
If CLI commands aren't working:
```bash
cd packages/cli
pnpm build
cd ../..
```

## Important Notes

### Update Frequency
- Check for updates weekly during active development
- Monthly for stable production sites
- Immediately for security updates

### Breaking Changes
- Always read release notes before updating
- Major version updates may require migration
- Test thoroughly in development before production

### Backup Best Practices
- Keep at least 3 recent backups
- Archive backups before major updates
- Test rollback procedure periodically

### Client Customizations
Remember that updates preserve:
- `smartsite.config.ts` configurations
- Custom components outside `/src/admin`
- Environment variables
- Public assets

But updates REPLACE:
- Everything in `/src/admin`
- Core Smart-Site functionality
- Admin panel features

## Summary Output

After successful update, provide:

```
✅ Smart-Site Update Complete

Client: $ARGUMENTS
Previous Version: v[old]
New Version: v[new]
Dependencies Synced: [number] added, [number] updated

Changes Applied:
- [Number] files updated
- [List major changes from diff]

Next Steps:
1. Test admin panel functionality
2. Verify frontend rendering
3. Check custom integrations
4. Deploy to staging for full testing

Rollback Command (if needed):
pnpm smartsite rollback
```

## Troubleshooting Common Issues

**"GitHub authentication required"**:
- Run `pnpm smartsite auth login`
- Or set `GITHUB_TOKEN` environment variable
- Token needs `repo` scope for private repository access

**"No updates available"**:
- You're already on the latest version
- Try `--edge` flag for unreleased updates

**"Backup directory already exists"**:
- Previous update may have failed
- Clean up old backups: `rm -rf .smartsite-backup/[old-timestamp]`

**"Permission denied" errors**:
- Ensure you have write access to the directory
- Try with sudo if necessary (not recommended)

**Types not matching after update**:
- Delete generated types: `rm src/admin/payload/payload-types.ts`
- Regenerate types: `pnpm dev`

**Dependency version conflicts**:
- The CLI will warn about peer dependency issues
- Update frameworks first if major version changes required
- Use `--force` to override compatibility checks (risky)

**Build fails after update**:
- Clear all caches: `rm -rf .next node_modules`
- Reinstall: `pnpm install`
- Rebuild: `pnpm build`