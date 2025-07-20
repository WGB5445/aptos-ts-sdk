/**
 * Utility functions for working with struct field information
 */
import { StructFieldInformation, FieldDefinition, VariantDefinition } from "../types/MoveModule";

export function isNative(info: StructFieldInformation): info is { kind: "Native" } {
  return info.kind === "Native";
}

export function isDeclared(
  info: StructFieldInformation
): info is { kind: "Declared"; fields: FieldDefinition[] } {
  return info.kind === "Declared";
}

export function isDeclaredVariants(
  info: StructFieldInformation
): info is { kind: "DeclaredVariants"; variants: VariantDefinition[] } {
  return info.kind === "DeclaredVariants";
}

export function getFieldsFromDeclared(info: StructFieldInformation): FieldDefinition[] {
  if (info.kind === "Declared") {
    return info.fields;
  }
  throw new Error("Expected Declared field information");
}

export function getVariantsFromDeclaredVariants(info: StructFieldInformation): VariantDefinition[] {
  if (info.kind === "DeclaredVariants") {
    return info.variants;
  }
  throw new Error("Expected DeclaredVariants field information");
}
