import esbuild from "esbuild";
const mode = process.argv[2];

const serverConfig = {
	bundle: true,
	outfile: "dist/server.js",
	platform: "node",
	minify: false,
	sourcemap: true,
	format: "esm",
	packages: "external",
	entryPoints: ["server/index.ts"],
};

const clientConfig = {
  bundle: true,
  outfile: "public/dist/client.js",
  platform: "browser",
  minify: false,
  sourcemap: true,
  format: "esm",
  entryPoints: ["client/index.ts"],
};

(async () => {
	await esbuild.build(serverConfig);
	await esbuild.build(clientConfig);
})();

