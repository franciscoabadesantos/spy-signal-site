import Script from 'next/script'

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

export default function OptionalSessionReplay() {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() ?? ''
  if (!posthogKey) return null

  const posthogHost = trimTrailingSlash(
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com'
  )
  const scriptSrc = `${posthogHost}/static/array.js`
  const initScript = `
    window.posthog = window.posthog || [];
    if (window.posthog && typeof window.posthog.init === 'function') {
      window.posthog.init(${JSON.stringify(posthogKey)}, {
        api_host: ${JSON.stringify(posthogHost)},
        capture_pageview: false,
        capture_pageleave: true,
        session_recording: {
          maskAllInputs: true
        }
      });
    }
  `

  return (
    <>
      <Script id="posthog-script" src={scriptSrc} strategy="afterInteractive" />
      <Script
        id="posthog-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: initScript }}
      />
    </>
  )
}
