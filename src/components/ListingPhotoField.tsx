import { useEffect, useRef, useState } from 'react'
import { compressListingPhotoFile } from '../lib/listingPhoto'

export type ListingPhotoPayload = { mime: string; data_base64: string }

type Props = {
  disabled?: boolean
  /** Photo déjà enregistrée (ex. data URL) — affichée jusqu’à remplacement ou retrait. */
  existingPhotoUrl?: string | null
  onPhotoChange: (payload: ListingPhotoPayload | null) => void
}

export function ListingPhotoField({
  disabled,
  existingPhotoUrl,
  onPhotoChange,
}: Props) {
  const camRef = useRef<HTMLInputElement>(null)
  const galRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  /** Après choix / retrait utilisateur, on ne resynchronise plus depuis le parent. */
  const photoTouchedRef = useRef(false)

  useEffect(() => {
    if (!photoTouchedRef.current) {
      setPreview(existingPhotoUrl ?? null)
    }
  }, [existingPhotoUrl])

  async function handleFile(file: File | undefined | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErr('Choisissez un fichier image.')
      return
    }
    setErr(null)
    setBusy(true)
    photoTouchedRef.current = true
    try {
      const payload = await compressListingPhotoFile(file)
      onPhotoChange(payload)
      setPreview(`data:${payload.mime};base64,${payload.data_base64}`)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur lors du traitement de la photo.')
    } finally {
      setBusy(false)
    }
  }

  function clearPhoto() {
    photoTouchedRef.current = true
    onPhotoChange(null)
    setPreview(null)
    setErr(null)
    if (camRef.current) camRef.current.value = ''
    if (galRef.current) galRef.current.value = ''
  }

  return (
    <div className="listing-photo-field">
      <span className="small muted">Photo (optionnel)</span>
      <p className="small muted listing-photo-field__hint">
        Sur téléphone : ouvrez l’appareil photo ou la galerie. L’image est
        redimensionnée puis convertie en <strong>WebP</strong> quand le navigateur le permet
        (sinon JPEG), pour limiter le poids du fichier.
      </p>
      <div className="listing-photo-field__actions">
        <button
          type="button"
          className="btn btn-ghost"
          disabled={disabled || busy}
          onClick={() => camRef.current?.click()}
        >
          {busy ? 'Traitement…' : 'Appareil photo'}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={disabled || busy}
          onClick={() => galRef.current?.click()}
        >
          Galerie
        </button>
        {preview ? (
          <button
            type="button"
            className="btn btn-ghost"
            disabled={disabled || busy}
            onClick={clearPhoto}
          >
            Retirer la photo
          </button>
        ) : null}
      </div>

      <input
        ref={camRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="visually-hidden"
        aria-label="Prendre une photo avec l’appareil"
        disabled={disabled || busy}
        onChange={(e) => {
          void handleFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <input
        ref={galRef}
        type="file"
        accept="image/*"
        className="visually-hidden"
        aria-label="Choisir une image dans la galerie"
        disabled={disabled || busy}
        onChange={(e) => {
          void handleFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      {preview ? (
        <img className="listing-photo-field__preview" src={preview} alt="" />
      ) : null}
      {err ? <p className="callout small">{err}</p> : null}
    </div>
  )
}
