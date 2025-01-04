#!/usr/bin/env node
import { NodeConfig } from "../types/config";
import * as path from "path";
import * as fs from "fs/promises";
import { existsSync } from "fs";
import { build } from "esbuild";

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateInputType(input: any): string {
  switch (input.type) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "select":
      return input.multiple ? "string[]" : "string";
    case "secret":
      return "string";
    case "array":
      if (typeof input.itemsType === "string") {
        return `${input.itemsType}[]`;
      }
      return `${generateObjectInterface(input.itemsType)}[]`;
    case "object":
      return generateObjectInterface(input);
    default:
      return "any";
  }
}

function generateObjectInterface(input: any): string {
  if (input.type !== "object") {
    return "any";
  }

  const fields = input.fields.map((field: any) => {
    const optional = !field.required ? "?" : "";
    return `  ${field.name}${optional}: ${generateInputType(field)};`;
  });

  return `{
${fields.join("\n")}
}`;
}

function generateFunctionInterface(functionConfig: any): string {
  const interfaceName = capitalize(functionConfig.name);

  if (!functionConfig.inputs || functionConfig.inputs.length === 0) {
    return `export interface ${interfaceName}Input {
  // This function takes no inputs
}`;
  }

  const inputs = functionConfig.inputs.map((input: any) => {
    const optional = !input.required ? "?" : "";
    return `  ${input.name}${optional}: ${generateInputType(input)};`;
  });

  return `export interface ${interfaceName}Input {
${inputs.join("\n")}
}`;
}

function generateBaseFunctionsInterface(functions: any[]): string {
  const functionDefinitions = functions.map((func) => {
    const inputType = `${capitalize(func.name)}Input`;
    return `  ${func.name}(input: ${inputType}): Promise<Record<string, any>>;`;
  });

  return `export interface BaseFunctions {
${functionDefinitions.join("\n")}
}`;
}

async function findConfigFile(): Promise<string> {
  const configPath = path.join(process.cwd(), "node.config.ts");
  try {
    await fs.access(configPath);
    return configPath;
  } catch {
    throw new Error("node.config.ts not found in the current directory");
  }
}

async function transpileAndLoadConfig(configPath: string): Promise<NodeConfig> {
  const tmpDir = path.join(process.cwd(), ".tmp");
  const outfile = path.join(tmpDir, "node.config.mjs");

  try {
    await fs.mkdir(tmpDir, { recursive: true });

    await build({
      entryPoints: [configPath],
      outfile,
      bundle: true,
      platform: "node",
      format: "esm",
      target: "node14",
    });

    const configModule = await import(`file://${outfile}`);
    const config = configModule.default;

    await fs.rm(tmpDir, { recursive: true, force: true });
    return config;
  } catch (error) {
    await fs.rm(tmpDir, { recursive: true, force: true });
    throw error;
  }
}

async function writeTypesFile(config: NodeConfig): Promise<void> {
  const dir = path.join(process.cwd(), "src/generated");

  if (existsSync(dir)) {
    await fs.rm(dir, { recursive: true });
  }

  await fs.mkdir(dir, { recursive: true });

  const interfaces = config.functions.map(generateFunctionInterface);
  const baseFunctionsInterface = generateBaseFunctionsInterface(
    config.functions
  );

  const content = `// Generated file - DO NOT EDIT
// Generated on: ${new Date().toISOString()}

${interfaces.join("\n\n")}

${baseFunctionsInterface}
`;

  const typesPath = path.join(dir, "inputTypes.ts");
  await fs.writeFile(typesPath, content, "utf-8");
  console.log(`Types written to ${typesPath}`);
}

async function main() {
  try {
    console.log("Generating types...");
    const configPath = await findConfigFile();
    const config = await transpileAndLoadConfig(configPath);
    await writeTypesFile(config);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
