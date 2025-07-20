import { VMControlFlowGraph } from "./src/core/ControlFlowGraph";
import { Bytecode } from "./src/types/MoveModule";

// Debug the loop detection issue
const code: Bytecode[] = [
  { kind: "LdU8", value: 0 },   // 0
  { kind: "LdTrue" },           // 1 - loop head
  { kind: "BrFalse", codeOffset: 5 }, // 2 - exit loop
  { kind: "LdU8", value: 1 },   // 3
  { kind: "Branch", codeOffset: 1 },  // 4 - back edge to loop head
  { kind: "Ret" }              // 5
];

console.log("Creating CFG for debug...");
const cfg = new VMControlFlowGraph(code);

console.log("Number of blocks:", cfg.numBlocks());
console.log("Blocks:", cfg.blocks());

for (const blockId of cfg.blocks()) {
  console.log(`Block ${blockId}:`);
  console.log(`  Start: ${cfg.blockStart(blockId)}`);
  console.log(`  End: ${cfg.blockEnd(blockId)}`);
  console.log(`  Successors: ${JSON.stringify(cfg.successors(blockId))}`);
  console.log(`  Is loop head: ${cfg.isLoopHead(blockId)}`);
}

console.log("Is back edge (4, 1):", cfg.isBackEdge(4, 1));
console.log("Number of back edges:", cfg.numBackEdges());

cfg.display();
