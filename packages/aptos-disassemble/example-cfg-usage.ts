/**
 * Example usage of the Control Flow Graph implementation
 * 
 * This example demonstrates how to use the VMControlFlowGraph class
 * to analyze Move bytecode control flow.
 */

import { 
  MoveDisassembler, 
  VMControlFlowGraph, 
  type ControlFlowGraph 
} from "./src/index";
import { Bytecode } from "./src/types/MoveModule";

// Example 1: Simple linear control flow
console.log("=== Example 1: Simple Linear Control Flow ===");
const linearCode: Bytecode[] = [
  { kind: "LdU8", value: 42 },
  { kind: "StLoc", localIdx: 0 },
  { kind: "CopyLoc", localIdx: 0 },
  { kind: "Ret" }
];

const linearCfg = new VMControlFlowGraph(linearCode);
console.log(`Number of blocks: ${linearCfg.numBlocks()}`);
console.log(`Entry block: ${linearCfg.entryBlockId()}`);
linearCfg.display();

// Example 2: Conditional branching
console.log("\n=== Example 2: Conditional Branching ===");
const branchingCode: Bytecode[] = [
  { kind: "CopyLoc", localIdx: 0 },    // 0: Load condition
  { kind: "BrFalse", codeOffset: 4 },  // 1: Branch if false to instruction 4
  { kind: "LdU8", value: 1 },          // 2: True branch
  { kind: "Branch", codeOffset: 5 },   // 3: Jump to end
  { kind: "LdU8", value: 0 },          // 4: False branch
  { kind: "Ret" }                      // 5: End
];

const branchingCfg = new VMControlFlowGraph(branchingCode);
console.log(`Number of blocks: ${branchingCfg.numBlocks()}`);
console.log("Block analysis:");
for (const blockId of branchingCfg.blocks()) {
  const successors = branchingCfg.successors(blockId);
  console.log(`  Block ${blockId}: instructions ${branchingCfg.blockStart(blockId)}-${branchingCfg.blockEnd(blockId)}, successors: [${successors.join(', ')}]`);
}

// Example 3: Loop detection
console.log("\n=== Example 3: Loop Detection ===");
const loopCode: Bytecode[] = [
  { kind: "LdU8", value: 10 },         // 0: Initialize counter
  { kind: "StLoc", localIdx: 0 },      // 1: Store counter
  { kind: "CopyLoc", localIdx: 0 },    // 2: Loop head - load counter
  { kind: "LdU8", value: 0 },          // 3: Load zero for comparison
  { kind: "Gt" },                      // 4: counter > 0
  { kind: "BrFalse", codeOffset: 10 }, // 5: Exit loop if counter <= 0
  { kind: "CopyLoc", localIdx: 0 },    // 6: Load counter
  { kind: "LdU8", value: 1 },          // 7: Load one
  { kind: "Sub" },                     // 8: Decrement counter
  { kind: "StLoc", localIdx: 0 },      // 9: Store decremented counter
  { kind: "Branch", codeOffset: 2 },   // 10: Back to loop head
  { kind: "Ret" }                      // 11: End
];

const loopCfg = new VMControlFlowGraph(loopCode);
console.log(`Number of blocks: ${loopCfg.numBlocks()}`);
console.log(`Number of back edges: ${loopCfg.numBackEdges()}`);

// Find loop heads
const loopHeads = loopCfg.blocks().filter(blockId => loopCfg.isLoopHead(blockId));
console.log(`Loop heads: [${loopHeads.join(', ')}]`);

// Analyze back edges
for (const blockId of loopCfg.blocks()) {
  for (const successor of loopCfg.successors(blockId)) {
    if (loopCfg.isBackEdge(blockId, successor)) {
      console.log(`Back edge detected: ${blockId} -> ${successor}`);
    }
  }
}

// Example 4: Reachability analysis
console.log("\n=== Example 4: Reachability Analysis ===");
const entryBlock = loopCfg.entryBlockId();
const reachableBlocks = loopCfg.reachableFrom(entryBlock);
console.log(`Blocks reachable from entry (${entryBlock}): [${reachableBlocks.join(', ')}]`);

// Example 5: Integration with MoveDisassembler
console.log("\n=== Example 5: Integration with MoveDisassembler ===");
// This example shows how to use the CFG with the MoveDisassembler class
// Note: This requires actual bytecode data

/*
// Example usage (uncomment when you have actual bytecode):
const bytecode = new Uint8Array([...]); // Your Move bytecode here
const disassembler = MoveDisassembler.fromBytecode(bytecode);
const module = disassembler.getModule();

// Create CFG for the first function in the module
if (module.function_defs && module.function_defs.length > 0) {
  try {
    const cfg = disassembler.createControlFlowGraph(0);
    console.log(`CFG for function 0: ${cfg.numBlocks()} blocks`);
    cfg.display();
  } catch (error) {
    console.log(`Could not create CFG for function 0: ${error.message}`);
  }
}
*/

console.log("\n=== Control Flow Graph Analysis Complete ===");
