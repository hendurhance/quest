# Release Process

This document explains how to create releases for Quest.

## Automated Release Workflow

The project uses GitHub Actions to automatically build and release the extension when you push a version tag.

### Quick Release Guide

```bash
# 1. Update the version in package.json
npm version patch  # Bumps version from 1.0.0 to 1.0.1
# OR
npm version minor  # Bumps version from 1.0.0 to 1.1.0
# OR
npm version major  # Bumps version from 1.0.0 to 2.0.0

# 2. Push the tag (created automatically by npm version)
git push --follow-tags

# 3. GitHub Actions will automatically:
#    - Build the extension
#    - Create a GitHub release
#    - Upload the zip file
#    - Generate release notes
```

That's it! 🎉

## What Happens Automatically

When you push a version tag (e.g., `v1.0.0`), the GitHub Action will:

1. ✅ **Verify** the tag version matches `package.json` version
2. ✅ **Install** dependencies
3. ✅ **Type-check** the codebase
4. ✅ **Build** the production extension
5. ✅ **Create** a BUILD_INFO.txt file with build metadata
6. ✅ **Zip** the dist folder
7. ✅ **Generate** a changelog from git commits
8. ✅ **Create** a GitHub Release with:
   - Release notes
   - Changelog
   - Installation instructions
   - Downloadable zip file
9. ✅ **Upload** build artifacts (retained for 90 days)

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version (`1.0.0` → `2.0.0`) - Breaking changes
- **MINOR** version (`1.0.0` → `1.1.0`) - New features (backward compatible)
- **PATCH** version (`1.0.0` → `1.0.1`) - Bug fixes

### Examples

```bash
# Bug fix release
npm version patch
# Output: v1.0.1

# New feature release
npm version minor
# Output: v1.1.0

# Breaking change release
npm version major
# Output: v2.0.0
```

## Manual Release Steps (Detailed)

If you prefer to do it manually:

### Step 1: Update Version

Edit `package.json`:

```json
{
  "version": "1.0.1"  // Update this
}
```

### Step 2: Commit Changes

```bash
git add package.json
git commit -m "chore: bump version to 1.0.1"
```

### Step 3: Create and Push Tag

```bash
git tag v1.0.1
git push origin main
git push origin v1.0.1
```

### Step 4: Wait for GitHub Actions

- Go to the **Actions** tab in GitHub
- Watch the "Build and Release" workflow run
- Once complete, check the **Releases** page

## Pre-Release Checklist

Before creating a release, ensure:

- [ ] All tests pass locally (`npm run type-check`)
- [ ] Build succeeds (`npm run build`)
- [ ] Extension works in Chrome (test manually)
- [ ] All features documented in README
- [ ] CHANGELOG updated (if you maintain one)
- [ ] No sensitive data in code
- [ ] API keys are not hardcoded

## Release Notes Best Practices

The GitHub Action generates basic release notes automatically, but you can edit them after creation:

### Good Commit Messages (for auto-changelog)

```bash
# Good examples:
git commit -m "feat: add dark mode support"
git commit -m "fix: resolve article saving issue"
git commit -m "docs: update installation guide"

# These will show nicely in the changelog!
```

### Editing Release Notes

After the release is created:

1. Go to **Releases** on GitHub
2. Click **Edit** on the release
3. Add additional context:
   - Breaking changes
   - Migration guides
   - Screenshots
   - Special installation notes

## Build Artifacts

Each release includes:

### 1. Release ZIP
- **File**: `quest-v{version}.zip`
- **Contents**: Complete production build
- **Use**: Direct installation in Chrome

### 2. Build Artifact (GitHub Actions)
- **Retention**: 90 days
- **Contents**: Unzipped dist folder
- **Use**: Debugging, inspection

### 3. BUILD_INFO.txt
- **Location**: Inside the zip
- **Contents**: 
  - Version number
  - Build timestamp
  - Git commit SHA
  - Git tag

## Troubleshooting

### "Tag version does not match package.json"

The GitHub Action verifies that the git tag matches `package.json` version.

**Fix:**
```bash
# If tag is v1.0.1 but package.json is 1.0.0:
# Option 1: Delete tag and fix package.json
git tag -d v1.0.1
git push origin :refs/tags/v1.0.1
npm version 1.0.1 --no-git-tag-version
git add package.json
git commit -m "chore: bump version to 1.0.1"
git tag v1.0.1
git push --follow-tags

# Option 2: Use npm version (recommended)
npm version 1.0.1
git push --follow-tags
```

### Build Fails

Check the **Actions** tab for error logs:
- TypeScript errors → Fix in code
- Build errors → Check Vite config
- Node version → Ensure Node 18+

### Release Not Created

Ensure:
- Tag format is `v*.*.*` (e.g., `v1.0.0`)
- You have `contents: write` permission
- `GITHUB_TOKEN` is available (automatic)

## Chrome Web Store Release

To publish to Chrome Web Store (not automated):

1. Download the release zip
2. Extract it
3. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
4. Upload the extracted folder
5. Fill in store listing details
6. Submit for review

## Tips

- **Test before tagging**: Always test the build locally first
- **Write good commits**: They become your changelog
- **Use pre-releases**: For beta versions, create a pre-release on GitHub
- **Keep versions in sync**: Manifest version is auto-synced from package.json
- **Check the workflow**: Review `.github/workflows/release.yml` for details

## Example Workflow

```bash
# Start new feature
git checkout -b feature/dark-mode

# Make changes
# ... code, code, code ...

# Commit
git commit -m "feat: add dark mode support"

# Merge to main
git checkout main
git merge feature/dark-mode

# Bump version
npm version minor  # 1.0.0 → 1.1.0

# Push
git push --follow-tags

# Done! GitHub Actions handles the rest
```

---

**Questions?** Check the [GitHub Actions documentation](https://docs.github.com/en/actions) or open an issue.
