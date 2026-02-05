import { Elysia } from 'elysia'
import { upvotesRoutes } from './routes/upvotes'
import { websitesRoutes } from './routes/websites'

export const app = new Elysia({ prefix: '/api' })
	.get('/', () => ({ status: 'ok' }))
	.use(websitesRoutes)
	.use(upvotesRoutes)
