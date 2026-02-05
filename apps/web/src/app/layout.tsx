import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
	title: 'ref.db — design references',
	description:
		'A community platform for collecting and browsing design reference websites.'
}

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en">
			<head>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link
					rel="preconnect"
					href="https://fonts.gstatic.com"
					crossOrigin="anonymous"
				/>
				<link
					href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Outfit:wght@300;400;500;600&display=swap"
					rel="stylesheet"
				/>
			</head>
			<body>{children}</body>
		</html>
	)
}
