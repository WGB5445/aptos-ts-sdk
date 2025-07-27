import {
  Stack,
  AccessControlState,
  ReentrancyChecker,
  TypeDepthChecker,
  VMConfig,
  InterpreterImpl,
  ExitCode,
  U8,
  U16,
  U64,
  U32,
  U256,
  Bool,
  U128,
  NumberType,
  isNumberValue,
  Ref,
  Vec,
  Value,
  Address,
  Struct,
  Frame,
} from "./types";
import { FunctionDefinition, FunctionHandle, MoveModule, SignatureToken } from "aptos-disassemble";

export class SimpleMoveVM {
  interpreter: InterpreterImpl;
  call_stack: Frame[];
  state: any;
  module_map: Map<string, MoveModule>;
  native_functions: Map<
    string,
    (
      type_args: string[],
      args: Value[]
    ) => {
      kind: "Return" | "Abort" | "Call";
      value?: Value[];
      handle?: number;
      reason?: string;
    }
  >;

  constructor(
    vm_config: VMConfig,
    access_control: AccessControlState,
    reentrancy_checker: ReentrancyChecker,
    ty_depth_checker: TypeDepthChecker,
    state?: any,
    module_map?: Map<string, MoveModule>,
    native_functions?: Map<
      string,
      (
        type_args: string[],
        args: Value[]
      ) => {
        kind: "Return" | "Abort" | "Call";
        value?: Value[];
        handle?: number;
        reason?: string;
      }
    >
  ) {
    this.interpreter = new InterpreterImpl(
      vm_config,
      access_control,
      reentrancy_checker,
      ty_depth_checker
    );
    this.state = state || {};
    this.call_stack = [];
    this.module_map = module_map || new Map<string, MoveModule>();
    this.native_functions = native_functions || new Map();
  }

  execute_code() {
    // 这里可以添加执行代码的逻辑
    console.log("Executing code...");
  }

  callFunction(func: {
    address: string;
    module: string;
    name: string;
    type_args: string[];
    args: any[];
  }): any {
    let module_code = this.find_module(func.address, func.module);

    let func_name_index = module_code.identifiers.findIndex((id) => id === func.name);
    if (func_name_index === -1) {
      throw new Error(`Function ${func.name} not found in module ${func.address}::${func.module}`);
    }

    let function_handle_index = module_code.function_handles.findIndex((handle) => {
      return handle.name === func_name_index;
    });
    if (function_handle_index === -1) {
      throw new Error(`Function handle for ${func.name} not found`);
    }

    let function_def = module_code.function_defs.find((def) => {
      return def.function === function_handle_index;
    });
    if (!function_def) {
      throw new Error(`Function definition for ${func.name} not found`);
    }

    if (!function_def.code) {
      throw new Error(`Function ${func.name} is native`);
    }

    let locals_signatures = module_code.signatures[function_def.code.locals];
    if (!locals_signatures) {
      throw new Error(`Locals signatures for function ${func.name} not found`);
    }

    const function_handle = this.get_function_handle(module_code, function_handle_index);

    const parameters_signatures = module_code.signatures[function_handle.parameters];
    if (!parameters_signatures) {
      throw new Error(`Parameters signatures for function ${func.name} not found`);
    }

    if (func.args.length !== parameters_signatures.length) {
      throw new Error(
        `Argument count mismatch for function ${func.name}: expected ${parameters_signatures.length}, got ${func.args.length}`
      );
    }

    const localCount = locals_signatures.length + parameters_signatures.length;
    const locals = new Array(localCount).fill(undefined);

    // 参数入局部变量
    func.args.forEach((value, i) => {
      locals[i] = value;
    });

    // 创建栈帧
    let frame = new Frame({
      pc: 0,
      module: module_code,
      functionDef: function_def,
      callType: "Call",
      locals,
      localTys: locals_signatures,
      interpreterImpl: this.interpreter,
    });

    while (1) {
      let result = frame.execute();
      if (result.kind === "Return") {
        let old_frame = this.call_stack.pop();
        if (old_frame === undefined) {
          let return_signatures = frame.module.signatures[function_handle.return_];
          if (return_signatures.length === 0) {
            return undefined;
          } else {
            return this.interpreter.operand_stack.popn(return_signatures.length);
          }
        } else {
          frame = old_frame;
          frame.pc++;
        }
      } else if (result.kind === "Abort") {
        throw new Error(`Execution aborted with value: ${result.value}`);
      } else if (result.kind === "Call") {
        if (this.call_stack.length >= 5) {
          throw new Error("Call stack size limit exceeded");
        }

        let old_function_handle = frame.module.function_handles[result.handle];
        if (!old_function_handle) {
          throw new Error(`Function handle for index ${result.handle} not found`);
        }

        let new_function_module_handle = frame.module.module_handles[old_function_handle.module];
        let new_function_address =
          frame.module.address_identifiers[new_function_module_handle.address];
        let new_function_module = frame.module.identifiers[new_function_module_handle.name];
        let new_function_name = frame.module.identifiers[old_function_handle.name];
        const module = this.find_module(`0x${new_function_address}`, new_function_module);

        console.log(
          `Calling function ${new_function_module}::${new_function_name} with address 0x${new_function_address}`
        );

        let new_function_ident_index = module.identifiers.findIndex(
          (id) => id === new_function_name
        );
        if (new_function_ident_index === -1) {
          throw new Error(
            `Function ${new_function_name} not found in module ${new_function_module}`
          );
        }

        let new_function_handle_index = module.function_handles.findIndex(
          (f) => f.name === new_function_ident_index
        );
        if (new_function_handle_index === -1) {
          throw new Error(`Function handle for ${new_function_name} not found`);
        }
        let new_function_handle = module.function_handles[new_function_handle_index];
        if (!new_function_handle) {
          throw new Error(`Function handle for ${new_function_name} not found`);
        }

        let new_function_definition = module.function_defs.find(
          (def) => def.function === new_function_handle_index
        );
        if (!new_function_definition) {
          throw new Error(`Function definition for handle ${result.handle} not found`);
        }

        let locals_signatures = module.signatures[function_def.code.locals];
        if (!locals_signatures) {
          throw new Error(`Locals signatures for function ${func.name} not found`);
        }

        const parameters_signatures = module.signatures[new_function_handle.parameters];
        if (!parameters_signatures) {
          throw new Error(`Parameters signatures for function ${func.name} not found`);
        }

        if (!new_function_definition.code) {
          let new_function = `0x${new_function_address}::${new_function_module}::${new_function_name}`;
          console.log(`Calling native function: ${new_function}`);
          let nativeFunction = this.native_functions.get(new_function);
          if (nativeFunction) {
            const args = parameters_signatures.map((_) => {
              return this.interpreter.operand_stack.pop();
            });
            let result = nativeFunction([], args);
            if (result.kind === "Return") {
              result.value?.forEach((value) => {
                this.interpreter.operand_stack.push(value);
              });
              frame.pc++;
            } else if (result.kind === "Abort") {
              throw new Error(
                `Native function ${new_function_name} aborted with value: ${result.reason}`
              );
            }
            continue;
          }
          throw new Error(`Native function ${new_function_name} not found`);
        }

        this.call_stack.push(frame);

        const localCount = locals_signatures.length + parameters_signatures.length;
        const locals = new Array(localCount).fill(undefined);

        if (parameters_signatures.length > 0) {
          console.log("Parameters count:", parameters_signatures.length);
          for (let i = 0; i < parameters_signatures.length; i++) {
            locals[i] = this.interpreter.operand_stack.pop();
          }
        }
        frame = this.create_call_frame(
          module,
          new_function_definition,
          "Call",
          locals,
          locals_signatures
        );
      }
    }
  }

  execute(func: {
    address: string;
    module: string;
    name: string;
    type_args: string[];
    args: any[];
  }) {
    return this.callFunction(func);
  }

  find_module(address: string, module: string): MoveModule {
    const moduleKey = `${address}::${module}`;
    const foundModule = this.module_map.get(moduleKey);
    if (!foundModule) {
      throw new Error(`Module ${moduleKey} not found`);
    }
    return foundModule;
  }

  get_function_handle(module: MoveModule, functionIndex: number): FunctionHandle {
    const functionHandle = module.function_handles[functionIndex];
    if (!functionHandle) {
      throw new Error(`Function handle for index ${functionIndex} not found`);
    }
    return functionHandle;
  }

  get_function_definition(module: MoveModule, functionIndex: number): FunctionDefinition {
    const functionDef = module.function_defs.find((def) => def.function === functionIndex);
    if (!functionDef) {
      throw new Error(`Function definition for index ${functionIndex} not found`);
    }
    return functionDef;
  }

  create_call_frame(
    module: MoveModule,
    functionDef: FunctionDefinition,
    callType: string = "Call",
    locals: any[] = [],
    localTys: SignatureToken[] = []
  ): Frame {
    return new Frame({
      pc: 0,
      module,
      functionDef,
      callType,
      locals,
      localTys,
      interpreterImpl: this.interpreter,
    });
  }
}
