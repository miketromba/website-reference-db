/**
 * App configuration.
 *
 * Bun's built-in HTML server does NOT expose `import.meta.env` like Vite.
 * For local dev we hardcode the public Supabase values (anon key is safe to
 * embed — it's a *publishable* key). In production builds these can be
 * replaced via `define` in `Bun.build()` or injected at deploy time.
 */

export const API_URL: string =
	typeof process !== 'undefined' && process.env?.VITE_API_URL
		? process.env.VITE_API_URL
		: 'http://localhost:3001'

export const SUPABASE_URL: string =
	typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL
		? process.env.VITE_SUPABASE_URL
		: 'https://siqvdvxdbzccsoqgwurm.supabase.co'

export const SUPABASE_ANON_KEY: string =
	typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY
		? process.env.VITE_SUPABASE_ANON_KEY
		: 'sb_publishable_hEG6DGUeLC_2-XSrZQLJOA_JcDr8nBq'
