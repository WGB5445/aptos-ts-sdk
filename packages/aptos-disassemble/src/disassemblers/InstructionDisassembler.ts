/**
 * InstructionDisassembler - Handles disassembly of individual bytecode instructions
 */
import { Bytecode, FieldDefinition, FieldHandle, StructVariantHandle } from "../types/MoveModule";
import { DisassemblerContext } from "../core/DisassemblerContext";
import { SignatureToken } from "../types/MoveModule";

export class InstructionDisassembler {
  constructor(
    private readonly context: DisassemblerContext,
    private readonly params: string[],
    private readonly locals: string[]
  ) {}

  disassemble(instruction: Bytecode): string {
    switch (instruction.kind) {
      // Stack operations
      case "Pop":
        return "Pop";
      case "Ret":
        return "Ret";
      case "Nop":
        return "Nop";

      // Branch operations
      case "BrTrue":
        return `BrTrue(${instruction.codeOffset})`;
      case "BrFalse":
        return `BrFalse(${instruction.codeOffset})`;
      case "Branch":
        return `Branch(${instruction.codeOffset})`;

      // Load operations
      case "LdU8":
        return `LdU8(${instruction.value})`;
      case "LdU16":
        return `LdU16(${instruction.value})`;
      case "LdU32":
        return `LdU32(${instruction.value})`;
      case "LdU64":
        return `LdU64(${instruction.value})`;
      case "LdU128":
        return `LdU128(${instruction.value})`;
      case "LdU256":
        return `LdU256(${instruction.value})`;
      case "LdTrue":
        return "LdTrue";
      case "LdFalse":
        return "LdFalse";
      case "LdConst":
        return this.formatLdConst(instruction.constIdx);

      // Cast operations
      case "CastU8":
        return "CastU8";
      case "CastU16":
        return "CastU16";
      case "CastU32":
        return "CastU32";
      case "CastU64":
        return "CastU64";
      case "CastU128":
        return "CastU128";
      case "CastU256":
        return "CastU256";

      // Local variable operations
      case "CopyLoc":
        return this.formatLocalInstruction(instruction.localIdx, "CopyLoc");
      case "MoveLoc":
        return this.formatLocalInstruction(instruction.localIdx, "MoveLoc");
      case "StLoc":
        return this.formatLocalInstruction(instruction.localIdx, "StLoc");
      case "MutBorrowLoc":
        return this.formatLocalInstruction(instruction.localIdx, "MutBorrowLoc");
      case "ImmBorrowLoc":
        return this.formatLocalInstruction(instruction.localIdx, "ImmBorrowLoc");

      // Function call operations
      case "Call":
        return this.formatCall(instruction.funcHandleIdx);
      case "CallGeneric":
        return this.formatCallGeneric(instruction.funcInstIdx);
      case "CallClosure":
        return this.formatCallClosure(instruction.sigIdx);

      // Closure operations
      case "PackClosure":
        return this.formatPackClosure(instruction.fun, instruction.mask);
      case "PackClosureGeneric":
        return this.formatPackClosureGeneric(instruction.fun, instruction.mask);

      // Struct operations
      case "Pack":
        return this.formatStructOperation(instruction.structDefIdx, "Pack");
      case "Unpack":
        return this.formatStructOperation(instruction.structDefIdx, "Unpack");
      case "PackGeneric":
        return this.formatGenericStructOperation(instruction.structInstIdx, "PackGeneric");
      case "UnpackGeneric":
        return this.formatGenericStructOperation(instruction.structInstIdx, "UnpackGeneric");

      // Variant operations
      case "PackVariant":
        return this.formatVariantOperation(instruction.structVariantHandleIdx, "PackVariant");
      case "UnpackVariant":
        return this.formatVariantOperation(instruction.structVariantHandleIdx, "UnpackVariant");
      case "TestVariant":
        return this.formatVariantOperation(instruction.structVariantHandleIdx, "TestVariant");
      case "PackVariantGeneric":
        return this.formatGenericVariantOperation(
          instruction.structVariantInstIdx,
          "PackVariantGeneric"
        );
      case "UnpackVariantGeneric":
        return this.formatGenericVariantOperation(
          instruction.structVariantInstIdx,
          "UnpackVariantGeneric"
        );
      case "TestVariantGeneric":
        return this.formatGenericVariantOperation(
          instruction.structVariantInstIdx,
          "TestVariantGeneric"
        );

      // Field operations
      case "MutBorrowField":
        return this.formatFieldOperation(instruction.fieldHandleIdx, "MutBorrowField");
      case "ImmBorrowField":
        return this.formatFieldOperation(instruction.fieldHandleIdx, "ImmBorrowField");
      case "MutBorrowFieldGeneric":
        return this.formatGenericFieldOperation(instruction.fieldInstIdx, "MutBorrowFieldGeneric");
      case "ImmBorrowFieldGeneric":
        return this.formatGenericFieldOperation(instruction.fieldInstIdx, "ImmBorrowFieldGeneric");

      // Variant field operations
      case "MutBorrowVariantField":
        return this.formatVariantFieldOperation(
          instruction.variantFieldHandleIdx,
          "MutBorrowVariantField"
        );
      case "ImmBorrowVariantField":
        return this.formatVariantFieldOperation(
          instruction.variantFieldHandleIdx,
          "ImmBorrowVariantField"
        );
      case "MutBorrowVariantFieldGeneric":
        return this.formatGenericVariantFieldOperation(
          instruction.variantFieldInstIdx,
          "MutBorrowVariantFieldGeneric"
        );
      case "ImmBorrowVariantFieldGeneric":
        return this.formatGenericVariantFieldOperation(
          instruction.variantFieldInstIdx,
          "ImmBorrowVariantFieldGeneric"
        );

      // Global operations
      case "MutBorrowGlobal":
        return this.formatStructOperation(instruction.structDefIdx, "MutBorrowGlobal");
      case "ImmBorrowGlobal":
        return this.formatStructOperation(instruction.structDefIdx, "ImmBorrowGlobal");
      case "MutBorrowGlobalGeneric":
        return this.formatGenericStructOperation(
          instruction.structInstIdx,
          "MutBorrowGlobalGeneric"
        );
      case "ImmBorrowGlobalGeneric":
        return this.formatGenericStructOperation(
          instruction.structInstIdx,
          "ImmBorrowGlobalGeneric"
        );
      case "Exists":
        return this.formatStructOperation(instruction.structDefIdx, "Exists");
      case "ExistsGeneric":
        return this.formatGenericStructOperation(instruction.structInstIdx, "ExistsGeneric");
      case "MoveFrom":
        return this.formatStructOperation(instruction.structDefIdx, "MoveFrom");
      case "MoveFromGeneric":
        return this.formatGenericStructOperation(instruction.structInstIdx, "MoveFromGeneric");
      case "MoveTo":
        return this.formatStructOperation(instruction.structDefIdx, "MoveTo");
      case "MoveToGeneric":
        return this.formatGenericStructOperation(instruction.structInstIdx, "MoveToGeneric");

      // Reference operations
      case "ReadRef":
        return "ReadRef";
      case "WriteRef":
        return "WriteRef";
      case "FreezeRef":
        return "FreezeRef";

      // Arithmetic operations
      case "Add":
        return "Add";
      case "Sub":
        return "Sub";
      case "Mul":
        return "Mul";
      case "Mod":
        return "Mod";
      case "Div":
        return "Div";
      case "Shl":
        return "Shl";
      case "Shr":
        return "Shr";

      // Bitwise operations
      case "BitOr":
        return "BitOr";
      case "BitAnd":
        return "BitAnd";
      case "Xor":
        return "Xor";

      // Logical operations
      case "Or":
        return "Or";
      case "And":
        return "And";
      case "Not":
        return "Not";

      // Comparison operations
      case "Eq":
        return "Eq";
      case "Neq":
        return "Neq";
      case "Lt":
        return "Lt";
      case "Gt":
        return "Gt";
      case "Le":
        return "Le";
      case "Ge":
        return "Ge";

      // Other operations
      case "Abort":
        return "Abort";

      // Vector operations
      case "VecPack":
        return this.formatVectorOperation(
          instruction.elemTyIdx,
          instruction.numElements,
          "VecPack"
        );
      case "VecLen":
        return this.formatVectorOperation(instruction.elemTyIdx, undefined, "VecLen");
      case "VecImmBorrow":
        return this.formatVectorOperation(instruction.elemTyIdx, undefined, "VecImmBorrow");
      case "VecMutBorrow":
        return this.formatVectorOperation(instruction.elemTyIdx, undefined, "VecMutBorrow");
      case "VecPushBack":
        return this.formatVectorOperation(instruction.elemTyIdx, undefined, "VecPushBack");
      case "VecPopBack":
        return this.formatVectorOperation(instruction.elemTyIdx, undefined, "VecPopBack");
      case "VecUnpack":
        return this.formatVectorOperation(
          instruction.elemTyIdx,
          instruction.numElements,
          "VecUnpack"
        );
      case "VecSwap":
        return this.formatVectorOperation(instruction.elemTyIdx, undefined, "VecSwap");

      default:
        throw new Error(`Unsupported instruction: ${instruction}`);
    }
  }

  private formatLocalInstruction(localIdx: number, instructionName: string): string {
    const localVar = this.getLocalVariable(localIdx);
    return `${instructionName}[${localIdx}](${localVar})`;
  }

  private getLocalVariable(localIdx: number): string {
    if (localIdx < this.params.length) {
      return `arg${localIdx}: ${this.params[localIdx]}`;
    } else if (localIdx < this.params.length + this.locals.length) {
      const localIndex = localIdx - this.params.length;
      return `loc${localIndex}: ${this.locals[localIndex]}`;
    } else {
      throw new Error(`Invalid local index: ${localIdx}`);
    }
  }

  private formatCall(funcHandleIdx: number): string {
    const functionHandle = this.context.getFunctionHandle(funcHandleIdx);
    const functionName = this.context.getIdentifier(functionHandle.name);
    const moduleHandle = this.context.getModuleHandle(functionHandle.module);

    let functionString = "";
    if (this.context.selfModuleHandleIdx === functionHandle.module) {
      functionString = functionName;
    } else {
      const moduleName = this.context.getIdentifier(moduleHandle.name);
      functionString = `${moduleName}::${functionName}`;
    }

    const typeArguments = functionHandle.type_parameters.map((tp) =>
      this.context.parseAbilities(tp)
    );
    const typeParamsStr = typeArguments.length > 0 ? `<${typeArguments.join(", ")}>` : "";

    return `Call[${funcHandleIdx}](${functionString}${typeParamsStr})`;
  }

  private formatCallGeneric(_funcInstIdx: number): string {
    return `CallGeneric`;
  }

  private formatCallClosure(sigIdx: number): string {
    const closureSignature = this.context.getSignature(sigIdx);
    const closureType = closureSignature.map((tp) => this.context.parseSignatureToken(tp));
    if (closureType.length !== 1) {
      throw new Error("CallClosure with type parameters is not supported yet");
    }
    return `CallClosure[${sigIdx}](${closureType[0]})`;
  }

  private formatPackClosure(fun: number, mask: number): string {
    const functionHandle = this.context.getFunctionHandle(fun);
    const functionName = this.context.getIdentifier(functionHandle.name);
    const moduleHandle = this.context.getModuleHandle(functionHandle.module);

    let functionString = "";
    if (this.context.selfModuleHandleIdx === functionHandle.module) {
      functionString = functionName;
    } else {
      const moduleName = this.context.getIdentifier(moduleHandle.name);
      functionString = `${moduleName}::${functionName}`;
    }

    const typeArguments = functionHandle.type_parameters.map((tp) =>
      this.context.parseAbilities(tp)
    );
    const typeParamsStr = typeArguments.length > 0 ? `<${typeArguments.join(", ")}>` : "";

    return `PackClosure#${mask}[${fun}](${functionString}${typeParamsStr})`;
  }

  private formatPackClosureGeneric(fun: number, mask: number): string {
    return `PackClosureGeneric#${mask}[${fun}]`;
  }

  private formatStructOperation(structDefIdx: number, instructionName: string): string {
    const structDef = this.context.getStructDefinition(structDefIdx);
    const structHandle = this.context.getStructHandle(structDef.struct_handle);
    const structName = this.context.getIdentifier(structHandle.name);
    return `${instructionName}[${structDefIdx}](${structName})`;
  }

  private formatGenericStructOperation(structInstIdx: number, instructionName: string): string {
    const structInst = this.context.getStructDefInstantiation(structInstIdx);
    const structDef = this.context.getStructDefinition(structInst.def);
    const structHandle = this.context.getStructHandle(structDef.struct_handle);
    const structName = this.context.getIdentifier(structHandle.name);
    const typeParams = this.context
      .getSignature(structInst.typeParameters)
      .map((tp) => this.context.parseSignatureToken(tp));
    const typeParamsStr = typeParams.length > 0 ? `<${typeParams.join(", ")}>` : "";
    return `${instructionName}[${structInstIdx}](${structName}${typeParamsStr})`;
  }

  private formatVariantOperation(structVariantHandleIdx: number, instructionName: string): string {
    const structVariantHandle = this.context.getStructVariantHandle(structVariantHandleIdx);
    const { structName, variantName } = this.getVariantInfo(structVariantHandle);
    return `${instructionName}[${structVariantHandleIdx}](${structName}/${variantName})`;
  }

  private formatGenericVariantOperation(
    structVariantInstIdx: number,
    instructionName: string
  ): string {
    const structVariantInst = this.context.getStructVariantInstantiation(structVariantInstIdx);
    const typeParams = this.context.getSignature(structVariantInst.type_parameters);
    const structVariantHandle = this.context.getStructVariantHandle(structVariantInst.handle);
    const { structName, variantName } = this.getVariantInfo(structVariantHandle);

    const structTypeParams = typeParams.map((tp) => this.context.parseSignatureToken(tp));
    const typeParamsStr = structTypeParams.length > 0 ? `<${structTypeParams.join(", ")}>` : "";
    return `${instructionName}[${structVariantInstIdx}](${structName}/${variantName}${typeParamsStr})`;
  }

  private formatFieldOperation(fieldHandleIdx: number, instructionName: string): string {
    const fieldHandle = this.context.getFieldHandle(fieldHandleIdx);
    const { structName, fieldName, fieldType } = this.getFieldInfo(fieldHandle);
    return `${instructionName}[${fieldHandleIdx}](${structName}.${fieldName}: ${fieldType})`;
  }

  private formatGenericFieldOperation(fieldInstIdx: number, instructionName: string): string {
    const fieldInst = this.context.getFieldInstantiation(fieldInstIdx);
    const fieldHandle = this.context.getFieldHandle(fieldInst.handle);
    const { structName, fieldName, fieldType } = this.getFieldInfo(fieldHandle);
    return `${instructionName}[${fieldInstIdx}](${structName}.${fieldName}: ${fieldType})`;
  }

  private formatVariantFieldOperation(
    variantFieldHandleIdx: number,
    instructionName: string
  ): string {
    // const variantFieldHandle = this.context.getVariantFieldHandle(variantFieldHandleIdx);
    // Implementation for variant field operations would be needed here
    return `${instructionName}[${variantFieldHandleIdx}]`;
  }

  private formatGenericVariantFieldOperation(
    variantFieldInstIdx: number,
    instructionName: string
  ): string {
    // const variantFieldInst = this.context.getVariantFieldInstantiation(variantFieldInstIdx);
    // Implementation for generic variant field operations would be needed here
    return `${instructionName}[${variantFieldInstIdx}]`;
  }

  private formatVectorOperation(
    elemTyIdx: number,
    numElements: bigint | undefined,
    instructionName: string
  ): string {
    const elementsStr = numElements !== undefined ? `, ${numElements}` : "";
    return `${instructionName}(${elemTyIdx}${elementsStr})`;
  }

  private formatLdConst(constIdx: number): string {
    const rawModule = this.context.getRawModule();
    const constant = rawModule.constant_pool[constIdx];
    if (!constant) {
      throw new Error(`Constant at index ${constIdx} is out of bounds`);
    }

    // Format the constant value based on its type
    const typeStr = this.context.parseSignatureToken(constant.type);
    const dataStr = this.formatConstantData(constant.data, constant.type);
    return `LdConst[${constIdx}](${typeStr}: ${dataStr})`;
  }

  private formatConstantData(data: Uint8Array, type: SignatureToken): string {
    // For address type, format as hex string with commas
    if (type.kind === "Address") {
      return Array.from(data).join(",");
    }

    // For other types, we can add more specific formatting later
    return Array.from(data).join(",");
  }

  private getFieldInfo(fieldHandle: FieldHandle): {
    structName: string;
    fieldName: string;
    fieldType: string;
  } {
    const structDef = this.context.getStructDefinition(fieldHandle.owner);
    const structHandle = this.context.getStructHandle(structDef.struct_handle);
    const structName = this.context.getIdentifier(structHandle.name);

    let fields: FieldDefinition[] = [];
    if (structDef.field_information.kind === "Declared") {
      fields = structDef.field_information.fields;
    }

    const field = fields[fieldHandle.field];
    if (!field) {
      throw new Error(`Field not found: ${fieldHandle.field}`);
    }

    const fieldName = this.context.getIdentifier(field.name);
    const fieldType = this.context.parseSignatureToken(field.type);
    return { structName, fieldName, fieldType };
  }

  private getVariantInfo(structVariantHandle: StructVariantHandle): {
    structName: string;
    variantName: string;
  } {
    const structDef = this.context.getStructDefinition(structVariantHandle.struct_index);
    const structHandle = this.context.getStructHandle(structDef.struct_handle);
    const structName = this.context.getIdentifier(structHandle.name);

    if (structDef.field_information.kind !== "DeclaredVariants") {
      throw new Error(
        `PackVariant is not supported for field information kind: ${structDef.field_information.kind}`
      );
    }

    const variant = structDef.field_information.variants[structVariantHandle.variant];
    if (!variant) {
      throw new Error(`Variant not found: ${structVariantHandle.variant}`);
    }

    const variantName = this.context.getIdentifier(variant.name);
    return { structName, variantName };
  }
}
