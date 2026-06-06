import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ImageIcon, X, Loader2 } from 'lucide-react'
import { compressImage } from '@/lib/image-compress'

interface ImageUploadProps {
  value?: string
  onChange: (base64: string | undefined) => void
  className?: string
  aspectRatio?: 'portrait' | 'square'
  /** Override max width (default: 800 for portrait, 400 for square) */
  maxWidth?: number
  /** Override max height (default: 1200 for portrait, 400 for square) */
  maxHeight?: number
  /** Compression quality 0–1 (default: 0.8) */
  quality?: number
}

const ACCEPT = 'image/*'

export function ImageUpload({
  value,
  onChange,
  className,
  aspectRatio = 'portrait',
  maxWidth,
  maxHeight,
  quality = 0.8,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string>()
  const [compressing, setCompressing] = useState(false)

  const resolvedMaxWidth = maxWidth ?? (aspectRatio === 'portrait' ? 800 : 400)
  const resolvedMaxHeight = maxHeight ?? (aspectRatio === 'portrait' ? 1200 : 400)

  async function handleFile(file: File) {
    setError(undefined)
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }

    setCompressing(true)
    try {
      const base64 = await compressImage(file, {
        maxWidth: resolvedMaxWidth,
        maxHeight: resolvedMaxHeight,
        quality,
      })
      onChange(base64)
    } catch {
      setError('Failed to process image. Please try another file.')
    } finally {
      setCompressing(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div
        className={cn(
          'bg-muted relative flex cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed',
          aspectRatio === 'portrait' ? 'aspect-[2/3]' : 'aspect-square',
          'w-32',
          compressing && 'cursor-wait opacity-60',
        )}
        onClick={() => !compressing && inputRef.current?.click()}
      >
        {compressing ? (
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        ) : value ? (
          <img src={value} alt="Cover" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="text-muted-foreground h-8 w-8" />
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
      </div>
      {value && !compressing && (
        <Button
          variant="ghost"
          size="sm"
          className="w-32 text-xs"
          onClick={() => onChange(undefined)}
        >
          <X className="mr-1 h-3 w-3" />
          Remove
        </Button>
      )}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )
}
