import { Elysia } from 'elysia'
import { supabase } from '../lib/supabase'
import { resolveUser } from '../middleware/auth'

export const upvotesRoutes = new Elysia().post(
	'/websites/:id/upvote',
	async ({ params, headers, set }) => {
		const user = await resolveUser(headers.authorization)
		if (!user) {
			set.status = 401
			return { error: 'Unauthorized' }
		}

		const websiteId = params.id

		// Verify website exists
		const { data: website, error: fetchError } = await supabase
			.from('websites')
			.select('id')
			.eq('id', websiteId)
			.single()

		if (fetchError || !website) {
			set.status = 404
			return { error: 'Website not found' }
		}

		// Check if already upvoted
		const { data: existing } = await supabase
			.from('upvotes')
			.select('id')
			.eq('website_id', websiteId)
			.eq('user_id', user.id)
			.single()

		if (existing) {
			// Remove upvote
			await supabase.from('upvotes').delete().eq('id', existing.id)
		} else {
			// Add upvote
			const { error: insertError } = await supabase
				.from('upvotes')
				.insert({ website_id: websiteId, user_id: user.id })

			if (insertError) {
				set.status = 500
				return { error: insertError.message }
			}
		}

		// Get updated count
		const { count } = await supabase
			.from('upvotes')
			.select('*', { count: 'exact', head: true })
			.eq('website_id', websiteId)

		return { upvoted: !existing, upvote_count: count ?? 0 }
	}
)
