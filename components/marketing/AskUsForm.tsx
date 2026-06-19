'use client'

import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { CONTACT_EMAIL } from '@/components/marketing/site-config'

const inputClass =
  'w-full rounded-2xl border border-slate-950/10 bg-white/55 px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#0757ff]/45 focus:bg-white/80 focus:ring-2 focus:ring-[#0757ff]/15 dark:border-white/12 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/35 dark:focus:bg-white/[0.07]'

export default function AskUsForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!message.trim()) return

    const subject = 'A question for the lounge'
    const body = `${message.trim()}\n\n— sent from the FAQ page${email.trim() ? `\nReply to: ${email.trim()}` : ''}`
    const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

    window.location.href = href
    setSent(true)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Your email (so we can reply)"
        autoComplete="email"
        className={inputClass}
      />
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Ask us anything — about the signal, the system, or the week ahead."
        rows={4}
        required
        className={`${inputClass} resize-none`}
      />
      <button
        type="submit"
        className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0757ff] px-6 font-semibold text-white shadow-[0_0_36px_rgba(7,87,255,0.26)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#1a66ff] active:translate-y-0 active:scale-[0.99]"
      >
        {sent ? 'Opening your mail app…' : 'Send it our way'}
        <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </button>
      <p className="text-center text-xs text-slate-500 dark:text-white/45">
        A human reads every message. We usually reply within a day.
      </p>
    </form>
  )
}
