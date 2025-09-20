import { animate, useMotionValue, useTransform } from 'motion/react'
import { useEffect } from 'react'

type UseNumericProps = {
  value: number
  options?: Partial<{
    duration?: number
    initialCount?: number
  }>
}

export const useNumeric = ({ value, options }: UseNumericProps) => {
  const count = useMotionValue(options?.initialCount || 0)
  const rounded = useTransform(() => Math.round(count.get()))

  useEffect(() => {
    const controls = animate(count, value, { duration: options?.duration || 5 })
    return () => controls.stop()
  }, [])

  return rounded
}
