import { Elysia, t } from 'elysia'
import { supabase } from '../lib/supabase'
import { resolveUser } from '../middleware/auth'

export const websitesRoutes = new Elysia({ prefix: '/websites' })
	// GET /websites — public, returns all websites with upvote counts
	.get(
		'/',
		async ({ query }) => {
			let q = supabase
				.from('websites')
				.select('*, upvotes(count)')
				.order('created_at', { ascending: false })

			if (query.user_id) {
				q = q.eq('user_id', query.user_id)
			}

			const { data, error } = await q

			if (error) {
				throw new Error(error.message)
			}

			return (data ?? []).map(w => ({
				id: w.id,
				url: w.url,
				title: w.title,
				user_id: w.user_id,
				screenshot_captured_at: w.screenshot_captured_at,
				created_at: w.created_at,
				upvote_count: w.upvotes?.[0]?.count ?? 0
			}))
		},
		{
			query: t.Object({
				user_id: t.Optional(t.String())
			})
		}
	)
	// POST /websites — auth required
	.post(
		'/',
		async ({ body, headers, set }) => {
			const user = await resolveUser(headers.authorization)
			if (!user) {
				set.status = 401
				return { error: 'Unauthorized' }
			}

			// Validate URL
			try {
				const parsed = new URL(body.url)
				if (!['http:', 'https:'].includes(parsed.protocol)) {
					throw new Error('Invalid protocol')
				}
			} catch {
				set.status = 400
				return { error: 'Invalid URL' }
			}

			const { data, error: dbError } = await supabase
				.from('websites')
				.insert({
					url: body.url,
					title: body.title ?? null,
					user_id: user.id
				})
				.select()
				.single()

			if (dbError) {
				if (dbError.code === '23505') {
					set.status = 409
					return { error: 'Website already exists' }
				}
				set.status = 500
				return { error: dbError.message }
			}

			return { ...data, upvote_count: 0 }
		},
		{
			body: t.Object({
				url: t.String(),
				title: t.Optional(t.String())
			})
		}
	)
	// DELETE /websites/:id — auth required, owner only
	.delete('/:id', async ({ params, headers, set }) => {
		const user = await resolveUser(headers.authorization)
		if (!user) {
			set.status = 401
			return { error: 'Unauthorized' }
		}

		const { data: existing, error: fetchError } = await supabase
			.from('websites')
			.select('user_id')
			.eq('id', params.id)
			.single()

		if (fetchError || !existing) {
			set.status = 404
			return { error: 'Website not found' }
		}

		if (existing.user_id !== user.id) {
			set.status = 403
			return { error: 'Not authorized to delete this website' }
		}

		const { error: deleteError } = await supabase
			.from('websites')
			.delete()
			.eq('id', params.id)

		if (deleteError) {
			set.status = 500
			return { error: deleteError.message }
		}

		return { success: true }
	})
