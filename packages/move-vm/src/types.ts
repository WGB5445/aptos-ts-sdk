import { Deserializer } from "aptos-bcs";
import { FunctionDefinition, MoveModule, SignatureToken } from "aptos-disassemble";

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
      throw new Error(`Invalid address format: ${value}`);
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

export class Struct {
  address: Address;
  module: string;
  name: string;
  typeParams: SignatureToken[];
  value: Record<string, Value>;

  constructor(
    address: Address,
    module: string,
    name: string,
    typeParams: SignatureToken[],
    value: Record<number, Value>
  ) {
    this.address = address;
    this.module = module;
    this.name = name;
    this.typeParams = typeParams;
    this.value = value;
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
  | Vec<Value>
  | Struct;
export type Type = any;
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
}
export class Frame {
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
          this.interpreterImpl.operand_stack.pop_as(Bool).value
            ? (this.pc = code.codeOffset)
            : this.pc++;
          continue;
        case "BrFalse":
          this.interpreterImpl.operand_stack.pop_as(Bool).value
            ? this.pc++
            : (this.pc = code.codeOffset);
          continue;
        case "Branch":
          this.pc = code.codeOffset;
          continue;
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
        case "LdConst": {
          const constValue = this.module.constant_pool[code.constIdx];
          let des = new Deserializer(constValue.data);
          const deserializeConstValue = (
            des: Deserializer,
            signature_token: SignatureToken
          ): Value => {
            console.log(`Deserializing constant value: ${JSON.stringify(signature_token)}`);
            switch (signature_token.kind) {
              case "U8":
                return U8.from(BigInt(des.deserializeU8()));
              case "U16":
                return U16.from(BigInt(des.deserializeU16()));
              case "U32":
                return U32.from(BigInt(des.deserializeU32()));
              case "U64":
                return U64.from(BigInt(des.deserializeU64()));
              case "U128":
                return U128.from(BigInt(des.deserializeU128()));
              case "U256":
                return U256.from(BigInt(des.deserializeU256()));
              case "Address":
                let address = Array.from({ length: 32 }, () => des.deserializeU8());
                return new Address(`0x${Buffer.from(address).toString("hex")}`);
              case "Bool":
                return Bool.fromBool(des.deserializeBool());
              case "Vector": {
                const length = des.deserializeUleb128AsU32();
                const elements: Value[] = [];
                console.log(`Deserializing vector of length ${length}`);
                for (let i = 0; i < length; i++) {
                  elements.push(deserializeConstValue(des, signature_token.type));
                }
                return new Vec(elements);
              }
              default:
                throw new Error(`Unsupported constant type: ${signature_token.kind}`);
            }
          };
          this.interpreterImpl.operand_stack.push(deserializeConstValue(des, constValue.type));
          break;
        }
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
          this.locals[moveLocalIndex] = undefined;
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
            case "Struct": {
              const struct_handle = this.module.struct_handles[elemType.handle];
              const struct_name = this.module.identifiers[struct_handle.name];
              const struct_module_handle = this.module.module_handles[struct_handle.module];
              const struct_module = this.module.identifiers[struct_module_handle.name];
              const struct_address = this.module.address_identifiers[struct_module_handle.address];
              const typeParams = struct_handle.type_parameters.map(
                (tp) => this.module.signatures[tp.constraints][0]
              );
              this.interpreterImpl.operand_stack.push(new Vec<Struct>([]));
              break;
            }
            default:
              throw new Error(`Unsupported vector element type: ${elemType.kind}`);
          }

          break;
        }
        case "VecPushBack": {
          let elem = this.interpreterImpl.operand_stack.pop();
          const ref = this.interpreterImpl.operand_stack.pop_as(Ref<Vec<Value>>);

          ref.value.push(elem);
          this.interpreterImpl.operand_stack.push(ref);
          break;
        }
        case "VecLen": {
          const vec_ref = this.interpreterImpl.operand_stack.pop_as(Ref<Vec<Value>>);

          this.interpreterImpl.operand_stack.push(U64.from(BigInt(vec_ref.value.value.length)));
          break;
        }
        case "Call": {
          return { kind: "Call", handle: code.funcHandleIdx };
        }
        case "ImmBorrowField":
        case "MutBorrowField": {
          let value = this.interpreterImpl.operand_stack.pop();
          let field_handle = this.module.field_handles[code.fieldHandleIdx];
          let field_handle_offset = field_handle.field;

          if (value instanceof Vec) {
            let field_ref = value.value[field_handle_offset];
            this.interpreterImpl.operand_stack.push(new Ref(field_ref));
          }
          this.interpreterImpl.operand_stack.push(new Ref(value));
          break;
        }
        case "Pack": {
          let struct_def = this.module.struct_defs[code.structDefIdx];
          let struct_handle = this.module.struct_handles[struct_def.struct_handle];
          let struct_name = this.module.identifiers[struct_handle.name];
          let struct_module_handle = this.module.module_handles[struct_handle.module];
          let struct_module = this.module.identifiers[struct_module_handle.name];
          let struct_address = this.module.address_identifiers[struct_module_handle.address];
          switch (struct_def.field_information.kind) {
            case "Native": {
              throw new Error("Native structs are not supported");
            }
            case "Declared":
              {
                let fields = struct_def.field_information.fields.length;
                let args = this.interpreterImpl.operand_stack.popn(fields);
                this.interpreterImpl.operand_stack.push(
                  new Struct(
                    new Address(`0x${struct_address}`),
                    struct_module,
                    struct_name,
                    // TODO: typeParams should be derived from struct_handle.type_parameters
                    [],
                    Object.fromEntries(args.map((field, index) => [index, field]))
                  )
                );
              }
              break;
            case "DeclaredVariants": {
              throw new Error("Declared variants are not supported");
              break;
            }
          }
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
