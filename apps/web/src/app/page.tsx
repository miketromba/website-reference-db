'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
	ArrowBigUp,
	ExternalLink,
	ImageOff,
	Loader2,
	Moon,
	Plus,
	Sun,
	Trash2
} from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
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
import { QueryProvider } from '../lib/query'

/* ── Query keys ───────────────────────────────────────── */

const websiteKeys = {
	all: ['websites'] as const,
	list: (view: 'all' | 'my', userId?: string) =>
		['websites', view, userId ?? 'anon'] as const
}

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

/* ── Screenshot Mode Toggle ────────────────────────────── */

function ScreenshotModeToggle({
	mode,
	onToggle
}: {
	mode: 'light' | 'dark'
	onToggle: (m: 'light' | 'dark') => void
}) {
	return (
		<div className="flex items-center gap-1 bg-paper-dark rounded-lg p-1">
			<button
				type="button"
				onClick={() => onToggle('light')}
				className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
					mode === 'light'
						? 'bg-card text-ink shadow-sm'
						: 'text-ink-muted hover:text-ink'
				}`}
			>
				<Sun size={14} />
				Light
			</button>
			<button
				type="button"
				onClick={() => onToggle('dark')}
				className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
					mode === 'dark'
						? 'bg-card text-ink shadow-sm'
						: 'text-ink-muted hover:text-ink'
				}`}
			>
				<Moon size={14} />
				Dark
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
	screenshotMode,
	onUpvote,
	onDelete
}: {
	website: Website
	isOwner: boolean
	showDelete: boolean
	screenshotMode: 'light' | 'dark'
	onUpvote: () => void
	onDelete: () => void
}) {
	const [imgError, setImgError] = useState(false)

	// Reset error state when screenshot mode changes so images reload
	// biome-ignore lint/correctness/useExhaustiveDependencies: screenshotMode change must reset error state to allow image reload
	useEffect(() => {
		setImgError(false)
	}, [screenshotMode])

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
					// biome-ignore lint/performance/noImgElement: dynamic API screenshot, not a static asset
					<img
						src={screenshotUrl(website.id, screenshotMode)}
						alt={`${screenshotMode === 'dark' ? 'Dark' : 'Light'} mode screenshot of ${displayUrl}`}
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
			<div className="px-4 py-3 flex items-center justify-between gap-2">
				<a
					href={website.url}
					target="_blank"
					rel="noopener noreferrer"
					className="text-sm text-ink hover:text-vermillion transition-colors truncate font-medium min-w-0"
					title={website.url}
				>
					{displayUrl}
				</a>

				<div className="flex items-center gap-1 shrink-0">
					<button
						type="button"
						onClick={onUpvote}
						className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm transition-all ${
							website.has_upvoted
								? 'text-vermillion bg-vermillion-light/50'
								: 'text-ink-muted hover:text-vermillion hover:bg-vermillion-light/50'
						}`}
					>
						<ArrowBigUp
							size={16}
							fill={website.has_upvoted ? 'currentColor' : 'none'}
						/>
						<span className="font-medium tabular-nums">
							{website.upvote_count}
						</span>
					</button>

					{isOwner && showDelete && (
						<button
							type="button"
							onClick={onDelete}
							className="p-1.5 rounded-lg text-ink-faint hover:text-vermillion hover:bg-vermillion-light/30 transition-all opacity-0 group-hover:opacity-100"
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
	const queryClient = useQueryClient()

	const [showAuth, setShowAuth] = useState(false)
	const [view, setView] = useState<'all' | 'my'>('all')
	const [submitError, setSubmitError] = useState('')
	const [screenshotMode, setScreenshotMode] = useState<'light' | 'dark'>(
		() => {
			if (typeof window !== 'undefined') {
				return (
					(localStorage.getItem('screenshotMode') as
						| 'light'
						| 'dark') ?? 'light'
				)
			}
			return 'light'
		}
	)

	// Persist screenshot mode preference
	useEffect(() => {
		localStorage.setItem('screenshotMode', screenshotMode)
	}, [screenshotMode])

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

	/* ── Queries ─────────────────────────────────────── */

	const queryKey = websiteKeys.list(view, user?.id)

	const { data: websites = [], isLoading } = useQuery({
		queryKey,
		queryFn: () =>
			getWebsites(
				view === 'my' && user ? user.id : undefined,
				session?.access_token
			),
		enabled: !authLoading
	})

	/* ── Mutations ───────────────────────────────────── */

	const addMutation = useMutation({
		mutationFn: (url: string) =>
			addWebsite(url, session?.access_token ?? ''),
		onSuccess: () => {
			setSubmitError('')
			queryClient.invalidateQueries({ queryKey: websiteKeys.all })
		},
		onError: (err: Error) => {
			setSubmitError(err.message)
		}
	})

	const deleteMutation = useMutation({
		mutationFn: (id: string) =>
			deleteWebsite(id, session?.access_token ?? ''),
		onMutate: async id => {
			await queryClient.cancelQueries({ queryKey })
			const previous = queryClient.getQueryData<Website[]>(queryKey)
			queryClient.setQueryData<Website[]>(queryKey, old =>
				old ? old.filter(w => w.id !== id) : []
			)
			return { previous }
		},
		onError: (_err, _id, context) => {
			if (context?.previous) {
				queryClient.setQueryData(queryKey, context.previous)
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: websiteKeys.all })
		}
	})

	const upvoteMutation = useMutation({
		mutationFn: (id: string) =>
			toggleUpvote(id, session?.access_token ?? ''),
		onMutate: async id => {
			// Cancel any outgoing refetches so they don't overwrite our optimistic update
			await queryClient.cancelQueries({ queryKey: websiteKeys.all })

			// Snapshot all cached website lists so we can roll back
			const snapshots: [readonly string[], Website[] | undefined][] = []
			for (const query of queryClient.getQueriesData<Website[]>({
				queryKey: websiteKeys.all
			})) {
				snapshots.push([query[0] as unknown as string[], query[1]])
			}

			// Optimistically update every cached list that contains this website
			queryClient.setQueriesData<Website[]>(
				{ queryKey: websiteKeys.all },
				old =>
					old?.map(w =>
						w.id === id
							? {
									...w,
									has_upvoted: !w.has_upvoted,
									upvote_count: w.has_upvoted
										? Math.max(0, w.upvote_count - 1)
										: w.upvote_count + 1
								}
							: w
					)
			)

			return { snapshots }
		},
		onError: (_err, _id, context) => {
			// Roll back all cached lists to their previous state
			if (context?.snapshots) {
				for (const [key, data] of context.snapshots) {
					queryClient.setQueryData(key, data)
				}
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: websiteKeys.all })
		}
	})

	/* ── Handlers ────────────────────────────────────── */

	const handleAddWebsite = (url: string) => {
		if (!user || !session) {
			setShowAuth(true)
			return
		}
		setSubmitError('')
		addMutation.mutate(url)
	}

	const handleUpvote = (id: string) => {
		if (!user || !session) {
			setShowAuth(true)
			return
		}
		upvoteMutation.mutate(id)
	}

	const handleDelete = (id: string) => {
		if (!session) return
		deleteMutation.mutate(id)
	}

	const loading = isLoading || authLoading

	return (
		<div className="min-h-screen bg-paper">
			<div className="max-w-6xl mx-auto">
				<Header onSignIn={() => setShowAuth(true)} />

				<UrlInput
					onSubmit={handleAddWebsite}
					submitting={addMutation.isPending}
					error={submitError}
				/>

				{/* View toggle + screenshot mode + count */}
				<div className="px-6 md:px-10 mb-6 flex items-center justify-between flex-wrap gap-3">
					<div className="flex items-center gap-3 flex-wrap">
						{user && <ViewToggle view={view} onToggle={setView} />}
						<ScreenshotModeToggle
							mode={screenshotMode}
							onToggle={setScreenshotMode}
						/>
					</div>
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
									screenshotMode={screenshotMode}
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

/* ── Page (wrapped with AuthProvider + QueryProvider) ── */

export default function Page() {
	return (
		<QueryProvider>
			<AuthProvider>
				<App />
			</AuthProvider>
		</QueryProvider>
	)
}
