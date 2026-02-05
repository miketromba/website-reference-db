import { API_URL } from './config'

export interface Website {
	id: string
	url: string
	title: string | null
	user_id: string
	screenshot_captured_at: string | null
	created_at: string
	upvote_count: number
}

function authHeaders(token?: string): HeadersInit {
	const h: Record<string, string> = {
		'Content-Type': 'application/json'
	}
	if (token) {
		h.Authorization = `Bearer ${token}`
	}
	return h
}

export async function getWebsites(userId?: string): Promise<Website[]> {
	const params = userId ? `?user_id=${encodeURIComponent(userId)}` : ''
	const res = await fetch(`${API_URL}/websites${params}`)
	if (!res.ok) {
		throw new Error('Failed to fetch websites')
	}
	return res.json()
}

export async function addWebsite(
	url: string,
	token: string,
	title?: string
): Promise<Website> {
	const res = await fetch(`${API_URL}/websites`, {
		method: 'POST',
		headers: authHeaders(token),
		body: JSON.stringify({ url, title })
	})
	const data = await res.json()
	if (!res.ok) {
		throw new Error(data.error || 'Failed to add website')
	}
	return data
}

export async function deleteWebsite(id: string, token: string): Promise<void> {
	const res = await fetch(`${API_URL}/websites/${id}`, {
		method: 'DELETE',
		headers: authHeaders(token)
	})
	if (!res.ok) {
		const data = await res.json()
		throw new Error(data.error || 'Failed to delete website')
	}
}

export async function toggleUpvote(
	id: string,
	token: string
): Promise<{ upvoted: boolean; upvote_count: number }> {
	const res = await fetch(`${API_URL}/websites/${id}/upvote`, {
		method: 'POST',
		headers: authHeaders(token)
	})
	const data = await res.json()
	if (!res.ok) {
		throw new Error(data.error || 'Failed to toggle upvote')
	}
	return data
}

export function screenshotUrl(websiteId: string): string {
	return `${API_URL}/screenshots/${websiteId}`
}
