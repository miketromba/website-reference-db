import { Elysia } from 'elysia'
import { supabase } from '../lib/supabase'

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000
const CACHE_HEADER = 'public, max-age=1209600, immutable'

/**
 * Resolve the base URL for the screenshot service.
 * In production, SCREENSHOT_SERVICE_URL points to the app's own origin.
 * Locally we fall back to localhost.
 */
function getScreenshotBaseUrl(request: Request): string {
	const env = process.env.SCREENSHOT_SERVICE_URL
	if (env && !env.startsWith('<')) return env

	// Derive from the incoming request origin
	const url = new URL(request.url)
	return url.origin
}

export const screenshotsRoutes = new Elysia().get(
	'/screenshots/:websiteId',
	async ({ params, set, request }) => {
		const { websiteId } = params

		// Look up website
		const { data: website, error: fetchError } = await supabase
			.from('websites')
			.select('id, url, screenshot_captured_at')
			.eq('id', websiteId)
			.single()

		if (fetchError || !website) {
			set.status = 404
			return { error: 'Website not found' }
		}

		const fileName = `${websiteId}.png`
		const isFresh =
			website.screenshot_captured_at &&
			Date.now() - new Date(website.screenshot_captured_at).getTime() <
				TWO_WEEKS_MS

		// Try serving from storage if fresh
		if (isFresh) {
			const { data: fileData } = await supabase.storage
				.from('screenshots')
				.download(fileName)

			if (fileData) {
				return new Response(fileData, {
					headers: {
						'Content-Type': 'image/png',
						'Cache-Control': CACHE_HEADER
					}
				})
			}
		}

		// Screenshot is stale or missing — capture a new one via the
		// co-located /api/screenshot endpoint (uses @miketromba/screenshot-service)
		const baseUrl = getScreenshotBaseUrl(request)
		const screenshotUrl = `${baseUrl}/api/screenshot?url=${encodeURIComponent(website.url)}&width=1440&height=900&type=png`

		let screenshotResponse: Response
		try {
			screenshotResponse = await fetch(screenshotUrl)
		} catch {
			set.status = 503
			return {
				error: 'Screenshot service unavailable (requires Vercel serverless environment)'
			}
		}

		if (!screenshotResponse.ok) {
			set.status = 503
			return {
				error: 'Screenshot service returned an error — may not be available in this environment'
			}
		}

		const imageBuffer = await screenshotResponse.arrayBuffer()
		const imageBytes = new Uint8Array(imageBuffer)

		// Upload to storage (upsert)
		const { error: uploadError } = await supabase.storage
			.from('screenshots')
			.upload(fileName, imageBytes, {
				contentType: 'image/png',
				upsert: true
			})

		if (uploadError) {
			console.error('Screenshot upload failed:', uploadError.message)
		}

		// Update screenshot_captured_at
		await supabase
			.from('websites')
			.update({ screenshot_captured_at: new Date().toISOString() })
			.eq('id', websiteId)

		return new Response(imageBytes, {
			headers: {
				'Content-Type': 'image/png',
				'Cache-Control': CACHE_HEADER
			}
		})
	}
)
