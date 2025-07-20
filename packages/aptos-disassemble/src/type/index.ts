import { bcs, Deserializer } from "aptos-bcs";
import {  AccessSpecifier, Bytecode, CodeUnit, Constant, FieldDefinition, FieldHandle, FieldInstantiation, FunctionAttribute, FunctionDefinition, load_code, load_signature_token, Metadata, ModuleHandle, MoveModule, parseSignatureToken, SignatureToken, StructDefinition, StructDefInstantiation, StructVariantHandle, StructVariantInstantiation, VariantDefinition, VariantFieldHandle, VariantFieldInstantiation, Visibility } from "./compiledModule";

export * from "./compiledModule";
export * from "./serializedType";


export function disassembleMoveModule(bytecode: Uint8Array | Buffer): MoveModule {
    const des = new Deserializer(bytecode);

    // get magic

    const magic = des.deserializeU32();
    if( magic !== 0xbeb1ca1 ) {
      throw new Error(`Invalid magic number: ${magic.toString(16)}`);
    }

    // get version
    const version = des.deserializeU32() & ~0xA000000;
    if ( version > 8 ){
        throw new Error(`Unsupported version: ${version}`);
    }

    // get table length
    const tableLength = des.deserializeUleb128AsU32();

    // get table
    const tables = Array.from({ length: tableLength }, () => {
        const kind = des.deserializeU8();
        let table_offset = des.deserializeUleb128AsU32();
        let count = des.deserializeUleb128AsU32();

        return {
            kind,
            table_offset,
            count
        };
    });

    // check table
    let offset = 0;
    tables.forEach((table) => {
        if(table.table_offset != offset) {
            throw new Error(`Table offset mismatch: expected ${offset}, got ${table.table_offset}`);
        }
        offset += table.count;
    });

    // copy deserializer

    let tables_byte = new Uint8Array(Array.from({ length: offset }, () => {
        return des.deserializeU8();
    }));

    // get self_module_handle_idx
    const selfModuleHandleIdx = des.deserializeUleb128AsU32();

    // 表类型常量定义
    const TableKind = {
      MODULE_HANDLES: 0x1,
      STRUCT_HANDLES: 0x2,
      FUNCTION_HANDLES: 0x3,
      FUNCTION_INST: 0x4,
      SIGNATURES: 0x5,
      CONSTANT_POOL: 0x6,
      IDENTIFIERS: 0x7,
      ADDRESS_IDENTIFIERS: 0x8,
      STRUCT_DEFS: 0xA,
      STRUCT_DEF_INST: 0xB,
      FUNCTION_DEFS: 0xC,
      FIELD_HANDLES: 0xD,
      FIELD_INST: 0xE,
      FRIEND_DECLS: 0xF,
      METADATA: 0x10,
      VARIANT_FIELD_HANDLES: 0x11,
      VARIANT_FIELD_INST: 0x12,
      STRUCT_VARIANT_HANDLES: 0x13,
      STRUCT_VARIANT_INST: 0x14,
    };

    let module_handles: Array<{address: number, name: number}> = [];
    let struct_handles: Array<{ module: number; name: number; abilities: number; type_parameters: { constraints: number; is_phantom: boolean; }[];}> = [];
    let function_handles: Array<{
        module: number;
        name: number;
        parameters: number;
        return_: number;
        type_parameters: number[];
        access_specifiers?: any;
        attributes?: any;
    }> = [];

    let function_inst: Array<{ handle: number; type_parameters: number; }> = [];

    let signatures: Array<Array<SignatureToken>> = [];
    let constant_pool: Array<Constant> = [];
    let identifiers: Array<string> = [];
    let address_identifiers: Array<string> = [];
    let metadatas   : Array<Metadata> = [];

    tables.forEach((table, idx) => {
        switch (table.kind) {
            case TableKind.MODULE_HANDLES:
                let module_handles_bytes = tables_byte.slice(table.table_offset, table.table_offset + table.count);
                const de = new Deserializer(module_handles_bytes);
                while(de.remaining() > 0) {
                    module_handles.push({ address: de.deserializeUleb128AsU32(), name: de.deserializeUleb128AsU32() });
                }
            break;
            
            case TableKind.STRUCT_HANDLES:
                let struct_handles_bytes = tables_byte.slice(table.table_offset, table.table_offset + table.count);
                const deStruct = new Deserializer(struct_handles_bytes);
                while(deStruct.remaining() > 0) {
                    const module = deStruct.deserializeUleb128AsU32();
                    const name = deStruct.deserializeUleb128AsU32();
                    const abilities = deStruct.deserializeUleb128AsU32();
                    const type_param_count = deStruct.deserializeUleb128AsU32();
                    const type_parameters = Array.from({ length: type_param_count }, () => {
                        const constraints = deStruct.deserializeUleb128AsU32();
                        let is_phantom = false;
                        if (version < 3) {
                            is_phantom = false;
                        } else {
                            let byte = deStruct.deserializeUleb128AsU32();
                            is_phantom = byte != 0;
                        };
                        return {
                            constraints,
                            is_phantom
                        }
                    });
                    
                    struct_handles.push(
                        {
                            module,
                            name,
                            abilities,
                            type_parameters
                        }
                    );
                }
            break;
            case TableKind.FUNCTION_HANDLES:
                let function_handles_bytes = tables_byte.slice(table.table_offset, table.table_offset + table.count);
                const deFunc = new Deserializer(function_handles_bytes);
                while(deFunc.remaining() > 0) {
                    const module = deFunc.deserializeUleb128AsU32();
                    const name = deFunc.deserializeUleb128AsU32();
                    const parameters = deFunc.deserializeUleb128AsU32();
                    const return_ = deFunc.deserializeUleb128AsU32();
                    const type_param_count = deFunc.deserializeUleb128AsU32();
                    const type_parameters = Array.from({ length: type_param_count }, () => {
                        const constraints = deFunc.deserializeUleb128AsU32();
                        return constraints;
                    });
                    let access_specifiers: any = null;
                    if (version >= 7) {
                        let has_access_specifiers = deFunc.deserializeU8();
                        let is_some: boolean | undefined = undefined;
                        switch (has_access_specifiers){
                            case 1:
                                is_some = false
                            break;
                            case 2:
                                is_some = true
                            break;
                            default:
                                throw new Error(`Unknown access specifier value: ${has_access_specifiers}`);
                        }
                        if( is_some ) {
                            access_specifiers = bcs.Vector(AccessSpecifier).read(deFunc);
                        }
                    }

                    let function_abilities: any = null;
                    if (version >= 8) {
                        function_abilities = bcs.Vector(FunctionAttribute).read(deFunc);
                    }

                    function_handles.push(
                        {
                            module,
                            name,
                            parameters,
                            return_,
                            type_parameters,
                            access_specifiers,
                            attributes: function_abilities,
                        }
                    );
                }
            break;
            case TableKind.FUNCTION_INST:
                let function_inst_bytes = tables_byte.slice(table.table_offset, table.table_offset + table.count);
                const deFuncInst = new Deserializer(function_inst_bytes);
                while(deFuncInst.remaining() > 0) {
                    const handle = deFuncInst.deserializeUleb128AsU32();
                    const type_parameters = deFuncInst.deserializeUleb128AsU32();
                    function_inst.push({ handle, type_parameters });
                }
            break;
            case TableKind.SIGNATURES:
                let signatures_bytes = tables_byte.slice(table.table_offset, table.table_offset + table.count);
                const deSignatures = new Deserializer(signatures_bytes);
                
                while(deSignatures.remaining() > 0) {
                    const signature_len = bcs.U8.read(deSignatures);
                    const tokens = Array.from({ length: signature_len }, () => {
                        return load_signature_token(deSignatures, version);
                    });
                    signatures.push(tokens);
                }
            break;
            case TableKind.CONSTANT_POOL:
                let constant_pool_bytes = tables_byte.slice(table.table_offset, table.table_offset + table.count);
                const deConstantPool = new Deserializer(constant_pool_bytes);
                while(deConstantPool.remaining() > 0) {
                    let constant_pool_token = load_signature_token(deConstantPool, version);
                    let size = deConstantPool.deserializeUleb128AsU32();
                    let constant_pool_values = new Uint8Array(Array.from({ length: size }, () => {
                        return deConstantPool.deserializeU8();
                    }));
                    constant_pool.push({
                        type: constant_pool_token as SignatureToken,
                        data: constant_pool_values
                    });
                }
            break;
            case TableKind.IDENTIFIERS:
                const deIdentifiers = new Deserializer(tables_byte.slice(table.table_offset, table.table_offset + table.count));
                while(deIdentifiers.remaining() > 0) {
                    const len = deIdentifiers.deserializeUleb128AsU32();
                    let identifiers_byte = new Uint8Array(Array.from({ length: len }, () => {
                        return deIdentifiers.deserializeU8();
                    }));
                    identifiers.push(Buffer.from(identifiers_byte).toString("utf-8"));
                }
            break;
            case TableKind.ADDRESS_IDENTIFIERS:
                const deAddressIdentifiers = new Deserializer(tables_byte.slice(table.table_offset, table.table_offset + table.count));
                while(deAddressIdentifiers.remaining() > 0) {
                    const address = new Uint8Array(Array.from({ length: 32 }, () => {
                        return deAddressIdentifiers.deserializeU8();
                    }));
                    address_identifiers.push(Buffer.from(address).toString("hex"));
                }
            break;
            case TableKind.STRUCT_DEFS:
            case TableKind.STRUCT_DEF_INST:
            case TableKind.FUNCTION_DEFS:
            case TableKind.FIELD_HANDLES:
            case TableKind.FIELD_INST:
                break;
            case TableKind.FRIEND_DECLS:
                if (version < 2) {
                    throw new Error(`Table kind ${table.kind} is not supported in version ${version}`);
                }
            break;
            case TableKind.METADATA:
                if (version < 5) {
                    throw new Error(`Metadata table is not supported in version ${version}`);
                }
                const deMetadata = new Deserializer(tables_byte.slice(table.table_offset, table.table_offset + table.count));
                while(deMetadata.remaining() > 0) {
                    const key_len = deMetadata.deserializeUleb128AsU32();
                    const key = new Uint8Array(Array.from({ length: key_len }, () => {
                        return deMetadata.deserializeU8();
                    }));

                    const value_len = deMetadata.deserializeUleb128AsU32();
                    const value = new Uint8Array(Array.from({ length: value_len }, () => {
                        return deMetadata.deserializeU8();
                    }));

                    metadatas.push({
                        key,
                        value
                    });
                }
            break;
            case TableKind.VARIANT_FIELD_HANDLES:
            case TableKind.VARIANT_FIELD_INST:
            case TableKind.STRUCT_VARIANT_HANDLES:
            case TableKind.STRUCT_VARIANT_INST:
                if (version < 7){
                    throw new Error(`Enum types not available for bytecode version ${version}`);
                }
            break;
            default:
                console.warn(`Unknown table kind ${table.kind} at index ${idx}`);
        }
    });

    let struct_defs: Array<StructDefinition> = [];
    let struct_defs_inst: Array<StructDefInstantiation> = [];

    let function_defs: Array<FunctionDefinition> = [];
    let field_defs: Array<FieldHandle> = [];
    let field_insts: Array<FieldInstantiation> = [];
    let friend_decls: Array<ModuleHandle> = [];
    let variant_field_handles: Array<VariantFieldHandle> = [];
    let variant_field_inst: Array<VariantFieldInstantiation> = [];
    let struct_variant_handles: Array<StructVariantHandle> = [];
    let struct_variant_inst: Array<StructVariantInstantiation> = [];

    tables.forEach((table) => {
        switch (table.kind) {
            case TableKind.STRUCT_DEFS:
                const deStructDefs = new Deserializer(tables_byte.slice(table.table_offset, table.table_offset + table.count));
                while(deStructDefs.remaining() > 0) {
                    let struct_handle = deStructDefs.deserializeUleb128AsU32();
                    let field_information_flag = deStructDefs.deserializeU8();
                    switch (field_information_flag) {
                        case 0x01:
                            // NATIVE
                            struct_defs.push({
                                struct_handle,
                                field_information: { kind: "Native" }
                            });
                        break;
                        case 0x02:
                            // DECLARED
                            let field_count = deStructDefs.deserializeUleb128AsU32();
                            let fields: Array<FieldDefinition> = Array.from({ length: field_count }, () => {
                                return {
                                    name: deStructDefs.deserializeUleb128AsU32(),
                                    type: load_signature_token(deStructDefs, version) as SignatureToken
                                };
                            });
                            struct_defs.push({
                                struct_handle,
                                field_information: { kind: "Declared", fields }
                            });
                        break;
                        case 0x03:
                            // UNRESTRICTED
                            if (version >= 7) {
                                let variant_count = deStructDefs.deserializeUleb128AsU32();
                                let variants: Array<VariantDefinition> = Array.from({ length: variant_count }, () => {
                                    let name = deStructDefs.deserializeUleb128AsU32();
                                    let fields: Array<FieldDefinition> = Array.from({ length: deStructDefs.deserializeUleb128AsU32() }, () => {
                                        return {
                                            name: deStructDefs.deserializeUleb128AsU32(),
                                            type: load_signature_token(deStructDefs, version) as SignatureToken
                                        };
                                    });
                                    return { name, fields };
                                });
                                struct_defs.push({
                                    struct_handle,
                                    field_information: { kind: "DeclaredVariants", variants }
                                });
                            }else {
                                throw new Error(`Unrestricted field information is not supported in version ${version}`);
                            }
                        break;
                        default:
                            throw new Error(`Unknown field information flag: ${field_information_flag}`);
                    }
                }
            break;
            case TableKind.STRUCT_DEF_INST:
                const deStructDefInst = new Deserializer(tables_byte.slice(table.table_offset, table.table_offset + table.count));
                while(deStructDefInst.remaining() > 0) {
                    let def = deStructDefInst.deserializeUleb128AsU32();
                    let type_parameters = deStructDefInst.deserializeUleb128AsU32();
                    struct_defs_inst.push({
                        def,
                        typeParameters: type_parameters
                    });
                }
            break;

            case TableKind.FUNCTION_DEFS:
                const deFunctionDefs = new Deserializer(tables_byte.slice(table.table_offset, table.table_offset + table.count));
                while(deFunctionDefs.remaining() > 0) {
                    let function_ = deFunctionDefs.deserializeUleb128AsU32();
                    let flag = deFunctionDefs.deserializeU8();

                    let vis: Visibility | undefined  = undefined;
                    let is_entry = false;
                    let extra_flags = 0;
                    if (version == 1){
                            if( (flag & 1) != 0){
                                flag ^= 1;
                                vis = "public";
                            }else {
                                vis = "private";
                            };
                            
                            is_entry = false;
                            extra_flags = flag;
                    }else  if ( version < 5 ) {
                        if ( flag == 2) {
                            vis = "public";
                            is_entry = true;
                        }else{
                            switch (flag) {
                                case 0:
                                    vis = "private";
                                    break;
                                case 1:
                                    vis = "public";
                                    break;
                                case 3:
                                    vis = "friend";
                                    break;
                                default:
                                    throw new Error(`Unknown function definition flag: ${flag}`);
                            }
                            is_entry = false;
                            extra_flags = deFunctionDefs.deserializeU8();
                        }
                    }else {
                        switch (flag) {
                            case 0:
                                vis = "private";
                                break;
                            case 1:
                                vis = "public";
                                break;
                            case 3:
                                vis = "friend";
                                break;
                            default:
                                throw new Error(`Unknown function definition flag: ${flag}`);
                        };
                        extra_flags = deFunctionDefs.deserializeU8();
                        is_entry = (extra_flags & 4) != 0;
                        if (is_entry) {
                            extra_flags ^= 4;
                        }
                    };
                    let acquires_global_resources: Array<number> = Array.from({ length: deFunctionDefs.deserializeUleb128AsU32() }, () => {
                        return deFunctionDefs.deserializeUleb128AsU32();
                    });
                    let code_unit: CodeUnit | undefined = undefined;
                    if ((extra_flags & 2) != 0) {
                        extra_flags ^= 2;
                    }else {
                        let locals = deFunctionDefs.deserializeUleb128AsU32();
                        let codes = load_code(deFunctionDefs, version);
                        code_unit = {
                            locals,
                            code: codes
                        };
                    }
                    function_defs.push({
                        function: function_,
                        visibility: vis,
                        isEntry: is_entry,
                        acquiresGlobalResources: acquires_global_resources,
                        code: code_unit,
                    });
                }
            break;
            case TableKind.FIELD_HANDLES:
                const deFieldHandles = new Deserializer(tables_byte.slice(table.table_offset, table.table_offset + table.count));
                while(deFieldHandles.remaining() > 0) {
                    let struct_idx = deFieldHandles.deserializeUleb128AsU32();
                    let offset = deFieldHandles.deserializeUleb128AsU32();
                    field_defs.push({
                        owner: struct_idx,
                        field: offset
                    });
                }
                break;
            case TableKind.FIELD_INST:
                const deFieldInst = new Deserializer(tables_byte.slice(table.table_offset, table.table_offset + table.count));
                while(deFieldInst.remaining() > 0) {
                    let handle = deFieldInst.deserializeUleb128AsU32();
                    let type_parameters = deFieldInst.deserializeUleb128AsU32();
                    field_insts.push({
                        handle,
                        typeParameters:type_parameters
                    });
                }
            break;
            case TableKind.FRIEND_DECLS:
                const deFriendDecls = new Deserializer(tables_byte.slice(table.table_offset, table.table_offset + table.count));
                while(deFriendDecls.remaining() > 0) {
                    let address = deFriendDecls.deserializeUleb128AsU32();
                    let name = deFriendDecls.deserializeUleb128AsU32();
                    friend_decls.push({
                        address,
                        name
                    });
                }
            break;
            case TableKind.VARIANT_FIELD_HANDLES:
                const deVariantFieldHandles = new Deserializer(tables_byte.slice(table.table_offset, table.table_offset + table.count));
                while(deVariantFieldHandles.remaining() > 0) {
                    let owner = deVariantFieldHandles.deserializeUleb128AsU32();
                    let offset = deVariantFieldHandles.deserializeUleb128AsU32();
                    let variant_count = deVariantFieldHandles.deserializeUleb128AsU32();
                    const variants = Array.from({ length: variant_count }, () => {
                        return deVariantFieldHandles.deserializeUleb128AsU32()
                    });
                    variant_field_handles.push({
                        struct_index: owner,
                        field: offset,
                        variants
                    });
                }
            break
            case TableKind.VARIANT_FIELD_INST:
                const deVariantFieldInst = new Deserializer(tables_byte.slice(table.table_offset, table.table_offset + table.count));
                while(deVariantFieldInst.remaining() > 0) {
                    let handle = deVariantFieldInst.deserializeUleb128AsU32();
                    let type_parameters = deVariantFieldInst.deserializeUleb128AsU32();
                    variant_field_inst.push({
                        handle,
                        typeParameters: type_parameters
                    });
                }
            break;
            case TableKind.STRUCT_VARIANT_HANDLES:
                const deStructVariantHandles = new Deserializer(tables_byte.slice(table.table_offset, table.table_offset + table.count));
                while(deStructVariantHandles.remaining() > 0) {
                    let struct_index = deStructVariantHandles.deserializeUleb128AsU32();
                    let variant = deStructVariantHandles.deserializeUleb128AsU32();
                    struct_variant_handles.push({
                        struct_index,
                        variant
                    });
                }
            break;
            case TableKind.STRUCT_VARIANT_INST:
                const deStructVariantInst = new Deserializer(tables_byte.slice(table.table_offset, table.table_offset + table.count));
                while(deStructVariantInst.remaining() > 0) {
                    let handle = deStructVariantInst.deserializeUleb128AsU32();
                    let type_parameters = deStructVariantInst.deserializeUleb128AsU32();
                    struct_variant_inst.push({
                        handle,
                        type_parameters
                    });
                }
            break;
            default:
                break;
        }
    });

    return {
        magic,
        version,
        selfModuleHandleIdx,
        module_handles,
        struct_handles,
        function_handles,
        function_inst,
        struct_defs_inst,
        signatures,
        constant_pool,
        identifiers,
        address_identifiers,
        metadatas,
        function_defs,
        struct_defs,
        field_handles: field_defs,
        field_insts,
        friend_decls,
        variant_field_handles,
        variant_field_inst,
        struct_variant_handles,
        struct_variant_inst
    };
}

export function disassemble_instruction(
    instruction: Bytecode,
    params: string[],
    locals: string[],
    module: MoveModule
): string {
    switch (instruction.kind) {
        case "LdConst":
            const constant = module.constant_pool[instruction.constIdx];
        return `LdConst[${instruction.constIdx}](${parseSignatureToken(constant.type,module)}: ${constant.data})`;
        case "CopyLoc":
            if ( instruction.localIdx < params.length ){
                return `CopyLoc[${instruction.localIdx}](arg${instruction.localIdx}: ${params[instruction.localIdx]})`;
            }else if( instruction.localIdx < params.length + locals.length ){
                return `CopyLoc[${instruction.localIdx}](loc${instruction.localIdx - params.length}: ${locals[instruction.localIdx - params.length]})`;
            }else{
                throw new Error(`Invalid local index: ${instruction.localIdx}`);
            }
        case "MoveLoc":
            if ( instruction.localIdx < params.length ){
                return `MoveLoc[${instruction.localIdx}](arg${instruction.localIdx}: ${params[instruction.localIdx]})`;
            }else if( instruction.localIdx < params.length + locals.length ){
                return `MoveLoc[${instruction.localIdx}](loc${instruction.localIdx - params.length}: ${locals[instruction.localIdx - params.length]})`;
            }else{
                throw new Error(`Invalid local index: ${instruction.localIdx}`);
            }
        case "StLoc":
            if ( instruction.localIdx < params.length ){
                return `StLoc[${instruction.localIdx}](arg${instruction.localIdx}: ${params[instruction.localIdx]})`;
            }else if( instruction.localIdx < params.length + locals.length ){
                return `StLoc[${instruction.localIdx}](loc${instruction.localIdx - params.length}: ${locals[instruction.localIdx - params.length]})`;
            }
            else{
                throw new Error(`Invalid local index: ${instruction.localIdx}`);
            }
        case "MutBorrowLoc":
            if ( instruction.localIdx < params.length ){
                return `MutBorrowLoc[${instruction.localIdx}](arg${instruction.localIdx}: ${params[instruction.localIdx]})`;
            }else if( instruction.localIdx < params.length + locals.length ){
                return `MutBorrowLoc[${instruction.localIdx}](loc${instruction.localIdx - params.length}: ${locals[instruction.localIdx - params.length]})`;
            }else{
                throw new Error(`Invalid local index: ${instruction.localIdx}`);
            }
        case "ImmBorrowLoc":
            if ( instruction.localIdx < params.length ){
                return `ImmBorrowLoc[${instruction.localIdx}](arg${instruction.localIdx}: ${params[instruction.localIdx]})`;
            }else if( instruction.localIdx < params.length + locals.length ){
                return `ImmBorrowLoc[${instruction.localIdx}](loc${instruction.localIdx - params.length}: ${locals[instruction.localIdx - params.length]})`;
            }else{
                throw new Error(`Invalid local index: ${instruction.localIdx}`);
            }
        case "MutBorrowField":
            const fieldHandle = module.field_handles[instruction.fieldHandleIdx];
            const structDef = module.struct_defs[fieldHandle.owner];
            const structName = module.identifiers[module.struct_handles[structDef.struct_handle].name];
            let fields: Array<FieldDefinition> = [];
            switch (structDef.field_information.kind) {
                case "Native":
                break;
                case "Declared":
                    fields = structDef.field_information.fields;
                break;
                default:
                    break;    
            };
            const field = fields[fieldHandle.field];
            if (!field) {
                throw new Error(`Field not found: ${fieldHandle.field}`);
            }
            const fieldTypeIndex = field.type;
            let ty = parseSignatureToken(fieldTypeIndex, module);
            return `MutBorrowField[${instruction.fieldHandleIdx}](${structName}.${module.identifiers[field.name]}: ${ty})`;
        case "MutBorrowFieldGeneric":
            const fieldInst = module.field_insts[instruction.fieldInstIdx];
            const fieldHandleGeneric = module.field_handles[fieldInst.handle];
            const structDefGeneric = module.struct_defs[fieldHandleGeneric.owner];
            const structNameGeneric = module.identifiers[module.struct_handles[structDefGeneric.struct_handle].name];
            let fieldsGeneric: Array<FieldDefinition> = [];
            switch (structDefGeneric.field_information.kind) {
                case "Native":
                break;
                case "Declared":
                    fieldsGeneric = structDefGeneric.field_information.fields;
                break;
                default:
                    break;    
            };
            const fieldGeneric = fieldsGeneric[fieldHandleGeneric.field];
            if (!fieldGeneric) {
                throw new Error(`Field not found: ${fieldHandleGeneric.field}`);
            }
            const fieldTypeIndexGeneric = fieldGeneric.type;
            let tyGeneric = parseSignatureToken(fieldTypeIndexGeneric, module);
            return `MutBorrowFieldGeneric[${instruction.fieldInstIdx}](${structNameGeneric}.${module.identifiers[fieldGeneric.name]}: ${tyGeneric})`;
        case "ImmBorrowField":
            const fieldHandleImm = module.field_handles[instruction.fieldHandleIdx];
            const structDefImm = module.struct_defs[fieldHandleImm.owner];
            const structNameImm = module.identifiers[module.struct_handles[structDefImm.struct_handle].name];
            let fieldsImm: Array<FieldDefinition> = [];
            switch (structDefImm.field_information.kind) {
                case "Native":
                break;
                case "Declared":
                    fieldsImm = structDefImm.field_information.fields;
                break;
                default:
                    break;    
            };
            const fieldImm = fieldsImm[fieldHandleImm.field];
            if (!fieldImm) {
                throw new Error(`Field not found: ${fieldHandleImm.field}`);
            }
            const fieldTypeIndexImm = fieldImm.type;
            let tyImm = parseSignatureToken(fieldTypeIndexImm, module);
            return `ImmBorrowField[${instruction.fieldHandleIdx}](${structNameImm}.${module.identifiers[fieldImm.name]}: ${tyImm})`;
        case "ImmBorrowFieldGeneric":
            const fieldInstImm = module.field_insts[instruction.fieldInstIdx];
            const fieldHandleImmGeneric = module.field_handles[fieldInstImm.handle];
            const structDefImmGeneric = module.struct_defs[fieldHandleImmGeneric.owner];
            const structNameImmGeneric = module.identifiers[module.struct_handles[structDefImmGeneric.struct_handle].name];
            let fieldsImmGeneric: Array<FieldDefinition> = [];
            switch (structDefImmGeneric.field_information.kind) {
                case "Native":
                break;
                case "Declared":
                    fieldsImmGeneric = structDefImmGeneric.field_information.fields;
                break;
                default:
                    break;    
            };
            const fieldImmGeneric = fieldsImmGeneric[fieldHandleImmGeneric.field];
            if (!fieldImmGeneric) {
                throw new Error(`Field not found: ${fieldHandleImmGeneric.field}`);
            }
            const fieldTypeIndexImmGeneric = fieldImmGeneric.type;
            let tyImmGeneric = parseSignatureToken(fieldTypeIndexImmGeneric, module);
            return `ImmBorrowFieldGeneric[${instruction.fieldInstIdx}](${structNameImmGeneric}.${module.identifiers[fieldImmGeneric.name]}: ${tyImmGeneric})`;
        case "MutBorrowVariantField":
            // const variantFieldHandle = module.variant_field_handles[instruction.variantFieldHandleIdx];
            // const structVariantDef = module.struct_defs[variantFieldHandle.struct_index];
            // const structVariantName = module.identifiers[module.struct_handles[structVariantDef.struct_handle].name];
            // let variantFields: Array<FieldDefinition> = [];
            // switch (structVariantDef.field_information.kind) {
            //     case "Native":
            //     break;
            //     case "DeclaredVariants":
            //         const variant = structVariantDef.field_information.variants[instruction.variantIndex];
            //         if (!variant) {
            //             throw new Error(`Variant not found: ${instruction.variantIndex}`);
            //         }
            //         variantFields = variant.fields;
            //     break;
            //     default:
            //         break;    
            // };
            // const variantField = variantFields[variantFieldHandle.field];
            // if (!variantField) {
            //     throw new Error(`Variant field not found: ${variantFieldHandle.field}`);
            // }
            // const variantFieldTypeIndex = variantField.type;
            // let tyVariant = parseSignatureToken(variantFieldTypeIndex, module);
            // return `MutBorrowVariantField[${instruction.variantFieldHandleIdx}](${structVariantName}.${module.identifiers[variantField.name]}: ${tyVariant})`;
            throw new Error("MutBorrowVariantField is not implemented yet");
        case "MutBorrowVariantFieldGeneric":
            throw new Error("MutBorrowVariantFieldGeneric is not implemented yet");
        case "ImmBorrowVariantField":
            throw new Error("ImmBorrowVariantField is not implemented yet");
        case "ImmBorrowVariantFieldGeneric":
            throw new Error("ImmBorrowVariantFieldGeneric is not implemented yet");
        case "Pack":
            {
                const structDef = module.struct_defs[instruction.structDefIdx];
                const structName = module.identifiers[module.struct_handles[structDef.struct_handle].name];
                return `Pack[${instruction.structDefIdx}](${structName})`;
            }    
        case "PackGeneric":
            {
                const structInst = module.struct_defs_inst[instruction.structInstIdx];
                const structName = module.identifiers[module.struct_handles[module.struct_defs[structInst.def].struct_handle].name];
                const structTypeParams = module.signatures.at(structInst.typeParameters)!.map((tp) => {
                    return parseSignatureToken(tp,module);
                });
                return `PackGeneric[${instruction.structInstIdx}](${structName}${structTypeParams?.length > 0 ? `<${structTypeParams.join(", ")}>` : ""})`;
            }
        case "Unpack":
            {
                const structDef = module.struct_defs[instruction.structDefIdx];
                const structName = module.identifiers[module.struct_handles[structDef.struct_handle].name];
                return `Unpack[${instruction.structDefIdx}](${structName})`;
            }
        case "UnpackGeneric":
            {
                const structInst = module.struct_defs_inst[instruction.structInstIdx];
                const structName = module.identifiers[module.struct_handles[module.struct_defs[structInst.def].struct_handle].name];
                const structTypeParams = module.signatures.at(structInst.typeParameters)!.map((tp) => {
                    return parseSignatureToken(tp,module);
                });
                return `UnpackGeneric[${instruction.structInstIdx}](${structName}${structTypeParams?.length > 0 ? `<${structTypeParams.join(", ")}>` : ""})`;
            }
        case "PackVariant":
            {
                const structVariantHandle = module.struct_variant_handles[instruction.structVariantHandleIdx];
                const structDef = module.struct_defs[structVariantHandle.struct_index];
                const structName = module.identifiers[module.struct_handles[structDef.struct_handle].name];
                let variantName = "";
                switch (structDef.field_information.kind) {
                    case "DeclaredVariants":
                        const variant = structDef.field_information.variants[structVariantHandle.variant];
                        if (!variant) {
                            throw new Error(`Variant not found: ${structVariantHandle.variant}`);
                        }
                        variantName = module.identifiers[variant.name];
                    break;
    
                    default:
                        throw new Error(`PackVariant is not supported for field information kind: ${structDef.field_information.kind}`);
                }
                return `PackVariant[${instruction.structVariantHandleIdx}](${structName}/${variantName})`;
            }
        case "PackVariantGeneric":
            {
                const struct_variant_inst =  module.struct_variant_inst[instruction.structVariantInstIdx];
                const type_params = module.signatures[struct_variant_inst.type_parameters];
                const struct_variant_handle = module.struct_variant_handles[struct_variant_inst.handle];
                const structDef = module.struct_defs[struct_variant_handle.struct_index]
                const struct_handle  = module.struct_handles[structDef.struct_handle];
                const struct_name = module.identifiers[struct_handle.name];
                const structTypeParams = type_params!.map((tp) => {
                    return parseSignatureToken(tp,module);
                });
                let variantName = "";
                switch (structDef.field_information.kind) {
                    case "DeclaredVariants":
                        const variant = structDef.field_information.variants[struct_variant_handle.variant];
                        if (!variant) {
                            throw new Error(`Variant not found: ${struct_variant_handle.variant}`);
                        }
                        variantName = module.identifiers[variant.name];
                    break;
    
                    default:
                        throw new Error(`PackVariant is not supported for field information kind: ${structDef.field_information.kind}`);
                }
                return `PackVariantGeneric[${instruction.structVariantInstIdx}](${struct_name}/${variantName}${structTypeParams?.length > 0 ? `<${structTypeParams.join(", ")}>` : ""})`;
            }

        default:
            throw new Error(`Unknown instruction kind: ${instruction.kind}`);
    }

}