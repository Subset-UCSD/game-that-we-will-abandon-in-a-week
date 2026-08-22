import esbuild from "esbuild";
const mode = process.argv[2];

const isServe = mode==='serve'

const serverConfigPromise = esbuild.context({
	bundle: true,
	outfile: "dist/server.js",
	platform: "node",
	minify: false,
	sourcemap: true,
	format: "esm",
	packages: "external",
	entryPoints: ["server/index.ts"],
});

const clientConfigPromise = esbuild.context({
  bundle: true,
  outfile: "public/dist/client.js",
  platform: "browser",
  minify: !isServe,
  sourcemap: true,
  format: "esm",
  entryPoints: ["client/index.ts"],
	define: {
		IS_SERVING: isServe?'true':'false'
	}
});

const [serverConfig,clientConfig] = await Promise.all([serverConfigPromise,clientConfigPromise])

switch (mode) {
	case 'build': {
		console.log('building')
		await Promise.all([
		 serverConfig.rebuild(), // .then(() => console.log('server done')),
		 clientConfig.rebuild(), // .then(() => console.log('client done')),
		])
		break
	}
	case 'serve': {
		console.log('serving')
		const clientServe = await clientConfig.serve({servedir:'public', port:6767,})
		for (const host of clientServe.hosts) {
			console.log(`http://${host}:${clientServe.port}`)
		}
		await serverConfig.watch()
		// hang
		await new Promise(() => {})
	}
	default: {
		console.error('usage: node esbuild.ts (build|serve)')
		console.error('🤡')
		process.exit(1)
	}
}

await Promise.all([
	serverConfig.dispose(),
	clientConfig.dispose(),
])