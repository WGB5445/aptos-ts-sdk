import { disassemble_instruction, disassembleMoveModule as dMoveModule, MoveModule, parseAbilities, parseSignatureToken } from './type';

export function disassemble(
    module: MoveModule
): string {
    let module_names: Map<string, number> = new Map();
    let module_aliases: Map<string, string> = new Map();

    const self_module = module.module_handles.at(module.selfModuleHandleIdx);
    if (!self_module) {
        throw new Error("Self module handle index is out of bounds");
    }
    const self_module_address = module.address_identifiers.at(self_module.address);
    if (!self_module_address) {
        throw new Error("Self module address identifier is out of bounds");
    }
    const self_module_name = module.identifiers.at(self_module.name);
    if (!self_module_name) {    
        throw new Error("Self module name identifier is out of bounds");
    }

    module_names.set(self_module_name, 0);

    for (const module_handle of module.module_handles) {
        const address = module.address_identifiers.at(module_handle.address);
        if (!address) {
            throw new Error("Module address identifier is out of bounds");
        }
        const name = module.identifiers.at(module_handle.name);
        if (!name) {
            throw new Error("Module name identifier is out of bounds");
        }
        
        if( module_names.has(name)){
            const count = module_names.get(name)!;
            module_names.set(name, count + 1);
            module_aliases.set(`${name}`, `${count + 1}${name}`);
        }else{
            module_names.set(`${name}`, 0);
            module_aliases.set(`${name}`, `${0}${name}`);
        };
    }

    const header = `module ${self_module_address}::${self_module_name}`;

    const imports = 
        module.module_handles.filter((m)=> {
            let m_address = module.address_identifiers.at(m.address);
            if (!m_address) {
                throw new Error("Module address identifier is out of bounds");
            }
            let m_name = module.identifiers.at(m.name);
            if (!m_name) {
                throw new Error("Module name identifier is out of bounds");
            }
            return `${m_address}${m_name}` !== `${self_module_address}${self_module_name}`;
        })
        .map((m)=> {
            let m_address = module.address_identifiers.at(m.address);
            if (!m_address) {
                throw new Error("Module address identifier is out of bounds");
            }
            let m_name = module.identifiers.at(m.name);
            if (!m_name) {
                throw new Error("Module name identifier is out of bounds");
            }
            if( module_names.has(m_name) && module_names.get(m_name)! > 0) {
                return `use ${m_address}::${m_name} as ${module_aliases.get(m_name)};`;
            }
            return `use ${m_address}::${m_name};`;
        }).join('\n');

    const structs = module.struct_defs.map((struct_definition) => {
        const struct_handle = module.struct_handles.at(struct_definition.struct_handle);
        if (!struct_handle) {
            throw new Error("Struct handle identifier is out of bounds");
        }

        const struct_module = module.module_handles.at(struct_handle.module);
        if (!struct_module) {
            throw new Error("Struct module handle is out of bounds");
        }

        const struct_name = module.identifiers.at(struct_handle.name);
        if (!struct_name) {
            throw new Error("Struct name identifier is out of bounds");
        }
        const abilities = parseAbilities(struct_handle.abilities);
        const struct_abilities = `${abilities.length > 0 ? ` has ${abilities.join(', ')}` : ""}`;
        const struct_type_params = struct_handle.type_parameters.map((tp, idx) => {
            const abilities = parseAbilities(tp.constraints);
            return `${tp.is_phantom ? 'phantom ' : ''}T${idx}${abilities.length > 0 ? `: ${abilities.join('+ ')}` : ''}`;
        });
        const type_parameters = `${struct_type_params.length > 0 ? `<${struct_type_params.join(', ')}>` : ''}`;
        switch (struct_definition.field_information.kind) {
            case 'Native':
                return `native struct ${struct_name}${type_parameters}${struct_abilities}`;
            case 'Declared':
                return `struct ${struct_name}${type_parameters}${struct_abilities} {\n${
                   struct_definition.field_information.fields.map((field) => {
                       const field_name = module.identifiers.at(field.name);
                       if (!field_name) {
                           throw new Error("Field name identifier is out of bounds");
                       }
                       const field_type = parseSignatureToken(field.type, module);
                       return `  ${field_name}: ${field_type}`;
                   }).join(',\n')
                }\n}`;
            case 'DeclaredVariants': { 
                const variants = struct_definition.field_information.variants.map((variant) => {
                    const variant_name = module.identifiers.at(variant.name);
                    if (!variant_name) {
                        throw new Error("Variant name identifier is out of bounds");
                    }
                    return `  ${variant_name}`;
                }).join(',\n');
                return `struct ${struct_handle} {\n${variants}\n}`;
            }
            default:
                throw new Error("Unknown field information");
        }
    }).join('\n');

    const function_defs = module.function_defs.map((function_definition) => {
        const function_visibility = function_definition.visibility;

        const function_handle = module.function_handles.at(function_definition.function);
        if (!function_handle) {
            throw new Error("Function handle identifier is out of bounds");
        }
        const function_module = module.module_handles.at(function_handle.module);
        if (!function_module) {
            throw new Error("Function module handle is out of bounds");
        }
        const function_name = module.identifiers.at(function_handle.name);
        if (!function_name) {
            throw new Error("Function name identifier is out of bounds");
        }

        const modifiers: string[] = [];
        modifiers.push(function_definition.code === undefined ? 'native' : '');

        if (function_definition.isEntry) {
            modifiers.push('entry');
        }
        switch (function_visibility) {
            case 'public':
                modifiers.push('public');
                break;
            case 'friend':
                modifiers.push('public(friend)');
                break;
            case 'private':
                break;
            default:
                throw new Error("Unknown function visibility: " + function_visibility);
        }

        // const type_parameters = function_handle.type_parameters.map((abilitySet, idx) => {
        //     const abilities = parseAbilities(abilitySet);
        //     return `T${idx}${abilities.length > 0 ? `: ${abilities.join('+ ')}` : ''}`;
        // });
        const type_parameters: string[] = [];

        const params = module.signatures.at(function_handle.parameters)!.map((param) => {
            const param_type = parseSignatureToken(param, module);
            // return `arg${idx}: ${param_type}`;
            return param_type
        });

        const ret_type = module.signatures.at(function_handle.return_)!.map((ret) => {
            return parseSignatureToken(ret, module);
        });

        let retTypeStr = '';
        if (ret_type.length === 0) {
          retTypeStr = '';
        } else if (ret_type.length === 1) {
          retTypeStr = `: ${ret_type[0]}`;
        } else {
          retTypeStr = `: (${ret_type.join(', ')})`;
        }

        let body: Array<String> = [];
        if (function_definition.code == undefined) {
            body = [];
        } else {
            let signatures = module.signatures.at(function_definition.code.locals);
            if (!signatures) {
                throw new Error("Function code locals signature is out of bounds");
            }
            const maxIdx = signatures.length + params.length - 1;
            const width = String(maxIdx).length;
            const locals:string[] = [];
            signatures.map((local, idx) => {
                const local_type = parseSignatureToken(local, module);
                body.push(`L${String(idx + params.length).padEnd(width, ' ')} loc${idx}: ${local_type}`);
                locals.push(local_type);
            });

            function_definition.code.code.map((instruction, idx) => {
                const instruction_str = disassemble_instruction(instruction, params, locals, module);
                if (idx == 0){
                    body.push(`B0:`)
                }
                body.push(`${"".padStart(4, " ")}${`${idx}`.padEnd(4, " ")}:${"".padEnd(6, " ")}${instruction_str}`);
            });
        }

        return (
          `${modifiers.join(' ')}${modifiers.length > 0 ? ' ' : ''}fun ` +
          `${function_name}` +
          `${type_parameters.length > 0 ? `<${type_parameters.join(', ')}>` : ""}` +
          ` ( ${params.map((param, idx) => `arg${idx}: ${param}`).join(", ")} )` +
          `${retTypeStr}` +
          ` {\n\n` +
          `${body.join("\n")}\n` +
          `}`
        );
    }).join('\n\n');

    const str = `// Move bytecode v${module.version}\n${header} {\n\n${imports}\n\n${structs}\n\n${function_defs}\n\n}`;

    return str;
}

export function disassemble_to_string(bytecode: Uint8Array | Buffer): string {
    let module = dMoveModule(bytecode)
    return disassemble( module);
}

// export function disassembleMoveScript(bytecode: Uint8Array | Buffer): string {
//   // TODO: Implement disassembly logic
//   return 'Disassembly not implemented yet.';
// }