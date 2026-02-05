import './lib/env'
import { serve } from 'bun'
import index from './index.html'

const port = Number(process.env.PORT) || 3003

const server = serve({
	port,
	routes: {
		'/*': index
	},

	development: process.env.NODE_ENV !== 'production' && {
		hmr: true,
		console: true
	}
})

console.log(`Server running at ${server.url}`)
