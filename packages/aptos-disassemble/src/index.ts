/**
 * Main entry point for the aptos-disassemble package
 * Provides clean, class-based API for Move bytecode disassembly
 */

// Export main classes
export { DisassemblerContext } from "./core/DisassemblerContext";
export { ModuleDisassembler } from "./disassemblers/ModuleDisassembler";
export { InstructionDisassembler } from "./disassemblers/InstructionDisassembler";
export { BytecodeLoader } from "./loaders/BytecodeLoader";

// Export types
export * from "./types/MoveModule";

// Export utilities
export { parseSignatureToken, parseAbilities } from "./utils/SignatureUtils";

// Export compatibility functions
export { disassembleMoveModule, disassemble_instruction } from "./types";

import { BytecodeLoader } from "./loaders/BytecodeLoader";
import { DisassemblerContext } from "./core/DisassemblerContext";
import { ModuleDisassembler } from "./disassemblers/ModuleDisassembler";
import { MoveModule } from "./types/MoveModule";

/**
 * Main disassembly function - improved version with class-based architecture
 */
export function disassemble(module: MoveModule): string {
  const context = new DisassemblerContext(module);
  const disassembler = new ModuleDisassembler(context);
  return disassembler.disassemble();
}

/**
 * Convenience function to disassemble bytecode directly to string
 */
export function disassemble_to_string(bytecode: Uint8Array | Buffer): string {
  const module = BytecodeLoader.loadFromBytecode(bytecode);
  return disassemble(module);
}

/**
 * Class-based API for more advanced usage
 */
export class MoveDisassembler {
  private context: DisassemblerContext;
  private moduleDisassembler: ModuleDisassembler;

  constructor(module: MoveModule) {
    this.context = new DisassemblerContext(module);
    this.moduleDisassembler = new ModuleDisassembler(this.context);
  }

  static fromBytecode(bytecode: Uint8Array | Buffer): MoveDisassembler {
    const module = BytecodeLoader.loadFromBytecode(bytecode);
    return new MoveDisassembler(module);
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
}
