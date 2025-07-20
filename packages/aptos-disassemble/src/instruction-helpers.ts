import {
    FieldDefinition,
    FieldHandle,
    MoveModule,
    parseSignatureToken,
    StructVariantHandle
} from "./types/compiledModule";

/**
 * Formats a local variable reference (parameter or local variable)
 */
export function formatLocalVariable(localIdx: number, params: string[], locals: string[]): string {
    if (localIdx < params.length) {
        return `arg${localIdx}: ${params[localIdx]}`;
    } else if (localIdx < params.length + locals.length) {
        const localIndex = localIdx - params.length;
        return `loc${localIndex}: ${locals[localIndex]}`;
    } else {
        throw new Error(`Invalid local index: ${localIdx}`);
    }
}

/**
 * Formats an instruction that operates on local variables
 */
export function formatLocalInstruction(
    instruction: { localIdx: number },
    instructionName: string,
    params: string[],
    locals: string[]
): string {
    const localVar = formatLocalVariable(instruction.localIdx, params, locals);
    return `${instructionName}[${instruction.localIdx}](${localVar})`;
}

/**
 * Extracts field information from a field handle
 */
export function getFieldInfo(fieldHandle: FieldHandle, module: MoveModule): {
    structName: string;
    field: FieldDefinition;
    fieldType: string;
} {
    const structDef = module.struct_defs[fieldHandle.owner];
    const structName = module.identifiers[module.struct_handles[structDef.struct_handle].name];
    
    let fields: Array<FieldDefinition> = [];
    if (structDef.field_information.kind === "Declared") {
        fields = structDef.field_information.fields;
    }
    
    const field = fields[fieldHandle.field];
    if (!field) {
        throw new Error(`Field not found: ${fieldHandle.field}`);
    }
    
    const fieldType = parseSignatureToken(field.type, module);
    return { structName, field, fieldType };
}

/**
 * Formats a field access instruction
 */
export function formatFieldInstruction(
    instructionName: string,
    index: number,
    structName: string,
    fieldName: string,
    fieldType: string
): string {
    return `${instructionName}[${index}](${structName}.${fieldName}: ${fieldType})`;
}

/**
 * Formats a struct operation instruction
 */
export function formatStructInstruction(
    instruction: { structDefIdx: number },
    instructionName: string,
    module: MoveModule
): string {
    const structDef = module.struct_defs[instruction.structDefIdx];
    const structName = module.identifiers[module.struct_handles[structDef.struct_handle].name];
    return `${instructionName}[${instruction.structDefIdx}](${structName})`;
}

/**
 * Formats a generic struct operation instruction
 */
export function formatGenericStructInstruction(
    instruction: { structInstIdx: number },
    instructionName: string,
    module: MoveModule
): string {
    const structInst = module.struct_defs_inst[instruction.structInstIdx];
    const structName = module.identifiers[module.struct_handles[module.struct_defs[structInst.def].struct_handle].name];
    const structTypeParams = module.signatures.at(structInst.typeParameters)!.map((tp) => {
        return parseSignatureToken(tp, module);
    });
    const typeParamsStr = structTypeParams?.length > 0 ? `<${structTypeParams.join(", ")}>` : "";
    return `${instructionName}[${instruction.structInstIdx}](${structName}${typeParamsStr})`;
}

/**
 * Extracts variant information from a struct variant handle
 */
export function getVariantInfo(structVariantHandle: StructVariantHandle, module: MoveModule): {
    structName: string;
    variantName: string;
} {
    const structDef = module.struct_defs[structVariantHandle.struct_index];
    const structName = module.identifiers[module.struct_handles[structDef.struct_handle].name];
    
    if (structDef.field_information.kind !== "DeclaredVariants") {
        throw new Error(`PackVariant is not supported for field information kind: ${structDef.field_information.kind}`);
    }
    
    const variant = structDef.field_information.variants[structVariantHandle.variant];
    if (!variant) {
        throw new Error(`Variant not found: ${structVariantHandle.variant}`);
    }
    
    const variantName = module.identifiers[variant.name];
    return { structName, variantName };
}

/**
 * Instruction handler type for mapping instruction types to their handlers
 */
export type InstructionHandler = (
    instruction: any,
    params: string[],
    locals: string[],
    module: MoveModule
) => string;

/**
 * Creates instruction handlers for different types of operations
 */
export class InstructionHandlers {
    /**
     * Handles local variable operations (CopyLoc, MoveLoc, StLoc, etc.)
     */
    static createLocalHandler(instructionName: string): InstructionHandler {
        return (instruction, params, locals) => 
            formatLocalInstruction(instruction, instructionName, params, locals);
    }

    /**
     * Handles field operations (MutBorrowField, ImmBorrowField, etc.)
     */
    static createFieldHandler(instructionName: string, indexProperty: string): InstructionHandler {
        return (instruction, _params, _locals, module) => {
            const fieldHandle = module.field_handles[instruction[indexProperty]];
            const { structName, field, fieldType } = getFieldInfo(fieldHandle, module);
            return formatFieldInstruction(
                instructionName,
                instruction[indexProperty],
                structName,
                module.identifiers[field.name],
                fieldType
            );
        };
    }

    /**
     * Handles generic field operations
     */
    static createGenericFieldHandler(instructionName: string): InstructionHandler {
        return (instruction, _params, _locals, module) => {
            const fieldInst = module.field_insts[instruction.fieldInstIdx];
            const fieldHandle = module.field_handles[fieldInst.handle];
            const { structName, field, fieldType } = getFieldInfo(fieldHandle, module);
            return formatFieldInstruction(
                instructionName,
                instruction.fieldInstIdx,
                structName,
                module.identifiers[field.name],
                fieldType
            );
        };
    }

    /**
     * Handles struct operations
     */
    static createStructHandler(instructionName: string): InstructionHandler {
        return (instruction, _params, _locals, module) => 
            formatStructInstruction(instruction, instructionName, module);
    }

    /**
     * Handles generic struct operations
     */
    static createGenericStructHandler(instructionName: string): InstructionHandler {
        return (instruction, _params, _locals, module) => 
            formatGenericStructInstruction(instruction, instructionName, module);
    }

    /**
     * Creates a handler that throws "not implemented" error
     */
    static createNotImplementedHandler(instructionName: string): InstructionHandler {
        return () => {
            throw new Error(`${instructionName} is not implemented yet`);
        };
    }
}
