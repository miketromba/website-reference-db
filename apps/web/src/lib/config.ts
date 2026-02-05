/**
 * App configuration.
 *
 * In production builds, `process.env.VITE_*` tokens are replaced at build time
 * via `define` in build.ts. During Bun dev server, process.env is available
 * natively. Fallbacks cover local development without a .env file.
 */

export const API_URL: string =
	process.env.VITE_API_URL || 'http://localhost:3001'

export const SUPABASE_URL: string =
	process.env.VITE_SUPABASE_URL || 'https://siqvdvxdbzccsoqgwurm.supabase.co'

export const SUPABASE_ANON_KEY: string =
	process.env.VITE_SUPABASE_ANON_KEY ||
	'sb_publishable_hEG6DGUeLC_2-XSrZQLJOA_JcDr8nBq'
