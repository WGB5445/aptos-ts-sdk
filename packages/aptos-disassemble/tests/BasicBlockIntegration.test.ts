import { describe, it, expect } from "vitest";
import { MoveDisassembler } from "../src/index";

describe("Basic Block Integration", () => {
  it("should print correct basic block markers", () => {
    // This is a simple test using an empty module structure
    // In a real scenario, you would use actual Move bytecode
    const mockModule = {
      magic: 0xa11ceb0b,
      version: 7,
      selfModuleHandleIdx: 0,
      module_handles: [{ address: 0, name: 0 }],
      struct_handles: [],
      function_handles: [
        {
          module: 0,
          name: 0,
          parameters: 0,
          return_: 1,
          type_parameters: [],
          access_specifiers: undefined,
          attributes: undefined,
        },
      ],
      field_handles: [],
      friend_decls: [],
      struct_defs_inst: [],
      function_inst: [],
      field_insts: [],
      signatures: [[], []], // Empty parameter and return signatures
      identifiers: ["test_module", "test_function"],
      address_identifiers: ["0x1"],
      constant_pool: [],
      metadatas: [],
      struct_defs: [],
      function_defs: [
        {
          function: 0,
          visibility: "private" as const,
          isEntry: false,
          acquiresGlobalResources: [],
          code: {
            locals: 0, // Index to empty signature
            code: [
              { kind: "LdTrue" as const }, // 0: Block 0
              { kind: "BrFalse" as const, codeOffset: 4 }, // 1: Branch to 4
              { kind: "LdU8" as const, value: 1 }, // 2: Block 1
              { kind: "Branch" as const, codeOffset: 5 }, // 3: Branch to 5
              { kind: "LdU8" as const, value: 2 }, // 4: Block 2
              { kind: "Ret" as const }, // 5: Block 3
            ],
          },
        },
      ],
      struct_variant_handles: [],
      struct_variant_inst: [],
      variant_field_handles: [],
      variant_field_inst: [],
    };

    // Test with basic blocks enabled (default)
    const disassemblerWithBlocks = new MoveDisassembler(mockModule, { printBasicBlocks: true });
    const outputWithBlocks = disassemblerWithBlocks.disassemble();

    // Should contain multiple block markers
    expect(outputWithBlocks).toMatch(/B0:/);
    expect(outputWithBlocks).toMatch(/B1:/);
    expect(outputWithBlocks).toMatch(/B2:/);

    // Test with basic blocks disabled
    const disassemblerWithoutBlocks = new MoveDisassembler(mockModule, { printBasicBlocks: false });
    const outputWithoutBlocks = disassemblerWithoutBlocks.disassemble();

    // Should only contain B0: (legacy behavior)
    expect(outputWithoutBlocks).toMatch(/B0:/);
    expect(outputWithoutBlocks).not.toMatch(/B1:/);
    expect(outputWithoutBlocks).not.toMatch(/B2:/);
  });

  it("should work with empty function bodies", () => {
    const mockModule = {
      magic: 0xa11ceb0b,
      version: 7,
      selfModuleHandleIdx: 0,
      module_handles: [{ address: 0, name: 0 }],
      struct_handles: [],
      function_handles: [
        {
          module: 0,
          name: 0,
          parameters: 0,
          return_: 1,
          type_parameters: [],
          access_specifiers: undefined,
          attributes: undefined,
        },
      ],
      field_handles: [],
      friend_decls: [],
      struct_defs_inst: [],
      function_inst: [],
      field_insts: [],
      signatures: [[], []],
      identifiers: ["test_module", "native_function"],
      address_identifiers: ["0x1"],
      constant_pool: [],
      metadatas: [],
      struct_defs: [],
      function_defs: [
        {
          function: 0,
          visibility: "private" as const,
          isEntry: false,
          acquiresGlobalResources: [],
          code: undefined, // Native function
        },
      ],
      struct_variant_handles: [],
      struct_variant_inst: [],
      variant_field_handles: [],
      variant_field_inst: [],
    };

    const disassembler = new MoveDisassembler(mockModule);
    const output = disassembler.disassemble();

    // Should not crash and should contain the native function
    expect(output).toContain("native");
  });
});
