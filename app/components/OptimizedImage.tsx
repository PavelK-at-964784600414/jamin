import Image from 'next/image'
import { ComponentProps } from 'react'

interface OptimizedImageProps extends Omit<ComponentProps<typeof Image>, 'src'> {
  src: string
  alt: string
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
}

export default function OptimizedImage({
  src,
  alt,
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  className = '',
  ...props
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      priority={priority}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      className={`transition-opacity duration-300 ${className}`}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      {...props}
    />
  )
}
