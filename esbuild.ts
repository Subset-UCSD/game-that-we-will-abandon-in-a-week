import esbuild from "esbuild";
const mode = process.argv[2];

const isServe = mode==='serve'
const isGitHubPages = !!process.env.GITHUB_PAGES&&!isServe

const serverConfigPromise = esbuild.context({
	bundle: true,
	outfile: isGitHubPages ? 'public/dist/worker.js' : "dist/server.js",
	platform: isGitHubPages ? 'browser' : "node",
	minify: isGitHubPages,
	sourcemap: true,
	format: "esm",
	packages: isGitHubPages ? 'bundle' : "external",
	entryPoints: [isGitHubPages ? 'server/gh-pages-preview-worker.js': "server/index.ts"],
});

const clientConfigPromise = esbuild.context({
  bundle: true,
  outfile: "public/dist/client.js",
  platform: "browser",
	target: 'es2022',
  minify: !isServe,
  sourcemap: true,
  format: "esm",
  entryPoints: ["client/index.ts"],
	banner: {
		js: (isGitHubPages ? 'import "../gh-pages-preview-ws-polyfill.js"\n' : '') + 'Symbol.dispose ??= Symbol("safari issue")'
	},
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
