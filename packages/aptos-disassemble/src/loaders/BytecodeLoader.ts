import { disassembleMoveModule } from "../types";

/**
 * Loader for Move bytecode modules.
 */
export class BytecodeLoader {
  static loadFromBytecode(bytecode: Uint8Array) {
    return disassembleMoveModule(bytecode);
  }
}
