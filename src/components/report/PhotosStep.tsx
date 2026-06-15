import { useRef, useState } from 'react'

export default function PhotosStep({
  photos,
  onPhotosChange,
}: {
  photos: File[]
  onPhotosChange: (files: File[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [compressing, setCompressing] = useState(false)

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || photos.length >= 5) return

    setCompressing(true)

    try {
      const imageCompression = (await import('browser-image-compression')).default
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      })
      onPhotosChange([...photos, compressed])
    } catch {
      onPhotosChange([...photos, file])
    } finally {
      setCompressing(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  function removePhoto(index: number) {
    onPhotosChange(photos.filter((_, i) => i !== index))
  }

  return (
    <div className="px-4 pt-5 space-y-4">
      <div>
        <p className="text-sm font-medium" style={{ color: '#111111' }}>
          Site photos
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#BBBBBB' }}>
          Add up to 5 photos from site
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <div key={index} className="relative aspect-square">
            <button
              type="button"
              onClick={() => removePhoto(index)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center z-10"
              style={{ backgroundColor: '#00236F' }}
              aria-label="Remove photo"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <img
              src={URL.createObjectURL(photo)}
              alt="Site photo"
              className="w-full h-full object-cover rounded-lg"
            />
            <p className="text-[10px] mt-0.5 text-center" style={{ color: '#BBBBBB' }}>
              {Math.round(photo.size / 1024)} KB
            </p>
          </div>
        ))}

        {photos.length < 5 && (
          <label>
            <div
              className="aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer"
              style={{
                border: '1.5px dashed #EEEEEE',
                backgroundColor: '#F5F6FA',
              }}
            >
              {compressing ? (
                <span className="text-xs" style={{ color: '#BBBBBB' }}>
                  Compressing...
                </span>
              ) : (
                <>
                  <CameraIcon />
                  <span className="text-xs mt-1" style={{ color: '#BBBBBB' }}>
                    Add photo
                  </span>
                </>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleSelect}
              className="hidden"
            />
          </label>
        )}
      </div>

      <p className="text-xs" style={{ color: '#BBBBBB' }}>
        Photos are optional but help your project manager track progress
      </p>
    </div>
  )
}

function CameraIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#BBBBBB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}
