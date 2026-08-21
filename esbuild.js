const config = {
  bundle: true,
  outfile: "dist/public/client.js",
  platform: "browser",
  minify: false,
  sourcemap: true,
  format: "esm",
  entryPoints: ["index.ts"],
};
await build(serverConfig);
