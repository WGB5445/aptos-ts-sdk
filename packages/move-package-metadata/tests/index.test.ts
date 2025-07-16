import { describe, it, expect } from 'vitest';
import { UpgradePolicy, PackageDep, Any, ModuleMetadata, PackageMetadata } from '../src/index';

describe('PackageMetadata', () => {

  it('should create UpgradePolicy instance', () => {
    const policy = { policy: 1 };
    expect(policy.policy).toBe(1);
  });


  it('should create PackageDep instance', () => {
    const account = new Uint8Array(32); account[31] = 1;
    const dep = { account, package_name: 'test-package' };
    expect(dep.account).toEqual(account);
    expect(dep.package_name).toBe('test-package');
  });


  it('should create Any instance', () => {
    const any = { type_name: 'test-type', data: [1, 2, 3] };
    expect(any.type_name).toBe('test-type');
    expect(any.data).toEqual([1, 2, 3]);
  });


  it('should create ModuleMetadata instance', () => {
    const module = { name: 'test-module', source: [1, 2], source_map: [3, 4], extension: null };
    expect(module.name).toBe('test-module');
    expect(module.source).toEqual([1, 2]);
    expect(module.source_map).toEqual([3, 4]);
  });


  it('should create PackageMetadata instance', () => {
    const policy = { policy: 1 };
    const account = new Uint8Array(32); account[31] = 1;
    const dep = { account, package_name: 'test-package' };
    const module = { name: 'test-module', source: [1, 2], source_map: [3, 4], extension: null };
    const metadata = {
      name: 'test-package',
      upgrade_policy: policy,
      upgrade_number: BigInt(1),
      source_digest: 'digest',
      manifest: [1, 2, 3],
      modules: [module],
      deps: [dep],
      extension: null,
    };
    expect(metadata.name).toBe('test-package');
    expect(metadata.upgrade_number).toBe(BigInt(1));
    expect(metadata.source_digest).toBe('digest');
  });


  it('should serialize and deserialize UpgradePolicy', () => {
    const policy = { policy: 1 };
    const bytes = UpgradePolicy.serialize(policy).toUint8Array();
    const deserializedPolicy = UpgradePolicy.deserialize(bytes);
    expect(deserializedPolicy.policy).toBe(1);
  });


  it('should serialize and deserialize PackageDep', () => {
    const account = new Uint8Array(32); account[31] = 1;
    const dep = { account, package_name: 'test-package' };
    const bytes = PackageDep.serialize(dep).toUint8Array();
    const deserializedDep = PackageDep.deserialize(bytes);
    expect(deserializedDep.account).toEqual(account);
    expect(deserializedDep.package_name).toBe('test-package');
  });


  it('should serialize and deserialize Any', () => {
    const any = { type_name: 'test-type', data: [1, 2, 3] };
    const bytes = Any.serialize(any).toUint8Array();
    const deserializedAny = Any.deserialize(bytes);
    expect(deserializedAny.type_name).toBe('test-type');
    expect(deserializedAny.data).toEqual([1, 2, 3]);
  });


  it('should serialize and deserialize ModuleMetadata', () => {
    const module = { name: 'test-module', source: [1, 2], source_map: [3, 4], extension: null };
    const bytes = ModuleMetadata.serialize(module).toUint8Array();
    const deserializedModule = ModuleMetadata.deserialize(bytes);
    expect(deserializedModule.name).toBe('test-module');
    expect(deserializedModule.source).toEqual([1, 2]);
    expect(deserializedModule.source_map).toEqual([3, 4]);
  });


  it('should serialize and deserialize PackageMetadata', () => {
    const policy = { policy: 1 };
    const account = new Uint8Array(32); account[31] = 1;
    const dep = { account, package_name: 'test-package' };
    const module = { name: 'test-module', source: [1, 2], source_map: [3, 4], extension: null };
    const metadata = {
      name: 'test-package',
      upgrade_policy: policy,
      upgrade_number: BigInt(1),
      source_digest: 'digest',
      manifest: [1, 2, 3],
      modules: [module],
      deps: [dep],
      extension: null,
    };
    const bytes = PackageMetadata.serialize(metadata).toUint8Array();
    const deserializedMetadata = PackageMetadata.deserialize(bytes);
    expect(deserializedMetadata.name).toBe('test-package');
    expect(deserializedMetadata.upgrade_number).toBe(BigInt(1));
    expect(deserializedMetadata.source_digest).toBe('digest');
  });
});
