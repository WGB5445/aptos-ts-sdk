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
import { beforeEach } from "vitest";
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
});