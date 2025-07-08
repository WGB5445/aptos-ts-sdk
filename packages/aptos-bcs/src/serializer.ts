export const MAX_U8_NUMBER: number = 255;
export const MAX_U16_NUMBER: number = 65535;
export const MAX_U32_NUMBER: number = 4294967295;
export const MAX_U64_BIG_INT: bigint = 18446744073709551615n;
export const MAX_U128_BIG_INT: bigint = 340282366920938463463374607431768211455n;
export const MAX_U256_BIG_INT: bigint =
  115792089237316195423570985008687907853269984665640564039457584007913129639935n;

export const outOfRangeErrorMessage = (value: bigint | number, min: bigint, max: bigint) =>
  `${value} is out of range: [${min}, ${max}]`;

/**
 * A class for serializing various data types into a binary format.
 * It provides methods to serialize strings, bytes, numbers, and other serializable objects
 * using the Binary Coded Serialization (BCS) layout. The serialized data can be retrieved as a
 * Uint8Array.
 * @group Implementation
 * @category BCS
 */
export class Serializer {
  private buffer: ArrayBuffer;

  private offset: number;

  /**
   * Constructs a serializer with a buffer of size `length` bytes, 64 bytes by default.
   * The `length` must be greater than 0.
   *
   * @param length - The size of the buffer in bytes.
   * @group Implementation
   * @category BCS
   */
  constructor(length: number = 64) {
    if (length <= 0) {
      throw new Error('Length needs to be greater than 0');
    }
    this.buffer = new ArrayBuffer(length);
    this.offset = 0;
  }

  /**
   * Ensures that the internal buffer can accommodate the specified number of bytes.
   * This function dynamically resizes the buffer if the current size is insufficient.
   *
   * @param bytes - The number of bytes to ensure the buffer can handle.
   * @group Implementation
   * @category BCS
   */
  private ensureBufferWillHandleSize(bytes: number) {
    while (this.buffer.byteLength < this.offset + bytes) {
      const newBuffer = new ArrayBuffer(this.buffer.byteLength * 2);
      new Uint8Array(newBuffer).set(new Uint8Array(this.buffer));
      this.buffer = newBuffer;
    }
  }

  /**
   * Appends the specified values to the buffer, ensuring that the buffer can accommodate the new data.
   *
   * @param {Uint8Array} values - The values to be appended to the buffer.
   * @group Implementation
   * @category BCS
   */
  protected appendToBuffer(values: Uint8Array) {
    this.ensureBufferWillHandleSize(values.length);
    new Uint8Array(this.buffer, this.offset).set(values);
    this.offset += values.length;
  }

  /**
   * Serializes a value into the buffer using the provided function, ensuring the buffer can accommodate the size.
   *
   * @param fn - The function to serialize the value, which takes a byte offset, the value to serialize, and an optional little-endian flag.
   * @param fn.byteOffset - The byte offset at which to write the value.
   * @param fn.value - The numeric value to serialize into the buffer.
   * @param fn.littleEndian - Optional flag indicating whether to use little-endian byte order (defaults to true).
   * @group Implementation
   * @category BCS
   */
  // TODO: JSDoc bytesLength and value
  private serializeWithFunction(
    fn: (byteOffset: number, value: number, littleEndian?: boolean) => void,
    bytesLength: number,
    value: number,
  ) {
    this.ensureBufferWillHandleSize(bytesLength);
    const dv = new DataView(this.buffer, this.offset);
    fn.apply(dv, [0, value, true]);
    this.offset += bytesLength;
  }

  /**
   * Serializes a boolean value into a byte representation.
   *
   * The BCS layout for a boolean uses one byte, where "0x01" represents true and "0x00" represents false.
   *
   * @param value - The boolean value to serialize.
   * @group Implementation
   * @category BCS
   */
  serializeBool(value: boolean): Serializer {
    const byteValue = value ? 1 : 0;
    this.appendToBuffer(new Uint8Array([byteValue]));
    return this;
  }

  /**
   * Serializes a Uint8 value and appends it to the buffer.
   * BCS layout for "uint8": One byte. Binary format in little-endian representation.
   *
   * @param value - The Uint8 value to serialize.
   * @group Implementation
   * @category BCS
   */
  serializeU8(value: number): Serializer {
    if (value < 0 || value > MAX_U8_NUMBER) {
      throw new Error(outOfRangeErrorMessage(value, 0n, BigInt(MAX_U8_NUMBER)));
    }
    this.appendToBuffer(new Uint8Array([value]));
    return this;
  }

  /**
   * Serializes a uint16 number.
   *
   * @group Implementation
   * @category BCS

   */

  /**
   * Serializes a 16-bit unsigned integer value into a binary format.
   * BCS layout for "uint16": Two bytes. Binary format in little-endian representation.
   *
   * @param value - The 16-bit unsigned integer value to serialize.
   * @example
   * ```typescript
   * const serializer = new Serializer();
   * serializer.serializeU16(4660);
   * assert(serializer.toUint8Array() === new Uint8Array([0x34, 0x12]));
   * ```
   * @group Implementation
   * @category BCS
   */
  serializeU16(value: number): Serializer {
    if (value < 0 || value > MAX_U16_NUMBER) {
      throw new Error(outOfRangeErrorMessage(BigInt(value), BigInt(0), BigInt(MAX_U16_NUMBER)));
    }
    this.serializeWithFunction(DataView.prototype.setUint16, 2, value);
    return this;
  }

  /**
   * Serializes a 32-bit unsigned integer value into a binary format.
   * This function is useful for encoding data that needs to be stored or transmitted in a compact form.
   * @example
   * ```typescript
   * const serializer = new Serializer();
   * serializer.serializeU32(305419896);
   * assert(serializer.toUint8Array() === new Uint8Array([0x78, 0x56, 0x34, 0x12]));
   * ```
   * @param value - The 32-bit unsigned integer value to serialize.
   * @group Implementation
   * @category BCS
   */
  serializeU32(value: number): Serializer {
    if (value < 0 || value > MAX_U32_NUMBER) {
      throw new Error(outOfRangeErrorMessage(BigInt(value), BigInt(0), BigInt(MAX_U32_NUMBER)));
    }
    this.serializeWithFunction(DataView.prototype.setUint32, 4, value);
    return this;
  }

  /**
   * Serializes a 64-bit unsigned integer into a format suitable for storage or transmission.
   * This function breaks down the value into two 32-bit components and writes them in little-endian order.
   *
   * @param value - The 64-bit unsigned integer to serialize, represented as a number.
   * @example
   * ```ts
   * const serializer = new Serializer();
   * serializer.serializeU64(1311768467750121216);
   * assert(serializer.toUint8Array() === new Uint8Array([0x00, 0xEF, 0xCD, 0xAB, 0x78, 0x56, 0x34, 0x12]));
   * ```
   * @group Implementation
   * @category BCS
   */
  serializeU64(value: bigint): Serializer {
    if (value < 0n || value > MAX_U64_BIG_INT) {
      throw new Error(outOfRangeErrorMessage(value, BigInt(0), MAX_U64_BIG_INT));
    }
    const low = BigInt(value) & BigInt(MAX_U32_NUMBER);
    const high = BigInt(value) >> BigInt(32);

    // write little endian number
    this.serializeU32(Number(low));
    this.serializeU32(Number(high));
    return this;
  }

  /**
   * Serializes a U128 value into a format suitable for storage or transmission.
   *
   * @param value - The U128 value to serialize, represented as a number.
   * @group Implementation
   * @category BCS
   */
  serializeU128(value: bigint): Serializer {
    if (value < 0n || value > MAX_U128_BIG_INT) {
      throw new Error(outOfRangeErrorMessage(value, BigInt(0), MAX_U128_BIG_INT));
    }
    const low = BigInt(value) & MAX_U64_BIG_INT;
    const high = BigInt(value) >> BigInt(64);

    // write little endian number
    this.serializeU64(low);
    this.serializeU64(high);
    return this;
  }

  /**
   * Serializes a U256 value into a byte representation.
   * This function is essential for encoding large numbers in a compact format suitable for transmission or storage.
   *
   * @param value - The U256 value to serialize, represented as an AnyNumber.
   * @group Implementation
   * @category BCS
   */
  serializeU256(value: bigint): Serializer {
    if (value < 0n || value > MAX_U256_BIG_INT) {
      throw new Error(outOfRangeErrorMessage(value, BigInt(0), MAX_U256_BIG_INT));
    }
    const low = BigInt(value) & MAX_U128_BIG_INT;
    const high = BigInt(value) >> BigInt(128);

    // write little endian number
    this.serializeU128(low);
    this.serializeU128(high);
    return this;
  }

  /**
   * Serializes a 32-bit unsigned integer as a variable-length ULEB128 encoded byte array.
   * BCS uses uleb128 encoding in two cases: (1) lengths of variable-length sequences and (2) tags of enum values
   *
   * @param val - The 32-bit unsigned integer value to be serialized.
   * @group Implementation
   * @category BCS
   */
  serializeU32AsUleb128(val: number): Serializer {
    if (val < 0n || val > BigInt(MAX_U32_NUMBER)) {
      throw new Error(outOfRangeErrorMessage(val, BigInt(0), BigInt(MAX_U32_NUMBER)));
    }
    let value = val;
    const valueArray = [];
    while (value >>> 7 !== 0) {
      valueArray.push((value & 0x7f) | 0x80);
      value >>>= 7;
    }
    valueArray.push(value);
    this.appendToBuffer(new Uint8Array(valueArray));
    return this;
  }

  /**
   * Returns the buffered bytes as a Uint8Array.
   *
   * This function allows you to retrieve the byte representation of the buffer up to the current offset.
   *
   * @returns Uint8Array - The byte array representation of the buffer.
   * @group Implementation
   * @category BCS
   */
  toUint8Array(): Uint8Array {
    return new Uint8Array(this.buffer).slice(0, this.offset);
  }
}
