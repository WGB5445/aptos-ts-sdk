import { describe, it, expect } from "vitest";
import { VMControlFlowGraph } from "../src/core/ControlFlowGraph";
import { Bytecode } from "../src/types/MoveModule";

describe("ControlFlowGraph", () => {
  it("should create a simple linear CFG", () => {
    const code: Bytecode[] = [
      { kind: "LdU8", value: 42 },
      { kind: "StLoc", localIdx: 0 },
      { kind: "Ret" }
    ];

    const cfg = new VMControlFlowGraph(code);
    
    expect(cfg.numBlocks()).toBe(1);
    expect(cfg.entryBlockId()).toBe(0);
    expect(cfg.blockStart(0)).toBe(0);
    expect(cfg.blockEnd(0)).toBe(2);
    expect(cfg.successors(0)).toEqual([]);
  });

  it("should create CFG with conditional branches", () => {
    const code: Bytecode[] = [
      { kind: "LdTrue" },           // 0
      { kind: "BrFalse", codeOffset: 4 }, // 1 - branch to instruction 4
      { kind: "LdU8", value: 1 },   // 2
      { kind: "Branch", codeOffset: 5 },  // 3 - branch to instruction 5
      { kind: "LdU8", value: 2 },   // 4
      { kind: "Ret" }              // 5
    ];

    const cfg = new VMControlFlowGraph(code);
    
    expect(cfg.numBlocks()).toBe(4);
    
    // Block 0: instructions 0-1
    expect(cfg.blockStart(0)).toBe(0);
    expect(cfg.blockEnd(0)).toBe(1);
    expect(cfg.successors(0)).toEqual([4, 2]); // BrFalse target (4) and fall-through (2)
    
    // Block 2: instruction 2-3
    expect(cfg.blockStart(2)).toBe(2);
    expect(cfg.blockEnd(2)).toBe(3);
    expect(cfg.successors(2)).toEqual([5]); // Branch target (5)
    
    // Block 4: instruction 4
    expect(cfg.blockStart(4)).toBe(4);
    expect(cfg.blockEnd(4)).toBe(4);
    expect(cfg.successors(4)).toEqual([5]); // Fall-through to 5
    
    // Block 5: instruction 5
    expect(cfg.blockStart(5)).toBe(5);
    expect(cfg.blockEnd(5)).toBe(5);
    expect(cfg.successors(5)).toEqual([]); // Return has no successors
  });

  it("should detect loops correctly", () => {
    const code: Bytecode[] = [
      { kind: "LdU8", value: 0 },   // 0
      { kind: "LdTrue" },           // 1 - loop head
      { kind: "BrFalse", codeOffset: 5 }, // 2 - exit loop
      { kind: "LdU8", value: 1 },   // 3
      { kind: "Branch", codeOffset: 1 },  // 4 - back edge to loop head
      { kind: "Ret" }              // 5
    ];

    const cfg = new VMControlFlowGraph(code);
    
    expect(cfg.numBlocks()).toBe(4);
    expect(cfg.isLoopHead(1)).toBe(true); // Block 1 is the loop head
    expect(cfg.isBackEdge(3, 1)).toBe(true); // Back edge from block 3 to block 1
    expect(cfg.numBackEdges()).toBe(1);
  });

  it("should provide correct instruction indexes", () => {
    const code: Bytecode[] = [
      { kind: "LdU8", value: 1 },   // 0
      { kind: "LdU8", value: 2 },   // 1
      { kind: "BrTrue", codeOffset: 5 }, // 2
      { kind: "LdU8", value: 3 },   // 3
      { kind: "LdU8", value: 4 },   // 4
      { kind: "Ret" }              // 5
    ];

    const cfg = new VMControlFlowGraph(code);
    
    // First block: 0-2
    const firstBlockInstructions = Array.from(cfg.instrIndexes(0));
    expect(firstBlockInstructions).toEqual([0, 1, 2]);
    
    // Second block: 3-4
    const secondBlockInstructions = Array.from(cfg.instrIndexes(3));
    expect(secondBlockInstructions).toEqual([3, 4]);
    
    // Third block: 5
    const thirdBlockInstructions = Array.from(cfg.instrIndexes(5));
    expect(thirdBlockInstructions).toEqual([5]);
  });

  it("should handle reachability analysis", () => {
    const code: Bytecode[] = [
      { kind: "LdTrue" },           // 0
      { kind: "BrFalse", codeOffset: 4 }, // 1
      { kind: "LdU8", value: 1 },   // 2
      { kind: "Ret" },             // 3
      { kind: "LdU8", value: 2 },   // 4
      { kind: "Ret" }              // 5
    ];

    const cfg = new VMControlFlowGraph(code);
    
    const reachableFromEntry = cfg.reachableFrom(0);
    expect(reachableFromEntry).toContain(0);
    expect(reachableFromEntry).toContain(2);
    expect(reachableFromEntry).toContain(4);
  });

  it("should handle empty code correctly", () => {
    const code: Bytecode[] = [];

    const cfg = new VMControlFlowGraph(code);
    
    expect(cfg.numBlocks()).toBe(0);
    expect(cfg.entryBlockId()).toBe(0);
  });
});
