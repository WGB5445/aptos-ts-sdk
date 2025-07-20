/**
 * Main entry point for the aptos-disassemble package
 * Provides clean, class-based API for Move bytecode disassembly
 */

// Export main classes
export { DisassemblerContext } from "./core/DisassemblerContext";
export { VMControlFlowGraph } from "./core/ControlFlowGraph";
export type { ControlFlowGraph } from "./core/ControlFlowGraph";
export { ModuleDisassembler } from "./disassemblers/ModuleDisassembler";
export { InstructionDisassembler } from "./disassemblers/InstructionDisassembler";
export { BytecodeLoader } from "./loaders/BytecodeLoader";

// Export types
export * from "./types/MoveModule";
export type { DisassemblerOptions } from "./types/DisassemblerOptions";

// Export utilities
export { parseSignatureToken, parseAbilities } from "./utils/SignatureUtils";

// Export compatibility functions
export { disassembleMoveModule, disassemble_instruction } from "./types";

import { BytecodeLoader } from "./loaders/BytecodeLoader";
import { DisassemblerContext } from "./core/DisassemblerContext";
import { ModuleDisassembler } from "./disassemblers/ModuleDisassembler";
import { VMControlFlowGraph } from "./core/ControlFlowGraph";
import { MoveModule } from "./types/MoveModule";
import { DisassemblerOptions } from "./types/DisassemblerOptions";

/**
 * Main disassembly function - improved version with class-based architecture
 */
export function disassemble(module: MoveModule, options?: Partial<DisassemblerOptions>): string {
  const context = new DisassemblerContext(module, options);
  const disassembler = new ModuleDisassembler(context);
  return disassembler.disassemble();
}

/**
 * Convenience function to disassemble bytecode directly to string
 */
export function disassemble_to_string(bytecode: Uint8Array | Buffer, options?: Partial<DisassemblerOptions>): string {
  const module = BytecodeLoader.loadFromBytecode(bytecode);
  return disassemble(module, options);
}

/**
 * Class-based API for more advanced usage
 */
export class MoveDisassembler {
  private context: DisassemblerContext;
  private moduleDisassembler: ModuleDisassembler;

  constructor(module: MoveModule, options?: Partial<DisassemblerOptions>) {
    this.context = new DisassemblerContext(module, options);
    this.moduleDisassembler = new ModuleDisassembler(this.context);
  }

  static fromBytecode(bytecode: Uint8Array | Buffer, options?: Partial<DisassemblerOptions>): MoveDisassembler {
    const module = BytecodeLoader.loadFromBytecode(bytecode);
    return new MoveDisassembler(module, options);
  }

  disassemble(): string {
    return this.moduleDisassembler.disassemble();
  }

  getContext(): DisassemblerContext {
    return this.context;
  }

  getModule(): MoveModule {
    return this.context.getRawModule();
  }

  getSelfModuleName(): string {
    return this.context.getSelfModuleName();
  }

  getSelfModuleAddress(): string {
    return this.context.getSelfModuleAddress();
  }

  getVersion(): number {
    return this.context.version;
  }

  /**
   * Create a control flow graph for a specific function in the module
   */
  createControlFlowGraph(functionIndex: number): VMControlFlowGraph {
    const module = this.context.getRawModule();
    if (!module.function_defs || functionIndex >= module.function_defs.length) {
      throw new Error(`Function index ${functionIndex} out of bounds`);
    }
    
    const functionDef = module.function_defs[functionIndex];
    if (!functionDef.code) {
      throw new Error(`Function at index ${functionIndex} has no code`);
    }
    
    return new VMControlFlowGraph(functionDef.code.code);
  }
}
