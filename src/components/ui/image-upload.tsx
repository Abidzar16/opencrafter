import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ImageIcon, X } from 'lucide-react'

interface ImageUploadProps {
  value?: string
  onChange: (base64: string | undefined) => void
  className?: string
  aspectRatio?: 'portrait' | 'square'
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024

export function ImageUpload({
  value,
  onChange,
  className,
  aspectRatio = 'portrait',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string>()

  function handleFile(file: File) {
    setError(undefined)
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('Image must be under 5 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = e => onChange(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div
        className={cn(
          'bg-muted relative flex cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed',
          aspectRatio === 'portrait' ? 'aspect-[2/3]' : 'aspect-square',
          'w-32',
        )}
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <img src={value} alt="Cover" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="text-muted-foreground h-8 w-8" />
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
      </div>
      {value && (
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
