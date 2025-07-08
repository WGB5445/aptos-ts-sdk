import { Deserializer } from './deserializer';
import {
  MAX_U128_BIG_INT,
  MAX_U16_NUMBER,
  MAX_U256_BIG_INT,
  MAX_U32_NUMBER,
  MAX_U64_BIG_INT,
  MAX_U8_NUMBER,
  outOfRangeErrorMessage,
  Serializer,
} from './serializer';

export interface Serializable {
  serialize<T extends Serializable>(data: T): Uint8Array;
}

export interface BcsTypeOptions<T, Input = T> {
  name?: string;
  validate?: (value: Input) => void;
}

export class BcsType<T, Input = T> {
  $inferType!: T;
  $inferInput!: Input;
  name: string;
  read: (des: Deserializer) => T;
  validate: (value: Input) => void;
  #write: (value: Input, ser: Serializer) => void;
  #serialize: (value: Input) => Uint8Array;

  constructor(
    options: {
      name: string;
      read: (des: Deserializer) => T;
      write: (value: Input, ser: Serializer) => void;
      serialize?: (value: Input) => Uint8Array;
      validate?: (value: Input) => void;
    } & BcsTypeOptions<T, Input>,
  ) {
    this.name = options.name;
    this.read = options.read;
    this.#write = options.write;
    this.#serialize =
      options.serialize ??
      ((value) => {
        const ser = new Serializer();
        this.#write(value, ser);
        return ser.toUint8Array();
      });

    this.validate = options.validate ?? (() => {});
  }

  write(value: Input, ser: Serializer) {
    this.validate(value);
    this.#write(value, ser);
  }

  serialize(value: Input) {
    this.validate(value);
    return new SerializableAndDeserializableClass(this, this.#serialize(value));
  }

  deserialize(bytes: Uint8Array): T {
    const reader = new Deserializer(bytes);
    return this.read(reader);
  }

  transform<T2 = T, Input2 = Input>({
    name,
    input,
    output,
    validate,
  }: {
    input?: (val: Input2) => Input;
    output?: (value: T) => T2;
  } & BcsTypeOptions<T2, Input2>) {
    return new BcsType<T2, Input2>({
      name: name ?? this.name,
      read: (reader) => (output ? output(this.read(reader)) : (this.read(reader) as never)),
      write: (value, writer) => this.#write(input ? input(value) : (value as never), writer),
      serialize: (value) => this.#serialize(input ? input(value) : (value as never)),
      validate: (value) => {
        validate?.(value);
        this.validate(input ? input(value) : (value as never));
      },
    });
  }
}

export const SerializableAndDeserializableBrand = 'SerializableAndDeserializable';

export function isSerialized(obj: unknown): obj is SerializableAndDeserializableClass<unknown> {
  return (
    !!obj &&
    typeof obj === 'object' &&
    (obj as Record<string, unknown>)[SerializableAndDeserializableBrand] === true
  );
}

export class SerializableAndDeserializableClass<T, Input = T> {
  #schema: BcsType<T, Input>;
  #bytes: Uint8Array;

  get [SerializableAndDeserializableBrand]() {
    return true;
  }

  constructor(type: BcsType<T, Input>, schema: Uint8Array) {
    this.#schema = type;
    this.#bytes = schema;
  }

  toUint8Array() {
    return this.#bytes;
  }

  deserialize() {
    return this.#schema.deserialize(this.#bytes);
  }
}

const U8Type = new BcsType<number>({
  name: 'U8',
  read: (des) => {
    const value = des.deserializeU8();
    return value;
  },
  write: (value, ser) => {
    ser.serializeU8(value);
  },
  serialize: (value) => {
    const ser = new Serializer();
    ser.serializeU8(value);
    return ser.toUint8Array();
  },
  validate: (value) => {
    if (value < 0 || value > MAX_U8_NUMBER) {
      throw outOfRangeErrorMessage(value, 0n, BigInt(MAX_U8_NUMBER));
    }
  },
});

export const U8: (value: number) => SerializableAndDeserializableClass<number> = (value: number) =>
  U8Type.serialize(value);

export const U16Type = new BcsType<number>({
  name: 'U16',
  read: (des) => {
    const value = des.deserializeU16();
    return value;
  },
  write: (value, ser) => {
    ser.serializeU16(value);
  },
  serialize: (value) => {
    const ser = new Serializer();
    ser.serializeU16(value);
    return ser.toUint8Array();
  },
  validate: (value) => {
    if (value < 0 || value > MAX_U16_NUMBER) {
      throw outOfRangeErrorMessage(value, 0n, BigInt(MAX_U16_NUMBER));
    }
  },
});
export const U16: (value: number) => SerializableAndDeserializableClass<number> = (value: number) =>
  U16Type.serialize(value);

export const U32Type = new BcsType<number>({
  name: 'U32',
  read: (des) => {
    const value = des.deserializeU32();
    return value;
  },
  write: (value, ser) => {
    ser.serializeU32(value);
  },
  serialize: (value) => {
    const ser = new Serializer();
    ser.serializeU32(value);
    return ser.toUint8Array();
  },
  validate: (value) => {
    if (value < 0 || value > MAX_U32_NUMBER) {
      throw outOfRangeErrorMessage(value, 0n, BigInt(MAX_U32_NUMBER));
    }
  },
});
export const U32: (value: number) => SerializableAndDeserializableClass<number> = (value: number) =>
  U32Type.serialize(value);
export const U64Type = new BcsType<bigint>({
  name: 'U64',
  read: (des) => {
    const value = des.deserializeU64();
    return value;
  },
  write: (value, ser) => {
    ser.serializeU64(value);
  },
  serialize: (value) => {
    const ser = new Serializer();
    ser.serializeU64(value);
    return ser.toUint8Array();
  },
  validate: (value) => {
    if (value < 0n || value > MAX_U64_BIG_INT) {
      throw outOfRangeErrorMessage(value, 0n, MAX_U64_BIG_INT);
    }
  },
});
export const U64: (value: bigint) => SerializableAndDeserializableClass<bigint> = (value: bigint) =>
  U64Type.serialize(value);
export const U128Type = new BcsType<bigint>({
  name: 'U128',
  read: (des) => {
    const value = des.deserializeU128();
    return value;
  },
  write: (value, ser) => {
    ser.serializeU128(value);
  },
  serialize: (value) => {
    const ser = new Serializer();
    ser.serializeU128(value);
    return ser.toUint8Array();
  },
  validate: (value) => {
    if (value < 0n || value > MAX_U128_BIG_INT) {
      throw outOfRangeErrorMessage(value, 0n, MAX_U128_BIG_INT);
    }
  },
});
export const U128: (value: bigint) => SerializableAndDeserializableClass<bigint> = (
  value: bigint,
) => U128Type.serialize(value);
export const U256Type = new BcsType<bigint>({
  name: 'U256',
  read: (des) => {
    const value = des.deserializeU256();
    return value;
  },
  write: (value, ser) => {
    ser.serializeU256(value);
  },
  serialize: (value) => {
    const ser = new Serializer();
    ser.serializeU256(value);
    return ser.toUint8Array();
  },
  validate: (value) => {
    if (value < 0n || value > MAX_U256_BIG_INT) {
      throw outOfRangeErrorMessage(value, 0n, MAX_U256_BIG_INT);
    }
  },
});
export const U256: (value: bigint) => SerializableAndDeserializableClass<bigint> = (
  value: bigint,
) => U256Type.serialize(value);
export const Uleb128Type = new BcsType<number>({
  name: 'Uleb128',
  read: (des) => {
    let value = 0;
    let shift = 0;
    let byte = 0;
    do {
      byte = des.deserializeU8();
      value |= (byte & 0x7f) << shift;
      shift += 7;
    } while (byte & 0x80);
    return value;
  },
  write: (value, ser) => {
    let v = value >>> 0;
    while (v >= 0x80) {
      ser.serializeU8((v & 0x7f) | 0x80);
      v >>>= 7;
    }
    ser.serializeU8(v);
  },
  serialize: (value) => {
    const ser = new Serializer();
    let v = value >>> 0;
    while (v >= 0x80) {
      ser.serializeU8((v & 0x7f) | 0x80);
      v >>>= 7;
    }
    ser.serializeU8(v);
    return ser.toUint8Array();
  },
  validate: (value) => {
    if (value < 0 || value > 0xffffffff) {
      throw new Error(`Uleb128 out of range: ${value}`);
    }
  },
});
export const Uleb128: (value: number) => SerializableAndDeserializableClass<number> = (
  value: number,
) => Uleb128Type.serialize(value);
export const BytesType = new BcsType<Uint8Array>({
  name: 'Bytes',
  read: (des) => {
    const len = Uleb128Type.read(des);
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      arr[i] = des.deserializeU8();
    }
    return arr;
  },
  write: (value, ser) => {
    Uleb128Type.write(value.length, ser);
    for (let i = 0; i < value.length; i++) {
      ser.serializeU8(value[i]!);
    }
  },
  serialize: (value) => {
    const ser = new Serializer();
    Uleb128Type.write(value.length, ser);
    for (let i = 0; i < value.length; i++) {
      ser.serializeU8(value[i]!);
    }
    return ser.toUint8Array();
  },
  validate: (value) => {
    if (!(value instanceof Uint8Array)) {
      throw new Error('Bytes must be an instance of Uint8Array');
    }
  },
});
export const Bytes: (value: Uint8Array) => SerializableAndDeserializableClass<Uint8Array> = (
  value: Uint8Array,
) => BytesType.serialize(value);

export function FixedBytesType<N extends number>(length: N): BcsType<Uint8Array> {
  return new BcsType<Uint8Array>({
    name: `FixedBytes${length}`,
    read: (des) => {
      const arr = new Uint8Array(length);
      for (let i = 0; i < length; i++) {
        arr[i] = des.deserializeU8();
      }
      return arr;
    },
    write: (value, ser) => {
      if (value.length !== length) throw new Error(`FixedBytes: length must be ${length}`);
      for (let i = 0; i < length; i++) {
        ser.serializeU8(value[i]!);
      }
    },
    serialize: (value) => {
      if (value.length !== length) throw new Error(`FixedBytes: length must be ${length}`);
      const ser = new Serializer();
      for (let i = 0; i < length; i++) {
        ser.serializeU8(value[i]!);
      }
      return ser.toUint8Array();
    },
    validate: (value) => {
      if (!(value instanceof Uint8Array) || value.length !== length) {
        throw new Error(`FixedBytes must be Uint8Array of length ${length}`);
      }
    },
  });
}

export const BoolType = new BcsType<boolean>({
  name: 'Bool',
  read: (des) => des.deserializeBool(),
  write: (value, ser) => ser.serializeBool(value),
  serialize: (value) => {
    const ser = new Serializer();
    ser.serializeBool(value);
    return ser.toUint8Array();
  },
  validate: (value) => {
    if (typeof value !== 'boolean') {
      throw new Error(`${value} is not a boolean value`);
    }
  },
});
export const Bool: (value: boolean) => SerializableAndDeserializableClass<boolean> = (
  value: boolean,
) => BoolType.serialize(value);
export const StringType = new BcsType<string>({
  name: 'String',
  read: (des) => {
    const arr = BytesType.read(des);
    return new TextDecoder().decode(arr);
  },
  write: (value, ser) => {
    const encoded = new TextEncoder().encode(value);
    BytesType.write(encoded, ser);
  },
  serialize: (value) => {
    const ser = new Serializer();
    const encoded = new TextEncoder().encode(value);
    BytesType.write(encoded, ser);
    return ser.toUint8Array();
  },
  validate: (value) => {
    if (typeof value !== 'string') {
      throw new Error('String must be a string value');
    }
  },
});
export const String: (value: string) => SerializableAndDeserializableClass<string> = (
  value: string,
) => StringType.serialize(value);
export const Vector = <T>(type: BcsType<T>): BcsType<T[]> =>
  new BcsType<T[]>({
    name: `Vector<${type.name}>`,
    read: (des) => {
      const len = Uleb128Type.read(des);
      const arr: T[] = [];
      for (let i = 0; i < len; i++) {
        arr.push(type.read(des));
      }
      return arr;
    },
    write: (value, ser) => {
      Uleb128Type.write(value.length, ser);
      value.forEach((item) => {
        type.write(item, ser);
      });
    },
    serialize: (value) => {
      const ser = new Serializer();
      Uleb128Type.write(value.length, ser);
      value.forEach((item) => {
        type.write(item, ser);
      });
      return ser.toUint8Array();
    },
    validate: (value) => {
      if (!Array.isArray(value)) {
        throw new Error('Vector must be an array');
      }
      value.forEach((item) => type.validate(item));
    },
  });

const OptionType = <T>(type: BcsType<T>): BcsType<T | null> =>
  new BcsType<T | null>({
    name: `Option<${type.name}>`,
    read: (des) => {
      const isSome = des.deserializeBool();
      return isSome ? type.read(des) : null;
    },
    write: (value, ser) => {
      ser.serializeBool(value !== null);
      if (value !== null) {
        type.write(value, ser);
      }
    },
    serialize: (value) => {
      const ser = new Serializer();
      ser.serializeBool(value !== null);
      if (value !== null) {
        type.write(value, ser);
      }
      return ser.toUint8Array();
    },
    validate: (value) => {
      if (value !== null) {
        type.validate(value);
      }
    },
  });
export const Option = <T>(type: BcsType<T>): BcsType<T | null> => OptionType(type);

export const bcs = {
  U8: U8Type,
  U16: U16Type,
  U32: U32Type,
  U64: U64Type,
  U128: U128Type,
  U256: U256Type,
  Uleb128: Uleb128Type,
  Bytes: BytesType,
  FixedBytes: FixedBytesType,
  Bool: BoolType,
  String: StringType,
  Vector,
  Option,
};
