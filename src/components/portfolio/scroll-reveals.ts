// Templates opt in a block or its immediate children. Unobserved content
// stays visible, including the server-rendered page before hydration.
const targets = '[data-reveal], [data-reveal-children] > :not(script, template, style)'

export function observeScrollReveals(main: HTMLElement, seen: WeakSet<Element>) {
  if (!window.IntersectionObserver || !Element.prototype.animate) return

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const print = window.matchMedia('print')
  const active = new Map<Element, Animation>()
  const footer = document.querySelector('footer.site-footer')

  function showImmediately(target: EventTarget | null) {
    if (!(target instanceof Element)) return
    for (let el: Element | null = target; el; el = el.parentElement) {
      if (el.matches(targets)) {
        seen.add(el)
        observer.unobserve(el)
        active.get(el)?.cancel()
      }
    }
  }

  function showAnchor() {
    const anchor = document.querySelector(':target')
    if (!anchor || anchor === main) return
    showImmediately(anchor)
    anchor.querySelectorAll(targets).forEach(showImmediately)
  }

  function stopAnimations() {
    active.forEach(animation => animation.cancel())
    active.clear()
  }

  const observer = new IntersectionObserver(entries => {
    if (motion.matches || print.matches) return
    const anchor = document.querySelector(':target')
    const siblings = new Map<Element | null, number>()
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      const el = entry.target
      observer.unobserve(el)
      if (seen.has(el) || !el.isConnected) continue
      seen.add(el)
      if (el.matches(':focus-within')) continue
      if (anchor && anchor !== main && (el.contains(anchor) || anchor.contains(el))) continue

      const group = el.parentElement
      const index = siblings.get(group) ?? 0
      siblings.set(group, index + 1)
      const animation = el.animate(
        [{ opacity: 0.24, translate: '0 14px' }, { opacity: 1, translate: '0 0' }],
        {
          id: 'portfolio-scroll-reveal',
          duration: 440,
          delay: Math.min(index, 3) * 65,
          easing: 'cubic-bezier(.2,.7,.25,1)',
          fill: 'backwards',
        },
      )
      active.set(el, animation)
      animation.onfinish = animation.oncancel = () => active.delete(el)
    }
  })

  function register(root: Element) {
    const observe = (el: Element) => {
      if (!seen.has(el)) observer.observe(el)
    }
    if (root.matches(targets)) observe(root)
    root.querySelectorAll(targets).forEach(observe)
  }

  // Suspense can deliver a section after its route has mounted.
  const additions = new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof HTMLElement) register(node)
      }
    }
  })

  function syncMotion() {
    observer.disconnect()
    additions.disconnect()
    stopAnimations()
    if (motion.matches) return
    for (const root of [main, footer]) {
      if (!root) continue
      register(root)
      additions.observe(root, { childList: true, subtree: true })
    }
    showAnchor()
  }

  const onFocus = (event: FocusEvent) => showImmediately(event.target)
  syncMotion()
  motion.addEventListener('change', syncMotion)
  document.addEventListener('focusin', onFocus)
  window.addEventListener('hashchange', showAnchor)
  window.addEventListener('beforeprint', stopAnimations)
  return () => {
    observer.disconnect()
    additions.disconnect()
    stopAnimations()
    motion.removeEventListener('change', syncMotion)
    document.removeEventListener('focusin', onFocus)
    window.removeEventListener('hashchange', showAnchor)
    window.removeEventListener('beforeprint', stopAnimations)
  }
}
