# Publishing

## Prerequisites

- An npm account (create at https://www.npmjs.com/signup)
- Node.js 18+

## First-Time Setup

### 1. Login to npm

```bash
npm login
```

### 2. Package scope

The package is published as `@ayushmaanagarwal1211/convex-offset-pagination`.

## Build

```bash
npm install --ignore-scripts
npm run build
```

Verify `dist/` contains:
- `dist/client/index.js` — compiled library
- `dist/client/index.d.ts` — TypeScript declarations

## Publish

```bash
# Dry run (verify what gets published)
npm publish --dry-run

# Publish
npm publish --access public
```

## Version Bumping

```bash
npm version patch   # 0.1.0 → 0.1.1 (bug fix)
npm version minor   # 0.1.1 → 0.2.0 (new feature)
npm version major   # 0.2.0 → 1.0.0 (breaking change)

npm publish --access public
```

## Submitting to Convex Directory

After publishing to npm:

1. Go to https://www.convex.dev/components/submissions
2. Fill in your npm package name: `@ayushmaanagarwal1211/convex-offset-pagination`
3. The Convex team reviews and lists it in the component directory
