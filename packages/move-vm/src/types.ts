export type FunctionHandleIndex = number;
export type FunctionInstantiationIndex = number;
export type SignatureIndex = number;

export type ExitCode =
  | { kind: "Return" }
  | { kind: "Abort", value: BigInt }
  | { kind: "Call", handle: FunctionHandleIndex }
  | { kind: "CallGeneric", instantiation: FunctionInstantiationIndex }
  | { kind: "CallClosure", signature: SignatureIndex };

// VM 相关类型定义
export type VMConfig = any;
export type AccessControlState = any;
export type ReentrancyChecker = any;
export type TypeDepthChecker = any;

export interface VMValueCast<T> {
  value_as(): T;
}

export type Frame = { location: () => Location };
export enum Location {
  Undefined,
  // 其他 location 类型
}
// ...existing code...

// 占位类型定义，可根据实际需求完善

export  class InterpreterImpl {
  operand_stack: Stack;
  call_stack: CallStack;
  vm_config: VMConfig;
  access_control: AccessControlState;
  reentrancy_checker: ReentrancyChecker;
  ty_depth_checker: TypeDepthChecker;

  constructor(
    vm_config: VMConfig,
    access_control: AccessControlState,
    reentrancy_checker: ReentrancyChecker,
    ty_depth_checker: TypeDepthChecker
  ) {
    this.operand_stack = Stack.new();
    this.call_stack = CallStack.new();
    this.vm_config = vm_config;
    this.access_control = access_control;
    this.reentrancy_checker = reentrancy_checker;
    this.ty_depth_checker = ty_depth_checker;
  }
}

// 栈和调用栈的 TypeScript 实现
const OPERAND_STACK_SIZE_LIMIT = 1024;
const CALL_STACK_SIZE_LIMIT = 1024;
const ACCESS_STACK_SIZE_LIMIT = 256;

// 错误码和异常
export enum StatusCode {
  EXECUTION_STACK_OVERFLOW,
  EMPTY_VALUE_STACK,
  UNKNOWN_INVARIANT_VIOLATION_ERROR,
}

export class PartialVMError extends Error {
  code: StatusCode;
  constructor(code: StatusCode, message?: string) {
    super(message);
    this.code = code;
  }
  static new(code: StatusCode) {
    return new PartialVMError(code);
  }
  withMessage(msg: string) {
    this.message = msg;
    return this;
  }
}

// 类型定义
export type Value = any; // 可根据实际 VM 需求定义
export type Type = any;  // 可根据实际 VM 需求定义
export class Stack {
  value: Value[] = [];
  types: Type[] = [];

  static new(): Stack {
    return new Stack();
  }

  push(value: Value): void {
    if (this.value.length < OPERAND_STACK_SIZE_LIMIT) {
      this.value.push(value);
    } else {
      throw PartialVMError.new(StatusCode.EXECUTION_STACK_OVERFLOW);
    }
  }

  pop(): Value {
    if (this.value.length === 0) {
      throw PartialVMError.new(StatusCode.EMPTY_VALUE_STACK);
    }
    return this.value.pop()!;
  }

  pop_as<T>(): T {
    const val = this.pop();
    if ((val as VMValueCast<T>).value_as) {
      return (val as VMValueCast<T>).value_as();
    }
    throw PartialVMError.new(StatusCode.UNKNOWN_INVARIANT_VIOLATION_ERROR);
  }

  popn(n: number): Value[] {
    if (this.value.length < n) {
      throw PartialVMError.new(StatusCode.EMPTY_VALUE_STACK);
    }
    const start = this.value.length - n;
    const args = this.value.splice(start, n);
    return args;
  }

  last_n(n: number): Value[] {
    if (this.value.length < n) {
      throw PartialVMError.new(StatusCode.EMPTY_VALUE_STACK)
        .withMessage("Failed to get last n arguments on the argument stack");
    }
    return this.value.slice(this.value.length - n);
  }

  push_ty(ty: Type): void {
    if (this.types.length < OPERAND_STACK_SIZE_LIMIT) {
      this.types.push(ty);
    } else {
      throw PartialVMError.new(StatusCode.EXECUTION_STACK_OVERFLOW);
    }
  }

  pop_ty(): Type {
    if (this.types.length === 0) {
      throw PartialVMError.new(StatusCode.EMPTY_VALUE_STACK);
    }
    return this.types.pop()!;
  }

  top_ty(): Type {
    if (this.types.length === 0) {
      throw PartialVMError.new(StatusCode.EMPTY_VALUE_STACK);
    }
    return this.types[this.types.length - 1];
  }

  popn_tys(n: number): Type[] {
    if (this.types.length < n) {
      throw PartialVMError.new(StatusCode.EMPTY_VALUE_STACK);
    }
    const start = this.types.length - n;
    const args = this.types.splice(start, n);
    return args;
  }

  check_balance(): void {
    if (this.types.length !== this.value.length) {
      throw PartialVMError.new(StatusCode.UNKNOWN_INVARIANT_VIOLATION_ERROR)
        .withMessage("Paranoid Mode: Type and value stack need to be balanced");
    }
  }
}

export class CallStack {
  private stack: Frame[] = [];

  static new(): CallStack {
    return new CallStack();
  }

  push(frame: Frame): void {
    if (this.stack.length < CALL_STACK_SIZE_LIMIT) {
      this.stack.push(frame);
    } else {
      throw frame;
    }
  }

  pop(): Frame | undefined {
    return this.stack.pop();
  }

  current_location(): Location {
    const frame = this.stack[this.stack.length - 1];
    return frame ? frame.location() : Location.Undefined;
  }
}
