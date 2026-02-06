import { join } from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	transpilePackages: ['@miketromba/screenshot-service'],
	serverExternalPackages: ['@sparticuz/chromium'],
	outputFileTracingRoot: join(import.meta.dirname, '..', '..'),
	outputFileTracingIncludes: {
		'/api/screenshot': [
			'./node_modules/@sparticuz/chromium/bin/**',
			'../../node_modules/.bun/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/bin/**'
		],
		'/api/screenshots/[websiteId]': [
			'./node_modules/@sparticuz/chromium/bin/**',
			'../../node_modules/.bun/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/bin/**'
		]
	}
}

export default nextConfig
