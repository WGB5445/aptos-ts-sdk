import { MAX_U32_NUMBER } from './serializer';

/**
 * A class that provides methods for deserializing various data types from a byte buffer.
 * It supports deserialization of primitive types, strings, and complex objects using a BCS (Binary Common Serialization) layout.
 * @group Implementation
 * @category BCS
 */
export class Deserializer {
  private buffer: ArrayBuffer;

  private offset: number;

  /**
   * Creates a new instance of the class with a copy of the provided data buffer.
   * This prevents outside mutation of the buffer.
   *
   * @param data - The data to be copied into the internal buffer as a Uint8Array.
   * @group Implementation
   * @category BCS
   */
  constructor(data: Uint8Array) {
    // copies data to prevent outside mutation of buffer.
    this.buffer = new ArrayBuffer(data.length);
    new Uint8Array(this.buffer).set(data, 0);
    this.offset = 0;
  }

  /**
   * Reads a specified number of bytes from the buffer and advances the offset.
   *
   * @param length - The number of bytes to read from the buffer.
   * @throws Throws an error if the read operation exceeds the buffer's length.
   * @group Implementation
   * @category BCS
   */
  private read(length: number): ArrayBuffer {
    if (this.offset + length > this.buffer.byteLength) {
      throw new Error('Reached to the end of buffer');
    }

    const bytes = this.buffer.slice(this.offset, this.offset + length);
    this.offset += length;
    return bytes;
  }

  /**
   * Returns the number of bytes remaining in the buffer.
   *
   * This information is useful to determine if there's more data to be read.
   *
   * @returns The number of bytes remaining in the buffer.
   * @group Implementation
   * @category BCS
   */
  remaining(): number {
    return this.buffer.byteLength - this.offset;
  }

  /**
   * Asserts that the buffer has no remaining bytes.
   *
   * @throws {Error} Throws an error if there are remaining bytes in the buffer.
   * @group Implementation
   * @category BCS
   */
  assertFinished(): void {
    if (this.remaining() !== 0) {
      throw new Error('Buffer has remaining bytes');
    }
  }

  /**
   * Deserializes a boolean value from a byte stream.
   *
   * The BCS layout for a boolean uses one byte, where "0x01" represents true and "0x00" represents false.
   * An error is thrown if the byte value is not valid.
   *
   * @returns The deserialized boolean value.
   * @throws Throws an error if the boolean value is invalid.
   * @group Implementation
   * @category BCS
   */
  deserializeBool(): boolean {
    const bool = new Uint8Array(this.read(1))[0];
    if (bool !== 1 && bool !== 0) {
      throw new Error('Invalid boolean value');
    }
    return bool === 1;
  }

  /**
   * Deserializes a uint8 number from the binary data.
   *
   * BCS layout for "uint8": One byte. Binary format in little-endian representation.
   *
   * @returns {number} The deserialized uint8 number.
   * @group Implementation
   * @category BCS
   */
  deserializeU8(): number {
    return new DataView(this.read(1)).getUint8(0);
  }

  /**
   * Deserializes a uint16 number from a binary format in little-endian representation.
   *
   * BCS layout for "uint16": Two bytes.
   * @example
   * ```typescript
   * const deserializer = new Deserializer(new Uint8Array([0x34, 0x12]));
   * assert(deserializer.deserializeU16() === 4660);
   * ```
   * @group Implementation
   * @category BCS
   */
  deserializeU16(): number {
    return new DataView(this.read(2)).getUint16(0, true);
  }

  /**
   * Deserializes a uint32 number from a binary format in little-endian representation.
   *
   * BCS layout for "uint32": Four bytes.
   * @example
   * ```typescript
   * const deserializer = new Deserializer(new Uint8Array([0x78, 0x56, 0x34, 0x12]));
   * assert(deserializer.deserializeU32() === 305419896);
   * ```
   * @group Implementation
   * @category BCS
   */
  deserializeU32(): number {
    return new DataView(this.read(4)).getUint32(0, true);
  }

  /**
   * Deserializes a uint64 number.
   *
   * This function combines two 32-bit values to return a 64-bit unsigned integer in little-endian representation.
   * @example
   * ```typescript
   * const deserializer = new Deserializer(new Uint8Array([0x00, 0xEF, 0xCD, 0xAB, 0x78, 0x56, 0x34, 0x12]));
   * assert(deserializer.deserializeU64() === 1311768467750121216);
   * ```
   * @group Implementation
   * @category BCS
   */
  deserializeU64(): bigint {
    const low = this.deserializeU32();
    const high = this.deserializeU32();

    // combine the two 32-bit values and return (little endian)
    return BigInt((BigInt(high) << BigInt(32)) | BigInt(low));
  }

  /**
   * Deserializes a uint128 number from its binary representation.
   * This function combines two 64-bit values to return a single uint128 value in little-endian format.
   *
   * @returns {BigInt} The deserialized uint128 number.
   * @group Implementation
   * @category BCS
   */
  deserializeU128(): bigint {
    const low = this.deserializeU64();
    const high = this.deserializeU64();

    // combine the two 64-bit values and return (little endian)
    return BigInt((high << BigInt(64)) | low);
  }

  /**
   * Deserializes a uint256 number from its binary representation.
   *
   * The BCS layout for "uint256" consists of thirty-two bytes in little-endian format.
   *
   * @returns {BigInt} The deserialized uint256 number.
   * @group Implementation
   * @category BCS
   */
  deserializeU256(): bigint {
    const low = this.deserializeU128();
    const high = this.deserializeU128();

    // combine the two 128-bit values and return (little endian)
    return BigInt((high << BigInt(128)) | low);
  }

  /**
   * Deserializes a uleb128 encoded uint32 number.
   *
   * This function is used for interpreting lengths of variable-length sequences and tags of enum values in BCS encoding.
   *
   * @throws {Error} Throws an error if the parsed value exceeds the maximum uint32 number.
   * @returns {number} The deserialized uint32 value.
   * @group Implementation
   * @category BCS
   */
  deserializeUleb128AsU32(): number {
    let value: bigint = BigInt(0);
    let shift = 0;

    while (value < MAX_U32_NUMBER) {
      const byte = this.deserializeU8();
      value |= BigInt(byte & 0x7f) << BigInt(shift);

      if ((byte & 0x80) === 0) {
        break;
      }
      shift += 7;
    }

    if (value > MAX_U32_NUMBER) {
      throw new Error('Overflow while parsing uleb128-encoded uint32 value');
    }

    return Number(value);
  }
}
