import { Deserializer, Hex, Serializable, Serializer, U8 } from '@aptos-labs/ts-sdk';

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

function createSerializableClass<T, N extends string = string>(
    className: N,
    serializeFn: (serializer: Serializer, data: T) => void,
    deserializeFn: (deserializer: Deserializer) => T
): {
    new (data: T): Serializable & { value: T; name: N };
    deserialize: (deserializer: Deserializer) => Serializable & { value: T; name: N };
    className: N;
} {
    const cls = {
        [className]: class implements Serializable {
            static className: N = className;
            private data: T;
            constructor(data: T) {
                this.data = data;
            }
            get value(): T {
                return this.data;
            }
            get name(): N {
                return className;
            }
            bcsToBytes(): Uint8Array {
                const serializer = new Serializer();
                this.serialize(serializer);
                return serializer.toUint8Array();
            }
            bcsToHex(): Hex {
                return new Hex( this.bcsToBytes() );
            }
            toStringWithoutPrefix(): string {
                return this.bcsToHex().toStringWithoutPrefix();
            }
            toString(): string {
                return this.bcsToHex().toString();
            }
            toJSON() {
                return this.data;
            }
            [Symbol.for('nodejs.util.inspect.custom')]() {
                return this.data;
            }
            serialize(serializer: Serializer): void {
                serializeFn(serializer, this.data);
            }
            static deserialize(deserializer: Deserializer): Serializable & { value: T; name: N } {
                const data = deserializeFn(deserializer);
                return new (this as any)(data);
            }
        }
    }[className];
    cls.className = className;
    return cls as any;
}

// UpgradePolicy
export const UpgradePolicy = createSerializableClass<number>(
    "UpgradePolicy",
    (serializer, data) => serializer.serializeU8(data),
    (deserializer) => deserializer.deserializeU8()
);


// PackageDep
export const PackageDep = createSerializableClass<{ account: string; package_name: string }>(
  "PackageDep",
  (serializer, data) => {
    serializer.serializeStr(data.account);
    serializer.serializeStr(data.package_name);
  },
  (deserializer) => ({
    account: deserializer.deserializeStr(),
    package_name: deserializer.deserializeStr(),
  })
);

// Any
export const Any = createSerializableClass<{ type_name: string; data: number[] }>(
  "Any",
  (serializer, data) => {
    serializer.serializeStr(data.type_name);
    serializer.serializeVector(data.data.map((num) => new U8(num)));
  },
  (deserializer) => ({
    type_name: deserializer.deserializeStr(),
    data: deserializer.deserializeVector(U8).map((num) => num.value),
  })
);

// ModuleMetadata
export const ModuleMetadata = createSerializableClass<{
  name: string;
  source: number[];
  source_map: number[];
  extension?: InstanceType<typeof Any>;
}>(
  "ModuleMetadata",
  (serializer, data) => {
    serializer.serializeStr(data.name);
    serializer.serializeVector(data.source.map((num) => new U8(num)));
    serializer.serializeVector(data.source_map.map((num) => new U8(num)));
    serializer.serializeOption(data.extension);
  },
  (deserializer) => ({
    name: deserializer.deserializeStr(),
    source: deserializer.deserializeVector(U8).map((num) => num.value),
    source_map: deserializer.deserializeVector(U8).map((num) => num.value),
    extension: deserializer.deserializeOption(Any),
  })
);

// PackageMetadata
export const PackageMetadata = createSerializableClass<{
  name: string;
  upgrade_policy: InstanceType<typeof UpgradePolicy>;
  upgrade_number: bigint;
  source_digest: string;
  manifest: number[];
  modules: Array<InstanceType<typeof ModuleMetadata>>;
  deps: Array<InstanceType<typeof PackageDep>>;
  extension?: InstanceType<typeof Any>;
}>(
  "PackageMetadata",
  (serializer, data) => {
    serializer.serializeStr(data.name);
    data.upgrade_policy.serialize(serializer);
    serializer.serializeU64(data.upgrade_number);
    serializer.serializeStr(data.source_digest);
    serializer.serializeVector(data.manifest.map((num) => new U8(num)));
    serializer.serializeVector(data.modules);
    serializer.serializeVector(data.deps);
    serializer.serializeOption(data.extension);
  },
  (deserializer) => ({
    name: deserializer.deserializeStr(),
    upgrade_policy: UpgradePolicy.deserialize(deserializer),
    upgrade_number: deserializer.deserializeU64(),
    source_digest: deserializer.deserializeStr(),
    manifest: deserializer.deserializeVector(U8).map((num) => num.value),
    modules: deserializer.deserializeVector(ModuleMetadata),
    deps: deserializer.deserializeVector(PackageDep),
    extension: deserializer.deserializeOption(Any),
  })
);
