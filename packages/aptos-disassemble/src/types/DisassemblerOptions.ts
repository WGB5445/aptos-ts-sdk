/**
 * Configuration options for the disassembler
 */
export interface DisassemblerOptions {
  /** Whether to print basic block markers (B0:, B1:, etc.) in function code */
  printBasicBlocks?: boolean;
}

export const DEFAULT_DISASSEMBLER_OPTIONS: DisassemblerOptions = {
  printBasicBlocks: true,
};
