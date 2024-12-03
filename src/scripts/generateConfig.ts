#!/usr/bin/env node
import { NodeConfig } from "../types/config";
import * as path from "path";
import * as fs from "fs/promises";
import { build } from "esbuild";

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

    // Transpile the TypeScript file using esbuild
    await build({
      entryPoints: [configPath],
      outfile,
      bundle: true,
      platform: "node",
      format: "esm",
      target: "node14",
    });

    // Use dynamic import instead of require
    const configModule = await import(`file://${outfile}`);
    const config = configModule.default;

    // Clean up
    await fs.rm(tmpDir, { recursive: true, force: true });

    return config;
  } catch (error) {
    // Clean up on error
    await fs.rm(tmpDir, { recursive: true, force: true });
    throw error;
  }
}

async function writeConfigFile(config: NodeConfig): Promise<void> {
  const distDir = path.join(process.cwd(), "dist");
  const configPath = path.join(distDir, "node.config.json");

  try {
    // Create dist directory if it doesn't exist
    await fs.mkdir(distDir, { recursive: true });

    // Write the config file with pretty formatting
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");

    console.log(`Config written to ${configPath}`);
  } catch (error) {
    throw new Error(`Failed to write config file: ${error}`);
  }
}

async function main() {
  try {
    console.log("Generating config...");
    const configPath = await findConfigFile();
    const config = await transpileAndLoadConfig(configPath);

    // Write the config to file
    await writeConfigFile(config);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
