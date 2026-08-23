import fs from 'fs/promises'

// ensures dist/server.js exists, should work on windows
await fs.mkdir('dist', { recursive: true })
await fs.appendFile('dist/server.js', '')
