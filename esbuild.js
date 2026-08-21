import esbuild from "esbuild";
const config = {
  bundle: true,
  outfile: "dist/client.js",
  platform: "browser",
  minify: false,
  sourcemap: true,
  format: "esm",
  entryPoints: ["src/index.ts"],
};
const ctx = await esbuild.context(config);
const what = await ctx.serve();
for (const host of what.hosts) {
  console.log(`http://${host}:${what.port}`);
}
