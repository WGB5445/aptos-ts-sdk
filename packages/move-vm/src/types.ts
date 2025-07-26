export type FunctionHandleIndex = number;
export type FunctionInstantiationIndex = number;
export type SignatureIndex = number;

export type ExitCode =
  | { kind: "Return" }
  | { kind: "Abort"; value: BigInt }
  | { kind: "Call"; handle: FunctionHandleIndex }
  | { kind: "CallGeneric"; instantiation: FunctionInstantiationIndex }
  | { kind: "CallClosure"; signature: SignatureIndex };

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

export class InterpreterImpl {
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

export class Ref<T> {
  value: T;

  constructor(value: T) {
    this.value = value;
  }

  get(): T {
    return this.value;
  }
}

export class U8 {
  value: bigint;
  constructor(value: bigint) {
    if (value < 0n || value > 255n) {
      throw new Error("U8 value must be between 0 and 255");
    }
    this.value = value;
  }
  static from(value: bigint): U8 {
    return new U8(value);
  }
}

export class U16 {
  value: bigint;
  constructor(value: bigint) {
    if (value < 0n || value > 65535n) {
      throw new Error("U16 value must be between 0 and 65535");
    }
    this.value = value;
  }
  static from(value: bigint): U16 {
    return new U16(value);
  }
}

export class U32 {
  value: bigint;
  constructor(value: bigint) {
    if (value < 0n || value > 4294967295n) {
      throw new Error("U32 value must be between 0 and 4294967295");
    }
    this.value = value;
  }
  static from(value: bigint): U32 {
    return new U32(value);
  }
}

export class U64 {
  value: bigint;
  constructor(value: bigint) {
    if (value < 0n || value > 0xffffffffffffffffn) {
      throw new Error("U64 value must be between 0 and 2^64-1");
    }
    this.value = value;
  }
  static from(value: bigint): U64 {
    return new U64(value);
  }
}

export class U128 {
  value: bigint;
  constructor(value: bigint) {
    if (value < 0n || value > 0xffffffffffffffffffffffffffffffffn) {
      throw new Error("U128 value must be between 0 and 2^128-1");
    }
    this.value = value;
  }
  static from(value: bigint): U128 {
    return new U128(value);
  }
}

export class U256 {
  value: bigint;
  constructor(value: bigint) {
    if (value < 0n || value > 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn) {
      throw new Error("U256 value must be between 0 and 2^256-1");
    }
    this.value = value;
  }
  static from(value: bigint): U256 {
    return new U256(value);
  }
}

export const types = [U8, U16, U32, U64, U128, U256];
export function isNumberValue(val: any): boolean {
  return types.some((type) => val instanceof type);
}

export const NumberType: Record<string, any> = {
  U8: U8,
  U16: U16,
  U32: U32,
  U64: U64,
  U128: U128,
  U256: U256,
};

export class Address {
  value: string;
  constructor(value: string) {
    if (!/^0x[a-fA-F0-9]{64}$/.test(value)) {
      throw new Error("Invalid address format");
    }
    this.value = value;
  }

  static fromAddress(value: string): Address {
    return new Address(value);
  }
}

export class Bool {
  value: boolean;
  constructor(value: boolean) {
    this.value = value;
  }

  static fromBool(value: boolean): Bool {
    return new Bool(value);
  }
}

export class Signer {
  value: string;
  constructor(value: string) {
    if (!/^0x[a-fA-F0-9]{64}$/.test(value)) {
      throw new Error("Invalid signer format");
    }
    this.value = value;
  }

  static fromSigner(value: string): Signer {
    return new Signer(value);
  }
}

export class Vec<T extends Value> {
  value: T[];
  constructor(value: T[]) {
    this.value = value;
  }
  push(item: T): void {
    this.value.push(item);
  }
  getItems(): T[] {
    return this.value;
  }
}

// 类型定义
export type Value =
  | U8
  | U16
  | U32
  | U64
  | U128
  | U256
  | Address
  | Bool
  | Signer
  | Ref<Value>
  | Vec<Value>; // 可根据实际 VM 需求定义
export type Type = any; // 可根据实际 VM 需求定义
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

  pop_as<T>(type: { new (...args: any[]): T }): T {
    const val = this.pop();
    if (val instanceof type) {
      return val as T;
    }
    throw PartialVMError.new(StatusCode.UNKNOWN_INVARIANT_VIOLATION_ERROR).withMessage(
      `Type mismatch: expected ${type.name}, got ${(val as Object).constructor.name}`
    );
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
      throw PartialVMError.new(StatusCode.EMPTY_VALUE_STACK).withMessage(
        "Failed to get last n arguments on the argument stack"
      );
    }
    return this.value.slice(this.value.length - n);
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
