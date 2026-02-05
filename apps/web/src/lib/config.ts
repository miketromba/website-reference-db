/**
 * App configuration.
 *
 * API is same-origin in the consolidated Next.js app, so API_URL is empty.
 * Client-side env vars use the NEXT_PUBLIC_ prefix.
 */

export const API_URL = ''

export const SUPABASE_URL: string =
	process.env.NEXT_PUBLIC_SUPABASE_URL ||
	'https://siqvdvxdbzccsoqgwurm.supabase.co'

export const SUPABASE_ANON_KEY: string =
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
	'sb_publishable_hEG6DGUeLC_2-XSrZQLJOA_JcDr8nBq'
