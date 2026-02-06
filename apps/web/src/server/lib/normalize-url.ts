/**
 * Normalizes a URL to its canonical form for deduplication.
 *
 * Normalization steps:
 * 1. Parse the URL (throws if invalid)
 * 2. Lowercase the protocol and hostname
 * 3. Remove default ports (80 for http, 443 for https)
 * 4. Remove trailing slash from the path (unless the path has meaningful segments)
 * 5. Remove the fragment/hash
 * 6. Sort query parameters alphabetically
 * 7. Remove common tracking parameters (utm_*, ref, etc.)
 * 8. Strip "www." prefix from hostname
 *
 * @example
 * normalizeUrl("https://Example.COM/")        → "https://example.com"
 * normalizeUrl("https://www.example.com/")     → "https://example.com"
 * normalizeUrl("https://example.com:443/path") → "https://example.com/path"
 * normalizeUrl("https://example.com/path/")    → "https://example.com/path"
 * normalizeUrl("https://example.com/#about")   → "https://example.com"
 */
export function normalizeUrl(rawUrl: string): string {
	// Trim whitespace
	const trimmed = rawUrl.trim()

	// Parse — this will throw if the URL is invalid
	const parsed = new URL(trimmed)

	// Only allow http/https
	if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
		throw new Error('Invalid protocol: only http and https are allowed')
	}

	// Lowercase hostname (URL constructor already lowercases it, but be explicit)
	let hostname = parsed.hostname.toLowerCase()

	// Strip "www." prefix
	if (hostname.startsWith('www.')) {
		hostname = hostname.slice(4)
	}

	// Remove default ports
	let port = parsed.port
	if (
		(parsed.protocol === 'http:' && port === '80') ||
		(parsed.protocol === 'https:' && port === '443')
	) {
		port = ''
	}

	// Normalize path: remove trailing slash(es) unless path is just "/"
	let path = parsed.pathname
	// Collapse multiple slashes
	path = path.replace(/\/+/g, '/')
	// Remove trailing slash if it's not the only character
	if (path.length > 1 && path.endsWith('/')) {
		path = path.replace(/\/+$/, '')
	}
	// If path ended up as just "/" with no other segments, remove it entirely
	if (path === '/') {
		path = ''
	}

	// Sort query parameters and remove tracking params
	const trackingParams = new Set([
		'utm_source',
		'utm_medium',
		'utm_campaign',
		'utm_term',
		'utm_content',
		'ref',
		'fbclid',
		'gclid',
		'mc_cid',
		'mc_eid'
	])
	const params = new URLSearchParams(parsed.search)
	const sortedParams = new URLSearchParams()
	const keys = [...params.keys()].filter(k => !trackingParams.has(k)).sort()
	for (const key of keys) {
		const value = params.get(key)
		if (value !== null) {
			sortedParams.set(key, value)
		}
	}
	const queryString = sortedParams.toString()

	// Reconstruct the canonical URL (no fragment)
	const portSuffix = port ? `:${port}` : ''
	const querySuffix = queryString ? `?${queryString}` : ''

	return `${parsed.protocol}//${hostname}${portSuffix}${path}${querySuffix}`
}
