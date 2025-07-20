import { bcs, Deserializer } from "aptos-bcs";

import {
  formatLocalInstruction,
  getFieldInfo,
  formatFieldInstruction,
  formatStructInstruction,
  formatGenericStructInstruction,
  getVariantInfo,
} from "../instruction-helpers";
import {
  parseSignatureToken,
  parseAbilities,
  Bytecode,
  Constant,
  Metadata,
  MoveModule,
  SignatureToken,
  CodeUnit,
  FieldDefinition,
  FieldHandle,
  FieldInstantiation,
  FunctionDefinition,
  ModuleHandle,
  StructDefinition,
  StructDefInstantiation,
  StructVariantHandle,
  StructVariantInstantiation,
  VariantDefinition,
  VariantFieldHandle,
  VariantFieldInstantiation,
  Visibility,
} from "../new-index";
import { AccessSpecifier, FunctionAttribute, load_signature_token, load_code } from "./MoveModule";

// Import functions that need to be defined
// These should be moved from type/compiledModule.ts
export { load_signature_token, parseAbilities, parseSignatureToken, load_code } from "./MoveModule";

export function disassembleMoveModule(bytecode: Uint8Array | Buffer): MoveModule {
  const des = new Deserializer(bytecode);

  // get magic

  const magic = des.deserializeU32();
  if (magic !== 0xbeb1ca1) {
    throw new Error(`Invalid magic number: ${magic.toString(16)}`);
  }

  // get version
  const version = des.deserializeU32() & ~0xa000000;
  if (version > 8) {
    throw new Error(`Unsupported version: ${version}`);
  }

  // get table length
  const tableLength = des.deserializeUleb128AsU32();

  // get table
  const tables = Array.from({ length: tableLength }, () => {
    const kind = des.deserializeU8();
    const table_offset = des.deserializeUleb128AsU32();
    const count = des.deserializeUleb128AsU32();

    return {
      kind,
      table_offset,
      count,
    };
  });

  // check table
  let offset = 0;
  tables.forEach((table) => {
    if (table.table_offset != offset) {
      throw new Error(`Table offset mismatch: expected ${offset}, got ${table.table_offset}`);
    }
    offset += table.count;
  });

  // copy deserializer

  const tables_byte = new Uint8Array(
    Array.from({ length: offset }, () => {
      return des.deserializeU8();
    })
  );

  // get self_module_handle_idx
  const selfModuleHandleIdx = des.deserializeUleb128AsU32();

  // 表类型常量定义
  const TableKind = {
    MODULE_HANDLES: 0x1,
    STRUCT_HANDLES: 0x2,
    FUNCTION_HANDLES: 0x3,
    FUNCTION_INST: 0x4,
    SIGNATURES: 0x5,
    CONSTANT_POOL: 0x6,
    IDENTIFIERS: 0x7,
    ADDRESS_IDENTIFIERS: 0x8,
    STRUCT_DEFS: 0xa,
    STRUCT_DEF_INST: 0xb,
    FUNCTION_DEFS: 0xc,
    FIELD_HANDLES: 0xd,
    FIELD_INST: 0xe,
    FRIEND_DECLS: 0xf,
    METADATA: 0x10,
    VARIANT_FIELD_HANDLES: 0x11,
    VARIANT_FIELD_INST: 0x12,
    STRUCT_VARIANT_HANDLES: 0x13,
    STRUCT_VARIANT_INST: 0x14,
  };

  const module_handles: Array<{ address: number; name: number }> = [];
  const struct_handles: Array<{
    module: number;
    name: number;
    abilities: number;
    type_parameters: { constraints: number; is_phantom: boolean }[];
  }> = [];
  const function_handles: Array<{
    module: number;
    name: number;
    parameters: number;
    return_: number;
    type_parameters: number[];
    access_specifiers?: any;
    attributes?: any;
  }> = [];

  const function_inst: Array<{ handle: number; type_parameters: number }> = [];

  const signatures: Array<Array<SignatureToken>> = [];
  const constant_pool: Array<Constant> = [];
  const identifiers: Array<string> = [];
  const address_identifiers: Array<string> = [];
  const metadatas: Array<Metadata> = [];

  tables.forEach((table, idx) => {
    switch (table.kind) {
      case TableKind.MODULE_HANDLES: {
        const module_handles_bytes = tables_byte.slice(
          table.table_offset,
          table.table_offset + table.count
        );
        const de = new Deserializer(module_handles_bytes);
        while (de.remaining() > 0) {
          module_handles.push({
            address: de.deserializeUleb128AsU32(),
            name: de.deserializeUleb128AsU32(),
          });
        }
        break;
      }

      case TableKind.STRUCT_HANDLES: {
        const struct_handles_bytes = tables_byte.slice(
          table.table_offset,
          table.table_offset + table.count
        );
        const deStruct = new Deserializer(struct_handles_bytes);
        while (deStruct.remaining() > 0) {
          const module = deStruct.deserializeUleb128AsU32();
          const name = deStruct.deserializeUleb128AsU32();
          const abilities = deStruct.deserializeUleb128AsU32();
          const type_param_count = deStruct.deserializeUleb128AsU32();
          const type_parameters = Array.from({ length: type_param_count }, () => {
            const constraints = deStruct.deserializeUleb128AsU32();
            let is_phantom = false;
            if (version < 3) {
              is_phantom = false;
            } else {
              const byte = deStruct.deserializeUleb128AsU32();
              is_phantom = byte != 0;
            }
            return {
              constraints,
              is_phantom,
            };
          });

          struct_handles.push({
            module,
            name,
            abilities,
            type_parameters,
          });
        }
        break;
      }
      case TableKind.FUNCTION_HANDLES: {
        const function_handles_bytes = tables_byte.slice(
          table.table_offset,
          table.table_offset + table.count
        );
        const deFunc = new Deserializer(function_handles_bytes);
        while (deFunc.remaining() > 0) {
          const module = deFunc.deserializeUleb128AsU32();
          const name = deFunc.deserializeUleb128AsU32();
          const parameters = deFunc.deserializeUleb128AsU32();
          const return_ = deFunc.deserializeUleb128AsU32();
          const type_param_count = deFunc.deserializeUleb128AsU32();
          const type_parameters = Array.from({ length: type_param_count }, () => {
            const constraints = deFunc.deserializeUleb128AsU32();
            return constraints;
          });
          let access_specifiers: any = null;
          if (version >= 7) {
            const has_access_specifiers = deFunc.deserializeU8();
            let is_some: boolean | undefined = undefined;
            switch (has_access_specifiers) {
              case 1:
                is_some = false;
                break;
              case 2:
                is_some = true;
                break;
              default:
                throw new Error(`Unknown access specifier value: ${has_access_specifiers}`);
            }
            if (is_some) {
              access_specifiers = bcs.Vector(AccessSpecifier).read(deFunc);
            }
          }

          let function_abilities: any = null;
          if (version >= 8) {
            function_abilities = bcs.Vector(FunctionAttribute).read(deFunc);
          }

          function_handles.push({
            module,
            name,
            parameters,
            return_,
            type_parameters,
            access_specifiers,
            attributes: function_abilities,
          });
        }
        break;
      }
      case TableKind.FUNCTION_INST: {
        const function_inst_bytes = tables_byte.slice(
          table.table_offset,
          table.table_offset + table.count
        );
        const deFuncInst = new Deserializer(function_inst_bytes);
        while (deFuncInst.remaining() > 0) {
          const handle = deFuncInst.deserializeUleb128AsU32();
          const type_parameters = deFuncInst.deserializeUleb128AsU32();
          function_inst.push({ handle, type_parameters });
        }
        break;
      }

      case TableKind.SIGNATURES: {
        const signatures_bytes = tables_byte.slice(
          table.table_offset,
          table.table_offset + table.count
        );
        const deSignatures = new Deserializer(signatures_bytes);

        while (deSignatures.remaining() > 0) {
          const signature_len = bcs.U8.read(deSignatures);
          const tokens = Array.from({ length: signature_len }, () => {
            return load_signature_token(deSignatures, version);
          });
          signatures.push(tokens);
        }
        break;
      }
      case TableKind.CONSTANT_POOL: {
        const constant_pool_bytes = tables_byte.slice(
          table.table_offset,
          table.table_offset + table.count
        );
        const deConstantPool = new Deserializer(constant_pool_bytes);
        while (deConstantPool.remaining() > 0) {
          const constant_pool_token = load_signature_token(deConstantPool, version);
          const size = deConstantPool.deserializeUleb128AsU32();
          const constant_pool_values = new Uint8Array(
            Array.from({ length: size }, () => {
              return deConstantPool.deserializeU8();
            })
          );
          constant_pool.push({
            type: constant_pool_token as SignatureToken,
            data: constant_pool_values,
          });
        }
        break;
      }
      case TableKind.IDENTIFIERS: {
        const deIdentifiers = new Deserializer(
          tables_byte.slice(table.table_offset, table.table_offset + table.count)
        );
        while (deIdentifiers.remaining() > 0) {
          const len = deIdentifiers.deserializeUleb128AsU32();
          const identifiers_byte = new Uint8Array(
            Array.from({ length: len }, () => {
              return deIdentifiers.deserializeU8();
            })
          );
          identifiers.push(Buffer.from(identifiers_byte).toString("utf-8"));
        }
        break;
      }
      case TableKind.ADDRESS_IDENTIFIERS: {
        const deAddressIdentifiers = new Deserializer(
          tables_byte.slice(table.table_offset, table.table_offset + table.count)
        );
        while (deAddressIdentifiers.remaining() > 0) {
          const address = new Uint8Array(
            Array.from({ length: 32 }, () => {
              return deAddressIdentifiers.deserializeU8();
            })
          );
          address_identifiers.push(Buffer.from(address).toString("hex"));
        }
        break;
      }
      case TableKind.STRUCT_DEFS:
      case TableKind.STRUCT_DEF_INST:
      case TableKind.FUNCTION_DEFS:
      case TableKind.FIELD_HANDLES:
      case TableKind.FIELD_INST:
        break;
      case TableKind.FRIEND_DECLS:
        if (version < 2) {
          throw new Error(`Table kind ${table.kind} is not supported in version ${version}`);
        }
        break;
      case TableKind.METADATA: {
        if (version < 5) {
          throw new Error(`Metadata table is not supported in version ${version}`);
        }
        const deMetadata = new Deserializer(
          tables_byte.slice(table.table_offset, table.table_offset + table.count)
        );
        while (deMetadata.remaining() > 0) {
          const key_len = deMetadata.deserializeUleb128AsU32();
          const key = new Uint8Array(
            Array.from({ length: key_len }, () => {
              return deMetadata.deserializeU8();
            })
          );

          const value_len = deMetadata.deserializeUleb128AsU32();
          const value = new Uint8Array(
            Array.from({ length: value_len }, () => {
              return deMetadata.deserializeU8();
            })
          );

          metadatas.push({
            key,
            value,
          });
        }
        break;
      }
      case TableKind.VARIANT_FIELD_HANDLES:
      case TableKind.VARIANT_FIELD_INST:
      case TableKind.STRUCT_VARIANT_HANDLES:
      case TableKind.STRUCT_VARIANT_INST: {
        if (version < 7) {
          throw new Error(`Enum types not available for bytecode version ${version}`);
        }
        break;
      }
      default:
        console.warn(`Unknown table kind ${table.kind} at index ${idx}`);
    }
  });

  const struct_defs: Array<StructDefinition> = [];
  const struct_defs_inst: Array<StructDefInstantiation> = [];

  const function_defs: Array<FunctionDefinition> = [];
  const field_defs: Array<FieldHandle> = [];
  const field_insts: Array<FieldInstantiation> = [];
  const friend_decls: Array<ModuleHandle> = [];
  const variant_field_handles: Array<VariantFieldHandle> = [];
  const variant_field_inst: Array<VariantFieldInstantiation> = [];
  const struct_variant_handles: Array<StructVariantHandle> = [];
  const struct_variant_inst: Array<StructVariantInstantiation> = [];

  tables.forEach((table) => {
    switch (table.kind) {
      case TableKind.STRUCT_DEFS: {
        const deStructDefs = new Deserializer(
          tables_byte.slice(table.table_offset, table.table_offset + table.count)
        );
        while (deStructDefs.remaining() > 0) {
          const struct_handle = deStructDefs.deserializeUleb128AsU32();
          const field_information_flag = deStructDefs.deserializeU8();
          switch (field_information_flag) {
            case 0x01:
              // NATIVE
              struct_defs.push({
                struct_handle,
                field_information: { kind: "Native" },
              });
              break;
            case 0x02: {
              // DECLARED
              const field_count = deStructDefs.deserializeUleb128AsU32();
              const fields: Array<FieldDefinition> = Array.from({ length: field_count }, () => {
                return {
                  name: deStructDefs.deserializeUleb128AsU32(),
                  type: load_signature_token(deStructDefs, version) as SignatureToken,
                };
              });
              struct_defs.push({
                struct_handle,
                field_information: { kind: "Declared", fields },
              });
              break;
            }
            case 0x03: {
              // UNRESTRICTED
              if (version >= 7) {
                const variant_count = deStructDefs.deserializeUleb128AsU32();
                const variants: Array<VariantDefinition> = Array.from(
                  { length: variant_count },
                  () => {
                    const name = deStructDefs.deserializeUleb128AsU32();
                    const fields: Array<FieldDefinition> = Array.from(
                      { length: deStructDefs.deserializeUleb128AsU32() },
                      () => {
                        return {
                          name: deStructDefs.deserializeUleb128AsU32(),
                          type: load_signature_token(deStructDefs, version) as SignatureToken,
                        };
                      }
                    );
                    return { name, fields };
                  }
                );
                struct_defs.push({
                  struct_handle,
                  field_information: { kind: "DeclaredVariants", variants },
                });
              } else {
                throw new Error(
                  `Unrestricted field information is not supported in version ${version}`
                );
              }
              break;
            }
            default:
              throw new Error(`Unknown field information flag: ${field_information_flag}`);
          }
        }
        break;
      }
      case TableKind.STRUCT_DEF_INST: {
        const deStructDefInst = new Deserializer(
          tables_byte.slice(table.table_offset, table.table_offset + table.count)
        );
        while (deStructDefInst.remaining() > 0) {
          const def = deStructDefInst.deserializeUleb128AsU32();
          const type_parameters = deStructDefInst.deserializeUleb128AsU32();
          struct_defs_inst.push({
            def,
            typeParameters: type_parameters,
          });
        }
        break;
      }
      case TableKind.FUNCTION_DEFS: {
        const deFunctionDefs = new Deserializer(
          tables_byte.slice(table.table_offset, table.table_offset + table.count)
        );
        while (deFunctionDefs.remaining() > 0) {
          const function_ = deFunctionDefs.deserializeUleb128AsU32();
          let flag = deFunctionDefs.deserializeU8();

          let vis: Visibility | undefined = undefined;
          let is_entry = false;
          let extra_flags = 0;
          if (version == 1) {
            if ((flag & 1) != 0) {
              flag ^= 1;
              vis = "public";
            } else {
              vis = "private";
            }

            is_entry = false;
            extra_flags = flag;
          } else if (version < 5) {
            if (flag == 2) {
              vis = "public";
              is_entry = true;
            } else {
              switch (flag) {
                case 0:
                  vis = "private";
                  break;
                case 1:
                  vis = "public";
                  break;
                case 3:
                  vis = "friend";
                  break;
                default:
                  throw new Error(`Unknown function definition flag: ${flag}`);
              }
              is_entry = false;
              extra_flags = deFunctionDefs.deserializeU8();
            }
          } else {
            switch (flag) {
              case 0:
                vis = "private";
                break;
              case 1:
                vis = "public";
                break;
              case 3:
                vis = "friend";
                break;
              default:
                throw new Error(`Unknown function definition flag: ${flag}`);
            }
            extra_flags = deFunctionDefs.deserializeU8();
            is_entry = (extra_flags & 4) != 0;
            if (is_entry) {
              extra_flags ^= 4;
            }
          }
          const acquires_global_resources: Array<number> = Array.from(
            { length: deFunctionDefs.deserializeUleb128AsU32() },
            () => {
              return deFunctionDefs.deserializeUleb128AsU32();
            }
          );
          let code_unit: CodeUnit | undefined = undefined;
          if ((extra_flags & 2) != 0) {
            extra_flags ^= 2;
          } else {
            const locals = deFunctionDefs.deserializeUleb128AsU32();
            const codes = load_code(deFunctionDefs, version);
            code_unit = {
              locals,
              code: codes,
            };
          }
          function_defs.push({
            function: function_,
            visibility: vis,
            isEntry: is_entry,
            acquiresGlobalResources: acquires_global_resources,
            code: code_unit,
          });
        }
        break;
      }
      case TableKind.FIELD_HANDLES: {
        const deFieldHandles = new Deserializer(
          tables_byte.slice(table.table_offset, table.table_offset + table.count)
        );
        while (deFieldHandles.remaining() > 0) {
          const struct_idx = deFieldHandles.deserializeUleb128AsU32();
          const offset = deFieldHandles.deserializeUleb128AsU32();
          field_defs.push({
            owner: struct_idx,
            field: offset,
          });
        }
        break;
      }
      case TableKind.FIELD_INST: {
        const deFieldInst = new Deserializer(
          tables_byte.slice(table.table_offset, table.table_offset + table.count)
        );
        while (deFieldInst.remaining() > 0) {
          const handle = deFieldInst.deserializeUleb128AsU32();
          const type_parameters = deFieldInst.deserializeUleb128AsU32();
          field_insts.push({
            handle,
            typeParameters: type_parameters,
          });
        }
        break;
      }
      case TableKind.FRIEND_DECLS: {
        const deFriendDecls = new Deserializer(
          tables_byte.slice(table.table_offset, table.table_offset + table.count)
        );
        while (deFriendDecls.remaining() > 0) {
          const address = deFriendDecls.deserializeUleb128AsU32();
          const name = deFriendDecls.deserializeUleb128AsU32();
          friend_decls.push({
            address,
            name,
          });
        }
        break;
      }
      case TableKind.VARIANT_FIELD_HANDLES: {
        const deVariantFieldHandles = new Deserializer(
          tables_byte.slice(table.table_offset, table.table_offset + table.count)
        );
        while (deVariantFieldHandles.remaining() > 0) {
          const owner = deVariantFieldHandles.deserializeUleb128AsU32();
          const offset = deVariantFieldHandles.deserializeUleb128AsU32();
          const variant_count = deVariantFieldHandles.deserializeUleb128AsU32();
          const variants = Array.from({ length: variant_count }, () => {
            return deVariantFieldHandles.deserializeUleb128AsU32();
          });
          variant_field_handles.push({
            struct_index: owner,
            field: offset,
            variants,
          });
        }
        break;
      }
      case TableKind.VARIANT_FIELD_INST: {
        const deVariantFieldInst = new Deserializer(
          tables_byte.slice(table.table_offset, table.table_offset + table.count)
        );
        while (deVariantFieldInst.remaining() > 0) {
          const handle = deVariantFieldInst.deserializeUleb128AsU32();
          const type_parameters = deVariantFieldInst.deserializeUleb128AsU32();
          variant_field_inst.push({
            handle,
            typeParameters: type_parameters,
          });
        }
        break;
      }
      case TableKind.STRUCT_VARIANT_HANDLES: {
        const deStructVariantHandles = new Deserializer(
          tables_byte.slice(table.table_offset, table.table_offset + table.count)
        );
        while (deStructVariantHandles.remaining() > 0) {
          const struct_index = deStructVariantHandles.deserializeUleb128AsU32();
          const variant = deStructVariantHandles.deserializeUleb128AsU32();
          struct_variant_handles.push({
            struct_index,
            variant,
          });
        }
        break;
      }
      case TableKind.STRUCT_VARIANT_INST: {
        const deStructVariantInst = new Deserializer(
          tables_byte.slice(table.table_offset, table.table_offset + table.count)
        );
        while (deStructVariantInst.remaining() > 0) {
          const handle = deStructVariantInst.deserializeUleb128AsU32();
          const type_parameters = deStructVariantInst.deserializeUleb128AsU32();
          struct_variant_inst.push({
            handle,
            type_parameters,
          });
        }
        break;
      }
      default:
        break;
    }
  });

  return {
    magic,
    version,
    selfModuleHandleIdx,
    module_handles,
    struct_handles,
    function_handles,
    function_inst,
    struct_defs_inst,
    signatures,
    constant_pool,
    identifiers,
    address_identifiers,
    metadatas,
    function_defs,
    struct_defs,
    field_handles: field_defs,
    field_insts,
    friend_decls,
    variant_field_handles,
    variant_field_inst,
    struct_variant_handles,
    struct_variant_inst,
  };
}

export function disassemble_instruction(
  instruction: Bytecode,
  params: string[],
  locals: string[],
  module: MoveModule
): string {
  switch (instruction.kind) {
    case "LdConst": {
      const constant = module.constant_pool[instruction.constIdx];
      return `LdConst[${instruction.constIdx}](${parseSignatureToken(constant.type, module)}: ${constant.data})`;
    }

    // Local variable operations - use helper function to reduce duplication
    case "CopyLoc":
    case "MoveLoc":
    case "StLoc":
    case "MutBorrowLoc":
    case "ImmBorrowLoc":
      return formatLocalInstruction(instruction, instruction.kind, params, locals);

    // Field operations
    case "MutBorrowField": {
      const fieldHandle = module.field_handles[instruction.fieldHandleIdx];
      const { structName, field, fieldType } = getFieldInfo(fieldHandle, module);
      return formatFieldInstruction(
        "MutBorrowField",
        instruction.fieldHandleIdx,
        structName,
        module.identifiers[field.name],
        fieldType
      );
    }

    case "MutBorrowFieldGeneric": {
      const fieldInst = module.field_insts[instruction.fieldInstIdx];
      const fieldHandle = module.field_handles[fieldInst.handle];
      const { structName, field, fieldType } = getFieldInfo(fieldHandle, module);
      return formatFieldInstruction(
        "MutBorrowFieldGeneric",
        instruction.fieldInstIdx,
        structName,
        module.identifiers[field.name],
        fieldType
      );
    }

    case "ImmBorrowField": {
      const fieldHandle = module.field_handles[instruction.fieldHandleIdx];
      const { structName, field, fieldType } = getFieldInfo(fieldHandle, module);
      return formatFieldInstruction(
        "ImmBorrowField",
        instruction.fieldHandleIdx,
        structName,
        module.identifiers[field.name],
        fieldType
      );
    }

    case "ImmBorrowFieldGeneric": {
      const fieldInst = module.field_insts[instruction.fieldInstIdx];
      const fieldHandle = module.field_handles[fieldInst.handle];
      const { structName, field, fieldType } = getFieldInfo(fieldHandle, module);
      return formatFieldInstruction(
        "ImmBorrowFieldGeneric",
        instruction.fieldInstIdx,
        structName,
        module.identifiers[field.name],
        fieldType
      );
    }

    case "MutBorrowVariantField":
      throw new Error("MutBorrowVariantField is not implemented yet");
    case "MutBorrowVariantFieldGeneric":
      throw new Error("MutBorrowVariantFieldGeneric is not implemented yet");
    case "ImmBorrowVariantField":
      throw new Error("ImmBorrowVariantField is not implemented yet");
    case "ImmBorrowVariantFieldGeneric":
      throw new Error("ImmBorrowVariantFieldGeneric is not implemented yet");

    // Struct packing/unpacking operations
    case "Pack":
      return formatStructInstruction(instruction, "Pack", module);
    case "Unpack":
      return formatStructInstruction(instruction, "Unpack", module);
    case "PackGeneric":
      return formatGenericStructInstruction(instruction, "PackGeneric", module);
    case "UnpackGeneric":
      return formatGenericStructInstruction(instruction, "UnpackGeneric", module);

    // Variant operations
    case "PackVariant": {
      const structVariantHandle = module.struct_variant_handles[instruction.structVariantHandleIdx];
      const { structName, variantName } = getVariantInfo(structVariantHandle, module);
      return `PackVariant[${instruction.structVariantHandleIdx}](${structName}/${variantName})`;
    }

    case "PackVariantGeneric": {
      const struct_variant_inst = module.struct_variant_inst[instruction.structVariantInstIdx];
      const type_params = module.signatures[struct_variant_inst.type_parameters];
      const struct_variant_handle = module.struct_variant_handles[struct_variant_inst.handle];
      const { structName: struct_name, variantName } = getVariantInfo(
        struct_variant_handle,
        module
      );

      const structTypeParams = type_params!.map((tp) => {
        return parseSignatureToken(tp, module);
      });
      const typeParamsStr = structTypeParams?.length > 0 ? `<${structTypeParams.join(", ")}>` : "";
      return `PackVariantGeneric[${instruction.structVariantInstIdx}](${struct_name}/${variantName}${typeParamsStr})`;
    }
    case "UnpackVariant": {
      const structVariantHandle = module.struct_variant_handles[instruction.structVariantHandleIdx];
      const { structName, variantName } = getVariantInfo(structVariantHandle, module);
      return `UnpackVariant[${instruction.structVariantHandleIdx}](${structName}/${variantName})`;
    }
    case "UnpackVariantGeneric": {
      const struct_variant_inst = module.struct_variant_inst[instruction.structVariantInstIdx];
      const type_params = module.signatures[struct_variant_inst.type_parameters];
      const struct_variant_handle = module.struct_variant_handles[struct_variant_inst.handle];
      const { structName: struct_name, variantName } = getVariantInfo(
        struct_variant_handle,
        module
      );

      const structTypeParams = type_params!.map((tp) => {
        return parseSignatureToken(tp, module);
      });
      const typeParamsStr = structTypeParams?.length > 0 ? `<${structTypeParams.join(", ")}>` : "";
      return `UnpackVariantGeneric[${instruction.structVariantInstIdx}](${struct_name}/${variantName}${typeParamsStr})`;
    }
    case "TestVariant": {
      const structVariantHandle = module.struct_variant_handles[instruction.structVariantHandleIdx];
      const { structName, variantName } = getVariantInfo(structVariantHandle, module);
      return `TestVariant[${instruction.structVariantHandleIdx}](${structName}/${variantName})`;
    }
    case "TestVariantGeneric": {
      const struct_variant_inst = module.struct_variant_inst[instruction.structVariantInstIdx];
      const type_params = module.signatures[struct_variant_inst.type_parameters];
      const struct_variant_handle = module.struct_variant_handles[struct_variant_inst.handle];
      const { structName: struct_name, variantName } = getVariantInfo(
        struct_variant_handle,
        module
      );

      const structTypeParams = type_params!.map((tp) => {
        return parseSignatureToken(tp, module);
      });
      const typeParamsStr = structTypeParams?.length > 0 ? `<${structTypeParams.join(", ")}>` : "";
      return `TestVariantGeneric[${instruction.structVariantInstIdx}](${struct_name}/${variantName}${typeParamsStr})`;
    }
    case "Exists": {
      const structDef = module.struct_defs[instruction.structDefIdx];
      const structName = module.identifiers[module.struct_handles[structDef.struct_handle].name];
      return `Exists[${instruction.structDefIdx}](${structName})`;
    }
    case "ExistsGeneric": {
      const structDefInst = module.struct_defs_inst[instruction.structInstIdx];
      const structDef = module.struct_defs[structDefInst.def];
      const structName = module.identifiers[module.struct_handles[structDef.struct_handle].name];
      const typeParams = module.signatures[structDefInst.typeParameters]!.map((tp) => {
        return parseSignatureToken(tp, module);
      });
      const typeParamsStr = typeParams?.length > 0 ? `<${typeParams.join(", ")}>` : "";
      return `ExistsGeneric[${instruction.structInstIdx}](${structName}${typeParamsStr})`;
    }
    case "MutBorrowGlobal": {
      const structDef = module.struct_defs[instruction.structDefIdx];
      const structName = module.identifiers[module.struct_handles[structDef.struct_handle].name];
      return `MutBorrowGlobal[${instruction.structDefIdx}](${structName})`;
    }
    case "MutBorrowGlobalGeneric": {
      const structDefInst = module.struct_defs_inst[instruction.structInstIdx];
      const structDef = module.struct_defs[structDefInst.def];
      const structName = module.identifiers[module.struct_handles[structDef.struct_handle].name];
      const typeParams = module.signatures[structDefInst.typeParameters]!.map((tp) => {
        return parseSignatureToken(tp, module);
      });
      const typeParamsStr = typeParams?.length > 0 ? `<${typeParams.join(", ")}>` : "";
      return `MutBorrowGlobalGeneric[${instruction.structInstIdx}](${structName}${typeParamsStr})`;
    }
    case "ImmBorrowGlobal": {
      const structDef = module.struct_defs[instruction.structDefIdx];
      const structName = module.identifiers[module.struct_handles[structDef.struct_handle].name];
      return `ImmBorrowGlobal[${instruction.structDefIdx}](${structName})`;
    }
    case "ImmBorrowGlobalGeneric": {
      const structDefInst = module.struct_defs_inst[instruction.structInstIdx];
      const structDef = module.struct_defs[structDefInst.def];
      const structName = module.identifiers[module.struct_handles[structDef.struct_handle].name];
      const typeParams = module.signatures[structDefInst.typeParameters]!.map((tp) => {
        return parseSignatureToken(tp, module);
      });
      const typeParamsStr = typeParams?.length > 0 ? `<${typeParams.join(", ")}>` : "";
      return `ImmBorrowGlobalGeneric[${instruction.structInstIdx}](${structName}${typeParamsStr})`;
    }
    case "MoveFrom": {
      const structDef = module.struct_defs[instruction.structDefIdx];
      const structName = module.identifiers[module.struct_handles[structDef.struct_handle].name];
      return `MoveFrom[${instruction.structDefIdx}](${structName})`;
    }
    case "MoveFromGeneric": {
      const structDefInst = module.struct_defs_inst[instruction.structInstIdx];
      const structDef = module.struct_defs[structDefInst.def];
      const structName = module.identifiers[module.struct_handles[structDef.struct_handle].name];
      const typeParams = module.signatures[structDefInst.typeParameters]!.map((tp) => {
        return parseSignatureToken(tp, module);
      });
      const typeParamsStr = typeParams?.length > 0 ? `<${typeParams.join(", ")}>` : "";
      return `MoveFromGeneric[${instruction.structInstIdx}](${structName}${typeParamsStr})`;
    }
    case "MoveTo": {
      const structDef = module.struct_defs[instruction.structDefIdx];
      const structName = module.identifiers[module.struct_handles[structDef.struct_handle].name];
      return `MoveTo[${instruction.structDefIdx}](${structName})`;
    }
    case "MoveToGeneric": {
      const structDefInst = module.struct_defs_inst[instruction.structInstIdx];
      const structDef = module.struct_defs[structDefInst.def];
      const structName = module.identifiers[module.struct_handles[structDef.struct_handle].name];
      const typeParams = module.signatures[structDefInst.typeParameters]!.map((tp) => {
        return parseSignatureToken(tp, module);
      });
      const typeParamsStr = typeParams?.length > 0 ? `<${typeParams.join(", ")}>` : "";
      return `MoveToGeneric[${instruction.structInstIdx}](${structName}${typeParamsStr})`;
    }
    case "CallClosure": {
      const closure_sign = module.signatures[instruction.sigIdx];
      const closure_type = closure_sign!.map((tp) => {
        return parseSignatureToken(tp, module);
      });
      if (closure_type.length != 1) {
        throw new Error("CallClosure with type parameters is not supported yet");
      }
      return `CallClosure[${instruction.sigIdx}](${closure_type.at(0)})`;
    }
    case "Call":
    case "PackClosure": {
      let funcHandleIdx;
      if (instruction.kind === "PackClosure") {
        funcHandleIdx = instruction.fun;
      } else {
        funcHandleIdx = instruction.funcHandleIdx;
      }
      const function_handle = module.function_handles[funcHandleIdx];
      const function_name = module.identifiers[function_handle.name];
      const module_handle = module.module_handles[function_handle.module];
      let function_string = "";
      if (module.selfModuleHandleIdx == function_handle.module) {
        function_string = `${function_name}`;
      } else {
        function_string = `${module.identifiers[module_handle.name]}::${function_name}`;
      }
      const type_arguments = function_handle.type_parameters.map((tp) => {
        return parseAbilities(tp);
      });
      const typeParamsStr = type_arguments?.length > 0 ? `<${type_arguments.join(", ")}>` : "";

      let op_name;
      if (instruction.kind === "PackClosure") {
        op_name = `PackClosure#${instruction.mask}`;
      } else {
        op_name = "Call";
      }
      return `${op_name}[${funcHandleIdx}](${function_string}${typeParamsStr})`;
    }
    case "PackClosureGeneric":
    case "CallGeneric": {
      // throw new Error("CallGeneric is not implemented yet");
      return `CallGeneric`;
    }

    case "LdU16":
      return `LdU16(${instruction.value})`;
    case "LdU32":
      return `LdU32(${instruction.value})`;
    case "LdU256":
      return `LdU256(${instruction.value})`;
    case "VecPack":
      return `VecPack(${instruction.elemTyIdx}, ${instruction.numElements})`;
    case "VecLen":
      return `VecLen(${instruction.elemTyIdx})`;
    case "VecImmBorrow":
      return `VecImmBorrow(${instruction.elemTyIdx})`;
    case "VecMutBorrow":
      return `VecMutBorrow(${instruction.elemTyIdx})`;
    case "VecPushBack":
      return `VecPushBack(${instruction.elemTyIdx})`;
    case "VecPopBack":
      return `VecPopBack(${instruction.elemTyIdx})`;
    case "VecUnpack":
      return `VecUnpack(${instruction.elemTyIdx}, ${instruction.numElements})`;
    case "VecSwap":
      return `VecSwap(${instruction.elemTyIdx})`;
    case "BrTrue":
      return `BrTrue(${instruction.codeOffset})`;
    case "BrFalse":
      return `BrFalse(${instruction.codeOffset})`;
    case "Branch":
      return `Branch(${instruction.codeOffset})`;
    case "LdU8":
      return `LdU8(${instruction.value})`;
    case "LdU64":
      return `LdU64(${instruction.value})`;
    case "LdU128":
      return `LdU128(${instruction.value})`;
    default:
      return `${instruction.kind}`;
  }
}
