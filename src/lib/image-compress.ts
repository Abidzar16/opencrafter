export interface CompressOptions {
  maxWidth: number
  maxHeight: number
  /** JPEG/WebP quality 0–1 */
  quality: number
}

/**
 * Compress an image File to a base64 data URL using the canvas API.
 * Scales the image down to fit within maxWidth × maxHeight while preserving
 * aspect ratio. Outputs WebP if the browser supports it, otherwise JPEG.
 */
export function compressImage(file: File, options: CompressOptions): Promise<string> {
  const { maxWidth, maxHeight, quality } = options

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img

      // Scale down proportionally
      if (width > maxWidth || height > maxHeight) {
        const scale = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      // Prefer WebP for better compression; fall back to JPEG
      const mimeType = canvas.toDataURL('image/webp').startsWith('data:image/webp')
        ? 'image/webp'
        : 'image/jpeg'

      resolve(canvas.toDataURL(mimeType, quality))
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }

    img.src = objectUrl
  })
}
