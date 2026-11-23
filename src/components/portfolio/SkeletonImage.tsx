'use client'

import Image, { type ImageProps } from 'next/image'
import { useState, type Ref } from 'react'

type Props = ImageProps & { ref?: Ref<HTMLImageElement> }

export default function SkeletonImage({ src, alt, onLoad, onError, ...props }: Props) {
  const [result, setResult] = useState<{ source: ImageProps['src']; state: 'loaded' | 'error' } | null>(null)
  const state = result?.source === src ? result.state : 'loading'

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      data-media-state={state}
      onLoad={event => {
        setResult({ source: src, state: 'loaded' })
        onLoad?.(event)
      }}
      onError={event => {
        setResult({ source: src, state: 'error' })
        onError?.(event)
      }}
    />
  )
}
