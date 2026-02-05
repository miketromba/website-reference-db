import { supabase } from '@/server/lib/supabase'

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000
const CACHE_HEADER = 'public, max-age=1209600, immutable'

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ websiteId: string }> }
) {
	try {
		const { websiteId } = await params

		// Look up website
		const { data: website, error: fetchError } = await supabase
			.from('websites')
			.select('id, url, screenshot_captured_at')
			.eq('id', websiteId)
			.single()

		if (fetchError || !website) {
			return Response.json(
				{ error: 'Website not found' },
				{ status: 404 }
			)
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

		// Screenshot is stale or missing — capture in-process using
		// @miketromba/screenshot-service (avoids self-referential HTTP call)
		const { GET: screenshotHandler } = await import(
			'@miketromba/screenshot-service/vercel'
		)
		const fakeRequest = new Request(
			`https://localhost/api/screenshot?url=${encodeURIComponent(website.url)}&width=1440&height=900&type=png`
		)
		const screenshotResponse = await screenshotHandler(fakeRequest)

		if (!screenshotResponse.ok) {
			return Response.json(
				{
					error: 'Screenshot capture failed',
					details: await screenshotResponse.text()
				},
				{ status: 503 }
			)
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
	} catch (error) {
		console.error('Screenshot route error:', error)
		return Response.json(
			{
				error: 'Screenshot service error',
				message:
					error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		)
	}
}
