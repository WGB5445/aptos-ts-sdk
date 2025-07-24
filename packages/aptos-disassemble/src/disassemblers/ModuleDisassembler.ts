/**
 * ModuleDisassembler - Handles disassembly of entire Move modules
 */
import { DisassemblerContext } from "../core/DisassemblerContext";
import { InstructionDisassembler } from "./InstructionDisassembler";
import { VMControlFlowGraph } from "../core/ControlFlowGraph";
import { DisassemblerOptions } from "../types/DisassemblerOptions";

export class ModuleDisassembler {
  private readonly options: DisassemblerOptions;

  constructor(private readonly context: DisassemblerContext) {
    this.options = this.context.options;
  }

  disassemble(): string {
    const { moduleNames, moduleAliases } = this.buildModuleAliases();

    const header = this.generateHeader();
    const imports = this.generateImports(moduleNames, moduleAliases);
    const structs = this.generateStructs();
    const functions = this.generateFunctions();

    return `// Move bytecode v${this.context.version}\n${header} {\n\n${imports}\n\n${structs}\n\n${functions}\n\n}`;
  }

  private buildModuleAliases(): {
    moduleNames: Map<string, number>;
    moduleAliases: Map<string, string>;
  } {
    const moduleNames = new Map<string, number>();
    const moduleAliases = new Map<string, string>();
    const rawModule = this.context.getRawModule();

    const selfModuleName = this.context.getSelfModuleName();
    moduleNames.set(selfModuleName, 0);

    for (const moduleHandle of rawModule.module_handles) {
      const name = this.context.getIdentifier(moduleHandle.name);

      if (moduleNames.has(name)) {
        const count = moduleNames.get(name)!;
        moduleNames.set(name, count + 1);
        moduleAliases.set(name, `${count + 1}${name}`);
      } else {
        moduleNames.set(name, 0);
        moduleAliases.set(name, `${0}${name}`);
      }
    }

    return { moduleNames, moduleAliases };
  }

  private generateHeader(): string {
    const selfModuleAddress = this.context.getSelfModuleAddress();
    const selfModuleName = this.context.getSelfModuleName();
    return `module ${selfModuleAddress}::${selfModuleName}`;
  }

  private generateImports(
    moduleNames: Map<string, number>,
    moduleAliases: Map<string, string>
  ): string {
    const rawModule = this.context.getRawModule();
    const selfModuleAddress = this.context.getSelfModuleAddress();
    const selfModuleName = this.context.getSelfModuleName();

    return rawModule.module_handles
      .filter((m) => {
        const mAddress = this.context.getAddressIdentifier(m.address);
        const mName = this.context.getIdentifier(m.name);
        return `${mAddress}${mName}` !== `${selfModuleAddress}${selfModuleName}`;
      })
      .map((m) => {
        const mAddress = this.context.getAddressIdentifier(m.address);
        const mName = this.context.getIdentifier(m.name);

        if (moduleNames.has(mName) && moduleNames.get(mName)! > 0) {
          return `use ${mAddress}::${mName} as ${moduleAliases.get(mName)};`;
        }
        return `use ${mAddress}::${mName};`;
      })
      .join("\n");
  }

  private generateStructs(): string {
    const rawModule = this.context.getRawModule();

    return rawModule.struct_defs
      .map((structDefinition) => {
        const structHandle = this.context.getStructHandle(structDefinition.struct_handle);
        const structName = this.context.getIdentifier(structHandle.name);
        const abilities = this.context.parseAbilities(structHandle.abilities);
        const structAbilities = abilities.length > 0 ? ` has ${abilities.join(", ")}` : "";

        const structTypeParams = structHandle.type_parameters.map((tp, idx) => {
          const abilities = this.context.parseAbilities(tp.constraints);
          return `${tp.is_phantom ? "phantom " : ""}T${idx}${abilities.length > 0 ? `: ${abilities.join("+ ")}` : ""}`;
        });
        const typeParameters =
          structTypeParams.length > 0 ? `<${structTypeParams.join(", ")}>` : "";

        switch (structDefinition.field_information.kind) {
          case "Native":
            return `native struct ${structName}${typeParameters}${structAbilities}`;
          case "Declared": {
            const fields = structDefinition.field_information.fields
              .map((field) => {
                const fieldName = this.context.getIdentifier(field.name);
                const fieldType = this.context.parseSignatureToken(field.type);
                return `  ${fieldName}: ${fieldType}`;
              })
              .join(",\n");
            return `struct ${structName}${typeParameters}${structAbilities} {\n${fields}\n}`;
          }
          case "DeclaredVariants": {
            const variants = structDefinition.field_information.variants
              .map((variant) => {
                const variantName = this.context.getIdentifier(variant.name);
                return `  ${variantName}`;
              })
              .join(",\n");
            return `struct ${structName}${typeParameters}${structAbilities} {\n${variants}\n}`;
          }
          default:
            throw new Error("Unknown field information");
        }
      })
      .join("\n");
  }

  private generateFunctions(): string {
    const rawModule = this.context.getRawModule();

    return rawModule.function_defs
      .map((functionDefinition) => {
        const functionHandle = this.context.getFunctionHandle(functionDefinition.function);
        const functionName = this.context.getIdentifier(functionHandle.name);

        const modifiers: string[] = [];
        if (functionDefinition.code === undefined) {
          modifiers.push("native");
        }

        if (functionDefinition.isEntry) {
          modifiers.push("entry");
        }

        switch (functionDefinition.visibility) {
          case "public":
            modifiers.push("public");
            break;
          case "friend":
            modifiers.push("public(friend)");
            break;
          case "private":
            break;
          default:
            throw new Error("Unknown function visibility: " + functionDefinition.visibility);
        }

        const typeParameters = functionHandle.type_parameters.map((abilitySet, idx) => {
          const abilities = this.context.parseAbilities(abilitySet);
          return `T${idx}${abilities.length > 0 ? `: ${abilities.join("+ ")}` : ""}`;
        });

        const params = this.context.getSignature(functionHandle.parameters).map((param) => {
          return this.context.parseSignatureToken(param);
        });

        const retType = this.context.getSignature(functionHandle.return_).map((ret) => {
          return this.context.parseSignatureToken(ret);
        });

        let retTypeStr = "";
        if (retType.length === 0) {
          retTypeStr = "";
        } else if (retType.length === 1) {
          retTypeStr = `: ${retType[0]}`;
        } else {
          retTypeStr = `: (${retType.join(", ")})`;
        }

        let body: string[] = [];
        if (functionDefinition.code === undefined) {
          body = [];
        } else {
          const signatures = this.context.getSignature(functionDefinition.code.locals);
          const maxIdx = signatures.length + params.length - 1;
          const width = String(maxIdx).length;
          const locals: string[] = [];

          signatures.forEach((local, idx) => {
            const localType = this.context.parseSignatureToken(local);
            body.push(`L${String(idx + params.length).padEnd(width, " ")} loc${idx}: ${localType}`);
            locals.push(localType);
          });

          const instructionDisassembler = new InstructionDisassembler(this.context, params, locals);

          // Create control flow graph if basic blocks should be printed
          let cfg: VMControlFlowGraph | undefined;
          let blockIdToNumber: Map<number, number> | undefined;

          if (this.options.printBasicBlocks) {
            cfg = new VMControlFlowGraph(functionDefinition.code.code);
            // Create mapping from block ID to block number for display
            blockIdToNumber = new Map();
            cfg.blocks().forEach((blockId, index) => {
              blockIdToNumber!.set(blockId, index);
            });
          }

          functionDefinition.code.code.forEach((instruction, idx) => {
            const instructionStr = instructionDisassembler.disassemble(instruction);

            // Check if this instruction starts a new basic block
            if (this.options.printBasicBlocks && cfg && blockIdToNumber) {
              const blockId = cfg.blocks().find((blockId) => cfg!.blockStart(blockId) === idx);
              if (blockId !== undefined) {
                const blockNumber = blockIdToNumber.get(blockId);
                if (blockNumber !== undefined) {
                  body.push(`B${blockNumber}:`);
                }
              }
            } else if (idx === 0 && !this.options.printBasicBlocks) {
              // Legacy behavior: only add B0: for the first instruction if not using CFG
              body.push(`B0:`);
            }

            body.push(
              `${"".padStart(4, " ")}${`${idx}`.padEnd(4, " ")}:${instructionStr}`
            );
          });
        }

        return (
          `${modifiers.join(" ")}${modifiers.length > 0 ? " " : ""}fun ` +
          `${functionName}` +
          `${typeParameters.length > 0 ? `<${typeParameters.join(", ")}>` : ""}` +
          ` ( ${params.map((param, idx) => `arg${idx}: ${param}`).join(", ")} )` +
          `${retTypeStr}` +
          ` {\n\n` +
          `${body.join("\n")}\n` +
          `}`
        );
      })
      .join("\n\n");
  }
}
