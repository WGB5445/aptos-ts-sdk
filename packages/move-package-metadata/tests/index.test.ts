import { describe, it, expect } from 'vitest';
import { UpgradePolicy, PackageDep, Any, ModuleMetadata, PackageMetadata } from '../src/index';
import { Deserializer, Serializer } from '@aptos-labs/ts-sdk';

describe('PackageMetadata', () => {
  it('should create UpgradePolicy instance', () => {
    const policy = new UpgradePolicy(1);
    expect(policy.policy).toBe(1);
  });

  it('should create PackageDep instance', () => {
    const dep = new PackageDep('0x1', 'test-package');
    expect(dep.account).toBe('0x1');
    expect(dep.package_name).toBe('test-package');
  });

  it('should create Any instance', () => {
    const any = new Any('test-type', [1, 2, 3]);
    expect(any.type_name).toBe('test-type');
    expect(any.data).toEqual([1, 2, 3]);
  });

  it('should create ModuleMetadata instance', () => {
    const module = new ModuleMetadata('test-module', [1, 2], [3, 4]);
    expect(module.name).toBe('test-module');
    expect(module.source).toEqual([1, 2]);
    expect(module.source_map).toEqual([3, 4]);
  });

  it('should create PackageMetadata instance', () => {
    const policy = new UpgradePolicy(1);
    const dep = new PackageDep('0x1', 'test-package');
    const module = new ModuleMetadata('test-module', [1, 2], [3, 4]);

    const metadata = new PackageMetadata(
      'test-package',
      policy,
      BigInt(1),
      'digest',
      [1, 2, 3],
      [module],
      [dep],
    );

    expect(metadata.name).toBe('test-package');
    expect(metadata.upgrade_number).toBe(BigInt(1));
    expect(metadata.source_digest).toBe('digest');
  });

  it('should serialize and deserialize UpgradePolicy', () => {
    const policy = new UpgradePolicy(1);
    const serializer = new Serializer();
    policy.serialize(serializer);

    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserializedPolicy = UpgradePolicy.deserialize(deserializer);

    expect(deserializedPolicy.policy).toBe(1);
  });

  it('should serialize and deserialize PackageDep', () => {
    const dep = new PackageDep('0x1', 'test-package');
    const serializer = new Serializer();
    dep.serialize(serializer);

    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserializedDep = PackageDep.deserialize(deserializer);

    expect(deserializedDep.account).toBe('0x1');
    expect(deserializedDep.package_name).toBe('test-package');
  });

  it('should serialize and deserialize Any', () => {
    const any = new Any('test-type', [1, 2, 3]);
    const serializer = new Serializer();
    any.serialize(serializer);

    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserializedAny = Any.deserialize(deserializer);

    expect(deserializedAny.type_name).toBe('test-type');
    expect(deserializedAny.data).toEqual([1, 2, 3]);
  });

  it('should serialize and deserialize ModuleMetadata', () => {
    const module = new ModuleMetadata('test-module', [1, 2], [3, 4]);
    const serializer = new Serializer();
    module.serialize(serializer);

    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserializedModule = ModuleMetadata.deserialize(deserializer);

    expect(deserializedModule.name).toBe('test-module');
    expect(deserializedModule.source).toEqual([1, 2]);
    expect(deserializedModule.source_map).toEqual([3, 4]);
  });
  it('should serialize and deserialize PackageMetadata', () => {
    const policy = new UpgradePolicy(1);
    const dep = new PackageDep('0x1', 'test-package');
    const module = new ModuleMetadata('test-module', [1, 2], [3, 4]);

    const metadata = new PackageMetadata(
      'test-package',
      policy,
      BigInt(1),
      'digest',
      [1, 2, 3],
      [module],
      [dep],
    );

    const serializer = new Serializer();
    metadata.serialize(serializer);

    const deserializer = new Deserializer(serializer.toUint8Array());
    const deserializedMetadata = PackageMetadata.deserialize(deserializer);

    expect(deserializedMetadata.name).toBe('test-package');
    expect(deserializedMetadata.upgrade_number).toBe(BigInt(1));
    expect(deserializedMetadata.source_digest).toBe('digest');
  });
});
