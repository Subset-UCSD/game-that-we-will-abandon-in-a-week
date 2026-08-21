import esbuild from "esbuild";
const [, , mode] = process.argv

const config = {
  bundle: true,
  outfile: "public/dist/client.js",
  platform: "browser",
  minify: false,
  sourcemap: true,
  format: "esm",
  entryPoints: ["src/index.ts"],
};
const ctx = await esbuild.context(config);

switch (mode) {
    case 'serve': {
        console.error('serving💅🫦')
        const what = await ctx.serve({ servedir: "public" });
        for (const host of what.hosts) {
        console.error(`http://${host}:${what.port}`);
        }
        break
    }
    case 'build': {
        await ctx.rebuild()
break
    }
    default: {
        console.error('holy fucking shit wtf is', mode ?? 'lack of argument')
        console.error('usage: node esbuild.js <mode>')
    }

}