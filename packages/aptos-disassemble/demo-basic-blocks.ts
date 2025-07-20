/**
 * Practical example showing how to use the enhanced basic block functionality
 */

import { 
  MoveDisassembler, 
  disassemble_to_string,
  type DisassemblerOptions 
} from "./src/index";

console.log("=== Basic Block Demo ===\n");

// Example: Simple mock bytecode that represents a function with conditional logic
// This would normally come from actual Move bytecode, but for demo purposes we'll create a mock
const mockModule = {
  magic: 0xa11ceb0b,
  version: 7,
  selfModuleHandleIdx: 0,
  module_handles: [
    { address: 0, name: 0 }
  ],
  struct_handles: [],
  function_handles: [
    { 
      module: 0, 
      name: 1, 
      parameters: 0, 
      return_: 0, 
      type_parameters: [],
      access_specifiers: undefined,
      attributes: undefined
    }
  ],
  field_handles: [],
  friend_decls: [],
  struct_defs_inst: [],
  function_inst: [],
  field_insts: [],
  signatures: [[]], // Empty signatures
  identifiers: ["DemoModule", "conditional_function"],
  address_identifiers: ["0x1"],
  constant_pool: [],
  metadatas: [],
  struct_defs: [],
  function_defs: [
    {
      function: 0,
      visibility: "public" as const,
      isEntry: true,
      acquiresGlobalResources: [],
      code: {
        locals: 0, // No local variables
        code: [
          { kind: "LdTrue" as const },              // 0: Load true (Block 0 starts)
          { kind: "BrFalse" as const, codeOffset: 4 }, // 1: If false, jump to 4
          { kind: "LdU8" as const, value: 42 },     // 2: True path (Block 1 starts)
          { kind: "Branch" as const, codeOffset: 5 }, // 3: Jump to end
          { kind: "LdU8" as const, value: 0 },      // 4: False path (Block 2 starts)
          { kind: "Ret" as const }                  // 5: Return (Block 3 starts)
        ]
      }
    }
  ],
  struct_variant_handles: [],
  struct_variant_inst: [],
  variant_field_handles: [],
  variant_field_inst: [],
};

console.log("1. With Basic Block Markers (Default):");
console.log("=====================================");
const disassemblerWithBlocks = new MoveDisassembler(mockModule, { printBasicBlocks: true });
const outputWithBlocks = disassemblerWithBlocks.disassemble();
console.log(outputWithBlocks);

console.log("\n\n2. Without Basic Block Markers (Legacy):");
console.log("========================================");
const disassemblerWithoutBlocks = new MoveDisassembler(mockModule, { printBasicBlocks: false });
const outputWithoutBlocks = disassemblerWithoutBlocks.disassemble();
console.log(outputWithoutBlocks);

console.log("\n\n3. Control Flow Graph Analysis:");
console.log("===============================");
const cfg = disassemblerWithBlocks.createControlFlowGraph(0);
console.log(`Number of basic blocks: ${cfg.numBlocks()}`);
console.log(`Entry block: ${cfg.entryBlockId()}`);
console.log(`Number of back edges (loops): ${cfg.numBackEdges()}`);

cfg.blocks().forEach((blockId, index) => {
  const start = cfg.blockStart(blockId);
  const end = cfg.blockEnd(blockId);
  const successors = cfg.successors(blockId);
  console.log(`Block ${index} (ID ${blockId}): instructions ${start}-${end}, successors: [${successors.join(', ')}]`);
});

console.log("\n=== Demo Complete ===");
