/** Cible alignée avec LISTING_PHOTO_MAX_BYTES côté Worker (décodée). */
const MAX_BYTES = 420_000
const MAX_EDGE = 1400

let cachedWebpExport: boolean | null = null

async function browserExportsWebp(): Promise<boolean> {
  if (cachedWebpExport !== null) return cachedWebpExport
  const result = await new Promise<boolean>((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = 16
    canvas.height = 16
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      resolve(false)
      return
    }
    ctx.fillStyle = '#010203'
    ctx.fillRect(0, 0, 16, 16)
    canvas.toBlob(
      (b) => resolve(b !== null && b.type === 'image/webp'),
      'image/webp',
      0.92,
    )
  })
  cachedWebpExport = result
  return result
}

async function encodeAtSize(
  bmp: ImageBitmap,
  w: number,
  h: number,
  mime: 'image/webp' | 'image/jpeg',
  startQ: number,
): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(bmp, 0, 0, w, h)

  let quality = startQ
  const step = mime === 'image/webp' ? 0.07 : 0.06
  const floor = mime === 'image/webp' ? 0.28 : 0.34

  for (let attempt = 0; attempt < 14; attempt++) {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), mime, quality)
    })
    if (
      blob &&
      blob.size <= MAX_BYTES &&
      (mime !== 'image/webp' || blob.type === 'image/webp')
    ) {
      return blob
    }
    quality -= step
    if (quality < floor) break
  }
  return null
}

async function compressToBlob(bmp: ImageBitmap): Promise<{ blob: Blob; mime: string }> {
  const ratio = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height))
  const w = Math.max(1, Math.round(bmp.width * ratio))
  const h = Math.max(1, Math.round(bmp.height * ratio))

  const useWebp = await browserExportsWebp()
  const primaryMime = useWebp ? 'image/webp' : 'image/jpeg'
  const primaryStart = useWebp ? 0.82 : 0.88
  const fallbackStart = 0.82

  async function tryPipeline(mime: 'image/webp' | 'image/jpeg', startQ: number) {
    let cw = w
    let ch = h
    let blob = await encodeAtSize(bmp, cw, ch, mime, startQ)
    for (let shrink = 0; shrink < 5 && (!blob || blob.size > MAX_BYTES); shrink++) {
      cw = Math.max(320, Math.round(cw * 0.84))
      ch = Math.max(320, Math.round(ch * 0.84))
      blob = await encodeAtSize(bmp, cw, ch, mime, mime === 'image/webp' ? 0.78 : startQ)
    }
    return blob
  }

  let blob = await tryPipeline(primaryMime, primaryStart)

  if ((!blob || blob.size > MAX_BYTES) && primaryMime === 'image/webp') {
    blob = await tryPipeline('image/jpeg', fallbackStart)
    if (blob && blob.size <= MAX_BYTES) {
      return { blob, mime: 'image/jpeg' }
    }
  }

  if (!blob || blob.size > MAX_BYTES) {
    throw new Error('Image trop lourde ; essayez une photo plus petite.')
  }

  return { blob, mime: blob.type === 'image/webp' ? 'image/webp' : primaryMime }
}

export async function compressListingPhotoFile(
  file: File,
): Promise<{ mime: string; data_base64: string }> {
  let bmp: ImageBitmap
  try {
    bmp = await createImageBitmap(file)
  } catch {
    throw new Error(
      'Impossible de lire cette image (essayez JPG ou PNG depuis la galerie).',
    )
  }

  try {
    const { blob, mime } = await compressToBlob(bmp)
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader()
      fr.onload = () => resolve(fr.result as string)
      fr.onerror = () => reject(new Error('Lecture impossible.'))
      fr.readAsDataURL(blob)
    })
    const data_base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
    return { mime, data_base64 }
  } finally {
    bmp.close()
  }
}
