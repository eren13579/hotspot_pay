import { Info } from 'lucide-react'
import SectionCard from './SectionCard'
import SettingsUploader from './SettingsUploader'
import SettingsField from './SettingsField'

/** Props : items, values, onChange(key, value), saving */
export default function AboutSection({ items, values, onChange, saving }) {
  if (!items?.length) return null

  const photoUrls = values['about.photoUrls']
  let photos = []
  try {
    photos = photoUrls ? JSON.parse(photoUrls) : []
  } catch { photos = [] }

  return (
    <SectionCard icon={Info} title="À propos" description="Contenu de la section À propos publique">
      {items
        .filter((i) => i.key !== 'about.photoUrls')
        .map((item) => (
          <SettingsField
            key={item.key}
            config={{ ...item, value: values[item.key] ?? item.value }}
            onChange={onChange}
            saving={saving}
          />
        ))}

      {/* Photos À propos */}
      <div>
        <label className="block text-xs font-medium mb-1 text-slate-400">Photos À propos</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[0, 1, 2].map((idx) => (
            <SettingsUploader
              key={idx}
              section="about"
              currentUrl={photos[idx] || ''}
              onUploaded={(url) => {
                const newPhotos = [...photos]
                newPhotos[idx] = url
                onChange('about.photoUrls', JSON.stringify(newPhotos))
              }}
              label={`Photo ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </SectionCard>
  )
}
