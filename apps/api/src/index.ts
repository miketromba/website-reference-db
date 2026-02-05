import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'
import { screenshotsRoutes } from './routes/screenshots'
import { upvotesRoutes } from './routes/upvotes'
import { websitesRoutes } from './routes/websites'

const app = new Elysia()
	.use(cors())
	.get('/', () => ({ status: 'ok' }))
	.use(websitesRoutes)
	.use(upvotesRoutes)
	.use(screenshotsRoutes)

// Local dev server — skipped on Vercel where the app is imported as a module
if (!process.env.VERCEL) {
	const port = process.env.PORT ?? 3001
	app.listen(port)
	console.log(`API server running at http://localhost:${port}`)
}

export default app
