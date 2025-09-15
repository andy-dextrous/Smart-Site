---
description: Create a new release for Smart-Site distribution
allowed_tools:
  - Bash
  - Read
  - MultiEdit
  - Write
---

# Create Release

Create a new release of Smart-Site for distribution to client sites via the SmartSite CLI.

## Understanding the Release Process

Creating a release makes Smart-Site updates available to all client sites. The release process:
- Tags a specific commit as a stable version
- Updates version tracking files
- Documents changes in CHANGELOG
- Triggers GitHub workflow to publish to external repository
- Makes the release available via SmartSite CLI

## When to Create a New Release

Create a new release when:
- **Major new features** are added to the Smart-Site admin layer
- **Bug fixes or improvements** are made to core functionality
- **Breaking changes** require client updates
- **Security updates** need to be distributed
- **Performance improvements** are significant
- **New sections or blocks** are added to the library

## Step 1: Analyze Recent Changes

First, understand what has changed since the last release:

### Get Last Release Tag
```bash
# Find the most recent release tag
LAST_TAG=$(git tag -l "v*" | sort -V | tail -1)

# If no releases exist yet, use initial commit
if [ -z "$LAST_TAG" ]; then
  LAST_TAG=$(git rev-list --max-parents=0 HEAD)
  echo "No previous releases found. Using initial commit."
else
  echo "Last release: $LAST_TAG"
fi
```

### Review All Changes
```bash
# Show commit history since last release
git log $LAST_TAG..HEAD --oneline

# Count commits since last release
COMMIT_COUNT=$(git rev-list --count $LAST_TAG..HEAD)
echo "Found $COMMIT_COUNT commits since $LAST_TAG"
```

### Review Smart-Site Admin Changes
```bash
# Show detailed changes in Smart-Site admin directory
git diff $LAST_TAG..HEAD -- apps/smart-site/src/admin/

# Show changed files summary
git diff --stat $LAST_TAG..HEAD -- apps/smart-site/src/admin/
```

### Categorize Changes
Review commits and categorize them:
- **Features**: New functionality added
- **Improvements**: Enhancements to existing features
- **Fixes**: Bug fixes and corrections
- **Breaking**: Changes requiring client updates
- **Security**: Security-related updates

## Step 2: Determine Version Number

Based on changes, determine the appropriate version bump:

### Semantic Versioning Rules

**MAJOR (x.0.0)** - Breaking changes:
- Incompatible API changes
- Major architecture updates
- Removal of features
- Database schema breaking changes

**MINOR (1.x.0)** - New features:
- New functionality added
- Backwards compatible changes
- New sections or blocks
- Performance improvements

**PATCH (1.0.x)** - Bug fixes:
- Bug fixes only
- Minor improvements
- Documentation updates
- No breaking changes

### Version Decision Matrix
```
Breaking changes? → MAJOR
New features? → MINOR
Bug fixes only? → PATCH
```

Suggest version based on analysis:
- Current version: [read from version.json]
- Suggested version: [based on changes]

## Step 3: Update Version File

Get current commit hash:
```bash
CURRENT_COMMIT=$(git rev-parse HEAD)
echo "Current commit: $CURRENT_COMMIT"
```

Update `apps/smart-site/src/admin/version.json`:
```json
{
  "version": "[NEW_VERSION]",
  "releaseDate": "[TODAY'S_DATE]",
  "gitCommit": "[CURRENT_COMMIT]",
  "changelog": "https://github.com/andy-dextrous/Smart-Site/releases/tag/v[NEW_VERSION]"
}
```

## Step 4: Update CHANGELOG

Edit `apps/smart-site/CHANGELOG.md`:

### CHANGELOG Format
```markdown
# Changelog

All notable changes to Smart-Site will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [[NEW_VERSION]] - [TODAY'S_DATE]

### Added
- [List new features and additions]
- [Include new sections, blocks, or collections]

### Changed
- [List changes to existing functionality]
- [Include improvements and optimizations]

### Fixed
- [List bug fixes]
- [Include specific issue resolutions]

### Removed
- [List removed features or deprecated items]

### Security
- [List security-related updates]

### Breaking Changes
- [Explicitly list any breaking changes]
- [Include migration instructions if needed]
```

### Example Entry
```markdown
## [1.2.0] - 2025-01-15

### Added
- New hero-split section with animation options
- SmartSite CLI automatic backup system
- Version tracking in admin/version.json
- Caching system for URI resolution with O(1) lookup

### Changed
- Improved admin dashboard performance by 40%
- Updated Payload hooks for better error handling
- Migrated to Tailwind v4 configuration system

### Fixed
- Fixed slug generation for deeply nested pages
- Resolved TypeScript errors in admin components
- Corrected media upload issues in production

### Security
- Updated dependencies to patch CVE-2024-XXXXX
```

## Step 5: Commit Version Changes

Stage and commit the version updates:
```bash
# Stage version and changelog files
git add apps/smart-site/src/admin/version.json apps/smart-site/CHANGELOG.md

# Create release commit
git commit -m "chore: release Smart-Site v[NEW_VERSION]

Release notes:
- [Brief summary of major changes]
- [Highlight breaking changes if any]
- See CHANGELOG.md for full details"
```

## Step 6: Create Git Tag

Create an annotated tag for the release:
```bash
# Create annotated tag
git tag -a v[NEW_VERSION] -m "Release Smart-Site v[NEW_VERSION]

[Copy relevant section from CHANGELOG here]"

# Verify tag was created
git tag -l "v[NEW_VERSION]"
git show v[NEW_VERSION]
```

## Step 7: Push to Repository

Push the commit and tag to origin:
```bash
# Push commits to main branch
git push origin main

# Push the new tag
git push origin v[NEW_VERSION]

# Verify push succeeded
git ls-remote --tags origin | grep v[NEW_VERSION]
```

## Step 8: Create GitHub Release

### Using GitHub CLI (Recommended)
```bash
# Extract release notes from CHANGELOG
sed -n '/## \[[NEW_VERSION]\]/,/## \[/p' apps/smart-site/CHANGELOG.md | head -n -1 > /tmp/release-notes.md

# Create GitHub release
gh release create v[NEW_VERSION] \
  --title "Smart-Site v[NEW_VERSION]" \
  --notes-file /tmp/release-notes.md \
  --target main
```

### Manual GitHub Release
If GitHub CLI is not available, provide instructions:

1. Go to: https://github.com/[your-repo]/releases/new
2. Choose tag: `v[NEW_VERSION]`
3. Release title: `Smart-Site v[NEW_VERSION]`
4. Copy the relevant section from CHANGELOG.md
5. Check "Set as the latest release"
6. Publish release

## Step 9: Verify Release Workflow

The GitHub workflow should automatically:
1. Detect the new release
2. Package the Smart-Site code
3. Publish to external Smart-Site repository
4. Make it available via SmartSite CLI

Verify workflow execution:
```bash
# Check GitHub Actions status
gh workflow view release --repo [your-repo]

# Or check manually at:
# https://github.com/[your-repo]/actions
```

## Step 10: Test Release Availability

Verify the release is available to clients:
```bash
# Check SmartSite CLI sees the new version
pnpm smartsite status

# Should show:
# Current version: [old version]
# Latest version: v[NEW_VERSION]
# Update available!
```

## Step 11: Test Update Process

Test updating a client site to the new version:
```bash
# Create test branch
git checkout -b test/release-v[NEW_VERSION]

# Try updating a test client
pnpm smartsite update test-client --dry-run

# If dry run looks good, do actual update
pnpm smartsite update test-client

# Verify update succeeded
cd apps/clients/test-client
cat src/admin/version.json
```

## Step 12: Document Release

### Update Main README
If significant features were added, update the main README:
- New features section
- Version compatibility notes
- Migration instructions (if breaking changes)

### Notify Team
Create release announcement including:
- Version number and release date
- Major features and improvements
- Breaking changes and migration steps
- Update instructions for clients

## Post-Release Tasks

### Monitor for Issues
- Watch for GitHub issues related to the release
- Monitor client update success rates
- Be ready to create hotfix if critical issues found

### Hotfix Process
If critical issues are found:
```bash
# Create hotfix branch
git checkout -b hotfix/v[VERSION]-fix

# Make fixes
# Update version.json to patch version
# Update CHANGELOG with hotfix entry

# Create hotfix release
git tag -a v[VERSION].1 -m "Hotfix: [description]"
git push origin v[VERSION].1
```

## Release Checklist

Before creating release, verify:
- [ ] All tests passing: `pnpm test`
- [ ] Type checking passes: `pnpm type-check`
- [ ] Linting passes: `pnpm lint`
- [ ] Build succeeds: `pnpm build`
- [ ] No uncommitted changes: `git status`
- [ ] On main/master branch: `git branch --show-current`
- [ ] Branch is up to date: `git pull origin main`

## Summary Output

After successful release creation:

```
✅ Smart-Site Release Created Successfully

Version: v[NEW_VERSION]
Tag: v[NEW_VERSION]
Commit: [COMMIT_HASH]
Release Date: [DATE]

Changes in this release:
- [Number] new features
- [Number] improvements
- [Number] bug fixes
- [Number] breaking changes

GitHub Release: https://github.com/[repo]/releases/tag/v[NEW_VERSION]

Clients can now update using:
pnpm smartsite update [client-name]

Next steps:
1. Monitor GitHub Actions for release workflow
2. Verify release appears in SmartSite CLI
3. Test update on staging client
4. Notify team of new release
```

## Important Notes

### Release Frequency
- Aim for regular releases (weekly/bi-weekly during active development)
- Batch related changes together
- Avoid releasing on Fridays (harder to fix issues over weekend)

### Breaking Changes
- Always document breaking changes clearly
- Provide migration instructions
- Consider deprecation periods for removed features
- Test thoroughly before releasing

### Version Naming
- Follow semantic versioning strictly
- Use pre-release versions for testing: v1.2.0-beta.1
- Reserve major versions for significant milestones

### Release Branch Strategy
- Always release from stable main/master branch
- Never release from feature branches
- Ensure CI/CD passes before releasing

### Rollback Plan
If a release has critical issues:
1. Don't delete the tag (keep for history)
2. Create a new patch release with fixes
3. Document the issue in CHANGELOG
4. Notify affected clients

## Troubleshooting

**"Tag already exists"**:
```bash
# Delete local tag
git tag -d v[VERSION]
# Delete remote tag (careful!)
git push origin :refs/tags/v[VERSION]
```

**"GitHub Actions workflow not triggering"**:
- Check workflow file exists: `.github/workflows/release.yml`
- Verify workflow permissions in repository settings
- Check GitHub Actions is enabled for repository

**"Clients not seeing update"**:
- Verify tag was pushed: `git ls-remote --tags`
- Check external repository received update
- Clear SmartSite CLI cache if needed

**"Version conflict"**:
- Ensure version in version.json matches tag
- Check no duplicate version numbers
- Verify CHANGELOG version matches