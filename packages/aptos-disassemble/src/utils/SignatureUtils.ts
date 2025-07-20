/**
 * Utility functions for parsing signature tokens and abilities
 */
import { SignatureToken, MoveModule } from "../types/MoveModule";

export const AbilityValues = {
  Copy: 0x1,
  Drop: 0x2,
  Store: 0x4,
  Key: 0x8,
};

export function parseAbilities(abilities: number): string[] {
  const result: string[] = [];
  if (abilities & AbilityValues.Copy) result.push("copy");
  if (abilities & AbilityValues.Drop) result.push("drop");
  if (abilities & AbilityValues.Store) result.push("store");
  if (abilities & AbilityValues.Key) result.push("key");
  return result;
}

export function parseSignatureToken(token: SignatureToken, module: MoveModule): string {
  switch (token.kind) {
    case "Bool":
      return "bool";
    case "U8":
      return "u8";
    case "U16":
      return "u16";
    case "U32":
      return "u32";
    case "U64":
      return "u64";
    case "U128":
      return "u128";
    case "U256":
      return "u256";
    case "Address":
      return "address";
    case "Signer":
      return "signer";
    case "Vector":
      return `vector<${parseSignatureToken(token.type, module)}>`;
    case "Reference":
      return `&${parseSignatureToken(token.type, module)}`;
    case "MutableReference":
      return `&mut ${parseSignatureToken(token.type, module)}`;
    case "TypeParameter":
      return `T${token.index}`;
    case "Struct": {
      const structHandle = module.struct_handles[token.handle];
      if (!structHandle) {
        throw new Error(`Struct handle at index ${token.handle} is out of bounds`);
      }
      const structName = module.identifiers[structHandle.name];
      if (!structName) {
        throw new Error(`Struct name at index ${structHandle.name} is out of bounds`);
      }

      // Only add module prefix if it's not the current module
      if (structHandle.module === module.selfModuleHandleIdx) {
        return structName;
      } else {
        const moduleHandle = module.module_handles[structHandle.module];
        if (!moduleHandle) {
          throw new Error(`Module handle at index ${structHandle.module} is out of bounds`);
        }
        const moduleName = module.identifiers[moduleHandle.name];
        if (!moduleName) {
          throw new Error(`Module name at index ${moduleHandle.name} is out of bounds`);
        }
        return `${moduleName}::${structName}`;
      }
    }
    case "StructInstantiation": {
      const structHandle = module.struct_handles[token.handle];
      if (!structHandle) {
        throw new Error(`Struct handle at index ${token.handle} is out of bounds`);
      }
      const structName = module.identifiers[structHandle.name];
      if (!structName) {
        throw new Error(`Struct name at index ${structHandle.name} is out of bounds`);
      }
      const typeParams = token.typeParams.map((tp) => parseSignatureToken(tp, module));

      // Only add module prefix if it's not the current module
      if (structHandle.module === module.selfModuleHandleIdx) {
        return `${structName}<${typeParams.join(", ")}>`;
      } else {
        const moduleHandle = module.module_handles[structHandle.module];
        if (!moduleHandle) {
          throw new Error(`Module handle at index ${structHandle.module} is out of bounds`);
        }
        const moduleName = module.identifiers[moduleHandle.name];
        if (!moduleName) {
          throw new Error(`Module name at index ${moduleHandle.name} is out of bounds`);
        }
        return `${moduleName}::${structName}<${typeParams.join(", ")}>`;
      }
    }
    case "Function": {
      const args = token.args.map((arg) => parseSignatureToken(arg, module));
      const results = token.results.map((result) => parseSignatureToken(result, module));
      const abilities = parseAbilities(token.abilities);
      const abilitiesStr = abilities.length > 0 ? ` + ${abilities.join(" + ")}` : "";
      return `|${args.join(", ")}| -> (${results.join(", ")})${abilitiesStr}`;
    }
    default:
      throw new Error(`Unknown signature token kind: ${token}`);
  }
}
