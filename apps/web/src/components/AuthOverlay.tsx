'use client'

import { ArrowRight, Loader2, Mail, X } from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'

interface AuthOverlayProps {
	isOpen: boolean
	onClose: () => void
}

export function AuthOverlay({ isOpen, onClose }: AuthOverlayProps) {
	const { signIn } = useAuth()
	const [email, setEmail] = useState('')
	const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>(
		'idle'
	)
	const [errorMsg, setErrorMsg] = useState('')
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (isOpen && inputRef.current) {
			setTimeout(() => inputRef.current?.focus(), 100)
		}
	}, [isOpen])

	// Reset state when overlay closes
	useEffect(() => {
		if (!isOpen) {
			setEmail('')
			setStatus('idle')
			setErrorMsg('')
		}
	}, [isOpen])

	if (!isOpen) return null

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!email.trim()) return

		setStatus('loading')
		setErrorMsg('')

		try {
			await signIn(email.trim())
			setStatus('sent')
		} catch (err) {
			setStatus('error')
			setErrorMsg(
				err instanceof Error ? err.message : 'Something went wrong'
			)
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<button
				type="button"
				className="absolute inset-0 w-full h-full bg-paper/80 backdrop-blur-sm cursor-default appearance-none border-none p-0"
				onClick={onClose}
				aria-label="Close dialog"
			/>

			{/* Card */}
			<div className="relative z-10 w-full max-w-md mx-4 bg-card border border-border rounded-2xl p-8 shadow-2xl shadow-ink/5 animate-in">
				<button
					type="button"
					onClick={onClose}
					className="absolute top-4 right-4 p-2 text-ink-muted hover:text-ink transition-colors rounded-lg hover:bg-paper"
				>
					<X size={20} />
				</button>

				{status === 'sent' ? (
					<div className="text-center py-4">
						<div className="w-14 h-14 rounded-full bg-vermillion-light flex items-center justify-center mx-auto mb-5">
							<Mail className="text-vermillion" size={24} />
						</div>
						<h2 className="font-display text-2xl font-semibold text-ink mb-2">
							Check your email
						</h2>
						<p className="text-ink-muted text-sm leading-relaxed">
							We sent a magic link to{' '}
							<span className="font-medium text-ink">
								{email}
							</span>
							.<br />
							Click it to sign in.
						</p>
					</div>
				) : (
					<>
						<h2 className="font-display text-2xl font-semibold text-ink mb-1">
							Sign in to continue
						</h2>
						<p className="text-ink-muted text-sm mb-6">
							Enter your email for a passwordless magic link.
						</p>

						<form onSubmit={handleSubmit} className="space-y-4">
							<input
								ref={inputRef}
								type="email"
								value={email}
								onChange={e => setEmail(e.target.value)}
								placeholder="you@example.com"
								required
								className="w-full px-4 py-3 bg-paper border border-border rounded-xl text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-vermillion/30 focus:border-vermillion transition-all font-body text-sm"
								disabled={status === 'loading'}
							/>

							{status === 'error' && (
								<p className="text-sm text-vermillion">
									{errorMsg}
								</p>
							)}

							<button
								type="submit"
								disabled={status === 'loading' || !email.trim()}
								className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-ink text-paper rounded-xl font-medium text-sm hover:bg-ink/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{status === 'loading' ? (
									<>
										<Loader2
											size={16}
											className="animate-spin"
										/>
										Sending...
									</>
								) : (
									<>
										Send Magic Link
										<ArrowRight size={16} />
									</>
								)}
							</button>
						</form>
					</>
				)}
			</div>
		</div>
	)
}
