import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	transpilePackages: ['@miketromba/screenshot-service'],
	serverExternalPackages: ['@sparticuz/chromium']
}

export default nextConfig
