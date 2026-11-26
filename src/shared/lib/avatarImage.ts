/**
 * Side of the square photo sent to the server (it accepts up to 768x768): sharp enough for the
 * big card of the impostor's reveal on 3x screens.
 */
export const AVATAR_SIZE = 768
/** The server refuses bigger uploads (500 KiB). */
export const AVATAR_MAX_BYTES = 500 * 1024
/** Error message of prepareAvatar when the file cannot be read as an image. */
export const INVALID_IMAGE_CODE = 'invalid_image'

// Decreasing JPEG qualities: the first one that fits AVATAR_MAX_BYTES wins (a 768px photo is
// usually 80 to 150 KB at the first).
const QUALITIES = [0.82, 0.7, 0.55, 0.4]

async function loadImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    // Modern browsers apply the EXIF orientation, so a portrait photo is not sideways.
    await image.decode()
    return image
  } catch {
    throw new Error(INVALID_IMAGE_CODE)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function toJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error(INVALID_IMAGE_CODE))),
      'image/jpeg',
      quality,
    )
  })
}

/**
 * Turns a picked photo (gallery or camera) into the avatar the server expects: the centered
 * square, scaled down to AVATAR_SIZE, as a JPEG. Drawing it on a canvas also drops the EXIF
 * metadata (such as the GPS position); the server re-encodes it anyway.
 */
export async function prepareAvatar(file: Blob): Promise<Blob> {
  const image = await loadImage(file)
  const side = Math.min(image.naturalWidth, image.naturalHeight)
  if (side === 0) throw new Error(INVALID_IMAGE_CODE)
  const size = Math.min(side, AVATAR_SIZE)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error(INVALID_IMAGE_CODE)
  context.imageSmoothingQuality = 'high'
  context.drawImage(
    image,
    (image.naturalWidth - side) / 2,
    (image.naturalHeight - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size,
  )

  for (const quality of QUALITIES) {
    const blob = await toJpeg(canvas, quality)
    if (blob.size <= AVATAR_MAX_BYTES) return blob
  }
  throw new Error(INVALID_IMAGE_CODE)
}
