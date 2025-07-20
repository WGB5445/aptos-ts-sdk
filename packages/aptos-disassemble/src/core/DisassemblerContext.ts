/**
 * DisassemblerContext - Core context class that holds module information
 * and provides convenient methods for accessing module data
 */
import { MoveModule, SignatureToken } from '../types/MoveModule';
import { parseSignatureToken, parseAbilities } from '../utils/SignatureUtils';

export class DisassemblerContext {
    constructor(private readonly module: MoveModule) {}

    get version(): number {
        return this.module.version;
    }

    get selfModuleHandleIdx(): number {
        return this.module.selfModuleHandleIdx;
    }

    // Module handle utilities
    getSelfModule() {
        const selfModule = this.module.module_handles[this.selfModuleHandleIdx];
        if (!selfModule) {
            throw new Error("Self module handle index is out of bounds");
        }
        return selfModule;
    }

    getSelfModuleAddress(): string {
        const selfModule = this.getSelfModule();
        return this.getAddressIdentifier(selfModule.address);
    }

    getSelfModuleName(): string {
        const selfModule = this.getSelfModule();
        return this.getIdentifier(selfModule.name);
    }

    // Identifier utilities
    getIdentifier(index: number): string {
        const identifier = this.module.identifiers[index];
        if (identifier === undefined) {
            throw new Error(`Identifier at index ${index} is out of bounds`);
        }
        return identifier;
    }

    getAddressIdentifier(index: number): string {
        const address = this.module.address_identifiers[index];
        if (address === undefined) {
            throw new Error(`Address identifier at index ${index} is out of bounds`);
        }
        return address;
    }

    // Signature utilities
    getSignature(index: number): SignatureToken[] {
        const signature = this.module.signatures[index];
        if (!signature) {
            throw new Error(`Signature at index ${index} is out of bounds`);
        }
        return signature;
    }

    parseSignatureToken(token: SignatureToken): string {
        return parseSignatureToken(token, this.module);
    }

    parseAbilities(abilities: number): string[] {
        return parseAbilities(abilities);
    }

    // Handle utilities
    getModuleHandle(index: number) {
        const handle = this.module.module_handles[index];
        if (!handle) {
            throw new Error(`Module handle at index ${index} is out of bounds`);
        }
        return handle;
    }

    getStructHandle(index: number) {
        const handle = this.module.struct_handles[index];
        if (!handle) {
            throw new Error(`Struct handle at index ${index} is out of bounds`);
        }
        return handle;
    }

    getFunctionHandle(index: number) {
        const handle = this.module.function_handles[index];
        if (!handle) {
            throw new Error(`Function handle at index ${index} is out of bounds`);
        }
        return handle;
    }

    getFieldHandle(index: number) {
        const handle = this.module.field_handles[index];
        if (!handle) {
            throw new Error(`Field handle at index ${index} is out of bounds`);
        }
        return handle;
    }

    // Definition utilities
    getStructDefinition(index: number) {
        const def = this.module.struct_defs[index];
        if (!def) {
            throw new Error(`Struct definition at index ${index} is out of bounds`);
        }
        return def;
    }

    getFunctionDefinition(index: number) {
        const def = this.module.function_defs[index];
        if (!def) {
            throw new Error(`Function definition at index ${index} is out of bounds`);
        }
        return def;
    }

    // Instantiation utilities
    getStructDefInstantiation(index: number) {
        const inst = this.module.struct_defs_inst[index];
        if (!inst) {
            throw new Error(`Struct def instantiation at index ${index} is out of bounds`);
        }
        return inst;
    }

    getFunctionInstantiation(index: number) {
        const inst = this.module.function_inst[index];
        if (!inst) {
            throw new Error(`Function instantiation at index ${index} is out of bounds`);
        }
        return inst;
    }

    getFieldInstantiation(index: number) {
        const inst = this.module.field_insts[index];
        if (!inst) {
            throw new Error(`Field instantiation at index ${index} is out of bounds`);
        }
        return inst;
    }

    // Variant utilities (for enum support)
    getStructVariantHandle(index: number) {
        const handle = this.module.struct_variant_handles[index];
        if (!handle) {
            throw new Error(`Struct variant handle at index ${index} is out of bounds`);
        }
        return handle;
    }

    getStructVariantInstantiation(index: number) {
        const inst = this.module.struct_variant_inst[index];
        if (!inst) {
            throw new Error(`Struct variant instantiation at index ${index} is out of bounds`);
        }
        return inst;
    }

    getVariantFieldHandle(index: number) {
        const handle = this.module.variant_field_handles[index];
        if (!handle) {
            throw new Error(`Variant field handle at index ${index} is out of bounds`);
        }
        return handle;
    }

    getVariantFieldInstantiation(index: number) {
        const inst = this.module.variant_field_inst[index];
        if (!inst) {
            throw new Error(`Variant field instantiation at index ${index} is out of bounds`);
        }
        return inst;
    }

    // Access to raw module for compatibility
    getRawModule(): MoveModule {
        return this.module;
    }
}
