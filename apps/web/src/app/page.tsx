'use client'

import {
	ArrowBigUp,
	ExternalLink,
	ImageOff,
	Loader2,
	Plus,
	Trash2
} from 'lucide-react'
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { AuthOverlay } from '../components/AuthOverlay'
import { AuthProvider, useAuth } from '../context/AuthContext'
import {
	addWebsite,
	deleteWebsite,
	getWebsites,
	screenshotUrl,
	toggleUpvote,
	type Website
} from '../lib/api'

/* ── Header ────────────────────────────────────────────── */

function Header({ onSignIn }: { onSignIn: () => void }) {
	const { user, signOut } = useAuth()

	return (
		<header className="flex items-center justify-between py-6 px-6 md:px-10">
			<h1 className="font-display text-2xl font-bold tracking-tight select-none">
				ref
				<span className="text-vermillion">.</span>
				db
			</h1>

			<div className="flex items-center gap-3">
				{user ? (
					<>
						<span className="text-sm text-ink-muted hidden sm:block truncate max-w-48">
							{user.email}
						</span>
						<button
							type="button"
							onClick={signOut}
							className="text-sm font-medium text-ink-muted hover:text-ink px-3 py-1.5 rounded-lg hover:bg-paper-dark transition-all"
						>
							Sign out
						</button>
					</>
				) : (
					<button
						type="button"
						onClick={onSignIn}
						className="text-sm font-medium text-ink-muted hover:text-ink px-3 py-1.5 rounded-lg hover:bg-paper-dark transition-all"
					>
						Sign in
					</button>
				)}
			</div>
		</header>
	)
}

/* ── URL Input ─────────────────────────────────────────── */

function UrlInput({
	onSubmit,
	submitting,
	error
}: {
	onSubmit: (url: string) => void
	submitting: boolean
	error: string
}) {
	const [url, setUrl] = useState('')

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault()
		if (!url.trim() || submitting) return
		onSubmit(url.trim())
		setUrl('')
	}

	return (
		<div className="px-6 md:px-10 mb-10">
			<form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
				<div className="flex gap-2">
					<input
						type="url"
						value={url}
						onChange={e => setUrl(e.target.value)}
						placeholder="Paste a website URL to save it…"
						className="flex-1 px-5 py-3.5 bg-card border border-border rounded-xl text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-vermillion/20 focus:border-vermillion/50 transition-all font-body text-sm shadow-sm"
						disabled={submitting}
					/>
					<button
						type="submit"
						disabled={submitting || !url.trim()}
						className="flex items-center gap-2 px-5 py-3.5 bg-ink text-paper rounded-xl font-medium text-sm hover:bg-ink/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shrink-0"
					>
						{submitting ? (
							<Loader2 size={16} className="animate-spin" />
						) : (
							<Plus size={16} strokeWidth={2.5} />
						)}
						<span className="hidden sm:inline">
							{submitting ? 'Adding…' : 'Add'}
						</span>
					</button>
				</div>
				{error && (
					<p className="mt-2 text-sm text-vermillion pl-1">{error}</p>
				)}
			</form>
		</div>
	)
}

/* ── View Toggle ───────────────────────────────────────── */

function ViewToggle({
	view,
	onToggle
}: {
	view: 'all' | 'my'
	onToggle: (v: 'all' | 'my') => void
}) {
	return (
		<div className="flex items-center gap-1 bg-paper-dark rounded-lg p-1">
			<button
				type="button"
				onClick={() => onToggle('my')}
				className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
					view === 'my'
						? 'bg-card text-ink shadow-sm'
						: 'text-ink-muted hover:text-ink'
				}`}
			>
				My References
			</button>
			<button
				type="button"
				onClick={() => onToggle('all')}
				className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
					view === 'all'
						? 'bg-card text-ink shadow-sm'
						: 'text-ink-muted hover:text-ink'
				}`}
			>
				All References
			</button>
		</div>
	)
}

/* ── Skeleton Card ─────────────────────────────────────── */

function SkeletonCard() {
	return (
		<div className="bg-card border border-border rounded-xl overflow-hidden animate-pulse">
			<div className="aspect-video bg-paper-dark" />
			<div className="p-4 space-y-3">
				<div className="h-4 bg-paper-dark rounded w-3/4" />
				<div className="flex items-center justify-between">
					<div className="h-8 w-16 bg-paper-dark rounded-lg" />
				</div>
			</div>
		</div>
	)
}

/* ── Reference Card ────────────────────────────────────── */

function ReferenceCard({
	website,
	isOwner,
	showDelete,
	onUpvote,
	onDelete
}: {
	website: Website
	isOwner: boolean
	showDelete: boolean
	onUpvote: () => void
	onDelete: () => void
}) {
	const [imgError, setImgError] = useState(false)

	const displayUrl = (() => {
		try {
			const u = new URL(website.url)
			return (
				u.hostname.replace(/^www\./, '') +
				(u.pathname !== '/' ? u.pathname : '')
			)
		} catch {
			return website.url
		}
	})()

	return (
		<div className="group bg-card border border-border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-ink/5 hover:-translate-y-0.5">
			{/* Screenshot */}
			<a
				href={website.url}
				target="_blank"
				rel="noopener noreferrer"
				className="block aspect-video bg-paper-dark relative overflow-hidden"
			>
				{imgError ? (
					<div className="absolute inset-0 flex flex-col items-center justify-center text-ink-faint gap-2">
						<ImageOff size={28} strokeWidth={1.5} />
						<span className="text-xs">Preview unavailable</span>
					</div>
				) : (
					<img
						src={screenshotUrl(website.id)}
						alt={`Screenshot of ${displayUrl}`}
						className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
						onError={() => setImgError(true)}
						loading="lazy"
					/>
				)}
				<div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/5 transition-colors flex items-center justify-center">
					<ExternalLink
						size={20}
						className="text-card opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md"
					/>
				</div>
			</a>

			{/* Details */}
			<div className="p-4">
				<a
					href={website.url}
					target="_blank"
					rel="noopener noreferrer"
					className="text-sm text-ink hover:text-vermillion transition-colors truncate block font-medium"
					title={website.url}
				>
					{displayUrl}
				</a>

				<div className="flex items-center justify-between mt-3">
					<button
						type="button"
						onClick={onUpvote}
						className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-ink-muted hover:text-vermillion hover:bg-vermillion-light/50 transition-all"
					>
						<ArrowBigUp size={18} />
						<span className="font-medium tabular-nums">
							{website.upvote_count}
						</span>
					</button>

					{isOwner && showDelete && (
						<button
							type="button"
							onClick={onDelete}
							className="p-2 rounded-lg text-ink-faint hover:text-vermillion hover:bg-vermillion-light/30 transition-all opacity-0 group-hover:opacity-100"
							title="Delete reference"
						>
							<Trash2 size={14} />
						</button>
					)}
				</div>
			</div>
		</div>
	)
}

/* ── App ───────────────────────────────────────────────── */

const SKELETON_KEYS = ['sk-a', 'sk-b', 'sk-c', 'sk-d', 'sk-e', 'sk-f']

function App() {
	const { user, session, loading: authLoading } = useAuth()
	const [websites, setWebsites] = useState<Website[]>([])
	const [loading, setLoading] = useState(true)
	const [showAuth, setShowAuth] = useState(false)
	const [view, setView] = useState<'all' | 'my'>('all')
	const [submitting, setSubmitting] = useState(false)
	const [submitError, setSubmitError] = useState('')

	// Default view based on auth
	useEffect(() => {
		setView(user ? 'my' : 'all')
	}, [user])

	// Close auth overlay on sign-in
	useEffect(() => {
		if (user && showAuth) {
			setShowAuth(false)
		}
	}, [user, showAuth])

	const fetchData = useCallback(async () => {
		setLoading(true)
		try {
			const userId = view === 'my' && user ? user.id : undefined
			const data = await getWebsites(userId)
			setWebsites(data)
		} catch {
			/* fetch error — silently degrade */
		} finally {
			setLoading(false)
		}
	}, [view, user])

	useEffect(() => {
		if (!authLoading) {
			fetchData()
		}
	}, [fetchData, authLoading])

	const handleAddWebsite = async (url: string) => {
		if (!user || !session) {
			setShowAuth(true)
			return
		}

		setSubmitting(true)
		setSubmitError('')

		try {
			const newSite = await addWebsite(url, session.access_token)
			setWebsites(prev => [newSite, ...prev])
		} catch (err) {
			setSubmitError(
				err instanceof Error ? err.message : 'Failed to add website'
			)
		} finally {
			setSubmitting(false)
		}
	}

	const handleUpvote = async (id: string) => {
		if (!user || !session) {
			setShowAuth(true)
			return
		}

		// Optimistic update
		setWebsites(prev =>
			prev.map(w =>
				w.id === id ? { ...w, upvote_count: w.upvote_count + 1 } : w
			)
		)

		try {
			const result = await toggleUpvote(id, session.access_token)
			setWebsites(prev =>
				prev.map(w =>
					w.id === id
						? { ...w, upvote_count: result.upvote_count }
						: w
				)
			)
		} catch {
			// Revert on failure
			setWebsites(prev =>
				prev.map(w =>
					w.id === id
						? {
								...w,
								upvote_count: Math.max(0, w.upvote_count - 1)
							}
						: w
				)
			)
		}
	}

	const handleDelete = async (id: string) => {
		if (!session) return

		const removed = websites.find(w => w.id === id)
		setWebsites(prev => prev.filter(w => w.id !== id))

		try {
			await deleteWebsite(id, session.access_token)
		} catch {
			if (removed) {
				setWebsites(prev => [removed, ...prev])
			}
		}
	}

	return (
		<div className="min-h-screen bg-paper">
			<div className="max-w-6xl mx-auto">
				<Header onSignIn={() => setShowAuth(true)} />

				<UrlInput
					onSubmit={handleAddWebsite}
					submitting={submitting}
					error={submitError}
				/>

				{/* View toggle + count */}
				<div className="px-6 md:px-10 mb-6 flex items-center justify-between flex-wrap gap-3">
					{user && <ViewToggle view={view} onToggle={setView} />}
					{!loading && (
						<span className="text-sm text-ink-muted ml-auto tabular-nums">
							{websites.length}{' '}
							{websites.length === 1 ? 'reference' : 'references'}
						</span>
					)}
				</div>

				{/* Grid */}
				<div className="px-6 md:px-10 pb-20">
					{loading ? (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
							{SKELETON_KEYS.map(k => (
								<SkeletonCard key={k} />
							))}
						</div>
					) : websites.length === 0 ? (
						<div className="text-center py-24">
							<p className="font-display text-xl text-ink-muted mb-2">
								{view === 'my'
									? 'No references yet'
									: 'Nothing here yet'}
							</p>
							<p className="text-sm text-ink-faint max-w-sm mx-auto">
								{view === 'my'
									? 'Paste a URL above to save your first design reference.'
									: 'Be the first to add a design reference.'}
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
							{websites.map(site => (
								<ReferenceCard
									key={site.id}
									website={site}
									isOwner={user?.id === site.user_id}
									showDelete={view === 'my'}
									onUpvote={() => handleUpvote(site.id)}
									onDelete={() => handleDelete(site.id)}
								/>
							))}
						</div>
					)}
				</div>
			</div>

			<AuthOverlay isOpen={showAuth} onClose={() => setShowAuth(false)} />
		</div>
	)
}

/* ── Page (wrapped with AuthProvider) ──────────────────── */

export default function Page() {
	return (
		<AuthProvider>
			<App />
		</AuthProvider>
	)
}
