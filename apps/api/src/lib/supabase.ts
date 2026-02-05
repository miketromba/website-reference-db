import './env'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | undefined

/** Lazily initialised Supabase client — throws on first use if env vars are missing. */
export function getSupabase(): SupabaseClient {
	if (_client) return _client

	const supabaseUrl = process.env.SUPABASE_URL
	const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

	if (!supabaseUrl || !supabaseServiceRoleKey) {
		throw new Error(
			'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
		)
	}

	_client = createClient(supabaseUrl, supabaseServiceRoleKey, {
		auth: { autoRefreshToken: false, persistSession: false }
	})
	return _client
}

/** @deprecated Use getSupabase() — kept for backwards compat during migration */
export const supabase = new Proxy({} as SupabaseClient, {
	get(_target, prop) {
		return (getSupabase() as Record<string | symbol, unknown>)[prop]
	}
})
