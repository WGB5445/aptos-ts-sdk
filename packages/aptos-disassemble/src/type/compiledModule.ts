import { bcs, Deserializer } from "aptos-bcs";
import { fromU8, SerializedType } from "./serializedType";

// --- Extra Index Types for Bytecode ---
export type FieldInstantiationIndex = number;

export interface ModuleHandle {
  address: AddressIdentifierIndex; 
  name: IdentifierIndex; 
}


export const StructTypeParameter = bcs.Struct("StructTypeParameter", {
  /** The type parameter constraints. */
  constraints: bcs.U8,
  /** Whether the parameter is declared as phantom. */
  is_phantom: bcs.Bool,
});

export const StructHandle = bcs.Struct("StructHandle", {
  module: bcs.U16,
  name: bcs.U16,
  abilities: bcs.U8,
  typeParameters: bcs.Vector(StructTypeParameter),
});

export const AccessKind = bcs.Enum("AccessKind", {
  Reads:  null,
  Writes: null,
});

export const ResourceInstantiation = bcs.Struct("ResourceInstantiation", {
  StructHandleIndex: bcs.Uleb128, // StructHandleIndex
  SignatureIndex: bcs.Uleb128, // SignatureIndex
});

export const ResourceSpecifier = bcs.Enum("ResourceSpecifier", {
  /** Any resource */
  Any: null,
  /** Resource declared at a specific address */
  DeclaredAtAddress: bcs.Uleb128,
  /** Resource declared in a specific module */
  DeclaredInModule: bcs.Uleb128,
  /** Resource type */
  Resource: bcs.Uleb128,
  /** Resource instantiation with type parameters */
  ResourceInstantiation: ResourceInstantiation,
});



export const AddressSpecifier = bcs.Enum("AddressSpecifier", {
  Any: null,
  Literal: bcs.Uleb128,
  Parameter: bcs.Uleb128,
});


export const AccessSpecifier = bcs.Struct("AccessSpecifier", {
  /** The kind of access. */
  kind: AccessKind,
  /** Whether the specifier is negated. */
  negated: bcs.Bool,
  /** The resource specifier. */
  resource: ResourceSpecifier,
  /** The address where the resource is stored. */
  address: AddressSpecifier,
});

export const FunctionAttribute = bcs.Enum("FunctionAttribute", {
  Persistent: null,
  ModuleLock: null,
});


export const FunctionHandle = bcs.Struct("FunctionHandle", {
  module: bcs.U16,
  name: bcs.U16,
  parameters: bcs.U16,
  return_: bcs.U16,
  typeParameters: bcs.Vector(bcs.U8),
  /** Optional access specifiers for the function. */
  access_specifiers: bcs.Option(bcs.Vector(AccessSpecifier)),
  /**
   * Optional attributes for the function.
   * - "Persistent": The function is treated like a public function on upgrade.
   * - "ModuleLock": During execution, a module reentrancy lock is established.
   */
  attributes: bcs.Vector(FunctionAttribute),
});

// export const CompiledModule = bcs.Struct("CompiledModule1",{
//   version: bcs.U32,
//   selfModuleHandleIdx: bcs.U16,
//   moduleHandles: bcs.Vector(ModuleHandle),
//   structHandles: bcs.Vector(StructHandle),
//   // functionHandles: bcs.Vector(FunctionHandle),
// });

/*
export interface CompiledModule {
  version: number;
  selfModuleHandleIdx: ModuleHandleIndex;
  moduleHandles: ModuleHandle[];
  structHandles: StructHandle[];
  functionHandles: FunctionHandle[];
  fieldHandles: FieldHandle[];
  friendDecls: ModuleHandle[];
  structDefInstantiations: StructDefInstantiation[];
  functionInstantiations: FunctionInstantiation[];
  fieldInstantiations: FieldInstantiation[];
  signatures: Signature[];
  identifiers: string[];
  addressIdentifiers: string[];
  constantPool: Constant[];
  metadata: Metadata[];
  structDefs: StructDefinition[];
  functionDefs: FunctionDefinition[];
  structVariantHandles: StructVariantHandle[];
  structVariantInstantiations: StructVariantInstantiation[];
  variantFieldHandles: VariantFieldHandle[];
  variantFieldInstantiations: VariantFieldInstantiation[];
}
*/

// --- Supporting Types ---

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







export interface FieldHandle {
  owner: StructDefinitionIndex;
  field: MemberCount;
}

/**
 * Access specifier for function/resource access control.
 */




/**
 * AccessKind 表示资源访问类型：
 * - "Reads"：资源被读取（如果用于否定，则表示既不读也不写）
 * - "Writes"：资源被读或写（如果用于否定，则表示未被写入）
 * 其它字符串可用于扩展。
 */
export type AccessKind = "Reads" | "Writes";

export interface StructDefInstantiation {
  def: StructDefinitionIndex;
  typeParameters: SignatureIndex;
}

export interface FunctionInstantiation {
  handle: FunctionHandleIndex;
  typeParameters: SignatureIndex;
}

export interface FieldInstantiation {
  handle: FieldHandleIndex;
  typeParameters: SignatureIndex;
}


// SignatureToken: TypeScript equivalent of the Rust enum
export type SignatureToken =
  | ({ kind: "Bool" } & { __signatureTokenBrand: true })
  | ({ kind: "U8" } & { __signatureTokenBrand: true })
  | ({ kind: "U64" } & { __signatureTokenBrand: true })
  | ({ kind: "U128" } & { __signatureTokenBrand: true })
  | ({ kind: "Address" } & { __signatureTokenBrand: true })
  | ({ kind: "Signer" } & { __signatureTokenBrand: true })
  | ({ kind: "Vector", type: SignatureToken } & { __signatureTokenBrand: true })
  | ({ kind: "Function", args: SignatureToken[], results: SignatureToken[], abilities: AbilitySet } & { __signatureTokenBrand: true })
  | ({ kind: "Struct", handle: StructHandleIndex } & { __signatureTokenBrand: true })
  | ({ kind: "StructInstantiation", handle: StructHandleIndex, typeParams: SignatureToken[] } & { __signatureTokenBrand: true })
  | ({ kind: "Reference", type: SignatureToken } & { __signatureTokenBrand: true })
  | ({ kind: "MutableReference", type: SignatureToken } & { __signatureTokenBrand: true })
  | ({ kind: "TypeParameter", index: TypeParameterIndex } & { __signatureTokenBrand: true })
  | ({ kind: "U16" } & { __signatureTokenBrand: true })
  | ({ kind: "U32" } & { __signatureTokenBrand: true })
  | ({ kind: "U256" } & { __signatureTokenBrand: true });

export type Signature = SignatureToken[];

export type TypeBuilder =
  | ({ kind: "Saturated", token: SignatureToken } & { __typeBuilderBrand: true })
  | ({ kind: "Vector" } & { __typeBuilderBrand: true })
  | ({ kind: "Reference" } & { __typeBuilderBrand: true })
  | ({ kind: "MutableReference" } & { __typeBuilderBrand: true })
  | ({
      kind: "StructInst",
      sh_idx: StructHandleIndex,
      arity: number,
      ty_args: SignatureToken[]
    } & { __typeBuilderBrand: true })
  | ({
      kind: "Function",
      abilities: AbilitySet,
      arg_count: number,
      result_count: number,
      args: SignatureToken[],
      results: SignatureToken[]
    } & { __typeBuilderBrand: true });

export const read_next = (deSignatures: Deserializer, version: number) => {
    let next_token_num = deSignatures.deserializeU8();

        let token = fromU8(next_token_num);
        switch (token) {
            case SerializedType.U16 | SerializedType.U32 | SerializedType.U256:
                if( version < 6 ) {
                    throw new Error(`Unsupported token type: ${token} for version ${version}`);
                }
            break;
            case SerializedType.FUNCTION:
                if( version < 8 ) {
                    throw new Error(`Unsupported token type: ${token} for version ${version}`);
                }
            break;
            default:
                // do nothing
            break;
        }

        let token_value: SignatureToken | TypeBuilder | null = null;
        switch (token) {
            case SerializedType.BOOL:
                token_value = { kind: "Bool", __signatureTokenBrand: true };
                break;
            case SerializedType.U8:
                token_value = { kind: "U8", __signatureTokenBrand: true };
                break;
            case SerializedType.U16:
                token_value = { kind: "U16", __signatureTokenBrand: true };
                break;
            case SerializedType.U32:
                token_value = { kind: "U32", __signatureTokenBrand: true };
                break;
            case SerializedType.U64:
                token_value = { kind: "U64", __signatureTokenBrand: true };
                break;
            case SerializedType.U128:
                token_value = { kind: "U128", __signatureTokenBrand: true };
                break;
            case SerializedType.U256:
                token_value = { kind: "U256", __signatureTokenBrand: true };
                break;
            case SerializedType.ADDRESS:
                token_value = { kind: "Address", __signatureTokenBrand: true };
                break;
            case SerializedType.REFERENCE:
                token_value = { kind: "Reference", __typeBuilderBrand: true };
                break;
            case SerializedType.MUTABLE_REFERENCE:
                token_value = { kind: "MutableReference", __typeBuilderBrand: true };
                break;
            case SerializedType.SIGNER:
                token_value = { kind: "Signer", __signatureTokenBrand: true };
                break;
            case SerializedType.VECTOR:
                token_value = { kind: "Vector", __typeBuilderBrand: true };
                break;
            case SerializedType.STRUCT:
                token_value = {kind: "Struct", __signatureTokenBrand: true, handle: deSignatures.deserializeU8()};
                break;
            case SerializedType.STRUCT_INST:
                let sh_idx = deSignatures.deserializeUleb128AsU32();
                let arity = deSignatures.deserializeUleb128AsU32();
                if (arity == 0 ){
                    throw new Error(`Unsupported arity 0 for struct instantiation at index ${sh_idx}`);
                }
                token_value = {
                    kind: "StructInst",
                    __typeBuilderBrand: true,
                    sh_idx: sh_idx,
                    arity: arity,
                    ty_args: []
                }
                break;
            case SerializedType.TYPE_PARAMETER:
                token_value = { kind: "TypeParameter", index: deSignatures.deserializeUleb128AsU32(), __signatureTokenBrand: true };
                break;
            case SerializedType.FUNCTION:
                let abilities = deSignatures.deserializeUleb128AsU32();
                let arg_count = deSignatures.deserializeUleb128AsU32();
                let result_count = deSignatures.deserializeUleb128AsU32();
                if(arg_count + result_count == 0){
                    token_value = {
                        kind: "Function",
                        __signatureTokenBrand: true,
                        abilities: abilities,
                        arg_count: arg_count,
                        result_count: result_count,
                        args:[],
                        results: []
                    };
                }else {
                    token_value = {
                        kind: "Function",
                        __typeBuilderBrand: true,
                        abilities: abilities,
                        arg_count: arg_count,
                        result_count: result_count,
                        args: [],
                        results: []
                    };
                }
                break;
            default:
                throw new Error(`Unknown serialized type: ${token}`);
        }
        return token_value
}

export const load_signature_token = (deSignatures: Deserializer, version: number) => {
  let stack: Array<TypeBuilder | SignatureToken > = [];
  let token = read_next(deSignatures, version);
  if( token == null){
      throw new Error(`Invalid token: ${token}`);
  }else if("__signatureTokenBrand" in token) {
      return token as SignatureToken;
  }else{
      stack.push(token as TypeBuilder);
  };

  while(1){
      if( stack.length > 256  ) {
          throw new Error(`Stack overflow: ${stack.length} tokens`);
      };
      let last = stack.at(-1);
      if( last == null ) {
          throw new Error(`Stack is empty`);
      }else if( typeof last === "object" && last !== null && "__typeBuilderBrand" in last ) {
          let next_token = read_next(deSignatures, version);
          if( next_token == null ) {
              throw new Error(`Invalid token: ${next_token}`);
          };
          stack.push(next_token);
      }else if( typeof last === "object" && last !== null && "__signatureTokenBrand" in last ) {
          let token = stack.pop();
          if( token == null ) {
              throw new Error(`Stack is empty`);
          };
          let token2 = stack.pop();
          if( token2 == null ) { 
              return token as SignatureToken;
          }else {
              let result = apply(token2 as TypeBuilder, token as SignatureToken);
              stack.push(result);
          };
      }

  }
}

export const apply = (self: TypeBuilder, tok: SignatureToken): SignatureToken | TypeBuilder => {
    switch (self.kind) {
        case "Reference":
            return { kind: "Reference", type: tok, __signatureTokenBrand: true };
        case "MutableReference":
            return { kind: "MutableReference", type: tok, __signatureTokenBrand: true };
        case "Vector":
            return { kind: "Vector", type: tok, __signatureTokenBrand: true };
        case "StructInst":
            self.ty_args.push(tok);
            if(self.ty_args.length >= self.arity) {
                return {
                    kind: "StructInstantiation",
                    handle: self.sh_idx,
                    typeParams: self.ty_args,
                    __signatureTokenBrand: true
                };
            }else {
                return {
                    kind: "StructInst",
                    __typeBuilderBrand: true,
                    sh_idx: self.sh_idx,
                    arity: self.arity,
                    ty_args: self.ty_args
                };
            }
        case "Function":
            if (self.args.length < self.arg_count) {
                self.args.push(tok);
            }else {
                self.results.push(tok);
            };
            if (self.args.length == self.arg_count && self.results.length == self.result_count) {
                return {
                    kind: "Function",
                    arg_count: self.arg_count,
                    result_count: self.result_count,
                    args: self.args,
                    results: self.results,
                    abilities: self.abilities,
                    __signatureTokenBrand: true
                }
            }else {
                return {
                    kind: "Function",
                    __typeBuilderBrand: true,
                    arg_count: self.arg_count,
                    result_count: self.result_count,
                    args: self.args,
                    results: self.results,
                    abilities: self.abilities
                };
            }
        default:
            throw new Error(`Unknown token kind ${tok.kind}`);
    }
}


export enum Ability {
  Copy = "copy",
  Drop = "drop",
  Store = "store",
  Key = "key"
}

export type AbilitySet = number;

export type TypeTag = string; // For simplicity, can be expanded

export interface Constant {
  type: SignatureToken;
  data: Uint8Array;
}

export interface Metadata {
  key: Uint8Array;
  value: Uint8Array;
}

export interface StructDefinition {
  struct_handle: StructHandleIndex;
  field_information: StructFieldInformation
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


// --- Bytecode Instruction Types ---

export type CodeUnit = {
  locals: SignatureIndex;
  code: Bytecode[];
};

// Index types for bytecode operands
export type CodeOffset = number;
export type LocalIndex = number;
export type FunctionInstantiationIndex = number;
export type StructDefinitionIndex = number;
export type StructDefInstantiationIndex = number;
export type StructVariantHandleIndex = number;
export type StructVariantInstantiationIndex = number;
export type VariantFieldHandleIndex = number;
export type VariantFieldInstantiationIndex = number;
export type ClosureMask = number;
export type MemberCount = number;

// Bytecode enum (discriminated union)
export type Bytecode =
  | { kind: "Pop" }
  | { kind: "Ret" }
  | { kind: "BrTrue", codeOffset: CodeOffset }
  | { kind: "BrFalse", codeOffset: CodeOffset }
  | { kind: "Branch", codeOffset: CodeOffset }
  | { kind: "LdU8", value: number }
  | { kind: "LdU64", value: bigint }
  | { kind: "LdU128", value: bigint }
  | { kind: "CastU8" }
  | { kind: "CastU64" }
  | { kind: "CastU128" }
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
  | { kind: "CallClosure", sigIdx: SignatureIndex }
  | { kind: "LdU16", value: number }
  | { kind: "LdU32", value: number }
  | { kind: "LdU256", value: string }
  | { kind: "CastU16" }
  | { kind: "CastU32" }
  | { kind: "CastU256" };

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




// Opcodes enum for bytecode mapping
export enum Opcodes {
    POP                         = 0x01,
    RET                         = 0x02,
    BR_TRUE                     = 0x03,
    BR_FALSE                    = 0x04,
    BRANCH                      = 0x05,
    LD_U64                      = 0x06,
    LD_CONST                    = 0x07,
    LD_TRUE                     = 0x08,
    LD_FALSE                    = 0x09,
    COPY_LOC                    = 0x0A,
    MOVE_LOC                    = 0x0B,
    ST_LOC                      = 0x0C,
    MUT_BORROW_LOC              = 0x0D,
    IMM_BORROW_LOC              = 0x0E,
    MUT_BORROW_FIELD            = 0x0F,
    IMM_BORROW_FIELD            = 0x10,
    CALL                        = 0x11,
    PACK                        = 0x12,
    UNPACK                      = 0x13,
    READ_REF                    = 0x14,
    WRITE_REF                   = 0x15,
    ADD                         = 0x16,
    SUB                         = 0x17,
    MUL                         = 0x18,
    MOD                         = 0x19,
    DIV                         = 0x1A,
    BIT_OR                      = 0x1B,
    BIT_AND                     = 0x1C,
    XOR                         = 0x1D,
    OR                          = 0x1E,
    AND                         = 0x1F,
    NOT                         = 0x20,
    EQ                          = 0x21,
    NEQ                         = 0x22,
    LT                          = 0x23,
    GT                          = 0x24,
    LE                          = 0x25,
    GE                          = 0x26,
    ABORT                       = 0x27,
    NOP                         = 0x28,
    EXISTS                      = 0x29,
    MUT_BORROW_GLOBAL           = 0x2A,
    IMM_BORROW_GLOBAL           = 0x2B,
    MOVE_FROM                   = 0x2C,
    MOVE_TO                     = 0x2D,
    FREEZE_REF                  = 0x2E,
    SHL                         = 0x2F,
    SHR                         = 0x30,
    LD_U8                       = 0x31,
    LD_U128                     = 0x32,
    CAST_U8                     = 0x33,
    CAST_U64                    = 0x34,
    CAST_U128                   = 0x35,
    MUT_BORROW_FIELD_GENERIC    = 0x36,
    IMM_BORROW_FIELD_GENERIC    = 0x37,
    CALL_GENERIC                = 0x38,
    PACK_GENERIC                = 0x39,
    UNPACK_GENERIC              = 0x3A,
    EXISTS_GENERIC              = 0x3B,
    MUT_BORROW_GLOBAL_GENERIC   = 0x3C,
    IMM_BORROW_GLOBAL_GENERIC   = 0x3D,
    MOVE_FROM_GENERIC           = 0x3E,
    MOVE_TO_GENERIC             = 0x3F,
    VEC_PACK                    = 0x40,
    VEC_LEN                     = 0x41,
    VEC_IMM_BORROW              = 0x42,
    VEC_MUT_BORROW              = 0x43,
    VEC_PUSH_BACK               = 0x44,
    VEC_POP_BACK                = 0x45,
    VEC_UNPACK                  = 0x46,
    VEC_SWAP                    = 0x47,
    LD_U16                      = 0x48,
    LD_U32                      = 0x49,
    LD_U256                     = 0x4A,
    CAST_U16                    = 0x4B,
    CAST_U32                    = 0x4C,
    CAST_U256                   = 0x4D,
    // Since bytecode version 7
    IMM_BORROW_VARIANT_FIELD    = 0x4E,
    MUT_BORROW_VARIANT_FIELD    = 0x4F,
    IMM_BORROW_VARIANT_FIELD_GENERIC    = 0x50,
    MUT_BORROW_VARIANT_FIELD_GENERIC    = 0x51,
    PACK_VARIANT                = 0x52,
    PACK_VARIANT_GENERIC        = 0x53,
    UNPACK_VARIANT              = 0x54,
    UNPACK_VARIANT_GENERIC      = 0x55,
    TEST_VARIANT                = 0x56,
    TEST_VARIANT_GENERIC        = 0x57,
    // Since bytecode version 8
    PACK_CLOSURE                = 0x58,
    PACK_CLOSURE_GENERIC        = 0x59,
    CALL_CLOSURE                = 0x5A,
}

export function load_code(deserializer: Deserializer, version: number): Array<Bytecode> {
    let bytecode_count = deserializer.deserializeUleb128AsU32();
    return Array.from({ length: bytecode_count }, () => {
        let byte = deserializer.deserializeU8();
        // check version
        switch(byte) {
            case Opcodes.LD_U16:
            case Opcodes.LD_U32:
            case Opcodes.LD_U256:
            case Opcodes.CAST_U16:
            case Opcodes.CAST_U32:
            case Opcodes.CAST_U256:
                if (version < 6) {
                    throw new Error(`Unsupported opcode ${byte} for version ${version}`);
                }
                break;
            case Opcodes.VEC_PACK:
            case Opcodes.VEC_LEN:
            case Opcodes.VEC_IMM_BORROW:
            case Opcodes.VEC_MUT_BORROW:
            case Opcodes.VEC_PUSH_BACK:
            case Opcodes.VEC_POP_BACK:
            case Opcodes.VEC_UNPACK:
            case Opcodes.VEC_SWAP:
                if (version < 4) {
                    throw new Error(`Unsupported opcode ${byte} for version ${version}`);
                }
                break;
            case Opcodes.TEST_VARIANT:
            case Opcodes.TEST_VARIANT_GENERIC:
            case Opcodes.PACK_VARIANT:
            case Opcodes.PACK_VARIANT_GENERIC:
            case Opcodes.IMM_BORROW_VARIANT_FIELD:
            case Opcodes.IMM_BORROW_VARIANT_FIELD_GENERIC:
            case Opcodes.MUT_BORROW_VARIANT_FIELD:
            case Opcodes.MUT_BORROW_VARIANT_FIELD_GENERIC:
                if (version < 7) {
                    throw new Error(`Unsupported opcode ${byte} for version ${version}`);
                }
                break;
            case Opcodes.PACK_CLOSURE:
            case Opcodes.PACK_CLOSURE_GENERIC:
            case Opcodes.CALL_CLOSURE:
                if (version < 8) {
                    throw new Error(`Unsupported opcode ${byte} for version ${version}`);
                }
                break;
            default:
                // No additional checks needed for other opcodes
                break;
        }
        switch (byte) {
            case Opcodes.POP:
                return { kind: "Pop" };
            case Opcodes.RET:
                return { kind: "Ret" };
            case Opcodes.BR_TRUE:
                return { kind: "BrTrue", codeOffset: deserializer.deserializeUleb128AsU32() };
            case Opcodes.BR_FALSE:
                return { kind: "BrFalse", codeOffset: deserializer.deserializeUleb128AsU32() };
            case Opcodes.BRANCH:
                return { kind: "Branch", codeOffset: deserializer.deserializeUleb128AsU32() };
            case Opcodes.LD_U8:
                return { kind: "LdU8", value: deserializer.deserializeU8() };
            case Opcodes.LD_U64:
                return { kind: "LdU64", value: deserializer.deserializeU64() };
            case Opcodes.LD_U128:
                return { kind: "LdU128", value: deserializer.deserializeU128() };
            case Opcodes.CAST_U8:
                return { kind: "CastU8" };
            case Opcodes.CAST_U64:
                return { kind: "CastU64" };
            case Opcodes.CAST_U128:
                return { kind: "CastU128" };
            case Opcodes.LD_CONST:
                return { kind: "LdConst", constIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.LD_TRUE:
                return { kind: "LdTrue" };
            case Opcodes.LD_FALSE:
                return { kind: "LdFalse" };
            case Opcodes.COPY_LOC:
                return { kind: "CopyLoc", localIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.MOVE_LOC:
                return { kind: "MoveLoc", localIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.ST_LOC:
                return { kind: "StLoc", localIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.MUT_BORROW_LOC:
                return { kind: "MutBorrowLoc", localIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.IMM_BORROW_LOC:
                return { kind: "ImmBorrowLoc", localIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.MUT_BORROW_FIELD:
                return { kind: "MutBorrowField", fieldHandleIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.MUT_BORROW_FIELD_GENERIC:
                return { kind: "MutBorrowFieldGeneric", fieldInstIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.IMM_BORROW_FIELD:
                return { kind: "ImmBorrowField", fieldHandleIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.IMM_BORROW_FIELD_GENERIC:
                return { kind: "ImmBorrowFieldGeneric", fieldInstIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.MUT_BORROW_VARIANT_FIELD:
                return { kind: "MutBorrowVariantField", variantFieldHandleIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.MUT_BORROW_VARIANT_FIELD_GENERIC:
                return { kind: "MutBorrowVariantFieldGeneric", variantFieldInstIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.IMM_BORROW_VARIANT_FIELD:
                return { kind: "ImmBorrowVariantField", variantFieldHandleIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.IMM_BORROW_VARIANT_FIELD_GENERIC:
                return { kind: "ImmBorrowVariantFieldGeneric", variantFieldInstIdx: deserializer.deserializeUleb128AsU32() };
              case Opcodes.CALL:
                return { kind: "Call", funcHandleIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.CALL_GENERIC:
                return { kind: "CallGeneric", funcInstIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.PACK:
                return { kind: "Pack", structDefIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.PACK_GENERIC:
                return { kind: "PackGeneric", structInstIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.UNPACK:
                return { kind: "Unpack", structDefIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.UNPACK_GENERIC:
                return { kind: "UnpackGeneric", structInstIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.PACK_VARIANT:
                return { kind: "PackVariant", structVariantHandleIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.UNPACK_VARIANT:
                return { kind: "UnpackVariant", structVariantHandleIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.PACK_VARIANT_GENERIC:
                return { kind: "PackVariantGeneric", structVariantInstIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.UNPACK_VARIANT_GENERIC:
                return { kind: "UnpackVariantGeneric", structVariantInstIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.TEST_VARIANT:
                return { kind: "TestVariant", structVariantHandleIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.TEST_VARIANT_GENERIC:
                return { kind: "TestVariantGeneric", structVariantInstIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.PACK_CLOSURE:
                return { kind: "PackClosure", fun: deserializer.deserializeUleb128AsU32(), mask: deserializer.deserializeUleb128AsU32() };
            case Opcodes.PACK_CLOSURE_GENERIC:
                return { kind: "PackClosureGeneric", fun: deserializer.deserializeUleb128AsU32(), mask: deserializer.deserializeUleb128AsU32() };
            case Opcodes.CALL_CLOSURE:
                return { kind: "CallClosure", sigIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.READ_REF:
                return { kind: "ReadRef" };
            case Opcodes.WRITE_REF:
                return { kind: "WriteRef" };
            case Opcodes.ADD:
                return { kind: "Add" };
            case Opcodes.SUB:
                return { kind: "Sub" };
            case Opcodes.MUL:
                return { kind: "Mul"};
            case Opcodes.MOD:
                return { kind: "Mod" };
            case Opcodes.DIV:
                return { kind: "Div" };
            case Opcodes.BIT_OR:
                return { kind: "BitOr" };
            case Opcodes.BIT_AND:
                return { kind: "BitAnd" };
            case Opcodes.XOR:
                return { kind: "Xor" };
            case Opcodes.SHL:
                return { kind: "Shl" };
            case Opcodes.SHR:
                return { kind: "Shr" };
            case Opcodes.OR:
                return { kind: "Or" };
            case Opcodes.AND:
                return { kind: "And" };
            case Opcodes.NOT:
                return { kind: "Not" };
            case Opcodes.EQ:
                return { kind: "Eq" };
            case Opcodes.NEQ:
                return { kind: "Neq" };
            case Opcodes.LT:
                return { kind: "Lt" };
            case Opcodes.GT:
                return { kind: "Gt" };
            case Opcodes.LE:
                return { kind: "Le" };
            case Opcodes.GE:
                return { kind: "Ge" };
            case Opcodes.ABORT:
                return { kind: "Abort" };
            case Opcodes.NOP:
                return { kind: "Nop" };
            case Opcodes.EXISTS:
                return { kind: "Exists", structDefIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.EXISTS_GENERIC:
                return { kind: "ExistsGeneric", structInstIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.MUT_BORROW_GLOBAL:
                return { kind: "MutBorrowGlobal", structDefIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.MUT_BORROW_GLOBAL_GENERIC:
                return { kind: "MutBorrowGlobalGeneric", structInstIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.IMM_BORROW_GLOBAL: 
                return { kind: "ImmBorrowGlobal", structDefIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.IMM_BORROW_GLOBAL_GENERIC:
                return { kind: "ImmBorrowGlobalGeneric", structInstIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.MOVE_FROM:
                return { kind: "MoveFrom", structDefIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.MOVE_FROM_GENERIC:
                return { kind: "MoveFromGeneric", structInstIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.MOVE_TO:
                return { kind: "MoveTo", structDefIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.MOVE_TO_GENERIC:
                return { kind: "MoveToGeneric", structInstIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.FREEZE_REF:
                return { kind: "FreezeRef" };
            case Opcodes.VEC_PACK:
                return { kind: "VecPack", elemTyIdx: deserializer.deserializeUleb128AsU32(), numElements: deserializer.deserializeU64() };
            case Opcodes.VEC_LEN:
                return { kind: "VecLen", elemTyIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.VEC_IMM_BORROW:
                return { kind: "VecImmBorrow", elemTyIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.VEC_MUT_BORROW:
                return { kind: "VecMutBorrow", elemTyIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.VEC_PUSH_BACK:
                return { kind: "VecPushBack", elemTyIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.VEC_POP_BACK:
                return { kind: "VecPopBack", elemTyIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.VEC_UNPACK:
                return { kind: "VecUnpack", elemTyIdx: deserializer.deserializeUleb128AsU32(), numElements: deserializer.deserializeU64() };
            case Opcodes.VEC_SWAP:
                return { kind: "VecSwap", elemTyIdx: deserializer.deserializeUleb128AsU32() };
            case Opcodes.LD_U16:
                return { kind: "LdU16", value: deserializer.deserializeU16() };
            case Opcodes.LD_U32:
                return { kind: "LdU32", value: deserializer.deserializeU32() };
            case Opcodes.LD_U256:
                return { kind: "LdU256", value: deserializer.deserializeU256().toString() };
            case Opcodes.CAST_U16:
                return { kind: "CastU16"};
            case Opcodes.CAST_U32:
                return { kind: "CastU32"};
            case Opcodes.CAST_U256:
                return { kind: "CastU256"};
            default:
              throw new Error(`Unknown bytecode opcode: 0x${byte.toString(16)}`);
        }
    });
}