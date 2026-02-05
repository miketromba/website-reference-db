/**
 * Entry point — renders <App /> wrapped in auth context.
 */

import { createRoot } from 'react-dom/client'
import { App } from './App'
import { AuthProvider } from './context/AuthContext'

function start() {
	const el = document.getElementById('root')
	if (!el) throw new Error('Root element not found')
	const root = createRoot(el)
	root.render(
		<AuthProvider>
			<App />
		</AuthProvider>
	)
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', start)
} else {
	start()
}
