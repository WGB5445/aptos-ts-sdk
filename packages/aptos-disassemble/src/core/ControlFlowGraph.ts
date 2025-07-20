/**
 * Control Flow Graph implementation for Move bytecode verification
 * Based on the Rust implementation from Move VM
 * 
 * Copyright (c) The Diem Core Contributors
 * Copyright (        // Build a mapping from a block id to the next block id in the traversal order
    const traversalSuccessors = new Map<BlockId, BlockId>();
    for (let i = 0; i < traversalOrder.length - 1; i++) {
      traversalSuccessors.set(traversalOrder[i], traversalOrder[i + 1]);
    }

    this.traversalSuccessors = traversalSuccessors;
    this.loopHeads = loopHeads;ove Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bytecode, CodeOffset } from "../types/MoveModule";

// Type aliases for better compatibility with Rust implementation
type BlockId = CodeOffset;

/**
 * A trait that specifies the basic requirements for a CFG
 */
export interface ControlFlowGraph {
  /** Start index of the block ID in the bytecode vector */
  blockStart(blockId: BlockId): CodeOffset;

  /** End index of the block ID in the bytecode vector */
  blockEnd(blockId: BlockId): CodeOffset;

  /** Successors of the block ID in the bytecode vector */
  successors(blockId: BlockId): BlockId[];

  /** Return the next block in traversal order */
  nextBlock(blockId: BlockId): BlockId | null;

  /** Iterator over the indexes of instructions in this block */
  instrIndexes(blockId: BlockId): Iterable<CodeOffset>;

  /** Return an iterator over the blocks of the CFG */
  blocks(): BlockId[];

  /** Return the number of blocks (vertices) in the control flow graph */
  numBlocks(): number;

  /** Return the id of the entry block for this control-flow graph */
  entryBlockId(): BlockId;

  /** Checks if the block ID is a loop head */
  isLoopHead(blockId: BlockId): boolean;

  /** Checks if the edge from cur->next is a back edge */
  isBackEdge(cur: BlockId, next: BlockId): boolean;

  /** Return the number of back edges in the cfg */
  numBackEdges(): number;
}

/**
 * Basic block structure
 */
class BasicBlock {
  constructor(
    public readonly exit: CodeOffset,
    public readonly successors: BlockId[]
  ) {}

  public display(entry: BlockId): void {
    console.log("+=======================+");
    console.log(`| Enter:  ${entry}            |`);
    console.log("+-----------------------+");
    console.log(`==> Children: ${JSON.stringify(this.successors)}`);
    console.log("+-----------------------+");
    console.log(`| Exit:   ${this.exit}            |`);
    console.log("+=======================+");
  }
}

/**
 * Exploration state for loop analysis
 */
enum Exploration {
  InProgress = "InProgress",
  Done = "Done"
}

const ENTRY_BLOCK_ID: BlockId = 0;

/**
 * The control flow graph that we build from the bytecode.
 */
export class VMControlFlowGraph implements ControlFlowGraph {
  /** The basic blocks */
  private readonly basicBlocks: Map<BlockId, BasicBlock>;
  /** Basic block ordering for traversal */
  private readonly traversalSuccessors: Map<BlockId, BlockId>;
  /** Map of loop heads with all of their back edges */
  private readonly loopHeads: Map<BlockId, Set<BlockId>>;

  constructor(code: Bytecode[]) {
    const codeLen = code.length as CodeOffset;
    
    // First go through and collect block ids, i.e., offsets that begin basic blocks.
    // Need to do this first in order to handle backwards edges.
    const blockIds = new Set<BlockId>();
    blockIds.add(ENTRY_BLOCK_ID);
    
    for (let pc = 0; pc < code.length; pc++) {
      VMControlFlowGraph.recordBlockIds(pc as CodeOffset, code, blockIds);
    }

    // Create basic blocks
    const basicBlocks = new Map<BlockId, BasicBlock>();
    let entry = 0;
    const exitToEntry = new Map<CodeOffset, BlockId>();
    
    for (let pc = 0; pc < code.length; pc++) {
      const coPc = pc as CodeOffset;

      // Create a basic block
      if (this.isEndOfBlock(coPc, code, blockIds)) {
        const exit = coPc;
        exitToEntry.set(exit, entry);
        const successors = this.getSuccessors(coPc, code);
        const bb = new BasicBlock(exit, successors);
        basicBlocks.set(entry, bb);
        entry = coPc + 1;
      }
    }
    
    this.basicBlocks = basicBlocks;
    console.assert(entry === codeLen, `Entry ${entry} should equal code length ${codeLen}`);

    // Loop analysis
    // This section identifies loops in the control-flow graph, picks a back edge and loop head
    // (the basic block the back edge returns to), and decides the order that blocks are
    // traversed during abstract interpretation (reverse post-order).

    const exploration = new Map<BlockId, Exploration>();
    const stack: BlockId[] = [ENTRY_BLOCK_ID];

    // For every loop in the CFG that is reachable from the entry block, there is an entry in
    // `loopHeads` mapping to all the back edges pointing to it, and vice versa.
    const loopHeads = new Map<BlockId, Set<BlockId>>();

    // Blocks appear in `postOrder` after all the blocks in their (non-reflexive) sub-graph.
    const postOrder: BlockId[] = [];

    while (stack.length > 0) {
      const block = stack.pop()!;
      const explorationState = exploration.get(block);

      if (explorationState === undefined) {
        // Record the fact that exploration of this block and its sub-graph has started.
        exploration.set(block, Exploration.InProgress);

        // Push the block back on the stack to finish processing it, and mark it as done
        // once its sub-graph has been traversed.
        stack.push(block);

        const successors = this.basicBlocks.get(block)?.successors || [];
        for (const succ of successors) {
          const succExploration = exploration.get(succ);
          
          if (succExploration === undefined) {
            // This successor has never been visited before, add it to the stack to
            // be explored before `block` gets marked `Done`.
            stack.push(succ);
          } else if (succExploration === Exploration.InProgress) {
            // This block's sub-graph was being explored, meaning it is a (reflexive
            // transitive) predecessor of `block` as well as being a successor,
            // implying a loop has been detected -- greedily choose the successor
            // block as the loop head.
            if (!loopHeads.has(succ)) {
              loopHeads.set(succ, new Set());
            }
            loopHeads.get(succ)!.add(block);
          }
          // Cross-edge detected, this block and its entire sub-graph (modulo
          // cycles) has already been explored via a different path, and is
          // already present in `postOrder`.
          // We skip this case.
        }
      } else if (explorationState === Exploration.InProgress) {
        // Finish up the traversal by adding this block to the post-order traversal
        // after its sub-graph (modulo cycles).
        postOrder.push(block);
        exploration.set(block, Exploration.Done);
      }
      // Already traversed the sub-graph reachable from this block, so skip it.
    }

    const traversalOrder = postOrder.reverse(); // Reverse post order

    // Build a mapping from a block id to the next block id in the traversal order
    const traversalSuccessors = new Map<BlockId, BlockId>();
    for (let i = 0; i < traversalOrder.length - 1; i++) {
      traversalSuccessors.set(traversalOrder[i], traversalOrder[i + 1]);
    }

    this.traversalSuccessors = traversalSuccessors;
    this.loopHeads = loopHeads;
  }

  public display(): void {
    for (const [entry, block] of this.basicBlocks) {
      block.display(entry);
    }
    console.log("Traversal:", Object.fromEntries(this.traversalSuccessors));
  }

  private isEndOfBlock(pc: CodeOffset, code: Bytecode[], blockIds: Set<BlockId>): boolean {
    return pc + 1 === code.length || blockIds.has(pc + 1);
  }

  private static recordBlockIds(pc: CodeOffset, code: Bytecode[], blockIds: Set<BlockId>): void {
    const bytecode = code[pc];

    // Get the offset from branch instructions
    const offset = this.getOffset(bytecode);
    if (offset !== null) {
      blockIds.add(offset);
    }

    // If this is a branch instruction and not the last instruction, the next instruction starts a new block
    if (this.isBranch(bytecode) && pc + 1 < code.length) {
      blockIds.add(pc + 1);
    }
  }

  private static getOffset(bytecode: Bytecode): CodeOffset | null {
    switch (bytecode.kind) {
      case "BrTrue":
      case "BrFalse":
      case "Branch":
        return bytecode.codeOffset;
      default:
        return null;
    }
  }

  private static isBranch(bytecode: Bytecode): boolean {
    switch (bytecode.kind) {
      case "BrTrue":
      case "BrFalse":
      case "Branch":
      case "Ret":
      case "Abort":
        return true;
      default:
        return false;
    }
  }

  private getSuccessors(pc: CodeOffset, code: Bytecode[]): BlockId[] {
    const bytecode = code[pc];
    const successors: BlockId[] = [];

    switch (bytecode.kind) {
      case "BrTrue":
      case "BrFalse":
        // Conditional branches have two successors: the branch target and the next instruction
        successors.push(bytecode.codeOffset);
        if (pc + 1 < code.length) {
          successors.push(pc + 1);
        }
        break;
      case "Branch":
        // Unconditional branch has one successor: the branch target
        successors.push(bytecode.codeOffset);
        break;
      case "Ret":
      case "Abort":
        // Terminal instructions have no successors
        break;
      default:
        // Regular instructions flow to the next instruction
        if (pc + 1 < code.length) {
          successors.push(pc + 1);
        }
        break;
    }

    return successors;
  }

  /**
   * A utility function that implements BFS-reachability from blockId
   */
  private traverseBy(blockId: BlockId): BlockId[] {
    const ret: BlockId[] = [];
    let index = 0;
    const seen = new Set<BlockId>();

    ret.push(blockId);
    seen.add(blockId);

    while (index < ret.length) {
      const currentBlockId = ret[index];
      index += 1;
      const successors = this.successors(currentBlockId);
      for (const successor of successors) {
        if (!seen.has(successor)) {
          ret.push(successor);
          seen.add(successor);
        }
      }
    }

    return ret;
  }

  public reachableFrom(blockId: BlockId): BlockId[] {
    return this.traverseBy(blockId);
  }

  public traversalIndex(blockId: BlockId): number {
    const keys = Array.from(this.traversalSuccessors.keys());
    const index = keys.indexOf(blockId);
    return index === -1 ? this.traversalSuccessors.size : index;
  }

  // ControlFlowGraph interface implementation

  blockStart(blockId: BlockId): CodeOffset {
    return blockId;
  }

  blockEnd(blockId: BlockId): CodeOffset {
    const block = this.basicBlocks.get(blockId);
    if (!block) {
      throw new Error(`Block ${blockId} not found`);
    }
    return block.exit;
  }

  successors(blockId: BlockId): BlockId[] {
    const block = this.basicBlocks.get(blockId);
    if (!block) {
      throw new Error(`Block ${blockId} not found`);
    }
    return [...block.successors]; // Return a copy to prevent mutation
  }

  nextBlock(blockId: BlockId): BlockId | null {
    console.assert(this.basicBlocks.has(blockId), `Block ${blockId} should exist`);
    return this.traversalSuccessors.get(blockId) || null;
  }

  *instrIndexes(blockId: BlockId): Iterable<CodeOffset> {
    const start = this.blockStart(blockId);
    const end = this.blockEnd(blockId);
    for (let i = start; i <= end; i++) {
      yield i;
    }
  }

  blocks(): BlockId[] {
    return Array.from(this.basicBlocks.keys());
  }

  numBlocks(): number {
    return this.basicBlocks.size;
  }

  entryBlockId(): BlockId {
    return ENTRY_BLOCK_ID;
  }

  isLoopHead(blockId: BlockId): boolean {
    return this.loopHeads.has(blockId);
  }

  isBackEdge(cur: BlockId, next: BlockId): boolean {
    const backEdges = this.loopHeads.get(next);
    return backEdges ? backEdges.has(cur) : false;
  }

  numBackEdges(): number {
    let count = 0;
    for (const edges of this.loopHeads.values()) {
      count += edges.size;
    }
    return count;
  }
}
