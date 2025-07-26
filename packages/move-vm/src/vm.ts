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
  constructor({
    pc,
    module,
    functionDef,
    callType,
    locals,
    localTys,
    interpreterImpl,
  }: {
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
      console.log(
        `Executing instruction at pc ${this.pc}: ${JSON.stringify(code, (_, value) => {
          return typeof value === "bigint" ? value.toString() : value;
        })}`
      );
      switch (code.kind) {
        case "Pop":
          this.interpreterImpl.operand_stack.pop();
          break;
        case "BrTrue":
          this.interpreterImpl.operand_stack.pop_as(Bool) ? (this.pc = code.codeOffset) : this.pc++;
          break;
        case "BrFalse":
          this.interpreterImpl.operand_stack.pop_as(Bool) ? this.pc++ : (this.pc = code.codeOffset);
          break;
        case "Branch":
          this.pc = code.codeOffset;
          break;
        case "LdU8":
          this.interpreterImpl.operand_stack.push(U8.from(BigInt(code.value)));
          break;
        case "LdU16":
          this.interpreterImpl.operand_stack.push(U16.from(BigInt(code.value)));
          break;
        case "LdU32":
          this.interpreterImpl.operand_stack.push(U32.from(BigInt(code.value)));
          break;
        case "LdU64":
          this.interpreterImpl.operand_stack.push(U64.from(BigInt(code.value)));
          break;
        case "LdU128":
          this.interpreterImpl.operand_stack.push(U128.from(BigInt(code.value)));
          break;
        case "LdU256":
          this.interpreterImpl.operand_stack.push(U256.from(BigInt(code.value)));
          break;
        // case "LdConst":
        // const constValue = this.module.constant_pool[code.constIdx];
        // this.interpreterImpl.operand_stack.push(constValue);
        // break;
        case "LdTrue":
          this.interpreterImpl.operand_stack.push(Bool.fromBool(true));
          break;
        case "LdFalse":
          this.interpreterImpl.operand_stack.push(Bool.fromBool(false));
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
          if (!isNumberValue(left) || !isNumberValue(right)) {
            throw new Error("Operands must be numbers");
          }
          if ((right as Object).constructor.name === (left as Object).constructor.name) {
            this.interpreterImpl.operand_stack.push(
              NumberType[left.constructor.name].from(
                (left.value as bigint) + (right.value as bigint)
              )
            );
          } else {
            throw new Error("Type mismatch");
          }
          break;
        case "Sub":
          const subRight = this.interpreterImpl.operand_stack.pop();
          const subLeft = this.interpreterImpl.operand_stack.pop();
          if (!isNumberValue(subLeft) || !isNumberValue(subRight)) {
            throw new Error("Operands must be numbers");
          }
          if ((subRight as Object).constructor.name === (subLeft as Object).constructor.name) {
            this.interpreterImpl.operand_stack.push(
              new NumberType[subLeft.constructor.name](
                (subLeft.value as bigint) - (subRight.value as bigint)
              )
            );
          } else {
            throw new Error("Type mismatch");
          }
          break;
        case "Mul":
          const mulRight = this.interpreterImpl.operand_stack.pop();
          const mulLeft = this.interpreterImpl.operand_stack.pop();
          if (!isNumberValue(mulLeft) || !isNumberValue(mulRight)) {
            throw new Error("Operands must be numbers");
          }
          if ((mulRight as Object).constructor.name === (mulLeft as Object).constructor.name) {
            this.interpreterImpl.operand_stack.push(
              new NumberType[mulLeft.constructor.name](
                (mulLeft.value as bigint) * (mulRight.value as bigint)
              )
            );
          } else {
            throw new Error("Type mismatch");
          }
          break;
        case "Div":
          const divRight = this.interpreterImpl.operand_stack.pop();
          const divLeft = this.interpreterImpl.operand_stack.pop();
          if (!isNumberValue(divLeft) || !isNumberValue(divRight)) {
            throw new Error("Operands must be numbers");
          }
          if ((divRight as Object).constructor.name !== (divLeft as Object).constructor.name) {
            throw new Error("Type mismatch");
          }
          if (divLeft.value === 0n) {
            throw new Error("Division by zero");
          }
          this.interpreterImpl.operand_stack.push(
            new NumberType[divLeft.constructor.name](
              (divLeft.value as bigint) / (divRight.value as bigint)
            )
          );
          break;
        case "Mod":
          const modRight = this.interpreterImpl.operand_stack.pop();
          const modLeft = this.interpreterImpl.operand_stack.pop();
          if (!isNumberValue(modLeft) || !isNumberValue(modRight)) {
            throw new Error("Operands must be numbers");
          }
          if ((modRight as Object).constructor.name !== (modLeft as Object).constructor.name) {
            throw new Error("Type mismatch");
          }
          if (modRight.value === 0n) {
            throw new Error("Division by zero");
          }
          this.interpreterImpl.operand_stack.push(
            new NumberType[modLeft.constructor.name](
              (modLeft.value as bigint) % (modRight.value as bigint)
            )
          );
          break;
        case "Eq":
          const eqRight = this.interpreterImpl.operand_stack.pop();
          const eqLeft = this.interpreterImpl.operand_stack.pop();
          if (!isNumberValue(eqLeft) || !isNumberValue(eqRight)) {
            throw new Error("Operands must be numbers");
          }
          if ((eqRight as Object).constructor.name !== (eqLeft as Object).constructor.name) {
            throw new Error("Type mismatch");
          }
          this.interpreterImpl.operand_stack.push(
            Bool.fromBool((eqLeft.value as bigint) == (eqRight.value as bigint))
          );
          break;
        case "Neq":
          const neqRight = this.interpreterImpl.operand_stack.pop();
          const neqLeft = this.interpreterImpl.operand_stack.pop();
          if (!isNumberValue(neqLeft) || !isNumberValue(neqRight)) {
            throw new Error("Operands must be numbers");
          }
          if ((neqRight as Object).constructor.name !== (neqLeft as Object).constructor.name) {
            throw new Error("Type mismatch");
          }

          this.interpreterImpl.operand_stack.push(Bool.fromBool(neqLeft.value !== neqRight.value));
          break;
        case "Gt":
          const gtRight = this.interpreterImpl.operand_stack.pop();
          const gtLeft = this.interpreterImpl.operand_stack.pop();
          if (!isNumberValue(gtLeft) || !isNumberValue(gtRight)) {
            throw new Error("Operands must be numbers");
          }
          if ((gtRight as Object).constructor.name !== (gtLeft as Object).constructor.name) {
            throw new Error("Type mismatch");
          }
          this.interpreterImpl.operand_stack.push(Bool.fromBool(gtLeft.value > gtRight.value));
          break;
        case "Lt":
          const ltRight = this.interpreterImpl.operand_stack.pop();
          const ltLeft = this.interpreterImpl.operand_stack.pop();
          this.interpreterImpl.operand_stack.push(Bool.fromBool(ltLeft.value < ltRight.value));
          break;
        case "Le":
          const leRight = this.interpreterImpl.operand_stack.pop();
          const leLeft = this.interpreterImpl.operand_stack.pop();
          this.interpreterImpl.operand_stack.push(Bool.fromBool(leLeft.value <= leRight.value));
          break;
        case "Ge":
          const geRight = this.interpreterImpl.operand_stack.pop();
          const geLeft = this.interpreterImpl.operand_stack.pop();
          this.interpreterImpl.operand_stack.push(Bool.fromBool(geLeft.value >= geRight.value));
          break;
        case "BitOr":
          const borRight = this.interpreterImpl.operand_stack.pop();
          const borLeft = this.interpreterImpl.operand_stack.pop();
          if (!(borLeft as any).isNumber && !(borRight as any).isNumber) {
            throw new Error("Operands must be numbers");
          }
          if ((borRight as Object).constructor.name !== (borLeft as Object).constructor.name) {
            throw new Error("Type mismatch");
          }

          this.interpreterImpl.operand_stack.push(
            new NumberType[borLeft.constructor.name](
              (borLeft.value as bigint) | (borRight.value as bigint)
            )
          );
          break;
        case "BitAnd":
          const bandRight = this.interpreterImpl.operand_stack.pop();
          const bandLeft = this.interpreterImpl.operand_stack.pop();
          if (!(bandLeft as any).isNumber && !(bandRight as any).isNumber) {
            throw new Error("Operands must be numbers");
          }
          if ((bandRight as Object).constructor.name !== (bandLeft as Object).constructor.name) {
            throw new Error("Type mismatch");
          }
          this.interpreterImpl.operand_stack.push(
            new NumberType[bandLeft.constructor.name](
              (bandLeft.value as bigint) & (bandRight.value as bigint)
            )
          );
          break;
        case "Xor":
          const xorRight = this.interpreterImpl.operand_stack.pop();
          const xorLeft = this.interpreterImpl.operand_stack.pop();
          if (!(xorLeft as any).isNumber && !(xorRight as any).isNumber) {
            throw new Error("Operands must be numbers");
          }
          if ((xorRight as Object).constructor.name !== (xorLeft as Object).constructor.name) {
            throw new Error("Type mismatch");
          }
          this.interpreterImpl.operand_stack.push(
            new NumberType[xorLeft.constructor.name](
              (xorLeft.value as bigint) ^ (xorRight.value as bigint)
            )
          );
          break;
        case "Shl":
          const shlRight = this.interpreterImpl.operand_stack.pop();
          const shlLeft = this.interpreterImpl.operand_stack.pop();
          if (!(shlLeft as any).isNumber && !(shlRight as any).isNumber) {
            throw new Error("Operands must be numbers");
          }
          if ((shlRight as Object).constructor.name !== (shlLeft as Object).constructor.name) {
            throw new Error("Type mismatch");
          }
          this.interpreterImpl.operand_stack.push(
            new NumberType[shlLeft.constructor.name](
              (shlLeft.value as bigint) << (shlRight.value as bigint)
            )
          );
          break;
        case "Shr":
          const shrRight = this.interpreterImpl.operand_stack.pop();
          const shrLeft = this.interpreterImpl.operand_stack.pop();
          if (!(shrLeft as any).isNumber && !(shrRight as any).isNumber) {
            throw new Error("Operands must be numbers");
          }
          if ((shrRight as Object).constructor.name !== (shrLeft as Object).constructor.name) {
            throw new Error("Type mismatch");
          }
          this.interpreterImpl.operand_stack.push(
            new NumberType[shrLeft.constructor.name](
              (shrLeft.value as bigint) >> (shrRight.value as bigint)
            )
          );
          break;
        case "Or":
          const orRight = this.interpreterImpl.operand_stack.pop();
          const orLeft = this.interpreterImpl.operand_stack.pop();
          if (!(orLeft instanceof Bool) || !(orRight instanceof Bool)) {
            throw new Error("Operands must be booleans");
          }
          this.interpreterImpl.operand_stack.push(Bool.fromBool(orLeft.value || orRight.value));
          break;
        case "And":
          const andRight = this.interpreterImpl.operand_stack.pop();
          const andLeft = this.interpreterImpl.operand_stack.pop();
          if (!(andLeft instanceof Bool) || !(andRight instanceof Bool)) {
            throw new Error("Operands must be booleans");
          }
          this.interpreterImpl.operand_stack.push(Bool.fromBool(andLeft.value && andRight.value));
          break;
        case "Not":
          const notValue = this.interpreterImpl.operand_stack.pop();
          this.interpreterImpl.operand_stack.push(Bool.fromBool(!notValue.value));
          break;
        case "Nop":
          // No operation, just continue
          break;
        case "Abort":
          const abortValue = this.interpreterImpl.operand_stack.pop_as(U64);
          return { kind: "Abort", value: abortValue.value };
        case "Ret":
          return { kind: "Return" };
        case "MutBorrowLoc":
        case "ImmBorrowLoc":
          const borrowLocalIndex = code.localIdx;
          if (borrowLocalIndex < 0 || borrowLocalIndex >= this.locals.length) {
            throw new Error(`Invalid local index: ${borrowLocalIndex}`);
          }
          const borrowValue = this.locals[borrowLocalIndex];
          if (borrowValue === undefined) {
            throw new Error(`Local variable at index ${borrowLocalIndex} is not initialized`);
          }
          if (borrowValue !== undefined) {
            if (!(borrowValue instanceof Ref)) {
              this.interpreterImpl.operand_stack.push(new Ref(borrowValue));
            } else {
              throw new Error("Cannot borrow a reference");
            }
          }
          break;
        case "VecPack": {
          const vecSize = Number(code.numElements.toString());
          const type = code.elemTyIdx;
          const elemType = this.module.signatures[type][0];

          switch (elemType.kind) {
            case "U8":
              this.interpreterImpl.operand_stack.push(
                new Vec<U8>(
                  Array.from({ length: vecSize }, () =>
                    this.interpreterImpl.operand_stack.pop_as(U8)
                  )
                )
              );
              break;
            case "U16":
              this.interpreterImpl.operand_stack.push(
                new Vec<U16>(
                  Array.from({ length: vecSize }, () =>
                    this.interpreterImpl.operand_stack.pop_as(U16)
                  )
                )
              );
              break;
            case "U32":
              this.interpreterImpl.operand_stack.push(
                new Vec<U32>(
                  Array.from({ length: vecSize }, () =>
                    this.interpreterImpl.operand_stack.pop_as(U32)
                  )
                )
              );
              break;
            case "U64":
              this.interpreterImpl.operand_stack.push(
                new Vec<U64>(
                  Array.from({ length: vecSize }, () =>
                    this.interpreterImpl.operand_stack.pop_as(U64)
                  )
                )
              );
              break;
            case "U128":
              this.interpreterImpl.operand_stack.push(
                new Vec<U128>(
                  Array.from({ length: vecSize }, () =>
                    this.interpreterImpl.operand_stack.pop_as(U128)
                  )
                )
              );
              break;
            case "U256":
              this.interpreterImpl.operand_stack.push(
                new Vec<U256>(
                  Array.from({ length: vecSize }, () =>
                    this.interpreterImpl.operand_stack.pop_as(U256)
                  )
                )
              );
              break;
            case "Address":
              this.interpreterImpl.operand_stack.push(
                new Vec<Address>(
                  Array.from({ length: vecSize }, () =>
                    this.interpreterImpl.operand_stack.pop_as(Address)
                  )
                )
              );
              break;
            case "Bool":
              this.interpreterImpl.operand_stack.push(
                new Vec<Bool>(
                  Array.from({ length: vecSize }, () =>
                    this.interpreterImpl.operand_stack.pop_as(Bool)
                  )
                )
              );
              break;
            default:
              throw new Error(`Unsupported vector element type: ${elemType.kind}`);
          }

          break;
        }

        case "VecPushBack": {
          let elem = this.interpreterImpl.operand_stack.pop();
          const ref = this.interpreterImpl.operand_stack.pop_as(Ref<Vec<Value>>);

          ref.get().push(elem);
          break;
        }

        default:
          throw new Error(
            `Unknown instruction at pc ${this.pc}: ${JSON.stringify(
              code,
              (_, value) => {
                return typeof value === "bigint" ? value.toString() : value;
              },
              2
            )}`
          );
      }
      this.pc++;
    }
    throw new Error(`Function ${this.function} did not return a value`);
  }
}
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
} from "./types";
import { FunctionDefinition, FunctionHandle, MoveModule } from "aptos-disassemble";

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

  callFunction(func: {
    address: string;
    module: string;
    name: string;
    type_args: string[];
    args: any[];
  }): any {
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

    if (!function_def.code) {
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

  execute(func: {
    address: string;
    module: string;
    name: string;
    type_args: string[];
    args: any[];
  }) {
    return this.callFunction(func);
  }
}
