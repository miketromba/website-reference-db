import { supabase } from '../lib/supabase'

/**
 * Resolve the authenticated user from an Authorization: Bearer <token> header.
 * Returns `null` if no valid token is present.
 */
export async function resolveUser(authorization: string | undefined) {
	if (!authorization?.startsWith('Bearer ')) return null

	const token = authorization.slice(7)
	const {
		data: { user }
	} = await supabase.auth.getUser(token)

	return user
}
