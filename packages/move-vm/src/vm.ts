// 栈帧结构
class Frame {
  pc: number;
  module: MoveModule;
  function: FunctionDefinition;
  callType: string;
  locals: any[];
  localTys: any[];
  interpreterImpl: InterpreterImpl;
  // 可扩展其他字段
  constructor({ pc, module, functionDef, callType, locals, localTys , interpreterImpl }: {
    pc?: number;
    module: MoveModule;
    functionDef: any;
    callType?: string;
    locals: any[];
    localTys: any[];
    interpreterImpl: InterpreterImpl;
  }) {
    this.pc = pc ?? 0;
    this.module = module;
    this.function = functionDef;
    this.callType = callType ?? "Call";
    this.locals = locals;
    this.localTys = localTys;
    this.interpreterImpl = interpreterImpl;
  }

  execute(): ExitCode {
    const codes = this.function.code!.code;
    if (!codes) {
      throw new Error("Function code is not defined");
    }

    while (this.pc < codes.length) {
      const code = codes[this.pc];
        console.log(`Executing instruction at pc ${this.pc}: ${JSON.stringify(code)}`);
      switch (code.kind) {
        case "Pop":
            this.interpreterImpl.operand_stack.pop();
            break;
        case "BrTrue":
            this.interpreterImpl.operand_stack.pop_as<boolean>() ? this.pc = code.codeOffset : this.pc++;
            break;
        case "BrFalse":
            this.interpreterImpl.operand_stack.pop_as<boolean>() ? this.pc++ : this.pc = code.codeOffset;
            break;
        case "Branch":
            this.pc = code.codeOffset;
            break;
        case "LdU8":
            this.interpreterImpl.operand_stack.push(code.value);
            break;
        case "LdU16":
            this.interpreterImpl.operand_stack.push(code.value);
            break;
        case "LdU32":
            this.interpreterImpl.operand_stack.push(code.value);
            break;
        case "LdU64":
            this.interpreterImpl.operand_stack.push(code.value);
            break;
        case "LdU128":
            this.interpreterImpl.operand_stack.push(code.value);
            break;
        case "LdU256":
            this.interpreterImpl.operand_stack.push(code.value);
            break;
        case "LdConst":
            const constValue = this.module.constant_pool[code.constIdx];
            this.interpreterImpl.operand_stack.push(constValue);
            break;
        case "LdTrue":
            this.interpreterImpl.operand_stack.push(true);
            break;
        case "LdFalse":
            this.interpreterImpl.operand_stack.push(false);
            break;
        case "CopyLoc":
            const localIndex = code.localIdx;
            if (localIndex < 0 || localIndex >= this.locals.length) {
              throw new Error(`Invalid local index: ${localIndex}`);
            }
            this.interpreterImpl.operand_stack.push(this.locals[localIndex]);
            break;
        case "MoveLoc":
            const moveLocalIndex = code.localIdx;
            if (moveLocalIndex < 0 || moveLocalIndex >= this.locals.length) {
              throw new Error(`Invalid local index: ${moveLocalIndex}`);
            }
            if (this.locals[moveLocalIndex] === undefined) {
              throw new Error(`Local variable at index ${moveLocalIndex} is not initialized`);
            }
            this.interpreterImpl.operand_stack.push(this.locals[moveLocalIndex]);
            this.locals[moveLocalIndex] = undefined; // 清除局部变量
            break;
        case "StLoc":
            const stLocalIndex = code.localIdx;
            if (stLocalIndex < 0 || stLocalIndex >= this.locals.length) {
              throw new Error(`Invalid local index: ${stLocalIndex}`);
            }
            const valueToStore = this.interpreterImpl.operand_stack.pop();
            this.locals[stLocalIndex] = valueToStore;
            break;
        case "Add":
            const right = this.interpreterImpl.operand_stack.pop();
            const left = this.interpreterImpl.operand_stack.pop();
            this.interpreterImpl.operand_stack.push(left + right);
            break;
        case "Sub":
            const subRight = this.interpreterImpl.operand_stack.pop();
            const subLeft = this.interpreterImpl.operand_stack.pop();
            this.interpreterImpl.operand_stack.push(subLeft - subRight);
            break;
        case "Mul":
            const mulRight = this.interpreterImpl.operand_stack.pop();
            const mulLeft = this.interpreterImpl.operand_stack.pop();
            this.interpreterImpl.operand_stack.push(mulLeft * mulRight);
            break;
        case "Div":
            const divRight = this.interpreterImpl.operand_stack.pop();
            const divLeft = this.interpreterImpl.operand_stack.pop();
            if (divRight === 0) {
              throw new Error("Division by zero");
            }
            this.interpreterImpl.operand_stack.push(divLeft / divRight);
            break;
        case "Mod":
            const modRight = this.interpreterImpl.operand_stack.pop();
            const modLeft = this.interpreterImpl.operand_stack.pop();
            if (modRight === 0) {
              throw new Error("Division by zero");
            }
            this.interpreterImpl.operand_stack.push(modLeft % modRight);
            break;
        case "Eq":
            const eqRight = this.interpreterImpl.operand_stack.pop();
            const eqLeft = this.interpreterImpl.operand_stack.pop();
            this.interpreterImpl.operand_stack.push(eqLeft === eqRight);
            break;
        case "Neq":
            const neqRight = this.interpreterImpl.operand_stack.pop();
            const neqLeft = this.interpreterImpl.operand_stack.pop();
            this.interpreterImpl.operand_stack.push(neqLeft !== neqRight);
            break;
        case "Gt":
            const gtRight = this.interpreterImpl.operand_stack.pop();
            const gtLeft = this.interpreterImpl.operand_stack.pop();
            this.interpreterImpl.operand_stack.push(gtLeft > gtRight);
            break;
        case "Lt":
            const ltRight = this.interpreterImpl.operand_stack.pop();
            const ltLeft = this.interpreterImpl.operand_stack.pop();
            this.interpreterImpl.operand_stack.push(ltLeft < ltRight);
            break;
        case "Le":
            const leRight = this.interpreterImpl.operand_stack.pop();
            const leLeft = this.interpreterImpl.operand_stack.pop();
            this.interpreterImpl.operand_stack.push(leLeft <= leRight);
            break;
        case "Ge":
            const geRight = this.interpreterImpl.operand_stack.pop();
            const geLeft = this.interpreterImpl.operand_stack.pop();
            this.interpreterImpl.operand_stack.push(geLeft >= geRight);
            break;
        case "BitOr":
            const borRight = this.interpreterImpl.operand_stack.pop();
            const borLeft = this.interpreterImpl.operand_stack.pop();
            this.interpreterImpl.operand_stack.push(borLeft | borRight);
            break;
        case "BitAnd":
            const bandRight = this.interpreterImpl.operand_stack.pop();
            const bandLeft = this.interpreterImpl.operand_stack.pop();
            this.interpreterImpl.operand_stack.push(bandLeft & bandRight);
            break;
        case "Xor":
            const xorRight = this.interpreterImpl.operand_stack.pop();
            const xorLeft = this.interpreterImpl.operand_stack.pop();
            this.interpreterImpl.operand_stack.push(xorLeft ^ xorRight);
            break;
        case "Shl":
            const shlRight = this.interpreterImpl.operand_stack.pop();
            const shlLeft = this.interpreterImpl.operand_stack.pop();
            this.interpreterImpl.operand_stack.push(shlLeft << shlRight);
            break;
        case "Shr":
            const shrRight = this.interpreterImpl.operand_stack.pop();
            const shrLeft = this.interpreterImpl.operand_stack.pop();
            this.interpreterImpl.operand_stack.push(shrLeft >> shrRight);
            break;
        case "Or":
            const orRight = this.interpreterImpl.operand_stack.pop();
            const orLeft = this.interpreterImpl.operand_stack.pop();
            this.interpreterImpl.operand_stack.push(orLeft || orRight);
            break;
        case "And":
            const andRight = this.interpreterImpl.operand_stack.pop();
            const andLeft = this.interpreterImpl.operand_stack.pop();
            this.interpreterImpl.operand_stack.push(andLeft && andRight);
            break;
        case "Not":
            const notValue = this.interpreterImpl.operand_stack.pop();
            this.interpreterImpl.operand_stack.push(!notValue);
            break;
        case "Nop":
            // No operation, just continue
            break;
        case "Abort":
            const abortValue = this.interpreterImpl.operand_stack.pop();
            return { kind: "Abort", value: BigInt(abortValue) };
        case "Ret":
          return { kind: "Return" };
        default:
          throw new Error(`Unknown instruction at pc ${this.pc}: ${JSON.stringify(code)}`);
      }
     
      this.pc++;
    }
    throw new Error(`Function ${this.function} did not return a value`);
  }
}
import { Stack, AccessControlState, ReentrancyChecker, TypeDepthChecker, VMConfig, InterpreterImpl, ExitCode } from "./types";
import { FunctionDefinition, FunctionHandle, MoveModule } from "aptos-disassemble"

export class SimpleMoveVM {
  interpreter: InterpreterImpl;
  state: any;
  module_map: Map<string, MoveModule>;

  constructor(
    vm_config: VMConfig,
    access_control: AccessControlState,
    reentrancy_checker: ReentrancyChecker,
    ty_depth_checker: TypeDepthChecker,
    state?: any,
    module_map?: Map<string, MoveModule>
  ) {
    this.interpreter = new InterpreterImpl(
      vm_config,
      access_control,
      reentrancy_checker,
      ty_depth_checker
    );
    this.state = state || {};
    this.module_map = module_map || new Map<string, MoveModule>();
  }

  execute_code() {
    // 这里可以添加执行代码的逻辑
    console.log("Executing code...");
  }


  callFunction(
    func: {
      address: string;
      module: string;
      name: string;
      type_args: string[];
      args: any[];
    }
  ): any {
    // 找 code 
    const code = this.module_map.get(`${func.address}::${func.module}`);
    if (!code) {
      throw new Error(`Module ${func.address}::${func.module} not found`);
    }

    let func_name_index = code.identifiers.findIndex((id) => id === func.name);
    if (func_name_index === -1) {
      throw new Error(`Function ${func.name} not found in module ${func.address}::${func.module}`);
    }

    let function_handle_index = code.function_handles.findIndex((handle) => {
        return handle.name === func_name_index;
    });
    if (function_handle_index === -1) {
      throw new Error(`Function handle for ${func.name} not found`);
    }

    let function_def = code.function_defs.find((def) => {
      return def.function === function_handle_index;
    });
    if (!function_def) {
      throw new Error(`Function definition for ${func.name} not found`);
    }

    if(!function_def.code) {
      throw new Error(`Function ${func.name} is native`);
    }

    let locals_signatures = code.signatures[function_def.code.locals];
    if (!locals_signatures) {
      throw new Error(`Locals signatures for function ${func.name} not found`);
    }

    const function_handle = code.function_handles[function_handle_index];
    if (!function_handle) {
      throw new Error(`Function handle for ${func.name} not found`);
    }

    const parameters_signatures = code.signatures[function_handle.parameters];
    if (!parameters_signatures) {
      throw new Error(`Parameters signatures for function ${func.name} not found`);
    }

    if (func.args.length !== parameters_signatures.length) {
      throw new Error(`Argument count mismatch for function ${func.name}: expected ${parameters_signatures.length}, got ${func.args.length}`);
    }

    const localCount = locals_signatures.length + parameters_signatures.length;
    const locals = new Array(localCount).fill(undefined);

    // 参数入局部变量
    func.args.forEach((value, i) => {
      locals[i] = value;
    });

    // 创建栈帧
    const frame = new Frame({
      pc: 0,
        module: code,
      functionDef: function_def,
      callType: "Call",
      locals,
      localTys: locals_signatures,
      interpreterImpl: this.interpreter, 
    });

    let result = frame.execute();
    if (result.kind === "Return") {
      let return_signatures = code.signatures[function_handle.return_];
        if (return_signatures.length === 0) {
            return undefined; // 无返回值
        } else {
            return this.interpreter.operand_stack.popn(return_signatures.length);
        }
    } else if (result.kind === "Abort") {
        throw new Error(`Execution aborted with value: ${result.value}`);
    }

    return result;
  }


  execute(
    func: {
      address: string;
      module: string;
      name: string;
      type_args: string[];
      args: any[];
    }
  ) {
    return this.callFunction(func);
  }
}
