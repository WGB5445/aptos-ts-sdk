# @wgb5445/aptos-move-package-metadata

A TypeScript library for handling Aptos Move package metadata serialization and deserialization.

## Installation

```bash
npm install @wgb5445/aptos-move-package-metadata
# or
yarn add @wgb5445/aptos-move-package-metadata
# or
pnpm add @wgb5445/aptos-move-package-metadata
```

## Peer Dependencies

This library requires `@aptos-labs/ts-sdk` as a peer dependency:

```bash
npm install @aptos-labs/ts-sdk
```

## Usage

```typescript
import {
  PackageMetadata,
  UpgradePolicy,
  ModuleMetadata,
  PackageDep,
} from '@wgb5445/aptos-move-package-metadata';

// Create upgrade policy
const policy = new UpgradePolicy(1);

// Create package dependency
const dep = new PackageDep('0x1', 'AptosFramework');

// Create module metadata
const module = new ModuleMetadata('test_module', [], []);

// Create package metadata
const metadata = new PackageMetadata(
  'MyPackage',
  policy,
  BigInt(1),
  'source_digest_hash',
  [1, 2, 3], // manifest bytes
  [module],
  [dep],
);

// Serialize
const serializer = new Serializer();
metadata.serialize(serializer);
const bytes = serializer.toUint8Array();

// Deserialize
const deserializer = new Deserializer(bytes);
const reconstructed = PackageMetadata.deserialize(deserializer);
```

## API Reference

### Classes

- `PackageMetadata` - Main package metadata container
- `UpgradePolicy` - Package upgrade policy
- `ModuleMetadata` - Individual module metadata
- `PackageDep` - Package dependency information
- `Any` - Generic data container with type information

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm run build

# Test
pnpm run test

# Lint
pnpm run lint

# Type check
pnpm run typecheck
```

## Publishing

```bash
# Build and publish
pnpm run publish
```

## License

MIT
