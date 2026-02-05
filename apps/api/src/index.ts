import { resolve } from 'node:path'
import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'

// Load .env from monorepo root
const envPath = resolve(import.meta.dir, '..', '..', '..', '.env')
const envFile = Bun.file(envPath)

if (await envFile.exists()) {
	const text = await envFile.text()
	for (const line of text.split('\n')) {
		const trimmed = line.trim()
		if (!trimmed || trimmed.startsWith('#')) continue
		const eq = trimmed.indexOf('=')
		if (eq === -1) continue
		const key = trimmed.slice(0, eq)
		const val = trimmed.slice(eq + 1)
		process.env[key] ??= val
	}
}

const port = process.env.PORT ?? 3001

new Elysia()
	.use(cors())
	.get('/', () => ({ status: 'ok' }))
	.listen(port)

console.log(`API server running at http://localhost:${port}`)
