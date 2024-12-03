// src/types/InputConfig.ts

// Base interface for all input types
export interface BaseInput {
  name: string;
  displayName?: string;
  type: "string" | "number" | "array" | "boolean" | "object" | "select";
  required: boolean;
}

// String input with additional properties
export interface StringInput extends BaseInput {
  type: "string";
  isMultiline?: boolean;
  useTemplate?: boolean;
}

// Number input with optional min and max
export interface NumberInput extends BaseInput {
  type: "number";
  min?: number;
  max?: number;
}

// Boolean input
export interface BooleanInput extends BaseInput {
  type: "boolean";
}

// New Select input type for choosing from predefined options
export interface SelectInput extends BaseInput {
  type: "select";
  options: SelectOption[];
  multiple?: boolean; // Optional: allow multiple selections
}

// Interface for select options
export interface SelectOption {
  value: string;
  label?: string; // Optional display label, falls back to value if not provided
}

// Object input for nested configurations
export interface ObjectInput extends BaseInput {
  type: "object";
  fields: InputConfig[];
}

// Array input that can contain nested InputConfigs or primitive types
export interface ArrayInput extends BaseInput {
  type: "array";
  itemsType: "string" | "number" | "boolean" | "select" | InputConfig;
}

// Union type for all possible inputs
export type InputConfig =
  | StringInput
  | NumberInput
  | BooleanInput
  | ObjectInput
  | ArrayInput
  | SelectInput;

export interface FunctionConfig {
  name: string;
  displayName?: string;
  inputs: InputConfig[];
}

export interface NodeConfig {
  name: string;
  functions: FunctionConfig[];
}
