'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { scrollMotionTokens, type ScrollExperienceProfile } from './scroll-tokens'

type ScrollFrame = {
  direction: -1 | 0 | 1
  progress: number
  scroll: number
  velocity: number
}

type ScrollSceneContext = {
  gsap: typeof gsap
  lenis: Lenis
  ScrollTrigger: typeof ScrollTrigger
}

type SceneSetup = (context: ScrollSceneContext) => void | (() => void)
type SceneRegistration = {
  cleanup: (() => void) | null
  setup: SceneSetup
}

class ScrollRuntimeController {
  private context: ScrollSceneContext | null = null
  private defaultProfile: ScrollExperienceProfile
  private lockIds = new Set<number>()
  private nextId = 1
  private profileIds = new Map<number, ScrollExperienceProfile>()
  private refreshFrame = 0
  private scenes = new Map<number, SceneRegistration>()
  private scrollListeners = new Set<(frame: ScrollFrame) => void>()

  constructor(defaultProfile: ScrollExperienceProfile) {
    this.defaultProfile = defaultProfile
  }

  activate(context: ScrollSceneContext) {
    this.deactivate()
    this.context = context
    this.scenes.forEach((registration) => this.runScene(registration))
    if (this.lockIds.size > 0) context.lenis.stop()
    this.requestRefresh()
  }

  deactivate() {
    if (this.refreshFrame) {
      window.cancelAnimationFrame(this.refreshFrame)
      this.refreshFrame = 0
    }
    this.scenes.forEach((registration) => {
      registration.cleanup?.()
      registration.cleanup = null
    })
    this.context = null
  }

  registerScene(setup: SceneSetup) {
    const id = this.nextId++
    const registration: SceneRegistration = { cleanup: null, setup }
    this.scenes.set(id, registration)
    if (this.context) this.runScene(registration)

    return () => {
      registration.cleanup?.()
      registration.cleanup = null
      this.scenes.delete(id)
    }
  }

  subscribeScroll(listener: (frame: ScrollFrame) => void) {
    this.scrollListeners.add(listener)
    if (typeof window !== 'undefined') listener(this.nativeFrame())
    return () => this.scrollListeners.delete(listener)
  }

  emitScroll(frame: ScrollFrame) {
    this.scrollListeners.forEach((listener) => listener(frame))
  }

  emitNativeScroll() {
    this.emitScroll(this.nativeFrame())
  }

  acquireLock() {
    const id = this.nextId++
    let released = false
    this.lockIds.add(id)
    this.context?.lenis.stop()

    return () => {
      if (released) return
      released = true
      this.lockIds.delete(id)
      if (this.lockIds.size === 0) this.context?.lenis.start()
    }
  }

  registerProfile(profile: ScrollExperienceProfile) {
    const id = this.nextId++
    this.profileIds.set(id, profile)
    this.syncProfileAttribute()

    return () => {
      this.profileIds.delete(id)
      this.syncProfileAttribute()
    }
  }

  requestRefresh() {
    if (!this.context || this.refreshFrame) return
    this.refreshFrame = window.requestAnimationFrame(() => {
      this.refreshFrame = 0
      this.context?.ScrollTrigger.refresh()
    })
  }

  syncProfileAttribute() {
    if (typeof document === 'undefined') return
    const profiles = Array.from(this.profileIds.values())
    document.documentElement.dataset.scrollProfile = profiles.at(-1) ?? this.defaultProfile
  }

  private nativeFrame(): ScrollFrame {
    const scroll = window.scrollY
    const limit = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    return {
      direction: 0,
      progress: limit > 0 ? scroll / limit : 0,
      scroll,
      velocity: 0,
    }
  }

  private runScene(registration: SceneRegistration) {
    if (!this.context) return
    registration.cleanup?.()
    registration.cleanup = registration.setup(this.context) ?? null
  }
}

type ScrollRuntimeContextValue = {
  reducedMotion: boolean
  runtime: ScrollRuntimeController
}

const ScrollRuntimeContext = createContext<ScrollRuntimeContextValue | null>(null)

type ScrollRuntimeProviderProps = {
  children: ReactNode
  defaultProfile?: ScrollExperienceProfile
}

export function ScrollRuntimeProvider({
  children,
  defaultProfile = 'standard',
}: ScrollRuntimeProviderProps) {
  const runtime = useMemo(() => new ScrollRuntimeController(defaultProfile), [defaultProfile])
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const root = document.documentElement
    let cleanupMode = () => {}

    const applyMode = () => {
      runtime.deactivate()
      cleanupMode()
      setReducedMotion(media.matches)
      runtime.syncProfileAttribute()

      if (media.matches) {
        root.dataset.scrollRuntime = 'native-reduced'
        let frame = 0
        const onNativeScroll = () => {
          if (frame) return
          frame = window.requestAnimationFrame(() => {
            frame = 0
            runtime.emitNativeScroll()
          })
        }
        window.addEventListener('scroll', onNativeScroll, { passive: true })
        runtime.emitNativeScroll()
        cleanupMode = () => {
          if (frame) window.cancelAnimationFrame(frame)
          window.removeEventListener('scroll', onNativeScroll)
        }
        return
      }

      gsap.registerPlugin(ScrollTrigger)
      const lenis = new Lenis({
        lerp: scrollMotionTokens.engine.lerp,
        overscroll: false,
        smoothWheel: true,
        stopInertiaOnNavigate: true,
      })
      const onLenisScroll = (event: Lenis) => {
        ScrollTrigger.update()
        runtime.emitScroll({
          direction: event.direction,
          progress: event.progress,
          scroll: event.scroll,
          velocity: event.velocity,
        })
      }
      const ticker = (time: number) => lenis.raf(time * 1000)

      lenis.on('scroll', onLenisScroll)
      gsap.ticker.add(ticker)
      gsap.ticker.lagSmoothing(0)
      root.dataset.scrollRuntime = 'smooth'
      runtime.activate({ gsap, lenis, ScrollTrigger })
      runtime.emitNativeScroll()

      cleanupMode = () => {
        lenis.off('scroll', onLenisScroll)
        gsap.ticker.remove(ticker)
        gsap.ticker.lagSmoothing(500, 33)
        lenis.destroy()
      }
    }

    applyMode()
    media.addEventListener('change', applyMode)

    return () => {
      media.removeEventListener('change', applyMode)
      runtime.deactivate()
      cleanupMode()
      delete root.dataset.scrollRuntime
      delete root.dataset.scrollProfile
    }
  }, [runtime])

  const value = useMemo(() => ({ reducedMotion, runtime }), [reducedMotion, runtime])

  return <ScrollRuntimeContext.Provider value={value}>{children}</ScrollRuntimeContext.Provider>
}

export function ScrollExperience({
  children,
  profile,
}: {
  children: ReactNode
  profile: ScrollExperienceProfile
}) {
  const { runtime } = useScrollRuntime()

  useEffect(() => runtime.registerProfile(profile), [profile, runtime])

  return children
}

export function useScrollRuntime() {
  const context = useContext(ScrollRuntimeContext)
  if (!context) throw new Error('useScrollRuntime must be used within ScrollRuntimeProvider')
  return context
}
