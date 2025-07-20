export enum SerializedType {
  BOOL = 0x1,
  U8 = 0x2,
  U64 = 0x3,
  U128 = 0x4,
  ADDRESS = 0x5,
  REFERENCE = 0x6,
  MUTABLE_REFERENCE = 0x7,
  STRUCT = 0x8,
  TYPE_PARAMETER = 0x9,
  VECTOR = 0xa,
  STRUCT_INST = 0xb,
  SIGNER = 0xc,
  U16 = 0xd,
  U32 = 0xe,
  U256 = 0xf,
  FUNCTION = 0x10,
}

export function fromU8(value: number): SerializedType {
  switch (value) {
    case SerializedType.BOOL:
      return SerializedType.BOOL;
    case SerializedType.U8:
      return SerializedType.U8;
    case SerializedType.U64:
      return SerializedType.U64;
    case SerializedType.U128:
      return SerializedType.U128;
    case SerializedType.ADDRESS:
      return SerializedType.ADDRESS;
    case SerializedType.REFERENCE:
      return SerializedType.REFERENCE;
    case SerializedType.MUTABLE_REFERENCE:
      return SerializedType.MUTABLE_REFERENCE;
    case SerializedType.STRUCT:
      return SerializedType.STRUCT;
    case SerializedType.TYPE_PARAMETER:
      return SerializedType.TYPE_PARAMETER;
    case SerializedType.VECTOR:
      return SerializedType.VECTOR;
    case SerializedType.STRUCT_INST:
      return SerializedType.STRUCT_INST;
    case SerializedType.SIGNER:
      return SerializedType.SIGNER;
    case SerializedType.U16:
      return SerializedType.U16;
    case SerializedType.U32:
      return SerializedType.U32;
    case SerializedType.U256:
      return SerializedType.U256;
    case SerializedType.FUNCTION:
      return SerializedType.FUNCTION;
    default:
      throw new Error("Unknown serialized type: " + value);
  }
}
