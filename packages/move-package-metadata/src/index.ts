import { bcs } from 'aptos-bcs';

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

// UpgradePolicy

export const UpgradePolicy = bcs.Struct("UpgradePolicy", {
      policy: bcs.U8,
    }
)

export const PackageDep = bcs.Struct("PackageDep", {
  account: bcs.FixedBytes(32),
  package_name: bcs.String,
});

export const Any = bcs.Struct("Any", {
  type_name: bcs.String,
  data: bcs.Vector(bcs.U8),
});

export const ModuleMetadata = bcs.Struct("ModuleMetadata", {
  name: bcs.String,
  source: bcs.Vector(bcs.U8),
  source_map: bcs.Vector(bcs.U8),
  extension: bcs.Option(Any),
});

export const PackageMetadata = bcs.Struct("PackageMetadata", {
  name: bcs.String,
  upgrade_policy: UpgradePolicy,
  upgrade_number: bcs.U64,
  source_digest: bcs.String,
  manifest: bcs.Vector(bcs.U8),
  modules: bcs.Vector(ModuleMetadata),
  deps: bcs.Vector(PackageDep),
  extension: bcs.Option(Any),
});
