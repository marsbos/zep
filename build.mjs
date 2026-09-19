import fs from "fs";
import { gzipSync } from "zlib";
import * as esbuild from "esbuild";
import { minify } from "terser";

console.log("🏄‍♂️ Building library packages...\n");

// Subpath exports instellingen: [entryPoint, outputDistPath]
const targets = [
  { entry: "./src/index.js", dist: "./dist/index.js" },
  { entry: "./src/helpers/index.js", dist: "./dist/helpers.js" },
];

fs.mkdirSync("./dist", { recursive: true });

for (const target of targets) {
  // 1. Bundle in geheugen
  const bundled = await esbuild.build({
    entryPoints: [target.entry],
    bundle: true,
    format: "esm",
    target: "es2020",
    write: false,
  });

  const code = bundled.outputFiles[0].text;

  // 2. Extra agressieve minificatie met Terser
  const esmResult = await minify(code, {
    module: true,
    compress: {
      passes: 5,
      ecma: 2020,
      toplevel: true,
      unsafe_arrows: true,
    },
    mangle: {
      toplevel: true,
      properties: { regex: /^_/ }, // Mangles private/interne variabelen met _
    },
  });

  // 3. Schrijf naar dist
  fs.writeFileSync(target.dist, esmResult.code);

  // 4. Statistieken printen
  const rawSize = fs.statSync(target.dist).size;
  const gzippedSize = gzipSync(esmResult.code).length;

  console.log(`📦 Dist target:  ${target.dist}`);
  console.log(`📏 Raw size:     ${rawSize} bytes`);
  console.log(
    `⚡ Gzipped size: ${gzippedSize} bytes (${(gzippedSize / 1024).toFixed(2)} KB)\n`,
  );
}

// Optioneel: Kopieer TypeScript declaratiebestanden als je die gebruikt
if (fs.existsSync("./src/index.d.ts")) {
  fs.copyFileSync("./src/index.d.ts", "./dist/index.d.ts");
}
if (fs.existsSync("./src/helpers/index.d.ts")) {
  fs.copyFileSync("./src/helpers/index.d.ts", "./dist/helpers.d.ts");
}

console.log("✅ All builds complete!");
