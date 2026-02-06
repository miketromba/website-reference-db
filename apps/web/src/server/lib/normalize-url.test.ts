import { describe, expect, test } from 'bun:test'
import { normalizeUrl } from './normalize-url'

describe('normalizeUrl', () => {
	// ── Basic normalization ──────────────────────────────────────────────

	describe('trailing slashes', () => {
		test('removes trailing slash from root URL', () => {
			expect(normalizeUrl('https://example.com/')).toBe(
				'https://example.com'
			)
		})

		test('removes trailing slash from path', () => {
			expect(normalizeUrl('https://example.com/path/')).toBe(
				'https://example.com/path'
			)
		})

		test('removes multiple trailing slashes', () => {
			expect(normalizeUrl('https://example.com/path///')).toBe(
				'https://example.com/path'
			)
		})

		test('preserves URL without trailing slash', () => {
			expect(normalizeUrl('https://example.com')).toBe(
				'https://example.com'
			)
		})

		test('preserves path without trailing slash', () => {
			expect(normalizeUrl('https://example.com/path')).toBe(
				'https://example.com/path'
			)
		})
	})

	// ── Hostname normalization ───────────────────────────────────────────

	describe('hostname', () => {
		test('lowercases hostname', () => {
			expect(normalizeUrl('https://Example.COM')).toBe(
				'https://example.com'
			)
		})

		test('lowercases mixed-case hostname with path', () => {
			expect(normalizeUrl('https://My-Site.Example.COM/Page')).toBe(
				'https://my-site.example.com/Page'
			)
		})

		test('strips www. prefix', () => {
			expect(normalizeUrl('https://www.example.com')).toBe(
				'https://example.com'
			)
		})

		test('strips www. prefix with path', () => {
			expect(normalizeUrl('https://www.example.com/about')).toBe(
				'https://example.com/about'
			)
		})

		test('strips www. prefix case-insensitively', () => {
			expect(normalizeUrl('https://WWW.example.com')).toBe(
				'https://example.com'
			)
		})

		test('does not strip www from subdomain like www2', () => {
			expect(normalizeUrl('https://www2.example.com')).toBe(
				'https://www2.example.com'
			)
		})

		test('does not strip www from middle of hostname', () => {
			expect(normalizeUrl('https://notwww.example.com')).toBe(
				'https://notwww.example.com'
			)
		})
	})

	// ── Protocol ─────────────────────────────────────────────────────────

	describe('protocol', () => {
		test('preserves https', () => {
			expect(normalizeUrl('https://example.com')).toBe(
				'https://example.com'
			)
		})

		test('preserves http', () => {
			expect(normalizeUrl('http://example.com')).toBe(
				'http://example.com'
			)
		})

		test('lowercases protocol', () => {
			expect(normalizeUrl('HTTPS://example.com')).toBe(
				'https://example.com'
			)
		})

		test('rejects ftp protocol', () => {
			expect(() => normalizeUrl('ftp://example.com')).toThrow()
		})

		test('rejects javascript protocol', () => {
			expect(() => normalizeUrl('javascript:alert(1)')).toThrow()
		})

		test('rejects data URIs', () => {
			expect(() => normalizeUrl('data:text/html,<h1>hi</h1>')).toThrow()
		})
	})

	// ── Default ports ────────────────────────────────────────────────────

	describe('default ports', () => {
		test('removes :443 from https URL', () => {
			expect(normalizeUrl('https://example.com:443')).toBe(
				'https://example.com'
			)
		})

		test('removes :443 from https URL with path', () => {
			expect(normalizeUrl('https://example.com:443/path')).toBe(
				'https://example.com/path'
			)
		})

		test('removes :80 from http URL', () => {
			expect(normalizeUrl('http://example.com:80')).toBe(
				'http://example.com'
			)
		})

		test('removes :80 from http URL with path', () => {
			expect(normalizeUrl('http://example.com:80/path')).toBe(
				'http://example.com/path'
			)
		})

		test('preserves non-default port on https', () => {
			expect(normalizeUrl('https://example.com:8443')).toBe(
				'https://example.com:8443'
			)
		})

		test('preserves non-default port on http', () => {
			expect(normalizeUrl('http://example.com:8080')).toBe(
				'http://example.com:8080'
			)
		})

		test('does not remove :80 from https (not default for https)', () => {
			expect(normalizeUrl('https://example.com:80')).toBe(
				'https://example.com:80'
			)
		})

		test('does not remove :443 from http (not default for http)', () => {
			expect(normalizeUrl('http://example.com:443')).toBe(
				'http://example.com:443'
			)
		})
	})

	// ── Fragments ────────────────────────────────────────────────────────

	describe('fragments', () => {
		test('removes fragment from root URL', () => {
			expect(normalizeUrl('https://example.com/#section')).toBe(
				'https://example.com'
			)
		})

		test('removes fragment from path URL', () => {
			expect(normalizeUrl('https://example.com/page#section')).toBe(
				'https://example.com/page'
			)
		})

		test('removes empty fragment', () => {
			expect(normalizeUrl('https://example.com/#')).toBe(
				'https://example.com'
			)
		})
	})

	// ── Query parameters ─────────────────────────────────────────────────

	describe('query parameters', () => {
		test('preserves meaningful query parameters', () => {
			expect(normalizeUrl('https://example.com/search?q=hello')).toBe(
				'https://example.com/search?q=hello'
			)
		})

		test('sorts query parameters alphabetically', () => {
			expect(
				normalizeUrl('https://example.com/search?z=last&a=first&m=mid')
			).toBe('https://example.com/search?a=first&m=mid&z=last')
		})

		test('removes utm_source', () => {
			expect(
				normalizeUrl('https://example.com?q=hi&utm_source=twitter')
			).toBe('https://example.com?q=hi')
		})

		test('removes utm_medium', () => {
			expect(normalizeUrl('https://example.com?utm_medium=social')).toBe(
				'https://example.com'
			)
		})

		test('removes utm_campaign', () => {
			expect(
				normalizeUrl('https://example.com?utm_campaign=spring')
			).toBe('https://example.com')
		})

		test('removes utm_term', () => {
			expect(normalizeUrl('https://example.com?utm_term=keyword')).toBe(
				'https://example.com'
			)
		})

		test('removes utm_content', () => {
			expect(normalizeUrl('https://example.com?utm_content=banner')).toBe(
				'https://example.com'
			)
		})

		test('removes fbclid', () => {
			expect(normalizeUrl('https://example.com?fbclid=abc123')).toBe(
				'https://example.com'
			)
		})

		test('removes gclid', () => {
			expect(normalizeUrl('https://example.com?gclid=abc123')).toBe(
				'https://example.com'
			)
		})

		test('removes ref', () => {
			expect(normalizeUrl('https://example.com?ref=homepage')).toBe(
				'https://example.com'
			)
		})

		test('removes all tracking params while preserving others', () => {
			expect(
				normalizeUrl(
					'https://example.com/page?utm_source=x&real=yes&fbclid=abc&q=test'
				)
			).toBe('https://example.com/page?q=test&real=yes')
		})
	})

	// ── Whitespace ───────────────────────────────────────────────────────

	describe('whitespace', () => {
		test('trims leading whitespace', () => {
			expect(normalizeUrl('  https://example.com')).toBe(
				'https://example.com'
			)
		})

		test('trims trailing whitespace', () => {
			expect(normalizeUrl('https://example.com  ')).toBe(
				'https://example.com'
			)
		})

		test('trims leading and trailing whitespace', () => {
			expect(normalizeUrl('  https://example.com  ')).toBe(
				'https://example.com'
			)
		})

		test('trims tabs and newlines', () => {
			expect(normalizeUrl('\n\thttps://example.com\n\t')).toBe(
				'https://example.com'
			)
		})
	})

	// ── Path normalization ───────────────────────────────────────────────

	describe('path normalization', () => {
		test('collapses multiple slashes in path', () => {
			expect(normalizeUrl('https://example.com/a//b///c')).toBe(
				'https://example.com/a/b/c'
			)
		})

		test('preserves case in path', () => {
			expect(normalizeUrl('https://example.com/CamelCase/Path')).toBe(
				'https://example.com/CamelCase/Path'
			)
		})

		test('handles deep paths', () => {
			expect(normalizeUrl('https://example.com/a/b/c/d/e')).toBe(
				'https://example.com/a/b/c/d/e'
			)
		})
	})

	// ── Invalid inputs ───────────────────────────────────────────────────

	describe('invalid inputs', () => {
		test('throws on empty string', () => {
			expect(() => normalizeUrl('')).toThrow()
		})

		test('throws on garbage string', () => {
			expect(() => normalizeUrl('not-a-url')).toThrow()
		})

		test('throws on relative URL', () => {
			expect(() => normalizeUrl('/path/to/page')).toThrow()
		})

		test('throws on URL without protocol', () => {
			expect(() => normalizeUrl('example.com')).toThrow()
		})
	})

	// ── Combined edge cases ──────────────────────────────────────────────

	describe('combined normalizations', () => {
		test('normalizes all aspects at once', () => {
			expect(
				normalizeUrl('  HTTPS://WWW.Example.COM:443/Path/#section  ')
			).toBe('https://example.com/Path')
		})

		test('handles URL with everything: port, www, trailing slash, fragment, tracking', () => {
			expect(
				normalizeUrl(
					'https://www.example.com:443/page/?utm_source=google&q=test#top'
				)
			).toBe('https://example.com/page?q=test')
		})

		test('normalizes real-world URLs consistently', () => {
			const variants = [
				'https://bun.com',
				'https://bun.com/',
				'https://www.bun.com',
				'https://www.bun.com/',
				'https://BUN.COM/',
				'https://bun.com/#',
				'  https://bun.com  ',
				'https://bun.com?utm_source=twitter'
			]
			const expected = 'https://bun.com'
			for (const variant of variants) {
				expect(normalizeUrl(variant)).toBe(expected)
			}
		})

		test('treats URLs with different paths as different', () => {
			const a = normalizeUrl('https://example.com')
			const b = normalizeUrl('https://example.com/about')
			expect(a).not.toBe(b)
		})

		test('treats http and https as different', () => {
			const a = normalizeUrl('http://example.com')
			const b = normalizeUrl('https://example.com')
			expect(a).not.toBe(b)
		})

		test('treats different subdomains as different', () => {
			const a = normalizeUrl('https://blog.example.com')
			const b = normalizeUrl('https://docs.example.com')
			expect(a).not.toBe(b)
		})
	})
})
