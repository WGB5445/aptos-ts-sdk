import { Deserializer, Serializable, Serializer, U8 } from '@aptos-labs/ts-sdk';

/*
    struct PackageMetadata has copy, drop, store {
        /// Name of this package.
        name: String,
        /// The upgrade policy of this package.
        upgrade_policy: UpgradePolicy,
        /// The numbers of times this module has been upgraded. Also serves as the on-chain version.
        /// This field will be automatically assigned on successful upgrade.
        upgrade_number: u64,
        /// The source digest of the sources in the package. This is constructed by first building the
        /// sha256 of each individual source, than sorting them alphabetically, and sha256 them again.
        source_digest: String,
        /// The package manifest, in the Move.toml format. Gzipped text.
        manifest: vector<u8>,
        /// The list of modules installed by this package.
        modules: vector<ModuleMetadata>,
        /// Holds PackageDeps.
        deps: vector<PackageDep>,
        /// For future extension
        extension: Option<Any>
    }

    struct UpgradePolicy has store, copy, drop {
        policy: u8
    }

    struct Any has drop, store, copy {
        type_name: String,
        data: vector<u8>
    }

    struct PackageDep has store, drop, copy {
        account: address,
        package_name: String
    }

    struct ModuleMetadata has copy, drop, store {
        /// Name of the module.
        name: String,
        /// Source text, gzipped String. Empty if not provided.
        source: vector<u8>,
        /// Source map, in compressed BCS. Empty if not provided.
        source_map: vector<u8>,
        /// For future extensions.
        extension: Option<Any>,
    }

*/

export class UpgradePolicy extends Serializable {
  policy: number;
  constructor(policy: number) {
    super();
    this.policy = policy;
  }

  override serialize(serializer: Serializer): void {
    serializer.serializeU8(this.policy);
  }
  static deserialize(deserializer: Deserializer): UpgradePolicy {
    return new UpgradePolicy(deserializer.deserializeU8());
  }
}

export class PackageDep extends Serializable {
  account: string;
  package_name: string;

  constructor(account: string, package_name: string) {
    super();
    this.account = account;
    this.package_name = package_name;
  }

  override serialize(serializer: Serializer): void {
    serializer.serializeStr(this.account);
    serializer.serializeStr(this.package_name);
  }
  static deserialize(deserializer: Deserializer): PackageDep {
    return new PackageDep(deserializer.deserializeStr(), deserializer.deserializeStr());
  }
}

export class Any extends Serializable {
  type_name: string;
  data: Array<number>;

  constructor(type_name: string, data: Array<number>) {
    super();
    this.type_name = type_name;
    this.data = data;
  }

  override serialize(serializer: Serializer): void {
    serializer.serializeStr(this.type_name);
    serializer.serializeVector(this.data.map((num) => new U8(num)));
  }

  static deserialize(deserializer: Deserializer): Any {
    return new Any(
      deserializer.deserializeStr(),
      deserializer.deserializeVector(U8).map((num) => num.value),
    );
  }
}

export class ModuleMetadata extends Serializable {
  name: string;
  source: Array<number>;
  source_map: Array<number>;
  extension?: Any;

  constructor(name: string, source: Array<number>, source_map: Array<number>, extension?: Any) {
    super();
    this.name = name;
    this.source = source;
    this.source_map = source_map;
    this.extension = extension;
  }

  override serialize(serializer: Serializer): void {
    serializer.serializeStr(this.name);
    serializer.serializeVector(this.source.map((num) => new U8(num)));
    serializer.serializeVector(this.source_map.map((num) => new U8(num)));
    serializer.serializeOption(this.extension);
  }

  static deserialize(deserializer: Deserializer): ModuleMetadata {
    return new ModuleMetadata(
      deserializer.deserializeStr(),
      deserializer.deserializeVector(U8).map((num) => num.value),
      deserializer.deserializeVector(U8).map((num) => num.value),
      deserializer.deserializeOption(Any),
    );
  }
}

export class PackageMetadata extends Serializable {
  name: string;
  upgrade_policy: UpgradePolicy;
  upgrade_number: bigint;
  source_digest: string;
  manifest: Array<number>;
  modules: Array<ModuleMetadata>;
  deps: Array<PackageDep>;
  extension?: Any;

  constructor(
    name: string,
    upgrade_policy: UpgradePolicy,
    upgrade_number: bigint,
    source_digest: string,
    manifest: Array<number>,
    modules: Array<ModuleMetadata>,
    deps: Array<PackageDep>,
    extension?: Any,
  ) {
    super();
    this.name = name;
    this.upgrade_policy = upgrade_policy;
    this.upgrade_number = upgrade_number;
    this.source_digest = source_digest;
    this.manifest = manifest;
    this.modules = modules;
    this.deps = deps;
    this.extension = extension;
  }

  override serialize(serializer: Serializer): void {
    serializer.serializeStr(this.name);
    this.upgrade_policy.serialize(serializer);
    serializer.serializeU64(this.upgrade_number);
    serializer.serializeStr(this.source_digest);
    serializer.serializeVector(this.manifest.map((num) => new U8(num)));
    serializer.serializeVector(this.modules);
    serializer.serializeVector(this.deps);
    serializer.serializeOption(this.extension);
  }

  static deserialize(deserializer: Deserializer): PackageMetadata {
    return new PackageMetadata(
      deserializer.deserializeStr(),
      UpgradePolicy.deserialize(deserializer),
      deserializer.deserializeU64(),
      deserializer.deserializeStr(),
      deserializer.deserializeVector(U8).map((num) => num.value),
      deserializer.deserializeVector(ModuleMetadata),
      deserializer.deserializeVector(PackageDep),
      deserializer.deserializeOption(Any),
    );
  }
}
