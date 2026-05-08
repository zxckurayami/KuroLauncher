import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ChangeEvent, MouseEvent as ReactMouseEvent } from 'react'
const logoIcon = new URL('../logo/KuroLauncher.png', import.meta.url).href
const heroReleaseArtwork = new URL('./assets/hero-release.png', import.meta.url).href
const heroWorkshopArtwork = new URL('./assets/hero-workshop.png', import.meta.url).href
const heroProfilesArtwork = new URL('./assets/hero-profiles.png', import.meta.url).href
const heroBoostArtwork = new URL('./assets/hero-boost.png', import.meta.url).href
const newsUpdateArtwork = new URL('./assets/news-update.png', import.meta.url).href
const newsReleaseArtwork = new URL('./assets/news-release.png', import.meta.url).href
const newsBoostArtwork = new URL('./assets/news-boost.png', import.meta.url).href
const APP_VERSION = '0.2.0'

type VersionItem = {
  id: string
  type: string
  releaseTime: string
}

type InstalledVersion = {
  id: string
  status: string
  path: string
}

type Profile = {
  id: string
  name: string
  versionId: string
  ram: string
  javaPath: string
  username?: string
  loader: 'vanilla' | 'forge' | 'fabric' | 'quilt' | 'neoforge'
  loaderVersion?: string
  fullscreenMode?: 'global' | 'on' | 'off'
  modpackPath?: string
  skin?: {
    url?: string
    model?: 'classic' | 'slim'
  }
}

type Settings = {
  theme: 'dark' | 'light'
  javaPath: string
  ram: string
  accent?: 'red' | 'violet' | 'white'
  fullscreen: boolean
  kuroBoost?: boolean
  kuroBoostPreset?: 'ai'
  profileName?: string
  profileStatus?: string
  avatarDataUrl?: string
}

type AuthState = {
  email: string
  loggedIn: boolean
  name?: string
}

type IconName =
  | 'home'
  | 'versions'
  | 'profiles'
  | 'settings'
  | 'mods'
  | 'skins'
  | 'play'
  | 'download'
  | 'spark'
  | 'folder'
  | 'shirt'
  | 'search'
  | 'user'
  | 'friends'
  | 'shield'
  | 'refresh'
  | 'chevron'
  | 'globe'
  | 'discord'
  | 'telegram'

const tabs = [
  { id: 'Dashboard', label: 'Главная', icon: 'home' },
  { id: 'Versions', label: 'Версии', icon: 'versions' },
  { id: 'Profiles', label: 'Профили', icon: 'profiles' },
  { id: 'Mods', label: 'Моды', icon: 'mods' },
  { id: 'Skins', label: 'Скины', icon: 'skins' },
  { id: 'Settings', label: 'Настройки', icon: 'settings' }
] as const

const defaultSteveSkinUrl = new URL('../skins/default-skin.png', import.meta.url).href

const socialLinks: Array<{ id: string; title: string; url: string; icon: IconName }> = [
  { id: 'discord', title: 'Discord', url: 'https://discord.gg/4WmemBZzut', icon: 'discord' },
  { id: 'telegram', title: 'Telegram', url: 'https://t.me/+kYL4EsOD7c1jYjUy', icon: 'telegram' },
  { id: 'telegram-updates', title: 'Telegram: обновления', url: 'https://t.me/+8zlPNjNz6QNjMTdi', icon: 'download' }
]

type Tab = typeof tabs[number]['id']

function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
    className
  }

  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 11.4 12 4l9 7.4V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      )
    case 'versions':
      return (
        <svg {...common}>
          <path d="M12 3 4 7l8 4 8-4-8-4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M4 12l8 4 8-4M4 17l8 4 8-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'profiles':
      return (
        <svg {...common}>
          <path d="M16 20c0-2.2-1.8-4-4-4H8c-2.2 0-4 1.8-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 19c0-1.9-1.1-3.5-2.8-4.2M16.4 4.4a3.5 3.5 0 0 1 0 6.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...common}>
          <path d="M9.7 4.1a2.35 2.35 0 0 1 4.6 0 2.35 2.35 0 0 0 3.3 1.9 2.35 2.35 0 0 1 2.3 4 2.35 2.35 0 0 0 0 3.9 2.35 2.35 0 0 1-2.3 4 2.35 2.35 0 0 0-3.3 1.9 2.35 2.35 0 0 1-4.6 0 2.35 2.35 0 0 0-3.3-1.9 2.35 2.35 0 0 1-2.3-4 2.35 2.35 0 0 0 0-3.9 2.35 2.35 0 0 1 2.3-4 2.35 2.35 0 0 0 3.3-1.9Z" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.65" />
        </svg>
      )
    case 'mods':
      return (
        <svg {...common}>
          <path d="M8.5 3.5 6 6l2 2-2 2-2-2-2.5 2.5L5 14l-2 2 5 5 2-2 3.5 3.5L16 20l-2-2 2-2 2 2 2.5-2.5L17 12l2-2-5-5-2 2-3.5-3.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      )
    case 'skins':
      return (
        <svg {...common}>
          <path d="M8 5 5 7l2 4 2-1v9h6v-9l2 1 2-4-3-2-2 2h-4L8 5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      )
    case 'play':
      return (
        <svg {...common}>
          <path d="M8 5.5v13l10-6.5-10-6.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      )
    case 'download':
      return (
        <svg {...common}>
          <path d="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'discord':
      return (
        <svg {...common}>
          <path d="M7.4 7.7c3-1.3 6.2-1.3 9.2 0l.6.3 1.5 6.1c.1.5-.1 1-.5 1.3-1 .8-2.2 1.4-3.5 1.8l-.9-1.3c-1.2.2-2.4.2-3.6 0l-.9 1.3c-1.3-.4-2.5-1-3.5-1.8-.4-.3-.6-.8-.5-1.3L6.8 8l.6-.3Z" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round" />
          <path d="M9.1 12.7c.55 0 1-.5 1-1.1s-.45-1.1-1-1.1-1 .5-1 1.1.45 1.1 1 1.1ZM14.9 12.7c.55 0 1-.5 1-1.1s-.45-1.1-1-1.1-1 .5-1 1.1.45 1.1 1 1.1Z" fill="currentColor" />
          <path d="M9.4 8.2 8.8 6.7M14.6 8.2l.6-1.5" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
        </svg>
      )
    case 'telegram':
      return (
        <svg {...common}>
          <path d="M20.4 4.7 4 11.1c-.9.35-.85 1.65.08 1.92l4.22 1.22 1.6 4.78c.32.94 1.55 1.1 2.1.27l2.28-3.42 4.15 3.03c.75.55 1.83.14 2.01-.77l2.08-12.02c.17-.98-.92-1.75-1.84-1.4Z" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round" />
          <path d="m8.4 14.2 11.5-8.5-8.9 11.2" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'spark':
      return (
        <svg {...common}>
          <path d="M13 3 9.8 10.2 3 13l6.8 2.8L13 23l3.2-7.2L23 13l-6.8-2.8L13 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      )
    case 'folder':
      return (
        <svg {...common}>
          <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h5l2 2h8A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-10Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      )
    case 'shirt':
      return (
        <svg {...common}>
          <path d="M8 5 5 7l2 4 2-1v9h6v-9l2 1 2-4-3-2-2 2h-4L8 5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      )
    case 'search':
      return (
        <svg {...common}>
          <path d="M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14ZM16.5 16.5 21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'user':
      return (
        <svg {...common}>
          <path d="M20 20c0-3.3-2.7-6-6-6h-4c-3.3 0-6 2.7-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      )
    case 'friends':
      return (
        <svg {...common}>
          <path d="M8 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2.5 20c.6-2.9 2.8-5 5.5-5 1.4 0 2.6.5 3.6 1.4M17 11a3 3 0 1 0 0-6M14.8 14.5c2.5.2 4.6 2.1 5.2 4.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      )
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 3 5 6v5.2c0 4.4 2.8 8.4 7 9.8 4.2-1.4 7-5.4 7-9.8V6l-7-3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="m8.8 12 2.1 2.1 4.4-4.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'refresh':
      return (
        <svg {...common}>
          <path d="M20 7v5h-5M4 17v-5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18.4 9A7 7 0 0 0 6 7.8M5.6 15A7 7 0 0 0 18 16.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'chevron':
      return (
        <svg {...common}>
          <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'globe':
      return (
        <svg {...common}>
          <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M3.6 9h16.8M3.6 15h16.8M12 3c2.1 2.5 3.1 5.5 3.1 9s-1 6.5-3.1 9c-2.1-2.5-3.1-5.5-3.1-9S9.9 5.5 12 3Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      )
    default:
      return null
  }
}

function createProfileDraft(settings: Settings, initialProfile?: Partial<Profile>) {
  return {
    name: initialProfile?.name || '',
    versionId: initialProfile?.versionId || '',
    ram: initialProfile?.ram || 'global',
    javaPath: initialProfile?.javaPath || settings.javaPath,
    loader: (initialProfile?.loader || 'vanilla') as Profile['loader'],
    loaderVersion: initialProfile?.loaderVersion || '',
    fullscreenMode: (initialProfile?.fullscreenMode || 'global') as NonNullable<Profile['fullscreenMode']>
  }
}

function formatProfileFullscreen(mode?: Profile['fullscreenMode']) {
  if (mode === 'on') return 'Фуллскрин'
  if (mode === 'off') return 'Окно'
  return 'Экран: по лаунчеру'
}

function formatRamLabel(value: string | undefined) {
  if (!value || value === 'global') return 'по лаунчеру'
  if (value === 'auto') return 'авто'
  return value
}

function formatProfileRam(profile: Profile, settings: Settings) {
  if (!profile.ram || profile.ram === 'global') {
    return `RAM: по лаунчеру (${formatRamLabel(settings.ram)})`
  }
  return `RAM: ${formatRamLabel(profile.ram)}`
}

const addonCategoryLabels: Record<string, string> = {
  mods: 'Моды',
  resourcepacks: 'Ресурспаки',
  shaderpacks: 'Шейдеры'
}

function createAddonBuckets() {
  return {
    mods: [] as any[],
    resourcepacks: [] as any[],
    shaderpacks: [] as any[]
  }
}

function getDefaultAddonCategory(categories: ReturnType<typeof createAddonBuckets>) {
  if (categories.mods.length > 0) return 'mods'
  if (categories.resourcepacks.length > 0) return 'resourcepacks'
  if (categories.shaderpacks.length > 0) return 'shaderpacks'
  return 'mods'
}

function getProfileModpackKey(profile?: Profile | null) {
  if (!profile?.modpackPath) return profile?.id || ''
  const parts = profile.modpackPath.split(/[\\/]/).filter(Boolean)
  return parts[parts.length - 1] || profile.id
}

function formatLoaderName(loader?: string, loaderVersion?: string) {
  const labels: Record<string, string> = {
    vanilla: 'Vanilla',
    forge: 'Forge',
    fabric: 'Fabric',
    quilt: 'Quilt',
    neoforge: 'NeoForge'
  }
  const label = labels[loader || 'vanilla'] || loader || 'Vanilla'
  return loaderVersion ? `${label} ${loaderVersion}` : label
}

function formatAddonType(type?: string) {
  return addonCategoryLabels[type || ''] || type || 'Дополнение'
}

function normalizeAccent(accent?: string): NonNullable<Settings['accent']> {
  if (accent === 'violet' || accent === 'white') return accent
  return 'red'
}

function normalizeProfileText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.slice(0, maxLength) : ''
}

function normalizeAvatarDataUrl(value: unknown) {
  return typeof value === 'string' && value.startsWith('data:image/') ? value : ''
}

function formatRamStat(value?: string) {
  if (!value || value === 'auto') return 'Авто'
  const match = value.match(/^(\d+)G$/i)
  return match ? `${match[1]} GB` : value
}

function getRamStatWidth(value?: string) {
  if (!value || value === 'auto') return '42%'
  const match = value.match(/^(\d+)G$/i)
  if (!match) return '42%'
  return `${Math.min(100, Math.max(18, Math.round(Number(match[1]) / 16 * 100)))}%`
}

function formatCompactDate(value?: string) {
  if (!value) return 'Актуальный релиз'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Актуальный релиз'

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short'
  }).format(date)
}

function openExternalLink(event: ReactMouseEvent<HTMLAnchorElement>, targetUrl: string) {
  event.preventDefault()

  const openExternal = (window as any).launcher?.openExternal
  if (typeof openExternal === 'function') {
    void openExternal(targetUrl)
    return
  }

  window.open(targetUrl, '_blank', 'noopener,noreferrer')
}

// Custom select component to replace native <select> for better styling
function CustomSelect({ options, value, onChange, placeholder, disabled = false }: any) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const selected = options.find((o: any) => o.value === value)

  return (
    <div className="custom-select" ref={ref}>
      <button
        type="button"
        className={`custom-select-trigger ${!value ? 'placeholder' : ''} ${open ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setOpen((s) => !s)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <span className="trigger-label">{selected ? selected.label : placeholder}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="custom-options" role="listbox">
          {options.map((opt: any) => (
            <div
              key={opt.value}
              role="option"
              tabIndex={0}
              className={`custom-option ${opt.value === value ? 'selected' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault()
                onChange(opt.value)
                setOpen(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onChange(opt.value)
                  setOpen(false)
                }
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Profile Form Component
function ProfileForm({ onSave, settings, installed, availableLoaderVersions, loaderVersionLoading, ramOptions, resetTrigger, onLoaderVersionChange, showAlert, initialProfile, mode = 'create', submitLabel, onCancel }: {
  onSave: (profile: any) => void,
  settings: Settings,
  installed: InstalledVersion[],
  availableLoaderVersions: any[],
  loaderVersionLoading: boolean,
  ramOptions: any[],
  resetTrigger: number,
  onLoaderVersionChange: (versionId: string, loader: string) => void,
  showAlert: (message: string) => void,
  initialProfile?: Partial<Profile> | null,
  mode?: 'create' | 'edit',
  submitLabel?: string,
  onCancel?: () => void
}) {
  const [formData, setFormData] = useState(() => createProfileDraft(settings, initialProfile || undefined))
  const isEditMode = mode === 'edit'

  useEffect(() => {
    setFormData(createProfileDraft(settings, initialProfile || undefined))
  }, [resetTrigger, initialProfile?.id, mode, settings.javaPath])

  const handleSubmit = () => {
    if (!formData.name || !formData.versionId) {
      showAlert('Введите имя и выберите версию профиля')
      return
    }
    onSave(formData)
  }

  const updateFormData = (updates: Partial<typeof formData>) => {
    const newData = { ...formData, ...updates }
    setFormData(newData)

    if (isEditMode) return
    if (updates.versionId || updates.loader) {
      if (newData.versionId && newData.loader !== 'vanilla') {
        onLoaderVersionChange(newData.versionId, newData.loader)
      }
    }
  }

  return (
    <div className="form-grid">
      {isEditMode && (
        <div className="profile-form-intro">
          <div className="profile-form-eyebrow">Профиль</div>
          <div className="profile-form-title">Тонкая настройка запуска</div>
          <div className="profile-form-text">
            Для модпаков можно поднять память, указать отдельную Java и переопределить режим экрана без изменения глобальных настроек лаунчера.
          </div>
        </div>
      )}
      <div className="form-group">
        <label className="form-label">Имя профиля</label>
        <input
          className="form-input"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          placeholder="Введите имя профиля"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Версия</label>
        <CustomSelect
          options={[{ value: '', label: 'Выберите версию' }, ...installed.map((it) => ({ value: it.id, label: it.id }))]}
          value={formData.versionId}
          onChange={(val: string) => updateFormData({ versionId: val })}
          placeholder="Выберите версию"
          disabled={isEditMode}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Загрузчик</label>
        <CustomSelect
          options={[
            { value: 'vanilla', label: 'Vanilla' },
            { value: 'forge', label: 'Forge' },
            { value: 'fabric', label: 'Fabric' },
            { value: 'quilt', label: 'Quilt' },
            { value: 'neoforge', label: 'NeoForge' }
          ]}
          value={formData.loader}
          onChange={(val: string) => updateFormData({ loader: val as typeof formData.loader, loaderVersion: '' })}
          placeholder="Загрузчик"
          disabled={isEditMode}
        />
      </div>
      {formData.loader !== 'vanilla' && (
        <div className="form-group">
          <label className="form-label">Версия загрузчика</label>
          {(() => {
            const mcParts = formData.versionId.split('.')
            const mcMajor = parseInt(mcParts[1] || '0', 10)
            const mcMinor = parseInt(mcParts[2] || '0', 10)
            const neoforgeUnsupported = formData.loader === 'neoforge' && formData.versionId &&
              (mcMajor < 20 || (mcMajor === 20 && mcMinor < 1))

            if (neoforgeUnsupported) {
              return (
                <div className="loader-version-warning warning">
                  <span className="warning-icon">⚠</span>
                  Доступно только для MC 1.20.1 и новее
                </div>
              )
            }

            if (isEditMode) {
              return (
                <CustomSelect
                  options={[{ value: formData.loaderVersion || '', label: formData.loaderVersion || 'Автовыбор при запуске' }]}
                  value={formData.loaderVersion || ''}
                  onChange={() => {}}
                  placeholder="Версия загрузчика"
                  disabled
                />
              )
            }

            if (!loaderVersionLoading && formData.versionId && availableLoaderVersions.length === 0) {
              return (
                <div className="loader-version-warning">
                  Версии не найдены для выбранной MC версии
                </div>
              )
            }

            return (
              <CustomSelect
                options={
                  loaderVersionLoading
                    ? [{ value: '', label: 'Загрузка...' }]
                    : [{ value: '', label: 'Выберите версию' }, ...availableLoaderVersions]
                }
                value={formData.loaderVersion || ''}
                onChange={(val: string) => updateFormData({ loaderVersion: val })}
                placeholder={loaderVersionLoading ? 'Загрузка...' : 'Выберите версию'}
                disabled={isEditMode}
              />
            )
          })()}
        </div>
      )}
      <div className="form-group">
        <label className="form-label">RAM</label>
        <CustomSelect
          options={ramOptions}
          value={formData.ram}
          onChange={(val: string) => updateFormData({ ram: val })}
          placeholder="Выберите память"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Java путь</label>
        <input
          className="form-input"
          value={formData.javaPath}
          onChange={(e) => updateFormData({ javaPath: e.target.value })}
          placeholder="Путь к Java"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Режим экрана</label>
        <CustomSelect
          options={[
            { value: 'global', label: 'Как в настройках лаунчера' },
            { value: 'on', label: 'Всегда полный экран' },
            { value: 'off', label: 'Всегда оконный режим' }
          ]}
          value={formData.fullscreenMode}
          onChange={(val: string) => updateFormData({ fullscreenMode: val as NonNullable<Profile['fullscreenMode']> })}
          placeholder="Выберите режим"
        />
      </div>
      <div className="profile-form-actions">
        <button className="btn btn-primary" onClick={handleSubmit}>{submitLabel || (isEditMode ? 'Сохранить изменения' : 'Сохранить профиль')}</button>
        {isEditMode && onCancel && (
          <button className="btn btn-ghost" type="button" onClick={onCancel}>Выйти к созданию</button>
        )}
      </div>
    </div>
  )
}

  const ramOptions = [
    { value: 'auto', label: 'Авто (рекомендуется)' },
    { value: '2G', label: '2 GB' },
    { value: '3G', label: '3 GB' },
    { value: '4G', label: '4 GB' },
    { value: '6G', label: '6 GB' },
    { value: '8G', label: '8 GB' },
    { value: '12G', label: '12 GB' },
    { value: '16G', label: '16 GB' }
  ]

  const profileRamOptions = [
    { value: 'global', label: 'Как в настройках лаунчера' },
    ...ramOptions
  ]

  const getSystemTheme = (): 'dark' | 'light' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'dark'
  }

  const defaultSettings: Settings = {
    theme: getSystemTheme(),
    javaPath: 'java',
    ram: 'auto',
    accent: 'red',
    fullscreen: false,
    kuroBoost: true,
    kuroBoostPreset: 'ai',
    profileName: '',
    profileStatus: '',
    avatarDataUrl: ''
  }

function normalizeSettings(settings?: Partial<Settings> | null): Settings {
  const next = { ...defaultSettings, ...(settings || {}) }
  return {
    ...next,
    theme: next.theme === 'light' || next.theme === 'dark' ? next.theme : defaultSettings.theme,
    javaPath: next.javaPath || defaultSettings.javaPath,
    ram: next.ram || defaultSettings.ram,
    accent: normalizeAccent(next.accent),
    fullscreen: Boolean(next.fullscreen),
    kuroBoost: next.kuroBoost !== false,
    kuroBoostPreset: 'ai',
    profileName: normalizeProfileText(next.profileName, 32),
    profileStatus: normalizeProfileText(next.profileStatus, 80),
    avatarDataUrl: normalizeAvatarDataUrl(next.avatarDataUrl)
  }
}

const newsItems = [
  {
    title: 'Настройки сохраняются сами',
    tag: 'Настройки',
    date: 'Сегодня',
    icon: 'settings' as IconName,
    image: newsUpdateArtwork,
    body: 'Тема, акцент, RAM, Java и fullscreen теперь остаются после перезапуска лаунчера.'
  },
  {
    title: 'Главный экран стал живым',
    tag: 'Интерфейс',
    date: 'Сегодня',
    icon: 'spark' as IconName,
    image: newsReleaseArtwork,
    body: 'Верхний баннер теперь перелистывает новости, показывает прогресс и ведёт к нужным разделам.'
  },
  {
    title: 'Светлая тема отполирована',
    tag: 'UI',
    date: 'Обновлено',
    icon: 'shield' as IconName,
    image: newsBoostArtwork,
    body: 'Белый акцент больше не уводит фон в синий, а красный стал глубже и спокойнее.'
  }
]

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard')
  const [isMaximized, setIsMaximized] = useState(false)
  const [versions, setVersions] = useState<VersionItem[]>([])
  const [installed, setInstalled] = useState<InstalledVersion[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [status, setStatus] = useState<string>('Готово')
  const [auth, setAuth] = useState<AuthState>({ email: '', loggedIn: false })
  const [loginState, setLoginState] = useState({ email: '', password: '' })
  const [registerMode, setRegisterMode] = useState(false)
  const [activeHeroIndex, setActiveHeroIndex] = useState(0)
  const [heroAutoplayResetKey, setHeroAutoplayResetKey] = useState(0)
  const [installingVersion, setInstallingVersion] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [progressInfo, setProgressInfo] = useState<{ label: string; current?: number; total?: number } | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null)

  const [profileFormResetTrigger, setProfileFormResetTrigger] = useState(0) // Trigger for form reset
  const [availableLoaderVersions, setAvailableLoaderVersions] = useState<Array<{ value: string; label: string }>>([])
  const [loaderVersionLoading, setLoaderVersionLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [versionsPerPage] = useState(20)
  const [versionFilter, setVersionFilter] = useState<string>('all')
  const [versionSearch, setVersionSearch] = useState<string>('')
  const [gameRunning, setGameRunning] = useState(false)
  const [modrinthQuery, setModrinthQuery] = useState<string>('')
  const [modrinthSearchVersion, setModrinthSearchVersion] = useState<string>('')
  const [modrinthSearchLoader, setModrinthSearchLoader] = useState<string>('')
  const [modrinthSearchType, setModrinthSearchType] = useState<string>('mod')
  const [modrinthSearchResults, setModrinthSearchResults] = useState<any[]>([])
  const [modrinthPage, setModrinthPage] = useState(1)
  const [modrinthTotalHits, setModrinthTotalHits] = useState(0)
  const [modrinthLoading, setModrinthLoading] = useState(false)
  const [modrinthInstalledAddons, setModrinthInstalledAddons] = useState<any[]>([])
  const [selectedModpackTarget, setSelectedModpackTarget] = useState<string>('')
  const [modpackCreateForm, setModpackCreateForm] = useState({
    name: '',
    versionId: '',
    loader: 'forge' as Profile['loader'],
    loaderVersion: ''
  })
  const [modpackCreateLoaderVersions, setModpackCreateLoaderVersions] = useState<Array<{ value: string; label: string }>>([])
  const [modpackCreateLoading, setModpackCreateLoading] = useState(false)
  const [modpackCreateLoaderLoading, setModpackCreateLoaderLoading] = useState(false)
  const [expandedModpacks, setExpandedModpacks] = useState<Set<string>>(new Set())
  const [standaloneExpanded, setStandaloneExpanded] = useState(true)
  const [openAddonCategories, setOpenAddonCategories] = useState<Record<string, string>>({})
  const [skinFile, setSkinFile] = useState<File | null>(null)
  const [skinDataUrl, setSkinDataUrl] = useState<string | null>(null)
  const [skinModel, setSkinModel] = useState<'classic' | 'slim'>('classic')
  const [profileSkinUrl, setProfileSkinUrl] = useState<string | null>(defaultSteveSkinUrl)
  const [skinUploading, setSkinUploading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void; onCancel?: () => void } | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const skinViewerContainerRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<any>(null)
  const viewerIdRef = useRef<number>(0)

  // Custom confirm dialog - doesn't steal focus like window.confirm
  const showConfirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({
        message,
        onConfirm: () => {
          setConfirmDialog(null)
          resolve(true)
        },
        onCancel: () => {
          setConfirmDialog(null)
          resolve(false)
        }
      })
    })
  }

  // Custom alert dialog - doesn't steal focus like window.alert
  const showAlert = (message: string) => {
    setConfirmDialog({
      message,
      onConfirm: () => setConfirmDialog(null)
    })
  }

  const activeProfile = useMemo(() => profiles.find((profile) => profile.id === selectedProfile), [profiles, selectedProfile])
  const editingProfile = useMemo(() => profiles.find((profile) => profile.id === editingProfileId), [profiles, editingProfileId])
  const modpackProfiles = useMemo(() => profiles.filter((profile) => Boolean(profile.modpackPath)), [profiles])
  const selectedModpackProfile = useMemo(
    () => modpackProfiles.find((profile) => profile.id === selectedModpackTarget) || null,
    [modpackProfiles, selectedModpackTarget]
  )
  const versionSelectOptions = useMemo(
    () => versions
      .filter((version) => version.type === 'release')
      .slice(0, 160)
      .map((version) => ({ value: version.id, label: version.id })),
    [versions]
  )
  const modpackTargetOptions = useMemo(
    () => [
      { value: '', label: 'Выберите модпак' },
      ...modpackProfiles.map((profile) => ({
        value: profile.id,
        label: `${profile.name} • ${profile.versionId} • ${formatLoaderName(profile.loader, profile.loaderVersion)}`
      }))
    ],
    [modpackProfiles]
  )
  const isTargetedModrinthType = modrinthSearchType !== 'modpack'
  const effectiveModrinthVersion = isTargetedModrinthType && selectedModpackProfile
    ? selectedModpackProfile.versionId
    : modrinthSearchVersion
  const effectiveModrinthLoader = isTargetedModrinthType && selectedModpackProfile
    ? (modrinthSearchType === 'mod'
      ? (selectedModpackProfile.loader === 'vanilla' ? '' : selectedModpackProfile.loader)
      : '')
    : modrinthSearchLoader
  const latestRelease = useMemo(() => versions.find((version) => version.type === 'release') || null, [versions])
  const dashboardNewsItems = newsItems
  const launchCandidate = activeProfile || profiles[0] || null
  const featuredVersionId = latestRelease?.id || installed[0]?.id || launchCandidate?.versionId || 'Загрузка релиза'
  const featuredProfile = useMemo(
    () => profiles.find((profile) => profile.versionId === featuredVersionId) || null,
    [profiles, featuredVersionId]
  )
  const featuredInstalled = installed.some((item) => item.id === featuredVersionId)
  const ramLabel = formatRamStat(settings.ram)
  const ramBarWidth = getRamStatWidth(settings.ram)
  const kuroBoostEnabled = settings.kuroBoost !== false
  const setKuroBoost = (enabled: boolean) => {
    setSettings((current) => ({
      ...current,
      kuroBoost: enabled,
      kuroBoostPreset: 'ai'
    }))
    setStatus(enabled ? 'KuroBoost включён: профиль будет оптимизирован при запуске' : 'KuroBoost выключен')
  }
  const heroPrimaryDisabled = featuredVersionId === 'Загрузка релиза' || installingVersion === featuredVersionId || Boolean(featuredProfile && gameRunning)
  const heroPrimaryLabel = featuredProfile
    ? (gameRunning ? 'Игра запущена' : 'Играть')
    : featuredInstalled
      ? 'Создать профиль'
      : installingVersion === featuredVersionId
        ? 'Установка...'
        : 'Установить релиз'
  const profileSubtitle = featuredProfile
    ? `${featuredProfile.name} • ${formatLoaderName(featuredProfile.loader, featuredProfile.loaderVersion)}`
    : featuredInstalled
      ? 'Версия установлена, профиль ещё не создан'
      : 'Официальный актуальный релиз'
  const releaseDateLabel = latestRelease?.releaseTime ? `Релиз ${formatCompactDate(latestRelease.releaseTime)}` : 'Релиз загружается'
  const heroSlides = [
    {
      id: 'release',
      kicker: 'Рекомендуемо',
      title: featuredVersionId,
      body: latestRelease
        ? `Самый актуальный официальный релиз Minecraft: ${latestRelease.id}.`
        : 'Загружаем актуальный релиз Minecraft из списка версий.',
      image: heroReleaseArtwork,
      meta: [featuredInstalled ? 'Установлено' : 'Можно установить', profileSubtitle, releaseDateLabel],
      actions: [
        {
          id: 'release-primary',
          label: heroPrimaryLabel,
          icon: featuredProfile ? 'play' as IconName : featuredInstalled ? 'profiles' as IconName : 'download' as IconName,
          variant: 'primary',
          disabled: heroPrimaryDisabled,
          onClick: () => {
            if (featuredProfile) {
              void launchProfile(featuredProfile)
            } else if (featuredInstalled) {
              setActiveTab('Profiles')
            } else {
              void installVersion(featuredVersionId)
            }
          }
        },
        {
          id: 'release-versions',
          label: 'Выбрать версию',
          icon: 'versions' as IconName,
          variant: 'secondary',
          onClick: () => {
            setVersionSearch(featuredVersionId === 'Загрузка релиза' ? '' : featuredVersionId)
            setActiveTab('Versions')
          }
        },
        {
          id: 'release-workshop',
          label: 'Мастерская',
          icon: 'mods' as IconName,
          variant: 'ghost',
          onClick: () => setActiveTab('Mods')
        }
      ]
    },
    {
      id: 'workshop',
      kicker: 'Новости мастерской',
      title: 'Моды, шейдеры, ресурспаки',
      body: 'Собирайте модпаки, ставьте дополнения под выбранный профиль и держите контент разложенным по категориям.',
      image: heroWorkshopArtwork,
      meta: ['Модпаки', 'Шейдеры', 'Ресурспаки'],
      actions: [
        { id: 'workshop-open', label: 'Открыть мастерскую', icon: 'mods' as IconName, variant: 'primary', onClick: () => setActiveTab('Mods') },
        { id: 'workshop-versions', label: 'Версии Minecraft', icon: 'versions' as IconName, variant: 'secondary', onClick: () => setActiveTab('Versions') }
      ]
    },
    {
      id: 'profiles',
      kicker: 'Профили и скины',
      title: 'Своя сборка под каждый запуск',
      body: 'Отдельные настройки RAM, Java, загрузчика, fullscreen и скинов помогают быстро переключаться между сборками.',
      image: heroProfilesArtwork,
      meta: [`Профилей: ${profiles.length}`, 'Локальные скины', 'Настройки запуска'],
      actions: [
        { id: 'profiles-open', label: 'Мои профили', icon: 'profiles' as IconName, variant: 'primary', onClick: () => setActiveTab('Profiles') },
        { id: 'profiles-skins', label: 'Скины', icon: 'skins' as IconName, variant: 'secondary', onClick: () => setActiveTab('Skins') },
        { id: 'profiles-settings', label: 'Настройки', icon: 'settings' as IconName, variant: 'ghost', onClick: () => setActiveTab('Settings') }
      ]
    },
    {
      id: 'boost',
      kicker: 'KuroBoost',
      title: 'Умная оптимизация профилей',
      body: 'KuroBoost подбирает RAM, JVM, игровые параметры и проверяет моды перед запуском под конкретный ПК.',
      image: heroBoostArtwork,
      meta: [kuroBoostEnabled ? 'Сейчас включён' : 'Можно включить', 'AI Optimized', 'Mod Check'],
      actions: [
        {
          id: 'boost-toggle',
          label: kuroBoostEnabled ? 'KuroBoost включён' : 'Включить KuroBoost',
          icon: 'shield' as IconName,
          variant: 'primary',
          onClick: () => {
            setKuroBoost(true)
          }
        },
        { id: 'boost-settings', label: 'Профили', icon: 'profiles' as IconName, variant: 'secondary', onClick: () => setActiveTab('Profiles') }
      ]
    }
  ]
  const activeHeroSlide = heroSlides[activeHeroIndex] || heroSlides[0]
  const changeHeroSlide = (nextIndex: number | ((index: number) => number)) => {
    if (heroSlides.length < 1) return
    setHeroAutoplayResetKey((key) => key + 1)
    setActiveHeroIndex((currentIndex) => {
      const resolvedIndex = typeof nextIndex === 'function' ? nextIndex(currentIndex) : nextIndex
      return (resolvedIndex + heroSlides.length) % heroSlides.length
    })
  }

  const launcherAvatar = normalizeAvatarDataUrl(settings.avatarDataUrl)
  const launcherProfileName = (settings.profileName || '').trim()
    || auth.name
    || (auth.loggedIn ? 'Пользователь' : 'Гость')
  const launcherProfileSubtitle = (settings.profileStatus || '').trim()
    || (auth.loggedIn ? auth.email : 'Не вошёл в систему')

  const userInitials = useMemo(() => {
    const source = launcherProfileName || auth.email || 'Гость'
    const normalized = source.replace(/@.*$/, '').split(/[^a-zA-Z0-9а-яА-Я]+/).filter(Boolean)
    const initials = normalized.slice(0, 2).map((part) => part[0].toUpperCase()).join('')
    return initials ? initials.slice(0, 2) : 'GU'
  }, [auth.email, launcherProfileName])

  useEffect(() => {
    async function syncProfileSkin() {
      setSkinFile(null)
      setSkinDataUrl(null)
      if (!activeProfile) {
        setSkinModel('classic')
        setProfileSkinUrl(defaultSteveSkinUrl)
        return
      }

      setSkinModel(activeProfile.skin?.model === 'slim' ? 'slim' : 'classic')
      
      try {
        const url = await (window as any).launcher.getSkinUrl(activeProfile.id)
        if (url) {
          setProfileSkinUrl(url)
        } else if (activeProfile.skin?.url) {
          setProfileSkinUrl(activeProfile.skin.url)
        } else {
          setProfileSkinUrl(defaultSteveSkinUrl)
        }
      } catch (e) {
        if (activeProfile.skin?.url) {
          setProfileSkinUrl(activeProfile.skin.url)
        } else {
          setProfileSkinUrl(defaultSteveSkinUrl)
        }
      }
    }
    syncProfileSkin()
  }, [activeProfile, defaultSteveSkinUrl])

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.user-section')) {
        setUserMenuOpen(false)
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  useEffect(() => {
    const currentId = ++viewerIdRef.current

    if (activeTab === 'Skins' && skinViewerContainerRef.current) {
      const container = skinViewerContainerRef.current
      const skinUrl = skinDataUrl || profileSkinUrl || defaultSteveSkinUrl
      
      container.innerHTML = ''

      if (!skinUrl) {
        const hint = document.createElement('div')
        hint.className = 'hint'
        hint.textContent = 'Нет выбранного скина'
        container.appendChild(hint)
        return
      }

      const initViewer = async () => {
        if (currentId !== viewerIdRef.current) return
        try {
          const mod: any = await import('skinview3d')
          const SkinViewer = mod.SkinViewer || mod.default?.SkinViewer || mod.default
          const createOrbitControls = mod.createOrbitControls || mod.default?.createOrbitControls
          if (!SkinViewer) throw new Error('SkinViewer not found')

          if (currentId !== viewerIdRef.current) return

          const viewer = new SkinViewer({
            domElement: container,
            width: 176,
            height: 352,
            skinUrl,
            model: skinModel === 'slim' ? 'slim' : 'classic',
            detectModel: false,
            background: settings.theme === 'light' ? 0xf0f0f0 : 0x1a1a1a
          })
          
          if (currentId !== viewerIdRef.current) {
            viewer.destroy()
            return
          }
          
          viewerRef.current = viewer

          if (createOrbitControls) {
            try {
              viewerRef.current.controls = createOrbitControls(viewer)
            } catch {}
          }

          const applySlim = () => {
            try {
              if (viewer.playerObject && viewer.playerObject.skin) {
                viewer.playerObject.skin.slim = skinModel === 'slim'
              }
            } catch {}
          }

          applySlim()
          setTimeout(() => {
            if (currentId === viewerIdRef.current) applySlim()
          }, 100)
        } catch (e) {
          if (currentId !== viewerIdRef.current) return
          const img = document.createElement('img')
          img.src = skinDataUrl || profileSkinUrl || defaultSteveSkinUrl
          img.style.width = '160px'
          img.style.height = '320px'
          img.style.objectFit = 'cover'
          img.style.imageRendering = 'pixelated'
          container.appendChild(img)
        }
      }

      initViewer()
    }

    return () => {
      if (currentId === viewerIdRef.current) {
        if (skinViewerContainerRef.current) {
          skinViewerContainerRef.current.innerHTML = ''
        }
        try {
          if (viewerRef.current && typeof viewerRef.current.destroy === 'function') viewerRef.current.destroy()
          if (viewerRef.current && viewerRef.current.controls && typeof viewerRef.current.controls.dispose === 'function') viewerRef.current.controls.dispose()
        } catch {}
        viewerRef.current = null
      }
    }
  }, [activeTab, skinModel, skinDataUrl, profileSkinUrl, defaultSteveSkinUrl])

  // Pagination logic with filtering and search
  const filteredVersions = versions.filter(v => {
    const matchesFilter = versionFilter === 'all' || v.type === versionFilter
    const matchesSearch = versionSearch === '' || v.id.toLowerCase().includes(versionSearch.toLowerCase())
    return matchesFilter && matchesSearch
  })
  const totalPages = Math.ceil(filteredVersions.length / versionsPerPage)
  const startIndex = (currentPage - 1) * versionsPerPage
  const endIndex = startIndex + versionsPerPage
  const currentVersions = filteredVersions.slice(startIndex, endIndex)



  async function loadMeta() {
    setStatus('Загрузка списка версий...')
    const manifest = await window.launcher.fetchVersionManifest()
    // Sort by release time, newest first
    const sortedVersions = manifest.sort((a, b) => new Date(b.releaseTime).getTime() - new Date(a.releaseTime).getTime())
    setVersions(sortedVersions)
    setStatus('Готово')
  }

  useEffect(() => {
    const wc = (window as any).windowControls
    if (!wc) return
    wc.isMaximized().then((v: boolean) => setIsMaximized(Boolean(v))).catch(() => {})
    const listener = (_event: any, value: boolean) => setIsMaximized(Boolean(value))
    wc.onMaximizeChange(listener)
    return () => wc.removeMaximizeChange(listener)
  }, [])

  const handleMinimize = () => {
    ;(window as any).windowControls?.minimize()
  }

  const handleToggleMax = async () => {
    try {
      const res = await (window as any).windowControls?.toggleMaximize()
      setIsMaximized(Boolean(res))
    } catch {}
  }

  const handleClose = () => {
    ;(window as any).windowControls?.close()
  }

  const createTitlebarMouseHandler = (action: () => void) => (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    action()
  }

  async function loadState() {
    const installedVersions = await window.launcher.getInstalledVersions()
    setInstalled(installedVersions)
    const storedProfiles = await window.launcher.getProfiles()
    const updatedProfiles = storedProfiles.map((p) => ({
      ...p,
      loader: p.loader || 'vanilla',
      loaderVersion: p.loaderVersion || '',
      ram: p.ram || 'global',
      javaPath: p.javaPath || defaultSettings.javaPath,
      username: p.username || '',
      fullscreenMode: p.fullscreenMode || 'global'
    }))
    setProfiles(updatedProfiles)
    const storedSettings = await window.launcher.getSettings()
    setSettings(normalizeSettings(storedSettings))
    setSettingsLoaded(true)
    const authState = await window.launcher.getAuthState()
    setAuth(authState)
  }

  useEffect(() => {
    if (selectedProfile && !profiles.some((profile) => profile.id === selectedProfile)) {
      setSelectedProfile(null)
    }
    if (editingProfileId && !profiles.some((profile) => profile.id === editingProfileId)) {
      setEditingProfileId(null)
    }
    if (selectedModpackTarget && !profiles.some((profile) => profile.id === selectedModpackTarget && profile.modpackPath)) {
      setSelectedModpackTarget('')
    }
  }, [profiles, selectedProfile, editingProfileId, selectedModpackTarget])

  useEffect(() => {
    let cancelled = false

    async function loadCreateLoaderVersions() {
      setModpackCreateLoaderVersions([])
      if (!modpackCreateForm.versionId || modpackCreateForm.loader === 'vanilla') {
        if (modpackCreateForm.loaderVersion) {
          setModpackCreateForm((prev) => ({ ...prev, loaderVersion: '' }))
        }
        return
      }

      setModpackCreateLoaderLoading(true)
      try {
        const versions = await window.launcher.getLoaderVersions(modpackCreateForm.versionId, modpackCreateForm.loader)
        if (cancelled) return
        const items = Array.isArray(versions)
          ? versions
              .map((item: any) => {
                if (typeof item === 'string') return { value: item, label: item }
                if (item && typeof item === 'object') {
                  return { value: item.version || item.id || String(item), label: item.label || item.version || item.id || String(item) }
                }
                return null
              })
              .filter((item): item is { value: string; label: string } => Boolean(item))
          : []
        setModpackCreateLoaderVersions(items)
        setModpackCreateForm((prev) => {
          if (prev.loaderVersion && items.some((item) => item.value === prev.loaderVersion)) return prev
          return { ...prev, loaderVersion: items[0]?.value || '' }
        })
      } catch (error: any) {
        if (!cancelled) {
          setModpackCreateLoaderVersions([])
          setStatus(`Не удалось загрузить версии модлоадера: ${error?.message || 'проверьте соединение'}`)
        }
      } finally {
        if (!cancelled) setModpackCreateLoaderLoading(false)
      }
    }

    loadCreateLoaderVersions()
    return () => {
      cancelled = true
    }
  }, [modpackCreateForm.versionId, modpackCreateForm.loader])

  async function fetchLoaderVersions(versionId: string, loader: Profile['loader']) {
    setAvailableLoaderVersions([])
    if (!versionId || loader === 'vanilla') {
      return
    }
    setLoaderVersionLoading(true)
    try {
      const versions = await window.launcher.getLoaderVersions(versionId, loader)
      const items = Array.isArray(versions)
        ? versions
            .map((item: any) => {
              if (typeof item === 'string') {
                return { value: item, label: item }
              }
              if (item && typeof item === 'object') {
                return { value: item.version || item.id || String(item), label: item.label || item.version || item.id || String(item) }
              }
              return null
            })
            .filter((item): item is { value: string; label: string } => Boolean(item))
        : []
      setAvailableLoaderVersions(items)
    } catch (error: any) {
      console.error('Ошибка загрузки версий загрузчика', error)
      setStatus(`Ошибка загрузки версий загрузчика: ${error?.message || 'проверьте соединение'}`)
      setAvailableLoaderVersions([])
    } finally {
      setLoaderVersionLoading(false)
    }
  }

  useEffect(() => {
    loadMeta()
    loadState()
    loadInstalledAddons()
  }, [])



  async function loadModrinthState() {
    setModrinthLoading(true)
    try {
      const addons = await window.launcher.getInstalledModrinthAddons()
      setModrinthInstalledAddons(addons || [])
    } catch (error) {
      console.error('Modrinth addon load error', error)
    } finally {
      setModrinthLoading(false)
    }
  }

  async function searchModrinth(page = 1) {
    setModrinthLoading(true)
    setModrinthPage(page)
    try {
      const data = await window.launcher.searchModrinth(modrinthQuery, {
        version: effectiveModrinthVersion,
        loader: effectiveModrinthLoader,
        projectType: modrinthSearchType,
        page,
        pageSize: 20
      })
      setModrinthSearchResults(data.hits || [])
      setModrinthTotalHits(data.total_hits || 0)
      const targetText = selectedModpackProfile && isTargetedModrinthType ? ` для "${selectedModpackProfile.name}"` : ''
      setStatus(`Найдено ${data.hits?.length ?? 0} результатов${targetText} (${data.total_hits ?? 0} всего)`)
    } catch (error: any) {
      console.error('Modrinth search error', error)
      setStatus(`Ошибка поиска Modrinth: ${error?.message || 'проверьте соединение'}`)
      setModrinthSearchResults([])
      setModrinthTotalHits(0)
    } finally {
      setModrinthLoading(false)
    }
  }

  async function createCustomModpack() {
    if (!modpackCreateForm.name.trim()) {
      showAlert('Введите название модпака')
      return
    }
    if (!modpackCreateForm.versionId) {
      showAlert('Выберите версию Minecraft для модпака')
      return
    }
    if (modpackCreateForm.loader !== 'vanilla' && !modpackCreateForm.loaderVersion) {
      showAlert('Выберите версию модлоадера')
      return
    }

    setModpackCreateLoading(true)
    setIsBusy(true)
    setStatus('Создание модпака...')
    try {
      const result = await window.launcher.createCustomModpack(modpackCreateForm)
      if (result?.profile) {
        setSelectedModpackTarget(result.profile.id)
        setSelectedProfile(result.profile.id)
        setStandaloneExpanded(false)
        setExpandedModpacks(new Set([getProfileModpackKey(result.profile)]))
        setModpackCreateForm({ name: '', versionId: '', loader: 'forge', loaderVersion: '' })
        await loadState()
        await loadInstalledAddons()
        setStatus(`Модпак "${result.profile.name}" создан`)
      }
    } catch (error: any) {
      console.error('Create modpack error', error)
      setStatus(`Ошибка создания модпака: ${error?.message || 'проверьте параметры'}`)
    } finally {
      setModpackCreateLoading(false)
      setIsBusy(false)
    }
  }

  async function installModrinthProject(item: any) {
    const projectId = item?.slug || item?.project_id || item?.id
    const projectType = item?.project_type || modrinthSearchType
    if (!projectId) return
    if (projectType !== 'modpack' && !selectedModpackProfile) {
      showAlert('Выберите модпак, куда установить моды, ресурспаки или шейдеры')
      return
    }

    setIsBusy(true)
    setStatus('Установка Modrinth проекта...')
    try {
      const installOptions = projectType === 'modpack'
        ? {
            gameVersion: modrinthSearchVersion || undefined,
            loader: modrinthSearchLoader || undefined
          }
        : {
            targetProfileId: selectedModpackProfile?.id,
            gameVersion: selectedModpackProfile?.versionId,
            loader: selectedModpackProfile?.loader === 'vanilla' ? undefined : selectedModpackProfile?.loader
          }
      const result = await window.launcher.installModrinthProject(projectId, installOptions)
      if (result?.profile) {
        setStatus(`Модпак установлен. Профиль "${result.profile.name}" создан.`)
        await loadState()
        setSelectedModpackTarget(result.profile.id)
        setStandaloneExpanded(false)
        setExpandedModpacks(new Set([getProfileModpackKey(result.profile)]))
      } else {
        setStatus(`Установлено в "${selectedModpackProfile?.name || result?.targetProfile?.name || 'модпак'}"`)
      }
      await loadInstalledAddons()
    } catch (error: any) {
      console.error('Modrinth install error', error)
      setStatus(`Ошибка установки Modrinth: ${error?.message || 'проверьте лог'}`)
    } finally {
      setIsBusy(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'Mods') {
      searchModrinth(1)
      loadInstalledAddons()
    }
  }, [activeTab, modrinthSearchType, effectiveModrinthLoader, effectiveModrinthVersion])

  async function loadInstalledAddons() {
    try {
      const addons = await window.launcher.getInstalledModrinthAddons()
      setModrinthInstalledAddons(addons)
    } catch (error) {
      console.error('Failed to load installed addons:', error)
    }
  }

  function toggleModpackExpansion(modpackId: string) {
    if (expandedModpacks.has(modpackId)) {
      setExpandedModpacks(new Set())
    } else {
      setStandaloneExpanded(false)
      setExpandedModpacks(new Set([modpackId]))
    }
  }

  const organizedAddons = useMemo(() => {
    const modpacks: { [key: string]: any } = {}
    const standalone = createAddonBuckets()

    modpackProfiles.forEach((profile) => {
      const key = getProfileModpackKey(profile)
      if (!key) return
      modpacks[key] = {
        key,
        title: profile.name,
        gameVersion: profile.versionId,
        loader: profile.loader,
        loaderVersion: profile.loaderVersion || '',
        categories: createAddonBuckets(),
        total: 0,
        profile
      }
    })

    modrinthInstalledAddons.forEach(addon => {
      const type = addon.type as 'mods' | 'resourcepacks' | 'shaderpacks'
      if (!['mods', 'resourcepacks', 'shaderpacks'].includes(type)) return

      if (addon.origin?.modpackKey || addon.origin?.modpackId) {
        const key = addon.origin.modpackKey || `${addon.origin.modpackId}-${addon.origin.modpackVersion || 'latest'}`
        if (!modpacks[key]) {
          modpacks[key] = {
            key,
            title: addon.origin.projectTitle || addon.origin.modpackId || 'Modpack',
            gameVersion: addon.origin.gameVersion || '',
            loader: addon.origin.detectedLoader || 'vanilla',
            loaderVersion: addon.origin.loaderVersion || '',
            categories: createAddonBuckets(),
            total: 0,
            profile: null
          }
        }
        modpacks[key].categories[type].push(addon)
        modpacks[key].total += 1
      } else {
        standalone[type].push(addon)
      }
    })

    const standaloneTotal = Object.values(standalone).reduce((sum, items) => sum + items.length, 0)

    return { modpacks, standalone, standaloneTotal }
  }, [modrinthInstalledAddons, modpackProfiles])

  async function deleteModpack(modpackKey: string, modpackTitle: string) {
    if (await showConfirm(`Удалить модпак "${modpackTitle}" и все его дополнения?`)) {
      try {
        await window.launcher.deleteModpackDirectory(modpackKey)
        await loadInstalledAddons()
        await loadState()
      } catch (error) {
        console.error('Failed to delete modpack:', error)
      }
    }
  }

  async function deleteAllStandalone() {
    if (await showConfirm('Удалить все отдельные дополнения?')) {
      try {
        // Delete all standalone addons
        for (const addon of Object.values(organizedAddons.standalone).flat()) {
          await window.launcher.deleteInstalledAddon(addon.type, addon.name, addon.path)
        }
        await loadInstalledAddons() // Reload to get updated state
      } catch (error) {
        console.error('Failed to delete standalone addons:', error)
      }
    }
  }

  async function toggleAddon(addon: any) {
    try {
      await window.launcher.toggleInstalledAddon(addon.type, addon.name, !addon.enabled, addon.path)
      await loadInstalledAddons() // Reload to get updated state
    } catch (error) {
      console.error('Failed to toggle addon:', error)
    }
  }

  async function deleteAddon(addon: any) {
    if (await showConfirm(`Удалить ${addon.name}?`)) {
      try {
        await window.launcher.deleteInstalledAddon(addon.type, addon.name, addon.path)
        await loadInstalledAddons() // Reload to get updated state
      } catch (error) {
        console.error('Failed to delete addon:', error)
      }
    }
  }

  function renderAddonCategory(
    scopeKey: string,
    categoryKey: 'mods' | 'resourcepacks' | 'shaderpacks',
    addons: any[],
    defaultCategory: 'mods' | 'resourcepacks' | 'shaderpacks'
  ) {
    const hasStoredCategory = Object.prototype.hasOwnProperty.call(openAddonCategories, scopeKey)
    const openCategory = hasStoredCategory ? openAddonCategories[scopeKey] : defaultCategory
    const isOpen = openCategory === categoryKey

    return (
      <div key={categoryKey} className={`addon-category ${isOpen ? 'open' : ''}`}>
        <button
          type="button"
          className="addon-category-header"
          onClick={() => {
            setOpenAddonCategories((prev) => ({
              ...prev,
              [scopeKey]: isOpen ? '' : categoryKey
            }))
          }}
        >
          <span className="addon-category-title">
            <span className="addon-category-chevron">{isOpen ? '▾' : '▸'}</span>
            {addonCategoryLabels[categoryKey]}
          </span>
          <span className="addon-category-count">{addons.length}</span>
        </button>
        {isOpen && (
          <div className="addon-category-list">
            {addons.length === 0 && <div className="addon-empty">Пусто</div>}
            {addons.map((addon) => (
              <div key={addon.id} className="installed-item addon-row">
                <div className="addon-row-main">
                  <span>{addon.name}</span>
                  <span>{formatAddonType(addon.type)} • {addon.enabled ? 'Включен' : 'Отключен'}</span>
                </div>
                <div className="addon-row-actions">
                  <button className="outline-button" onClick={() => toggleAddon(addon)}>
                    {addon.enabled ? 'Отключить' : 'Включить'}
                  </button>
                  <button className="outline-button delete-button" onClick={() => deleteAddon(addon)}>
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  useEffect(() => {
    if (activeTab === 'Versions') {
      setCurrentPage(1)
    }
  }, [activeTab, versionFilter, versionSearch])

  useEffect(() => {
    const installProgressListener = (_event: any, data: { message: string }) => {
      setStatus(data.message)
      setIsBusy(true)
      setProgressInfo({ label: data.message })
    }
    window.launcher.onInstallProgress(installProgressListener)
    return () => window.launcher.removeInstallProgress(installProgressListener)
  }, [])

  useEffect(() => {
    const launchProgressListener = (_event: any, data: { message: string; progress?: { current: number; total: number }; gameExited?: boolean }) => {
      setStatus(data.message)
      setIsBusy(true)

      if (data.gameExited) {
        setGameRunning(false)
        setIsBusy(false)
        setProgressInfo(null)
      } else if (data.progress?.total) {
        setProgressInfo({ label: data.message, current: data.progress.current, total: data.progress.total })
      } else {
        setProgressInfo({ label: data.message })
      }
    }
    window.launcher.onLaunchProgress(launchProgressListener)
    return () => window.launcher.removeLaunchProgress(launchProgressListener)
  }, [])

  async function installVersion(versionId: string) {
    setInstallingVersion(versionId)
    setIsBusy(true)
    setProgressInfo({ label: `Установка версии ${versionId}...` })
    setStatus(`Установка версии ${versionId}...`)

    try {
      await window.launcher.installVersion(versionId)
      await loadState()
      setStatus(`Версия ${versionId} установлена`)
      setProgressInfo(null)
    } catch (error: any) {
      console.error('Install error', error)
      setStatus(`Ошибка установки: ${error?.message || 'проверьте соединение и путь'}`)
      setProgressInfo(null)
    } finally {
      setInstallingVersion(null)
      setIsBusy(false)
    }
  }

  async function deleteInstalledVersion(versionId: string) {
    const confirmed = await showConfirm(`Удалить установленную версию ${versionId}?`)
    if (!confirmed) return

    try {
      setIsBusy(true)
      setProgressInfo({ label: `Удаление версии ${versionId}...` })
      await window.launcher.deleteInstalledVersion(versionId)
      await loadState()
      setStatus(`Версия ${versionId} удалена`)
      setProgressInfo(null)
    } catch (error: any) {
      console.error('Delete installed version error', error)
      setStatus(`Ошибка удаления версии: ${error?.message || 'проверьте доступ'}`)
      setProgressInfo(null)
    } finally {
      setIsBusy(false)
    }
  }

  async function saveNewProfile(profileData: any) {
    if (!profileData.name || !profileData.versionId) {
      setStatus('Введите имя и выберите версию профиля')
      return
    }
    await window.launcher.saveProfile({ ...profileData, username: '', id: `${Date.now()}` })
    setStatus('Профиль сохранён')
    setProfileFormResetTrigger((k) => k + 1)
    await loadState()
  }

  async function saveProfileSettings(profileData: any) {
    if (!editingProfile) return

    const nextProfile = {
      ...editingProfile,
      ...profileData,
      id: editingProfile.id,
      username: '',
      modpackPath: editingProfile.modpackPath,
      skin: editingProfile.skin
    }

    await window.launcher.saveProfile(nextProfile)
    setStatus(`Настройки профиля "${nextProfile.name}" сохранены`)
    await loadState()
  }

  async function launchProfile(profile: Profile) {
    setIsBusy(true)
    setProgressInfo({ label: `Запуск ${profile.name}...` })
    setStatus(`Запуск ${profile.name}...`)

    try {
      await window.launcher.launchProfile(profile.id, launcherProfileName)
      setGameRunning(true)
      setStatus(`Игра запущена: ${profile.name}`)
      setProgressInfo(null)
    } catch (error: any) {
      console.error('Launch error', error)
      setStatus(`Ошибка запуска: ${error?.message || 'проверьте Java и установку версии'}`)
      setProgressInfo(null)
      setIsBusy(false)
    }
  }

  async function deleteProfile(profileId: string) {
    const confirmed = await showConfirm('Удалить профиль? Это действие необратимо.')
    if (!confirmed) return

    try {
      await (window as any).launcher.deleteProfile(profileId)
      setStatus('Профиль удалён')

      // Clear selected profile if it was deleted
      if (selectedProfile === profileId) {
        setSelectedProfile(null)
      }
      if (editingProfileId === profileId) {
        setEditingProfileId(null)
      }

      // Trigger form reset
      setProfileFormResetTrigger(k => k + 1)

      // Reload state after form reset
      await loadState()
    } catch (error: any) {
      console.error('Delete profile error', error)
      setStatus(`Ошибка удаления профиля: ${error?.message || 'проверьте доступ'}`)
    }
  }

  async function handleLogin() {
    const result = registerMode
      ? await window.launcher.registerUser(loginState.email, loginState.password)
      : await window.launcher.loginUser(loginState.email, loginState.password)
    setAuth({ email: result.email, loggedIn: result.loggedIn })
    setStatus(result.message)
  }

  async function handleLogout() {
    await window.launcher.logoutUser()
    setAuth({ email: '', loggedIn: false })
    setStatus('Вы вышли из аккаунта')
  }

  function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return
    if (!file.type.startsWith('image/')) {
      showAlert('Выберите изображение для аватарки.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      showAlert('Аватарка должна быть меньше 2 МБ.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      if (!result.startsWith('data:image/')) {
        showAlert('Не удалось прочитать изображение.')
        return
      }
      setSettings((current) => ({ ...current, avatarDataUrl: result }))
      setStatus('Аватар профиля обновлён')
    }
    reader.onerror = () => {
      showAlert('Не удалось загрузить аватарку.')
    }
    reader.readAsDataURL(file)
  }

  async function handleSaveSettings() {
    const normalizedSettings = normalizeSettings(settings)
    setSettings(normalizedSettings)
    await window.launcher.saveSettings(normalizedSettings)
    setStatus('Настройки сохранены')
  }

  useEffect(() => {
    if (!settingsLoaded) return
    void window.launcher.saveSettings(normalizeSettings(settings)).catch((error: any) => {
      console.error('Ошибка автосохранения настроек', error)
    })
  }, [settings, settingsLoaded])

  const themeClass = settings.theme === 'light' ? 'theme-light' : 'theme-dark'
  const accentColor = normalizeAccent(settings.accent)
  
  useEffect(() => {
    try {
      document.body.classList.remove('theme-light', 'theme-dark')
      document.body.classList.add(themeClass)
      document.body.setAttribute('data-accent', accentColor)
    } catch (e) {}
    return () => {
      try { document.body.classList.remove(themeClass) } catch (e) {}
    }
  }, [themeClass, accentColor])

  useEffect(() => {
    try {
      window.localStorage.setItem('kuroBoost', kuroBoostEnabled ? 'on' : 'off')
    } catch (e) {}
  }, [kuroBoostEnabled])

  useEffect(() => {
    if (activeHeroIndex >= heroSlides.length) {
      setActiveHeroIndex(0)
    }
  }, [activeHeroIndex, heroSlides.length])

  useEffect(() => {
    if (activeTab !== 'Dashboard' || heroSlides.length < 2) return
    const timer = window.setTimeout(() => {
      setActiveHeroIndex((index) => (index + 1) % heroSlides.length)
    }, 6500)
    return () => window.clearTimeout(timer)
  }, [activeTab, activeHeroIndex, heroAutoplayResetKey, heroSlides.length])

  return (
    <div className="app-shell">
      <div className="live-bg"></div>
      <div className="noise-overlay"></div>
      <div className="titlebar">
        <div className="titlebar-title">KuroLauncher</div>
        <div className="titlebar-controls">
          <button
            type="button"
            className="titlebar-btn"
            onMouseUp={createTitlebarMouseHandler(handleMinimize)}
            aria-label="Minimize"
          >
            <svg viewBox="0 0 12 2" xmlns="http://www.w3.org/2000/svg" fill="none">
              <rect x="0" y="0" width="12" height="2" rx="1" fill="currentColor" />
            </svg>
          </button>

          <button
            type="button"
            className="titlebar-btn"
            onMouseUp={createTitlebarMouseHandler(() => {
              void handleToggleMax()
            })}
            aria-label="Maximize"
          >
            {isMaximized ? (
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
                <rect x="3" y="6" width="14" height="12" stroke="currentColor" strokeWidth="1.6" rx="1" />
                <path d="M7 6V4h10v10h-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
                <rect x="4" y="4" width="16" height="16" stroke="currentColor" strokeWidth="1.6" rx="1" />
              </svg>
            )}
          </button>

          <button
            type="button"
            className="titlebar-btn"
            onMouseUp={createTitlebarMouseHandler(handleClose)}
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
              <path d="M4 4l16 16M20 4L4 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <aside className="launcher-sidebar glass-panel">
        <div className="sidebar-brand">
          <img src={logoIcon} alt="KuroLauncher" className="sidebar-logo" />
          <div className="sidebar-brand-copy">
            <div className="sidebar-title">KuroLauncher</div>
            <div className="sidebar-version">v{APP_VERSION}</div>
          </div>
        </div>

        <nav className="nav-bar" aria-label="Главная навигация">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.label}
            >
              <Icon name={tab.icon} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-profile-card">
          <div className="sidebar-profile-main">
            <button className={`user-avatar ${launcherAvatar ? 'has-image' : ''}`} onClick={() => setActiveTab('Settings')} aria-label="Открыть настройки профиля">
              {launcherAvatar ? <img src={launcherAvatar} alt="" /> : userInitials}
            </button>
            <div className="user-info">
              <div className="user-name">{launcherProfileName}</div>
              <div className="user-email">{launcherProfileSubtitle}</div>
            </div>
          </div>
          {auth.loggedIn ? (
            <button className="outline-button sidebar-wide-button" onClick={handleLogout}>
              Выйти
            </button>
          ) : (
            <button className="outline-button sidebar-wide-button" onClick={() => setActiveTab('Settings')}>
              <Icon name="user" />
              Войти
            </button>
          )}
        </div>

        <button
          type="button"
          className={`boost-card ${kuroBoostEnabled ? 'active' : ''}`}
          onClick={() => setKuroBoost(!kuroBoostEnabled)}
          aria-pressed={kuroBoostEnabled}
          title="KuroBoost оптимизирует параметры Minecraft и Java перед запуском профиля."
        >
          <div className="boost-head">
            <Icon name="shield" />
            <div>
              <div className="boost-title">KuroBoost</div>
              <div className="boost-text">AI-профиль запуска</div>
            </div>
          </div>
          <div className="boost-toggle">
            <span>{kuroBoostEnabled ? 'Вкл' : 'Выкл'}</span>
            <span className={`toggle-pill ${kuroBoostEnabled ? 'active' : ''}`}><span /></span>
          </div>
        </button>
      </aside>

      <div className="workspace-shell">
        <div className="header glass-panel">
          <div className="header-left">
            <div className={`header-status ${isBusy ? 'loading' : ''}`}>
              <span className="status-dot"></span>
              {status}
            </div>
          </div>
          <label className="top-search">
            <Icon name="search" />
            <input
              value={versionSearch}
              onChange={(e) => {
                setVersionSearch(e.target.value)
                setCurrentPage(1)
                setActiveTab('Versions')
              }}
              placeholder="Поиск версии..."
            />
          </label>
        </div>

      {isBusy && progressInfo && (
        <div className="progress-panel">
          <div className="progress-label">{progressInfo!.label}</div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: progressInfo!.total ? `${Math.min(100, Math.round((progressInfo!.current ?? 0) / progressInfo!.total * 100))}%` : '100%' }}
            />
          </div>
        </div>
      )}

      <main className={`content ${activeTab === 'Settings' ? 'settings-content' : ''}`}>
        {activeTab === 'Skins' && (
          <section className="skins-grid">
            <div className="panel panel large">
              <div className="panel-title">Скины</div>
              <div className="form-grid">
                <label>
                  Профиль
                  <div style={{ marginTop: 8 }}>
                    <CustomSelect
                      options={[{ value: '', label: 'Выберите профиль' }, ...profiles.map(p => ({ value: p.id, label: p.name || p.id }))]}
                      value={selectedProfile || ''}
                      onChange={(val: string) => setSelectedProfile(val)}
                      placeholder="Выберите профиль"
                    />
                  </div>
                </label>

                <label>
                  Модель
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="radio" name="skinModel" checked={skinModel === 'classic'} onChange={() => setSkinModel('classic')} /> Обычный
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="radio" name="skinModel" checked={skinModel === 'slim'} onChange={() => setSkinModel('slim')} /> Слим
                    </label>
                  </div>
                </label>

                <label>
                  Загрузить скин (PNG)
                  <div className="skin-file-row" style={{ marginTop: 8 }}>
                    <input ref={fileInputRef} type="file" accept="image/png" style={{ display: 'none' }} onChange={(e) => {
                      const f = e.target.files && e.target.files[0]
                      if (!f) return
                      setSkinFile(f)
                      const reader = new FileReader()
                      reader.onload = () => setSkinDataUrl(String(reader.result))
                      reader.readAsDataURL(f)
                    }} />
                    <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>Выбрать файл</button>
                    <span className="small-text">{skinFile?.name || ''}</span>
                  </div>
                </label>

                <div className="skin-preview-section">
                  <div className="panel-subtitle">Предпросмотр</div>
                  <div className="skin-preview-row">
                    <div className="skin-preview-box">
                      <div ref={skinViewerContainerRef} className="skin-preview-canvas" />
                    </div>
                    <div className="skin-preview-controls">
                      <div className="skin-preview-actions">
                        <button
                          className="button"
                          disabled={!selectedProfile || (!skinDataUrl && profileSkinUrl === defaultSteveSkinUrl) || skinUploading}
                          onClick={async () => {
                            if (!selectedProfile) return
                            setSkinUploading(true)
                            try {
                              const prof = profiles.find(p => p.id === selectedProfile)
                              if (!prof) {
                                showAlert('Профиль не найден')
                                return
                              }

                              const updatedSkin = {
                                ...(prof.skin || {}),
                                model: skinModel
                              }
                              const updatedProfile = { ...prof, skin: updatedSkin }

                              if (skinDataUrl) {
                                const res = await (window as any).launcher.saveSkin(selectedProfile, skinDataUrl)
                                if (!res || !res.ok) {
                                  showAlert('Не удалось сохранить скин')
                                  return
                                }
                                updatedProfile.skin.url = res.url
                              }

                               await (window as any).launcher.saveProfile(updatedProfile)
                               await loadState()
                               setProfileSkinUrl(updatedProfile.skin.url || defaultSteveSkinUrl)
                               setSkinFile(null)
                            } catch (e) {
                              console.error(e)
                              showAlert('Ошибка при сохранении скина')
                            } finally {
                              setSkinUploading(false)
                            }
                          }}
                        >{skinUploading ? 'Сохранение...' : 'Сохранить скин'}</button>

                        <button className="btn btn-secondary" onClick={() => {
                          setSkinFile(null)
                          setSkinDataUrl(null)
                        }}>Отменить</button>
                      </div>
                      <div className="hint">Используйте 64×64 PNG-скины. Поверните модель мышью в окне просмотра. Если 3D не работает, установите зависимость <code>skinview3d</code>.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        {activeTab === 'Dashboard' && (
          <section className="dashboard-grid dashboard-modern">
            <div className="dashboard-main-column">
              <motion.section
                className="hero-card hero-carousel-card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
              >
                <AnimatePresence initial={false}>
                  <motion.div
                    key={`${activeHeroSlide.id}-background`}
                    className="hero-slide-bg"
                    style={{ '--hero-image': `url(${activeHeroSlide.image})` } as any}
                    initial={{ opacity: 0, scale: 1.045, x: 18 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 1.025, x: -16 }}
                    transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                    aria-hidden="true"
                  />
                </AnimatePresence>
                <button
                  type="button"
                  className="hero-nav hero-nav-prev"
                  onClick={() => changeHeroSlide((index) => index - 1)}
                  aria-label="Предыдущая новость"
                  title="Предыдущая новость"
                >
                  <Icon name="chevron" />
                </button>
                <button
                  type="button"
                  className="hero-nav hero-nav-next"
                  onClick={() => changeHeroSlide((index) => index + 1)}
                  aria-label="Следующая новость"
                  title="Следующая новость"
                >
                  <Icon name="chevron" />
                </button>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeHeroSlide.id}
                    className="hero-copy"
                    initial={{ opacity: 0, x: 24, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: -18, filter: 'blur(8px)' }}
                    transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="hero-kicker">{activeHeroSlide.kicker}</span>
                    <h1>{activeHeroSlide.title}</h1>
                    <p>{activeHeroSlide.body}</p>
                    <div className="hero-meta-row">
                      {activeHeroSlide.meta.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                    <div className="hero-actions">
                      {activeHeroSlide.actions.map((action) => (
                        <button
                          key={action.id}
                          className={`btn btn-${action.variant}`}
                          disabled={action.disabled}
                          onClick={action.onClick}
                        >
                          <Icon name={action.icon} />
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
                <div key={`${activeHeroSlide.id}-${heroAutoplayResetKey}`} className="hero-progress" aria-hidden="true">
                  <span />
                </div>
                <div
                  className="hero-dots"
                  aria-label="Новости на главном экране"
                  style={{ '--dot-offset': `${activeHeroIndex * 38}px` } as any}
                >
                  <span className="hero-dot-glider" aria-hidden="true" />
                  {heroSlides.map((slide, index) => (
                    <button
                      key={slide.id}
                      type="button"
                      className={index === activeHeroIndex ? 'active' : ''}
                      onClick={() => changeHeroSlide(index)}
                      aria-label={`Открыть новость: ${slide.title}`}
                      aria-current={index === activeHeroIndex ? 'true' : undefined}
                    />
                  ))}
                </div>
              </motion.section>

              <div className="section-heading">
                <div>
                  <span className="section-marker" />
                  <h2>Новости и обновления</h2>
                </div>
                <button className="icon-button" onClick={loadMeta} title="Обновить версии">
                  <Icon name="refresh" />
                </button>
              </div>

              <div className="news-grid">
                {dashboardNewsItems.map((item, index) => (
                  <motion.article
                    key={item.title}
                    className={`news-card rich-news-card news-card-${index + 1}`}
                    style={{ '--news-image': `url(${item.image})` } as any}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: index * 0.08 }}
                  >
                    <div className="news-media">
                      <Icon name={item.icon} />
                      <span>{item.tag}</span>
                    </div>
                    <div className="news-content">
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                      <span>{item.date}</span>
                    </div>
                  </motion.article>
                ))}
              </div>

              <div className="section-heading quick-heading">
                <div>
                  <span className="section-marker" />
                  <h2>Быстрый доступ</h2>
                </div>
              </div>

              <div className="quick-grid">
                <button className="quick-card" onClick={() => setActiveTab('Profiles')}>
                  <span className="quick-icon red"><Icon name="folder" /></span>
                  <span>
                    <strong>Локальные профили</strong>
                    <small>Быстрая загрузка профилей</small>
                  </span>
                </button>
                <button className="quick-card" onClick={() => setActiveTab('Mods')}>
                  <span className="quick-icon dark-red"><Icon name="mods" /></span>
                  <span>
                    <strong>Моды</strong>
                    <small>Модпаки, ресурсы и шейдеры</small>
                  </span>
                </button>
                <button className="quick-card" onClick={() => setActiveTab('Skins')}>
                  <span className="quick-icon wine"><Icon name="shirt" /></span>
                  <span>
                    <strong>Скины</strong>
                    <small>Библиотека скинов и плащей</small>
                  </span>
                </button>
                <button className="quick-card" onClick={() => setActiveTab('Settings')}>
                  <span className="quick-icon ember"><Icon name="settings" /></span>
                  <span>
                    <strong>Настройки</strong>
                    <small>Java, RAM и запуск</small>
                  </span>
                </button>
              </div>
            </div>

            <aside className="dashboard-side-column">
              <section className="side-widget profile-widget">
                <div className="widget-title-row">
                  <span className="section-marker" />
                  <h2>Ваш профиль</h2>
                  <button className="icon-button" onClick={() => setActiveTab('Settings')} title="Настройки">
                    <Icon name="settings" />
                  </button>
                </div>
                <div className="profile-widget-body">
                  <button className={`user-avatar big-avatar ${launcherAvatar ? 'has-image' : ''}`} onClick={() => setActiveTab('Settings')} aria-label="Открыть настройки профиля">
                    {launcherAvatar ? <img src={launcherAvatar} alt="" /> : userInitials}
                  </button>
                  <div>
                    <div className="user-name">{launcherProfileName}</div>
                    <div className="user-email">{launcherProfileSubtitle}</div>
                  </div>
                </div>
                <button className="outline-button sidebar-wide-button" onClick={() => setActiveTab(auth.loggedIn ? 'Profiles' : 'Settings')}>
                  <Icon name={auth.loggedIn ? 'profiles' : 'user'} />
                  {auth.loggedIn ? 'Мои профили' : 'Войти в аккаунт'}
                </button>
              </section>

              <section className="side-widget friends-widget">
                <div className="widget-title-row">
                  <h2>Друзья</h2>
                  <span className="online-label">0 онлайн</span>
                </div>
                <div className="empty-friends">
                  <Icon name="friends" />
                  <p>Войдите, чтобы видеть статус друзей и играть вместе.</p>
                </div>
              </section>

              <section className="side-widget stats-widget">
                <div className="widget-title-row">
                  <h2>Статистика</h2>
                </div>
                <div className="stats-grid compact-stats">
                  <div className="stat-card">
                    <div className="stat-header">
                      <span className="stat-label">Версий установлено</span>
                      <span className="stat-value">{installed.length}</span>
                    </div>
                    <div className="stat-bar">
                      <motion.div className="stat-bar-fill" initial={{ width: 0 }} animate={{ width: `${Math.min(100, installed.length * 10)}%` }} transition={{ duration: 1, delay: 0.2 }} />
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-header">
                      <span className="stat-label">Профилей</span>
                      <span className="stat-value">{profiles.length}</span>
                    </div>
                    <div className="stat-bar">
                      <motion.div className="stat-bar-fill" initial={{ width: 0 }} animate={{ width: `${Math.min(100, profiles.length * 20)}%` }} transition={{ duration: 1, delay: 0.4 }} />
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-header">
                      <span className="stat-label">RAM выделено</span>
                      <span className="stat-value">{ramLabel}</span>
                    </div>
                    <div className="stat-bar">
                      <motion.div className="stat-bar-fill" initial={{ width: 0 }} animate={{ width: ramBarWidth }} transition={{ duration: 1, delay: 0.6 }} />
                    </div>
                  </div>
                </div>
              </section>

              <div className="social-row">
                {socialLinks.map((link) => (
                  <a
                    key={link.id}
                    className="social-button"
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    title={link.title}
                    aria-label={link.title}
                    onClick={(event) => openExternalLink(event, link.url)}
                  >
                    <Icon name={link.icon} />
                  </a>
                ))}
              </div>
              <div className="launcher-footnote">KuroLauncher {APP_VERSION} • 2026</div>
            </aside>
          </section>
        )}

        {activeTab === 'Versions' && (
          <section className="versions-grid scrollable-content">
            <div className="panel panel large">
              <div className="panel-title">Доступные версии ({filteredVersions.length})</div>

              <div className="version-filters">
                <div className="filter-group">
                  <label>Поиск версии:</label>
                  <input
                    type="text"
                    placeholder="Введите ID версии..."
                    value={versionSearch}
                    onChange={(e) => setVersionSearch(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="filter-group">
                  <label>Тип версии:</label>
                  <div className="filter-buttons">
                    {[
                      { value: 'all', label: 'Все' },
                      { value: 'release', label: 'Релизы' },
                      { value: 'snapshot', label: 'Снапшоты' },
                      { value: 'old_beta', label: 'Бета' },
                      { value: 'old_alpha', label: 'Альфа' }
                    ].map(filter => (
                      <button
                        key={filter.value}
                        className={`filter-btn ${versionFilter === filter.value ? 'active' : ''}`}
                        onClick={() => setVersionFilter(filter.value)}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="version-list">
                {currentVersions.map((version) => (
                  <article key={version.id} className="version-card">
                    <div>
                      <div className="version-id">{version.id}</div>
                      <div className="version-meta">{version.type} • {new Date(version.releaseTime).toLocaleDateString()}</div>
                    </div>
                    <button
                      className="outline-button"
                      disabled={installingVersion === version.id}
                      onClick={() => installVersion(version.id)}
                    >
                      {installingVersion === version.id ? 'Установка...' : 'Установить'}
                    </button>
                  </article>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    ‹ Предыдущая
                  </button>

                  <div className="pagination-info">
                    Страница {currentPage} из {totalPages}
                  </div>

                  <button
                    className="pagination-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Следующая ›
                  </button>
                </div>
              )}
            </div>

            <div className="panel panel small installed-versions-panel">
              <div className="panel-title">Установленные</div>
              <div className="installed-list installed-version-list">
                {installed.length === 0 && <div className="hint">Нет установленных версий</div>}
                {installed.map((item) => (
                  <div key={item.id} className="installed-item installed-version-item">
                    <div className="installed-version-main">
                      <span className="installed-version-id" title={item.id}>{item.id}</span>
                      <span className="installed-version-status">{item.status}</span>
                    </div>
                    <div className="installed-version-actions">
                      <button
                        className="outline-button delete-button installed-version-delete"
                        onClick={() => deleteInstalledVersion(item.id)}
                        disabled={isBusy}
                        title={`Удалить ${item.id}`}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'Profiles' && (
          <section className="profiles-grid scrollable-content">
            <div className="panel panel small">
              <div className="panel-title">Профили</div>
              <div className="profiles-list">
                {profiles.map((profile) => (
                  <article
                    key={profile.id}
                    className={`profile-card ${selectedProfile === profile.id ? 'selected' : ''}`}
                    onClick={() => setSelectedProfile(profile.id)}
                  >
                    <div className="profile-details">
                      <div className="profile-card-top">
                        <div className="profile-name">{profile.name}</div>
                        {profile.modpackPath && <span className="profile-badge">Модпак</span>}
                      </div>
                      <div className="profile-meta">
                        {profile.versionId}
                        {profile.loader !== 'vanilla' ? ` • ${profile.loader.charAt(0).toUpperCase() + profile.loader.slice(1)}` : ''}
                        {profile.loaderVersion ? ` ${profile.loaderVersion}` : ''}
                      </div>
                      <div className="profile-chip-row">
                        <span className="profile-chip">{formatProfileRam(profile, settings)}</span>
                        <span className="profile-chip">{profile.javaPath && profile.javaPath !== settings.javaPath ? 'Java: своя' : 'Java: общая'}</span>
                        <span className="profile-chip">{formatProfileFullscreen(profile.fullscreenMode)}</span>
                      </div>
                    </div>
                    <div className="profile-actions">
                      <button
                        className="button launch-button"
                        onClick={(e) => {
                          e.stopPropagation()
                          launchProfile(profile)
                        }}
                        disabled={gameRunning}
                      >
                        {gameRunning ? 'Игра запущена' : 'Запустить'}
                      </button>
                      <button
                        className="outline-button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedProfile(profile.id)
                          setEditingProfileId(profile.id)
                        }}
                      >
                        Настроить
                      </button>
                      <button
                        className="btn btn-ghost delete-button"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteProfile(profile.id)
                        }}
                      >
                        Удалить
                      </button>
                    </div>
                  </article>
                ))}
                {profiles.length === 0 && <div className="hint">Создайте профиль для запуска</div>}
              </div>
            </div>

            <div className="panel panel large">
              <div className={`profile-config-panel ${editingProfile ? '' : 'profile-config-panel-muted'}`}>
                <div className="profile-panel-header">
                  <div className="panel-title">{editingProfile ? `Настройка: ${editingProfile.name}` : 'Новый профиль'}</div>
                  {editingProfile && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setEditingProfileId(null)}
                    >
                      Назад к созданию
                    </button>
                  )}
                </div>

                {editingProfile ? (
                  <ProfileForm
                    key={`edit-${editingProfile.id}`}
                    onSave={saveProfileSettings}
                    settings={settings}
                    installed={installed}
                    availableLoaderVersions={availableLoaderVersions}
                    loaderVersionLoading={loaderVersionLoading}
                    ramOptions={profileRamOptions}
                    resetTrigger={profileFormResetTrigger}
                    onLoaderVersionChange={(versionId, loader) => fetchLoaderVersions(versionId, loader as any)}
                    showAlert={showAlert}
                    initialProfile={editingProfile}
                    mode="edit"
                    submitLabel="Сохранить настройки профиля"
                    onCancel={() => setEditingProfileId(null)}
                  />
                ) : (
                  <ProfileForm
                    onSave={saveNewProfile}
                    settings={settings}
                    installed={installed}
                    availableLoaderVersions={availableLoaderVersions}
                    loaderVersionLoading={loaderVersionLoading}
                    ramOptions={profileRamOptions}
                    resetTrigger={profileFormResetTrigger}
                    onLoaderVersionChange={(versionId, loader) => fetchLoaderVersions(versionId, loader as any)}
                    showAlert={showAlert}
                    mode="create"
                    submitLabel="Создать профиль"
                  />
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'Mods' && (
          <section className="modrinth-grid scrollable-content">
            <div className="panel panel large">
              <div className="panel-title">Модпаки</div>
              <div className="modpack-workbench">
                <div className="modpack-workbench-panel">
                  <div className="workbench-title">Цель установки</div>
                  <CustomSelect
                    options={modpackTargetOptions}
                    value={selectedModpackTarget}
                    onChange={(val: string) => setSelectedModpackTarget(val)}
                    placeholder="Выберите модпак"
                  />
                  {selectedModpackProfile ? (
                    <div className="target-summary">
                      <div className="target-name">{selectedModpackProfile.name}</div>
                      <div className="target-chip-row">
                        <span className="target-chip">{selectedModpackProfile.versionId}</span>
                        <span className="target-chip">{formatLoaderName(selectedModpackProfile.loader, selectedModpackProfile.loaderVersion)}</span>
                        <span className="target-chip">{formatProfileRam(selectedModpackProfile, settings)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="target-warning">Перед установкой модов, ресурспаков или шейдеров выберите модпак.</div>
                  )}
                </div>

                <div className="modpack-workbench-panel">
                  <div className="workbench-title">Создать свой модпак</div>
                  <div className="modpack-create-grid">
                    <label>
                      Название
                      <input
                        value={modpackCreateForm.name}
                        onChange={(e) => setModpackCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Например Kuro Survival"
                      />
                    </label>
                    <label>
                      Версия Minecraft
                      <CustomSelect
                        options={[{ value: '', label: 'Выберите версию' }, ...versionSelectOptions]}
                        value={modpackCreateForm.versionId}
                        onChange={(val: string) => setModpackCreateForm((prev) => ({ ...prev, versionId: val, loaderVersion: '' }))}
                        placeholder="Версия"
                      />
                    </label>
                    <label>
                      Модлоадер
                      <CustomSelect
                        options={[
                          { value: 'forge', label: 'Forge' },
                          { value: 'fabric', label: 'Fabric' },
                          { value: 'quilt', label: 'Quilt' },
                          { value: 'neoforge', label: 'NeoForge' },
                          { value: 'vanilla', label: 'Vanilla' }
                        ]}
                        value={modpackCreateForm.loader}
                        onChange={(val: Profile['loader']) => setModpackCreateForm((prev) => ({ ...prev, loader: val, loaderVersion: '' }))}
                        placeholder="Модлоадер"
                      />
                    </label>
                    <label>
                      Версия модлоадера
                      <CustomSelect
                        options={[
                          { value: '', label: modpackCreateForm.loader === 'vanilla' ? 'Не требуется' : modpackCreateLoaderLoading ? 'Загрузка...' : 'Выберите версию' },
                          ...modpackCreateLoaderVersions
                        ]}
                        value={modpackCreateForm.loaderVersion}
                        onChange={(val: string) => setModpackCreateForm((prev) => ({ ...prev, loaderVersion: val }))}
                        placeholder="Версия модлоадера"
                        disabled={modpackCreateForm.loader === 'vanilla' || modpackCreateLoaderLoading}
                      />
                    </label>
                    <button className="button" onClick={createCustomModpack} disabled={modpackCreateLoading || modpackCreateLoaderLoading}>
                      Создать модпак
                    </button>
                  </div>
                </div>
              </div>

              <div className="panel-title" style={{ marginTop: 18 }}>Браузер Modrinth</div>
              {selectedModpackProfile && isTargetedModrinthType && (
                <div className="modrinth-filter-note">
                  Поиск дополнений идёт под выбранный модпак: {selectedModpackProfile.versionId} • {formatLoaderName(selectedModpackProfile.loader, selectedModpackProfile.loaderVersion)}
                </div>
              )}
              <div className="form-grid">
                <label>
                  Поиск
                  <input value={modrinthQuery} onChange={(e) => setModrinthQuery(e.target.value)} placeholder="Имя мода, текст или ID" />
                </label>
                <label>
                  Версия Minecraft
                  <input
                    value={effectiveModrinthVersion}
                    onChange={(e) => setModrinthSearchVersion(e.target.value)}
                    placeholder="Например 1.20.1"
                    disabled={Boolean(selectedModpackProfile && isTargetedModrinthType)}
                  />
                </label>
                <label>
                  Загрузчик
                  <CustomSelect
                    options={[
                      { value: '', label: 'Любой' },
                      { value: 'fabric', label: 'Fabric' },
                      { value: 'forge', label: 'Forge' },
                      { value: 'quilt', label: 'Quilt' },
                      { value: 'neoforge', label: 'NeoForge' }
                    ]}
                    value={effectiveModrinthLoader}
                    onChange={(val: string) => setModrinthSearchLoader(val)}
                    placeholder="Загрузчик"
                    disabled={Boolean(selectedModpackProfile && isTargetedModrinthType)}
                  />
                </label>
                <label>
                  Тип контента
                  <CustomSelect
                    options={[
                      { value: 'all', label: 'Все' },
                      { value: 'mod', label: 'Моды' },
                      { value: 'modpack', label: 'Модпаки' },
                      { value: 'resourcepack', label: 'Ресурсы' },
                      { value: 'shader', label: 'Шейдеры' }
                    ]}
                    value={modrinthSearchType}
                    onChange={(val: string) => setModrinthSearchType(val)}
                    placeholder="Тип"
                  />
                </label>
                <button className="button" onClick={() => searchModrinth(1)} disabled={modrinthLoading}>Искать</button>
              </div>

              <div className="panel-title" style={{ marginTop: 18 }}>
                Результаты поиска {modrinthTotalHits ? `(${modrinthTotalHits} найдено)` : ''}
              </div>
              <div className="search-results grid">
                {modrinthLoading && <div className="hint">Загрузка результатов...</div>}
                {!modrinthLoading && modrinthSearchResults.length === 0 && <div className="hint">Нет результатов. Попробуйте другой запрос или смените фильтры.</div>}
                {modrinthSearchResults.map((item) => (
                  <article key={item.id} className="search-card modrinth-card">
                    <div className="search-card-header">
                      <img src={item.icon_url || ''} alt={item.title || item.name} className="search-card-icon" />
                      <div>
                        <div className="search-title">{item.title || item.name}</div>
                        <div className="search-meta">{item.project_type} • {item.primary_category || item.loader_type || 'Без категории'}</div>
                      </div>
                    </div>
                    <div className="search-body">
                      <p>{item.description ? item.description.slice(0, 160) : 'Описание отсутствует.'}</p>
                      <div className="search-tags">
                        {Array.isArray(item.categories) && item.categories.slice(0, 4).map((category: any) => (
                          <span key={category} className="tag">{category}</span>
                        ))}
                      </div>
                    </div>
                    <div className="search-footer">
                      <div>
                        <span className="small-text">Загрузки: {item.downloads ?? 0}</span>
                        <span className="small-text">   Версий: {item.versions?.length ?? 0}</span>
                      </div>
                      <button className="outline-button" onClick={() => installModrinthProject(item)} disabled={modrinthLoading || isBusy}>
                        {item.project_type === 'modpack' ? 'Скачать модпак' : 'Скачать'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {modrinthTotalHits > 20 && (
                <div className="pagination" style={{ marginTop: 16 }}>
                  <button className="pagination-btn" disabled={modrinthPage <= 1 || modrinthLoading} onClick={() => searchModrinth(modrinthPage - 1)}>‹ Назад</button>
                  <div className="pagination-info">Страница {modrinthPage} из {Math.ceil(modrinthTotalHits / 20)}</div>
                  <button className="pagination-btn" disabled={modrinthPage >= Math.ceil(modrinthTotalHits / 20) || modrinthLoading} onClick={() => searchModrinth(modrinthPage + 1)}>Вперёд ›</button>
                </div>
              )}
            </div>

            <div className="panel panel small">
              <div className="panel-title">Установленные дополнения</div>
              <div className="installed-list">
                {modrinthInstalledAddons.length === 0 && Object.keys(organizedAddons.modpacks).length === 0 && (
                  <div className="hint">Пока нет установленных модов/шейдеров/ресурсов.</div>
                )}

                {organizedAddons.standaloneTotal > 0 && (
                  <div className="modpack-section">
                    <div
                      className="modpack-header"
                      onClick={() => {
                        setStandaloneExpanded(!standaloneExpanded)
                        if (!standaloneExpanded) setExpandedModpacks(new Set())
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="modpack-title">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{
                            marginRight: 8,
                            transform: standaloneExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                          }}
                        >
                          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 8 }}>
                          <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z" stroke="currentColor" strokeWidth="1.6"/>
                          <path d="m8 5 4-3 4 3" stroke="currentColor" strokeWidth="1.6"/>
                        </svg>
                        Отдельные дополнения
                        <span className="modpack-subtitle">
                          {organizedAddons.standaloneTotal} дополнений
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          className="outline-button delete-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteAllStandalone()
                          }}
                          style={{ fontSize: 12, padding: '4px 8px' }}
                        >
                          Удалить все
                        </button>
                      </div>
                    </div>

                    {standaloneExpanded && (
                      <motion.div
                        className="modpack-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="addon-category-grid">
                          {renderAddonCategory('standalone', 'mods', organizedAddons.standalone.mods, getDefaultAddonCategory(organizedAddons.standalone))}
                          {renderAddonCategory('standalone', 'resourcepacks', organizedAddons.standalone.resourcepacks, getDefaultAddonCategory(organizedAddons.standalone))}
                          {renderAddonCategory('standalone', 'shaderpacks', organizedAddons.standalone.shaderpacks, getDefaultAddonCategory(organizedAddons.standalone))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {Object.values(organizedAddons.modpacks).map((pack: any) => {
                  const isExpanded = expandedModpacks.has(pack.key)
                  const categoryCounts = {
                    mods: pack.categories.mods.length,
                    resourcepacks: pack.categories.resourcepacks.length,
                    shaderpacks: pack.categories.shaderpacks.length
                  }
                  const defaultCategory = getDefaultAddonCategory(pack.categories)

                  return (
                    <div key={pack.key} className="modpack-section">
                      <div className="modpack-header" onClick={() => toggleModpackExpansion(pack.key)} style={{ cursor: 'pointer' }}>
                        <div className="modpack-title">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{
                              marginRight: 8,
                              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s'
                            }}
                          >
                            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <div className="modpack-title-stack">
                            <span>{pack.title}</span>
                            <span className="modpack-subtitle">
                              {pack.gameVersion || 'Версия не указана'} • {formatLoaderName(pack.loader, pack.loaderVersion)} • {pack.total} дополнений
                            </span>
                            <span className="modpack-category-pills">
                              <span>Моды {categoryCounts.mods}</span>
                              <span>Рес. {categoryCounts.resourcepacks}</span>
                              <span>Шейд. {categoryCounts.shaderpacks}</span>
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            className="outline-button delete-button"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteModpack(pack.key, pack.title)
                            }}
                            style={{ fontSize: 12, padding: '4px 8px' }}
                            aria-label={`Удалить модпак ${pack.title}`}
                            title="Удалить модпак"
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <motion.div
                          className="modpack-content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="addon-category-grid">
                            {renderAddonCategory(pack.key, 'mods', pack.categories.mods, defaultCategory)}
                            {renderAddonCategory(pack.key, 'resourcepacks', pack.categories.resourcepacks, defaultCategory)}
                            {renderAddonCategory(pack.key, 'shaderpacks', pack.categories.shaderpacks, defaultCategory)}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'Settings' && (
          <section className="settings-grid">
            <div className="panel large">
              <div className="panel-title">Настройки</div>
              <div className="form-grid">
                <label>
                  Акцент
                  <div style={{ marginTop: 8 }}>
                    <CustomSelect
                      options={[
                        { value: 'red', label: 'Красный' },
                        { value: 'violet', label: 'Фиолетовый' },
                        { value: 'white', label: 'Белый' }
                      ]}
                      value={settings.accent || 'red'}
                      onChange={(val: string) => setSettings({ ...settings, accent: val as 'red' | 'violet' | 'white' })}
                      placeholder="Выберите акцент"
                    />
                  </div>
                </label>
                <label>
                  Тема
                  <div style={{ marginTop: 8 }}>
                    <CustomSelect
                      options={[{ value: 'dark', label: 'Тёмная' }, { value: 'light', label: 'Светлая' }]}
                      value={settings.theme}
                      onChange={(val: string) => setSettings({ ...settings, theme: val as Settings['theme'] })}
                      placeholder="Выберите тему"
                    />
                  </div>
                </label>
                <label>
                  Путь к Java
                  <input value={settings.javaPath} onChange={(e) => setSettings({ ...settings, javaPath: e.target.value })} />
                </label>
                <label>
                  Память (RAM)
                  <div style={{ marginTop: 8 }}>
                    <CustomSelect
                      options={ramOptions}
                      value={settings.ram || 'auto'}
                      onChange={(val: string) => setSettings({ ...settings, ram: val })}
                      placeholder="Выберите память"
                    />
                  </div>
                </label>
                <button
                  type="button"
                  className={`settings-toggle-card ${settings.fullscreen ? 'active' : ''}`}
                  onClick={() => setSettings({ ...settings, fullscreen: !settings.fullscreen })}
                  aria-pressed={settings.fullscreen}
                >
                  <div className="settings-toggle-copy">
                    <span className="settings-toggle-eyebrow">Запуск</span>
                    <span className="settings-toggle-title">Полноэкранный режим</span>
                    <span className="settings-toggle-text">
                      Minecraft будет открываться сразу на весь экран при запуске из лаунчера.
                    </span>
                  </div>
                  <span className={`settings-toggle-pill ${settings.fullscreen ? 'active' : ''}`}>
                    <span className="settings-toggle-thumb" />
                  </span>
                </button>
                <button className="button" onClick={handleSaveSettings}>Сохранить настройки</button>
              </div>
            </div>

            <div className="panel small auth-panel">
              <div className="panel-title">Авторизация</div>
              <label>
                Email
                <input value={loginState.email} onChange={(e) => setLoginState({ ...loginState, email: e.target.value })} />
              </label>
              <label>
                Пароль
                <input type="password" value={loginState.password} onChange={(e) => setLoginState({ ...loginState, password: e.target.value })} />
              </label>
              <div className="button-row">
                <button className="outline-button" onClick={() => setRegisterMode(!registerMode)}>{registerMode ? 'Войти' : 'Регистрация'}</button>
                <button className="button" onClick={handleLogin}>{registerMode ? 'Зарегистрироваться' : 'Войти'}</button>
              </div>
              <p className="hint">Локальная авторизация хранится безопасно в хранилище KuroLauncher.</p>
            </div>

            <div className="panel profile-settings-panel">
              <div className="profile-settings-heading">
                <div>
                  <div className="panel-title">Профиль лаунчера</div>
                  <p className="profile-settings-caption">Имя, статус и аватар для интерфейса KuroLauncher.</p>
                </div>
                <span className="profile-settings-badge">{auth.loggedIn ? 'Аккаунт' : 'Локальный'}</span>
              </div>

              <div className="profile-settings-layout">
                <div className="profile-settings-preview">
                  <div className="profile-settings-avatar-stack">
                    <label className={`profile-settings-avatar ${launcherAvatar ? 'has-image' : ''}`}>
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarUpload} aria-label="Выбрать аватар профиля" />
                      {launcherAvatar ? <img src={launcherAvatar} alt="" /> : <span>{userInitials}</span>}
                    </label>
                    <div className="profile-settings-avatar-actions">
                      <label className="outline-button profile-avatar-upload">
                        Выбрать аватар
                        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarUpload} aria-label="Выбрать аватар профиля" />
                      </label>
                      <button className="outline-button" onClick={() => setSettings({ ...settings, avatarDataUrl: '' })}>
                        Сбросить аватар
                      </button>
                    </div>
                  </div>
                  <div className="profile-settings-preview-copy">
                    <strong>{launcherProfileName}</strong>
                    <span>{launcherProfileSubtitle}</span>
                  </div>
                </div>

                <div className="profile-settings-form">
                  <label>
                    Имя в лаунчере
                    <input
                      value={settings.profileName || ''}
                      maxLength={32}
                      placeholder={auth.loggedIn ? 'Пользователь' : 'Гость'}
                      onChange={(e) => setSettings({ ...settings, profileName: e.target.value.slice(0, 32) })}
                    />
                  </label>
                  <label className="profile-settings-wide">
                    Статус
                    <textarea
                      value={settings.profileStatus || ''}
                      maxLength={80}
                      rows={2}
                      placeholder="Готов к запуску"
                      onChange={(e) => setSettings({ ...settings, profileStatus: e.target.value.slice(0, 80) })}
                    />
                  </label>
                  <button className="button profile-settings-save" onClick={handleSaveSettings}>
                    Сохранить профиль
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      </div>

      {/* Custom Confirm/Alert Dialog */}
      {confirmDialog && (
        <div className="modal-overlay" onClick={() => confirmDialog!.onCancel?.()}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{confirmDialog!.onCancel ? 'Подтверждение' : 'Внимание'}</h3>
            <p>{confirmDialog!.message}</p>
            <div className="modal-actions">
              {confirmDialog!.onCancel && (
                <button className="outline-button" onClick={() => confirmDialog!.onCancel?.()}>Отмена</button>
              )}
              <button className="btn btn-primary" onClick={() => confirmDialog!.onConfirm()}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
