# Upstream Merge Skill: Syncing with simple-conversation-relay

## Overview

This skill documents how to merge updates from the upstream `simple-conversation-relay` repository into this `crelay-payments` repository. This payment-focused repository was created from the Payments branch and maintains the ability to pull in improvements from the upstream while preserving payment-specific functionality.

## Prerequisites

- Upstream remote configured: `https://github.com/deshartman/simple-conversation-relay.git`
- Working directory is clean or changes are committed
- Understanding of git merge conflict resolution
- Familiarity with payment-specific code in this repository

## Repository Relationship

```
simple-conversation-relay (upstream)
└── v4.0 branch (canonical implementation)
    │
    └── merged into ↓
        │
        crelay-payments (this repo)
        └── main/env-update branch (payment-specialized)
```

**Key Principle**: Upstream provides canonical implementations of core features. This repo adds payment-specific functionality on top.

## Step-by-Step Merge Process

### 1. Verify Upstream Remote

Check if upstream is configured:
```bash
git remote -v
```

If upstream is not listed, add it:
```bash
git remote add upstream https://github.com/deshartman/simple-conversation-relay.git
```

### 2. Create Feature Branch

Always merge in a feature branch, not directly in main:
```bash
git checkout -b upstream-merge-v4.x.x
```

### 3. Fetch Upstream Changes

```bash
git fetch upstream
```

This downloads all branches and commits from upstream without merging.

### 4. Merge Upstream v4.0 Branch

```bash
git merge upstream/v4.0 --allow-unrelated-histories --no-edit
```

**Flags explained:**
- `--allow-unrelated-histories`: Required because repos have different git histories
- `--no-edit`: Uses default merge commit message (can be edited later)

**Expected Result**: Merge conflicts in multiple files. This is normal and expected.

## Conflict Resolution Strategy

### Critical Decision Framework

When resolving conflicts, use this decision tree:

#### 1. **Code Files (server.ts, services, etc.)**

**Default: Accept THEIRS (upstream)**

Upstream has the canonical implementation. Accept their version unless:
- File contains payment-specific code (like payment tools)
- File has payment-specific modifications that must be preserved

**Files to typically accept upstream (`git checkout --theirs`):**
- `server/src/server.ts` - Core server with environment loading
- `server/src/services/TwilioService.ts` - Service improvements
- `.gitignore` - Standard gitignore patterns

**Files to keep ours (`git checkout --ours`):**
- `server/src/tools/*-capture.ts` - Payment-specific tools
- `server/src/interfaces/AgentAssistedPayments.d.ts` - Payment types

#### 2. **Configuration Files**

**Default: Keep OURS (payment repo)**

These files are payment-specific:

**Always keep ours:**
- `server/.env.example` - Contains payment-specific environment variables
- `server/assets/PaymentContext.md` - Payment AI instructions
- `server/assets/PaymentToolManifest.json` - Payment tools
- `server/assets/serverConfig.json` - May have payment-specific config

**Exception**: If upstream adds new general configuration, manually merge relevant parts.

#### 3. **Documentation Files (README, CHANGELOG)**

**Strategy: Manual Merge Required**

These files need careful manual merging:

**README.md**:
```bash
git checkout --ours README.md  # Start with our payment-focused version
# Then manually add upstream improvements:
# - New feature documentation
# - Environment configuration updates
# - API changes
# Preserve payment-first organization
```

**CHANGELOG.md**:
```bash
git checkout --ours CHANGELOG.md  # Start with ours
# Add new release entry at top documenting the merge
# Keep all existing payment-specific release notes
```

#### 4. **package.json**

**Strategy: Hybrid Merge**

```bash
# Usually accept upstream first
git checkout --theirs server/package.json

# Then manually edit to:
# 1. Change name back to "conversation-relay-payments"
# 2. Update version to payment repo scheme (e.g., 4.9.8.0)
# 3. Ensure payment-specific scripts are present
# 4. Verify all dependencies are correct
```

### Conflict Resolution Example

```bash
# For server.ts (accept upstream canonical implementation)
git checkout --theirs server/src/server.ts
git add server/src/server.ts

# For .env.example (keep our payment-specific variables)
git checkout --ours server/.env.example
git add server/.env.example

# For README (manual merge required)
git checkout --ours README.md
# Edit file to add upstream improvements
git add README.md
```

## Post-Merge Checklist

### 1. Update package.json

After merging, always verify/update:

```json
{
  "name": "conversation-relay-payments",  // Must be payment repo name
  "version": "4.9.x.0",  // Payment repo version scheme (add .0)
  "description": "Using Twilio Conversation Relay to handle payments in conversations.",
  "scripts": {
    // Ensure all environment-aware scripts are present:
    "dev": "NODE_ENV=dev tsx watch src/server.ts",
    "start": "NODE_ENV=prod node dist/server.js",
    "start:dev": "NODE_ENV=dev node dist/server.js",
    "dev:prod": "NODE_ENV=prod tsx watch src/server.ts"
  }
}
```

### 2. Update Documentation

**README.md**: Add release section at top (after Focus paragraph):
```markdown
## Release v4.9.x.0 - [Feature Name]

This release merges upstream improvements from [simple-conversation-relay v4.9.x]...

**🔧 Key Features:**
- List merged features

**✅ Benefits:**
- List benefits for payment use case
```

**CHANGELOG.md**: Add new release entry at top:
```markdown
## Release v4.9.x.0

### Upstream Merge: [Feature Name]

This release merges changes from [simple-conversation-relay v4.9.x]...

#### 🔄 Merged from Upstream
- List what was merged

#### 📝 Files Modified
- List modified files

#### 🎯 Benefits
- Focus on payment-specific benefits
```

### 3. Create Environment Files

If upstream adds new environment features, create/update:

```bash
# Create .env.dev (development with ngrok)
cp server/.env.example server/.env.dev
# Edit: Set SERVER_BASE_URL to ngrok domain

# Create .env.prod (production with fly.dev)
cp server/.env.example server/.env.prod
# Edit: Set SERVER_BASE_URL to fly.dev domain
```

**Note**: These files are gitignored and should not be committed.

### 4. Build and Test

**Always test before committing:**

```bash
# Install dependencies if package.json changed
cd server
pnpm install

# Build TypeScript
pnpm build
# Should complete with no errors

# Test development mode
pnpm dev
# Should show: "Environment loaded from: .env.dev (NODE_ENV: dev)"
# Should show: "All required environment variables validated"
# Should load all payment tools successfully
# Ctrl+C to stop

# Test production build
pnpm start
# Should show: "Environment loaded from: .env.prod (NODE_ENV: prod)"
# Ctrl+C to stop
```

### 5. Verify Payment Functionality

After merge, verify payment-specific code still works:

**Check files exist:**
```bash
ls -la server/src/tools/*capture*.ts
# Should see: start-capture.ts, capture-card.ts, capture-security-code.ts,
#             capture-expiry-date.ts, finish-capture.ts, cancel-capture.ts
```

**Check payment tools loaded:**
```bash
# In dev server output, should see:
# [CachedAssetsService] Loaded tool: start-capture
# [CachedAssetsService] Loaded tool: capture-card
# [CachedAssetsService] Loaded tool: capture-security-code
# [CachedAssetsService] Loaded tool: capture-expiry-date
# [CachedAssetsService] Loaded tool: finish-capture
# [CachedAssetsService] Loaded tool: cancel-capture
```

## Common Merge Scenarios

### Scenario 1: Environment Configuration Updates (v4.9.8)

**What upstream provides:**
- New environment loading functions
- NODE_ENV-based .env file selection
- Environment validation

**Merge strategy:**
1. Accept upstream `server.ts` (has new env loading)
2. Keep our `.env.example` (has payment variables)
3. Update README with env instructions
4. Create .env.dev and .env.prod locally

### Scenario 2: Service Improvements

**What upstream provides:**
- Refactored services (e.g., removing EventEmitter)
- Bug fixes
- Performance improvements

**Merge strategy:**
1. Accept upstream service files if they don't contain payment code
2. If service has payment methods (like TwilioService), carefully review:
   - If upstream improved base functionality → accept theirs
   - If our repo added payment methods → keep ours or manually merge

### Scenario 3: New Features

**What upstream provides:**
- New tools
- New configuration options
- New service capabilities

**Merge strategy:**
1. Accept new features from upstream
2. Update payment context/manifest if needed to use new features
3. Document in CHANGELOG how new features benefit payment use cases

## Troubleshooting

### Issue: "refusing to merge unrelated histories"

**Solution:** Add `--allow-unrelated-histories` flag
```bash
git merge upstream/v4.0 --allow-unrelated-histories
```

### Issue: Too many conflicts

**Solution:** Use strategic conflict resolution
```bash
# Accept all upstream code files first
git checkout --theirs server/src/server.ts
git checkout --theirs server/src/services/*.ts

# Keep all payment-specific files
git checkout --ours server/.env.example
git checkout --ours server/assets/Payment*.json
git checkout --ours server/assets/Payment*.md

# Mark as resolved
git add -u

# Then manually merge docs
# Edit README.md and CHANGELOG.md
```

### Issue: Build fails after merge

**Solution:** Check for breaking changes
```bash
# Review what changed in upstream
git log upstream/v4.0 --oneline -20

# Check for TypeScript errors
cd server
pnpm build

# Check for import issues
grep -r "import.*from" server/src/
```

### Issue: Environment loading not working

**Solution:** Verify environment functions were merged correctly
```bash
# Check if functions exist in server.ts
grep -A 5 "loadEnvironmentConfig\|validateRequiredEnvVars" server/src/server.ts

# Check if .env.dev exists
ls -la server/.env.dev

# Check NODE_ENV is set in scripts
grep "NODE_ENV" server/package.json
```

## Commit Message Template

```
Merge upstream/v4.0: [Feature Name] (v4.9.x.0)

- Merged [feature] from simple-conversation-relay v4.9.x
- [List specific functions/improvements merged]
- Updated package.json to v4.9.x.0 with [changes]
- [Created/Updated specific files]
- Updated README with [documentation] while preserving payment focus
- Added CHANGELOG entry for v4.9.x.0 upstream merge
- [Updated specific services from upstream]
- Maintained all payment-specific functionality
- Build and [dev/prod] server tested successfully
```

## Best Practices

### 1. Always Use a Feature Branch
Never merge directly into main. Use branches like `upstream-merge-v4.9.8`, `sync-upstream`, etc.

### 2. Test Thoroughly Before Merging to Main
- Build must succeed
- Dev server must start
- All payment tools must load
- Environment loading must work

### 3. Document What Was Merged
Update CHANGELOG with specific features merged and their benefits for payment use cases.

### 4. Preserve Payment-First Focus
When merging docs, always maintain the payment-first organization and emphasis.

### 5. Version Numbering
- Upstream uses: `4.9.8`
- We use: `4.9.8.0` (add .0 to indicate our build on top of their version)

### 6. Keep Payment Secrets Separate
Never commit .env.dev or .env.prod files. They contain credentials and are gitignored.

## When to Merge from Upstream

Good times to merge:
- ✅ Upstream releases new features you want (environment config, new tools)
- ✅ Upstream fixes critical bugs
- ✅ Upstream improves performance or architecture
- ✅ Quarterly sync to stay up-to-date

Avoid merging:
- ❌ In the middle of active payment feature development
- ❌ Right before a production release
- ❌ When you don't have time to test thoroughly
- ❌ When upstream made breaking changes you're not ready for

## Success Criteria

A successful upstream merge should result in:

- ✅ All conflicts resolved
- ✅ Build completes with no errors
- ✅ Dev and prod servers start successfully
- ✅ All payment tools load correctly
- ✅ Environment loading works (shows correct .env file loaded)
- ✅ Environment validation works (checks required variables)
- ✅ README updated with new features
- ✅ CHANGELOG documents the merge
- ✅ package.json has correct name and version
- ✅ All payment-specific functionality preserved

## Quick Reference Commands

```bash
# 1. Setup
git remote add upstream https://github.com/deshartman/simple-conversation-relay.git
git checkout -b upstream-merge-vX.X.X

# 2. Fetch and merge
git fetch upstream
git merge upstream/v4.0 --allow-unrelated-histories

# 3. Resolve conflicts (example)
git checkout --theirs server/src/server.ts
git checkout --ours server/.env.example
git checkout --ours README.md  # then manually edit
git add -u

# 4. Update files
# Edit package.json (name, version)
# Edit README.md (add release section)
# Edit CHANGELOG.md (add entry)

# 5. Test
cd server && pnpm install && pnpm build && pnpm dev

# 6. Commit
git commit -m "Merge upstream/v4.0: [Feature] (v4.9.x.0)"

# 7. Merge to main (when ready)
git checkout main
git merge upstream-merge-vX.X.X
git push origin main
```

## Related Documentation

- [README.md](../../README.md#syncing-with-upstream) - Upstream sync overview
- [CHANGELOG.md](../../CHANGELOG.md) - History of previous merges
- [Upstream Repository](https://github.com/deshartman/simple-conversation-relay) - Source of updates
- [Anthropic Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) - About agent skills

---

**Last Updated**: Based on v4.9.8.0 merge (December 2025)
**Skill Version**: 1.0
