'use client'

import type { Session, User } from '@supabase/supabase-js'
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState
} from 'react'
import { supabase } from '../lib/supabase'

interface AuthContextValue {
	session: Session | null
	user: User | null
	loading: boolean
	signIn: (email: string) => Promise<void>
	signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
	session: null,
	user: null,
	loading: true,
	signIn: async () => {},
	signOut: async () => {}
})

export function AuthProvider({ children }: { children: ReactNode }) {
	const [session, setSession] = useState<Session | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session: s } }) => {
			setSession(s)
			setLoading(false)
		})

		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, s) => {
			setSession(s)
			setLoading(false)
		})

		return () => subscription.unsubscribe()
	}, [])

	const signIn = async (email: string) => {
		const { error } = await supabase.auth.signInWithOtp({ email })
		if (error) throw error
	}

	const signOut = async () => {
		await supabase.auth.signOut()
		setSession(null)
	}

	return (
		<AuthContext
			value={{
				session,
				user: session?.user ?? null,
				loading,
				signIn,
				signOut
			}}
		>
			{children}
		</AuthContext>
	)
}

export function useAuth() {
	return useContext(AuthContext)
}
