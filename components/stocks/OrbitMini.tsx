import SystemProfileBlob, { type SystemProfileBlobDimension } from '@/components/page/SystemProfileBlob'
import { cn } from '@/lib/utils'

type OrbitMiniProps = {
  dimensions: SystemProfileBlobDimension[]
  size?: number
  className?: string
}

export default function OrbitMini({
  dimensions,
  size = 80,
  className,
}: OrbitMiniProps) {
  return (
    <SystemProfileBlob
      dimensions={dimensions}
      mini
      size={size}
      className={cn('shrink-0', className)}
    />
  )
}
