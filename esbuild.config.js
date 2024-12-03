const esbuild = require("esbuild");
const { execSync } = require("child_process");
const fs = require("fs");

// Create dist directory if it doesn't exist
if (!fs.existsSync("dist")) {
  fs.mkdirSync("dist", { recursive: true });
}

// Build TypeScript files
esbuild.buildSync({
  entryPoints: [
    "src/main.ts",
    "src/scripts/generateConfig.ts",
    "src/scripts/generateTypes.ts",
  ],
  bundle: true,
  platform: "node",
  target: "node14",
  outdir: "dist",
  format: "cjs",
  sourcemap: true,
  minify: false,
  external: [
    "fs/promises",
    "path",
    "fs",
    "child_process",
    "esbuild",
    "./esbuild",
    "esbuild/lib/main",
  ],
});

// Generate TypeScript declaration files
execSync("tsc --declaration --emitDeclarationOnly --outDir dist", {
  stdio: "inherit",
});

console.log("Build completed successfully!");
