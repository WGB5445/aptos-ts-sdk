import { describe, it, expect } from "vitest";
import {
  MAX_U128_BIG_INT,
  MAX_U16_NUMBER,
  MAX_U32_NUMBER,
  MAX_U64_BIG_INT,
  MAX_U8_NUMBER,
  MAX_U256_BIG_INT,
  Serializer,
  bcs,
  outOfRangeErrorMessage,
} from "../src";
/* eslint-disable @typescript-eslint/no-shadow */
describe("BCS Serializer", () => {

  it("serializes a non-empty string", () => {
    let serializedData = bcs.String.serialize("çå∞≠¢õß∂ƒ∫");
    expect(serializedData.toUint8Array()).toEqual(
      new Uint8Array([
        24, 0xc3, 0xa7, 0xc3, 0xa5, 0xe2, 0x88, 0x9e, 0xe2, 0x89, 0xa0, 0xc2, 0xa2, 0xc3, 0xb5, 0xc3, 0x9f, 0xe2, 0x88,
        0x82, 0xc6, 0x92, 0xe2, 0x88, 0xab,
      ]),
    );

    serializedData = bcs.String.serialize("abcd1234");
    expect(serializedData.toUint8Array()).toEqual(new Uint8Array([8, 0x61, 0x62, 0x63, 0x64, 0x31, 0x32, 0x33, 0x34]));
  });

  it("serializes an empty string", () => {
    let serializedData = bcs.String.serialize("");
    expect(serializedData.toUint8Array()).toEqual(new Uint8Array([0]));
  });

  it("serializes dynamic length bytes", () => {
    let serializedData = bcs.Bytes.serialize(new Uint8Array([0x41, 0x70, 0x74, 0x6f, 0x73]));
    expect(serializedData.toUint8Array()).toEqual(new Uint8Array([5, 0x41, 0x70, 0x74, 0x6f, 0x73]));
  });

  it("serializes dynamic length bytes with zero elements", () => {
    let serializedData = bcs.Bytes.serialize(new Uint8Array([]));
    expect(serializedData.toUint8Array()).toEqual(new Uint8Array([0]));
  });

  it("serializes fixed length bytes", () => {
    let serializedData = bcs.FixedBytes(5).serialize(new Uint8Array([0x41, 0x70, 0x74, 0x6f, 0x73]));
    expect(serializedData.toUint8Array()).toEqual(new Uint8Array([0x41, 0x70, 0x74, 0x6f, 0x73]));
  });

  it("serializes fixed length bytes with zero element", () => {
    let serializedData = bcs.FixedBytes(0).serialize(new Uint8Array([]));
    expect(serializedData.toUint8Array()).toEqual(new Uint8Array([]));
  });

  it("serializes a boolean value", () => {
    let serializedData = bcs.Bool.serialize(true);
    expect(serializedData.toUint8Array()).toEqual(new Uint8Array([0x01]));

    serializedData = bcs.Bool.serialize(false);
    expect(serializedData.toUint8Array()).toEqual(new Uint8Array([0x00]));
  });

  it("throws when serializing a boolean value with wrong data type", () => {
    expect(() => {
      // @ts-ignore
      bcs.Bool.serialize(12);
    }).toThrow(`${12} is not a boolean value`);
  });

  it("serializes a uint8", () => {
    let serializedData = bcs.U8.serialize(255);
    expect(serializedData.toUint8Array()).toEqual(new Uint8Array([0xff]));
  });

  it("throws when serializing uint8 with out of range value", () => {
    expect(() => {
      bcs.U8.serialize(256);
    }).toThrow(outOfRangeErrorMessage(256, 0n, BigInt(MAX_U8_NUMBER)));

    expect(() => {
        bcs.U8.serialize(-1);
    }).toThrow(outOfRangeErrorMessage(-1, 0n, BigInt(MAX_U8_NUMBER)));
  });

  it("serializes a uint16", () => {
    let serializedData = bcs.U16.serialize(65535);
    expect(serializedData.toUint8Array()).toEqual(new Uint8Array([0xff, 0xff]));

    serializedData = bcs.U16.serialize(4660);
    expect(serializedData.toUint8Array()).toEqual(new Uint8Array([0x34, 0x12]));
  });

  it("throws when serializing uint16 with out of range value", () => {
    expect(() => {
        bcs.U16.serialize(65536);
    }).toThrow(outOfRangeErrorMessage(65536, 0n, BigInt(MAX_U16_NUMBER)));

    expect(() => {
        bcs.U16.serialize(-1);
    }).toThrow(outOfRangeErrorMessage(-1, 0n, BigInt(MAX_U16_NUMBER)));
  });
  it("serializes a uint32", () => {
    let serializedData = bcs.U32.serialize(4294967295);
    expect(serializedData.toUint8Array()).toEqual(new Uint8Array([0xff, 0xff, 0xff, 0xff]));

    serializedData = bcs.U32.serialize(4660);
    expect(serializedData.toUint8Array()).toEqual(new Uint8Array([0x34, 0x12, 0x00, 0x00]));
  });
  it("throws when serializing uint32 with out of range value", () => {
    expect(() => {
        bcs.U32.serialize(4294967296);
    }).toThrow(outOfRangeErrorMessage(4294967296, 0n, BigInt(MAX_U32_NUMBER)));

    expect(() => {
        bcs.U32.serialize(-1);
    }).toThrow(outOfRangeErrorMessage(-1, 0n, BigInt(MAX_U32_NUMBER)));
  });
  it("serializes a uint64", () => {
    let serializedData = bcs.U64.serialize(18446744073709551615n);
    expect(serializedData.toUint8Array()).toEqual(new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]));

    serializedData = bcs.U64.serialize(4660n);
    expect(serializedData.toUint8Array()).toEqual(new Uint8Array([0x34, 0x12, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
  });
  it("throws when serializing uint64 with out of range value", () => {
    expect(() => {
        bcs.U64.serialize(18446744073709551616n);
    }).toThrow(outOfRangeErrorMessage(18446744073709551616n, 0n, MAX_U64_BIG_INT));

    expect(() => {
        bcs.U64.serialize(-1n);
    }).toThrow(outOfRangeErrorMessage(-1n, 0n, MAX_U64_BIG_INT));
  });
  it("serializes a uint128", () => {
    let serializedData = bcs.U128.serialize(340282366920938463463374607431768211455n);
    expect(serializedData.toUint8Array()).toEqual(
      new Uint8Array([
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
      ])
    );
  });
  it("throws when serializing uint128 with out of range value", () => {
    expect(() => {
        bcs.U128.serialize(340282366841710300949128831971969468211455n);
    }).toThrow(outOfRangeErrorMessage(340282366841710300949128831971969468211455n, 0n, MAX_U128_BIG_INT));

    expect(() => {
        bcs.U128.serialize(-1n);
    }).toThrow(outOfRangeErrorMessage(-1n, 0n, MAX_U128_BIG_INT));
  });
  it("serializes and deserializes a struct", () => {
    const MyStruct = bcs.Struct("MyStruct", {
      foo: bcs.U8,
      bar: bcs.U64,
      flag: bcs.Bool,
    });

    const value = { foo: 42, bar: 18446744073709551615n, flag: true };
    const serialized = MyStruct.serialize(value);
    expect(serialized.toUint8Array()).toEqual(
      new Uint8Array([
        42, // foo
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, // bar (LE)
        0x01, // flag
      ])
    );

    const deserialized = MyStruct.deserialize(serialized.toUint8Array());
    expect(deserialized).toEqual(value);
  });

  it("serializes and deserializes an enum", () => {
    // 定义一个简单的 Enum 类型
    const MyEnum = bcs.Enum("MyEnum", {
      VariantA: bcs.U8,
      VariantB: bcs.Bool,
      VariantC: bcs.String,
    });

    // 测试 VariantA
    const valueA = { VariantA: 123 };
    const serializedA = MyEnum.serialize(valueA);
    expect(serializedA.toUint8Array()).toEqual(new Uint8Array([0, 123]));
    const deserializedA = MyEnum.deserialize(serializedA.toUint8Array());
    expect(deserializedA.$kind == "VariantA").toBe(true);
    expect(deserializedA.VariantA).toEqual(valueA.VariantA);

    // 测试 VariantB
    const valueB = { VariantB: true };
    const serializedB = MyEnum.serialize(valueB);
    expect(serializedB.toUint8Array()).toEqual(new Uint8Array([1, 1]));
    const deserializedB = MyEnum.deserialize(serializedB.toUint8Array());
    expect(deserializedB.$kind == "VariantB").toBe(true);
    expect(deserializedB.VariantB).toEqual(valueB.VariantB);

    // 测试 VariantC
    const valueC = { VariantC: "abc" };
    const serializedC = MyEnum.serialize(valueC);
    expect(serializedC.toUint8Array()).toEqual(new Uint8Array([2, 3, 97, 98, 99]));
    const deserializedC = MyEnum.deserialize(serializedC.toUint8Array());
    expect(deserializedC.$kind == "VariantC").toBe(true);
    expect(deserializedC.VariantC).toEqual(valueC.VariantC);
  });
  
});