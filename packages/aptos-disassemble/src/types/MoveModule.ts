/**
 * Core types from the original compiledModule.ts - cleaned up and organized
 */

// --- Index Types for Bytecode ---
export type ModuleHandleIndex = number;
export type StructHandleIndex = number;
export type FunctionHandleIndex = number;
export type FieldHandleIndex = number;
export type SignatureIndex = number;
export type IdentifierIndex = number;
export type AddressIdentifierIndex = number;
export type ConstantPoolIndex = number;
export type TypeParameterIndex = number;
export type VariantIndex = number;
export type FieldInstantiationIndex = number;
export type StructDefinitionIndex = number;
export type StructDefInstantiationIndex = number;
export type StructVariantHandleIndex = number;
export type StructVariantInstantiationIndex = number;
export type VariantFieldHandleIndex = number;
export type VariantFieldInstantiationIndex = number;
export type FunctionInstantiationIndex = number;
export type LocalIndex = number;
export type CodeOffset = number;
export type ClosureMask = number;
export type MemberCount = number;

// --- Core Module Structure ---
export interface MoveModule {
    magic: number;
    version: number;
    selfModuleHandleIdx: number;
    module_handles: Array<ModuleHandle>;
    struct_handles: Array<StructHandle>;
    function_handles: Array<FunctionHandle>;
    field_handles: Array<FieldHandle>;
    friend_decls: Array<ModuleHandle>;
    struct_defs_inst: Array<StructDefInstantiation>;
    function_inst: Array<FunctionInstantiation>;
    field_insts: Array<FieldInstantiation>;
    signatures: Array<Array<SignatureToken>>;
    identifiers: Array<string>;
    address_identifiers: Array<string>;
    constant_pool: Array<Constant>;
    metadatas: Array<Metadata>;
    struct_defs: Array<StructDefinition>;
    function_defs: Array<FunctionDefinition>;
    struct_variant_handles: Array<StructVariantHandle>;
    struct_variant_inst: Array<StructVariantInstantiation>;
    variant_field_handles: Array<VariantFieldHandle>;
    variant_field_inst: Array<VariantFieldInstantiation>;
}

// --- Module Structure Types ---
export interface ModuleHandle {
    address: AddressIdentifierIndex;
    name: IdentifierIndex;
}

export interface StructHandle {
    module: ModuleHandleIndex;
    name: IdentifierIndex;
    abilities: number;
    type_parameters: Array<{
        constraints: number;
        is_phantom: boolean;
    }>;
}

export interface FunctionHandle {
    module: ModuleHandleIndex;
    name: IdentifierIndex;
    parameters: SignatureIndex;
    return_: SignatureIndex;
    type_parameters: number[];
    access_specifiers?: any;
    attributes?: any;
}

export interface FieldHandle {
    owner: StructDefinitionIndex;
    field: MemberCount;
}

// --- Instantiation Types ---
export interface StructDefInstantiation {
    def: StructDefinitionIndex;
    typeParameters: SignatureIndex;
}

export interface FunctionInstantiation {
    handle: FunctionHandleIndex;
    type_parameters: SignatureIndex;
}

export interface FieldInstantiation {
    handle: FieldHandleIndex;
    typeParameters: SignatureIndex;
}

// --- Definition Types ---
export interface StructDefinition {
    struct_handle: StructHandleIndex;
    field_information: StructFieldInformation;
}

export type StructFieldInformation =
    | { kind: "Native" }
    | { kind: "Declared", fields: FieldDefinition[] }
    | { kind: "DeclaredVariants", variants: VariantDefinition[] };

export interface FieldDefinition {
    name: IdentifierIndex;
    type: SignatureToken;
}

export interface VariantDefinition {
    name: IdentifierIndex;
    fields: FieldDefinition[];
}

export type Visibility = "public" | "private" | "friend";

export interface FunctionDefinition {
    function: FunctionHandleIndex;
    visibility: Visibility;
    isEntry: boolean;
    acquiresGlobalResources: StructHandleIndex[];
    code?: CodeUnit;
}

export interface CodeUnit {
    locals: SignatureIndex;
    code: Bytecode[];
}

// --- Variant Types (for enum support) ---
export interface StructVariantHandle {
    struct_index: StructDefinitionIndex;
    variant: VariantIndex;
}

export interface StructVariantInstantiation {
    handle: StructVariantHandleIndex;
    type_parameters: SignatureIndex;
}

export interface VariantFieldHandle {
    struct_index: StructDefinitionIndex;
    variants: VariantIndex[];
    field: MemberCount;
}

export interface VariantFieldInstantiation {
    handle: VariantFieldHandleIndex;
    typeParameters: SignatureIndex;
}

// --- Metadata Types ---
export interface Constant {
    type: SignatureToken;
    data: Uint8Array;
}

export interface Metadata {
    key: Uint8Array;
    value: Uint8Array;
}

// --- Ability Types ---
export enum Ability {
    Copy = "copy",
    Drop = "drop",
    Store = "store",
    Key = "key"
}

export type AbilitySet = number;

// --- Re-export SignatureToken ---
export type SignatureToken =
    | ({ kind: "Bool" } & { __signatureTokenBrand: true })
    | ({ kind: "U8" } & { __signatureTokenBrand: true })
    | ({ kind: "U16" } & { __signatureTokenBrand: true })
    | ({ kind: "U32" } & { __signatureTokenBrand: true })
    | ({ kind: "U64" } & { __signatureTokenBrand: true })
    | ({ kind: "U128" } & { __signatureTokenBrand: true })
    | ({ kind: "U256" } & { __signatureTokenBrand: true })
    | ({ kind: "Address" } & { __signatureTokenBrand: true })
    | ({ kind: "Signer" } & { __signatureTokenBrand: true })
    | ({ kind: "Vector", type: SignatureToken } & { __signatureTokenBrand: true })
    | ({ kind: "Function", args: SignatureToken[], results: SignatureToken[], abilities: AbilitySet } & { __signatureTokenBrand: true })
    | ({ kind: "Struct", handle: StructHandleIndex } & { __signatureTokenBrand: true })
    | ({ kind: "StructInstantiation", handle: StructHandleIndex, typeParams: SignatureToken[] } & { __signatureTokenBrand: true })
    | ({ kind: "Reference", type: SignatureToken } & { __signatureTokenBrand: true })
    | ({ kind: "MutableReference", type: SignatureToken } & { __signatureTokenBrand: true })
    | ({ kind: "TypeParameter", index: TypeParameterIndex } & { __signatureTokenBrand: true });

// --- Re-export Bytecode ---
export type Bytecode =
    | { kind: "Pop" }
    | { kind: "Ret" }
    | { kind: "BrTrue", codeOffset: CodeOffset }
    | { kind: "BrFalse", codeOffset: CodeOffset }
    | { kind: "Branch", codeOffset: CodeOffset }
    | { kind: "LdU8", value: number }
    | { kind: "LdU16", value: number }
    | { kind: "LdU32", value: number }
    | { kind: "LdU64", value: bigint }
    | { kind: "LdU128", value: bigint }
    | { kind: "LdU256", value: string }
    | { kind: "CastU8" }
    | { kind: "CastU16" }
    | { kind: "CastU32" }
    | { kind: "CastU64" }
    | { kind: "CastU128" }
    | { kind: "CastU256" }
    | { kind: "LdConst", constIdx: ConstantPoolIndex }
    | { kind: "LdTrue" }
    | { kind: "LdFalse" }
    | { kind: "CopyLoc", localIdx: LocalIndex }
    | { kind: "MoveLoc", localIdx: LocalIndex }
    | { kind: "StLoc", localIdx: LocalIndex }
    | { kind: "Call", funcHandleIdx: FunctionHandleIndex }
    | { kind: "CallGeneric", funcInstIdx: FunctionInstantiationIndex }
    | { kind: "Pack", structDefIdx: StructDefinitionIndex }
    | { kind: "PackGeneric", structInstIdx: StructDefInstantiationIndex }
    | { kind: "PackVariant", structVariantHandleIdx: StructVariantHandleIndex }
    | { kind: "PackVariantGeneric", structVariantInstIdx: StructVariantInstantiationIndex }
    | { kind: "Unpack", structDefIdx: StructDefinitionIndex }
    | { kind: "UnpackGeneric", structInstIdx: StructDefInstantiationIndex }
    | { kind: "UnpackVariant", structVariantHandleIdx: StructVariantHandleIndex }
    | { kind: "UnpackVariantGeneric", structVariantInstIdx: StructVariantInstantiationIndex }
    | { kind: "TestVariant", structVariantHandleIdx: StructVariantHandleIndex }
    | { kind: "TestVariantGeneric", structVariantInstIdx: StructVariantInstantiationIndex }
    | { kind: "ReadRef" }
    | { kind: "WriteRef" }
    | { kind: "FreezeRef" }
    | { kind: "MutBorrowLoc", localIdx: LocalIndex }
    | { kind: "ImmBorrowLoc", localIdx: LocalIndex }
    | { kind: "MutBorrowField", fieldHandleIdx: FieldHandleIndex }
    | { kind: "MutBorrowVariantField", variantFieldHandleIdx: VariantFieldHandleIndex }
    | { kind: "MutBorrowFieldGeneric", fieldInstIdx: FieldInstantiationIndex }
    | { kind: "MutBorrowVariantFieldGeneric", variantFieldInstIdx: VariantFieldInstantiationIndex }
    | { kind: "ImmBorrowField", fieldHandleIdx: FieldHandleIndex }
    | { kind: "ImmBorrowVariantField", variantFieldHandleIdx: VariantFieldHandleIndex }
    | { kind: "ImmBorrowFieldGeneric", fieldInstIdx: FieldInstantiationIndex }
    | { kind: "ImmBorrowVariantFieldGeneric", variantFieldInstIdx: VariantFieldInstantiationIndex }
    | { kind: "MutBorrowGlobal", structDefIdx: StructDefinitionIndex }
    | { kind: "MutBorrowGlobalGeneric", structInstIdx: StructDefInstantiationIndex }
    | { kind: "ImmBorrowGlobal", structDefIdx: StructDefinitionIndex }
    | { kind: "ImmBorrowGlobalGeneric", structInstIdx: StructDefInstantiationIndex }
    | { kind: "Add" }
    | { kind: "Sub" }
    | { kind: "Mul" }
    | { kind: "Mod" }
    | { kind: "Div" }
    | { kind: "BitOr" }
    | { kind: "BitAnd" }
    | { kind: "Xor" }
    | { kind: "Or" }
    | { kind: "And" }
    | { kind: "Not" }
    | { kind: "Eq" }
    | { kind: "Neq" }
    | { kind: "Lt" }
    | { kind: "Gt" }
    | { kind: "Le" }
    | { kind: "Ge" }
    | { kind: "Abort" }
    | { kind: "Nop" }
    | { kind: "Exists", structDefIdx: StructDefinitionIndex }
    | { kind: "ExistsGeneric", structInstIdx: StructDefInstantiationIndex }
    | { kind: "MoveFrom", structDefIdx: StructDefinitionIndex }
    | { kind: "MoveFromGeneric", structInstIdx: StructDefInstantiationIndex }
    | { kind: "MoveTo", structDefIdx: StructDefinitionIndex }
    | { kind: "MoveToGeneric", structInstIdx: StructDefInstantiationIndex }
    | { kind: "Shl" }
    | { kind: "Shr" }
    | { kind: "VecPack", elemTyIdx: SignatureIndex, numElements: bigint }
    | { kind: "VecLen", elemTyIdx: SignatureIndex }
    | { kind: "VecImmBorrow", elemTyIdx: SignatureIndex }
    | { kind: "VecMutBorrow", elemTyIdx: SignatureIndex }
    | { kind: "VecPushBack", elemTyIdx: SignatureIndex }
    | { kind: "VecPopBack", elemTyIdx: SignatureIndex }
    | { kind: "VecUnpack", elemTyIdx: SignatureIndex, numElements: bigint }
    | { kind: "VecSwap", elemTyIdx: SignatureIndex }
    | { kind: "PackClosure", fun: FunctionHandleIndex, mask: ClosureMask }
    | { kind: "PackClosureGeneric", fun: FunctionInstantiationIndex, mask: ClosureMask }
    | { kind: "CallClosure", sigIdx: SignatureIndex };
