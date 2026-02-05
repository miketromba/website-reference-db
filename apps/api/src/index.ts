import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'
import { screenshotsRoutes } from './routes/screenshots'
import { upvotesRoutes } from './routes/upvotes'
import { websitesRoutes } from './routes/websites'

const port = process.env.PORT ?? 3001

new Elysia()
	.use(cors())
	.get('/', () => ({ status: 'ok' }))
	.use(websitesRoutes)
	.use(upvotesRoutes)
	.use(screenshotsRoutes)
	.listen(port)

console.log(`API server running at http://localhost:${port}`)
