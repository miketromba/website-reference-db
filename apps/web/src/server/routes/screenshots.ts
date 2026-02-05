import { Elysia } from 'elysia'
import { supabase } from '../lib/supabase'

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000
const CACHE_HEADER = 'public, max-age=1209600, immutable'

export const screenshotsRoutes = new Elysia().get(
	'/screenshots/:websiteId',
	async ({ params, set }) => {
		const { websiteId } = params
		const screenshotServiceUrl = process.env.SCREENSHOT_SERVICE_URL

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

		// Screenshot is stale or missing — capture a new one
		if (!screenshotServiceUrl || screenshotServiceUrl.startsWith('<')) {
			set.status = 501
			return { error: 'Screenshot service not configured' }
		}

		const screenshotUrl = `${screenshotServiceUrl}/screenshot?url=${encodeURIComponent(website.url)}&width=1440&height=900&type=png`

		let screenshotResponse: Response
		try {
			screenshotResponse = await fetch(screenshotUrl)
		} catch {
			set.status = 502
			return { error: 'Failed to reach screenshot service' }
		}

		if (!screenshotResponse.ok) {
			set.status = 502
			return { error: 'Screenshot service returned an error' }
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
