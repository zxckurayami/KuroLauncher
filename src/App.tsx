import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
const logoIcon = new URL('../logo/KuroLauncher.png', import.meta.url).href

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
  username: string
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
}

type AuthState = {
  email: string
  loggedIn: boolean
}

type LaunchConsoleEntry = {
  id: number
  message: string
  tone: 'info' | 'success' | 'error'
}

const tabs = [
  { id: 'Dashboard', label: 'Главная' },
  { id: 'Versions', label: 'Версии' },
  { id: 'Profiles', label: 'Профили' },
  { id: 'Settings', label: 'Настройки' },
  { id: 'Mods', label: 'Моды' },
  { id: 'Skins', label: 'Скины' }
] as const

const defaultSteveSkinUrl = new URL('../skins/default-skin.png', import.meta.url).href

type Tab = typeof tabs[number]['id']

function createProfileDraft(settings: Settings, initialProfile?: Partial<Profile>) {
  return {
    name: initialProfile?.name || '',
    versionId: initialProfile?.versionId || '',
    ram: initialProfile?.ram || 'auto',
    javaPath: initialProfile?.javaPath || settings.javaPath,
    username: initialProfile?.username || '',
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
      <div className="form-group">
        <label className="form-label">Никнейм</label>
        <input
          className="form-input"
          value={formData.username}
          onChange={(e) => updateFormData({ username: e.target.value })}
          placeholder="Ваш никнейм"
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
    fullscreen: false
  }

const newsItems = [
  {
    title: 'KuroLauncher 0.1.0',
    body: 'Стартовая версия лаунчера с загрузкой версий, профилями и атмосферным интерфейсом.'
  },
  {
    title: 'Локальные профили и скины',
    body: 'Быстрая загрузка профилей и локальных скинов без лишних задержек — играйте на своих условиях.'
  },
  {
    title: 'Современный UI',
    body: 'Тёмная японская тема, glassmorphism и анимации для премиальному UX.'
  }
]

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard')
  const [isMaximized, setIsMaximized] = useState(false)
  const [versions, setVersions] = useState<VersionItem[]>([])
  const [installed, setInstalled] = useState<InstalledVersion[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [status, setStatus] = useState<string>('Готово')
  const [auth, setAuth] = useState<AuthState>({ email: '', loggedIn: false })
  const [loginState, setLoginState] = useState({ email: '', password: '' })
  const [registerMode, setRegisterMode] = useState(false)
  const [installingVersion, setInstallingVersion] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [progressInfo, setProgressInfo] = useState<{ label: string; current?: number; total?: number } | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null)
  const [launchConsoleOpen, setLaunchConsoleOpen] = useState(false)
  const [launchConsolePhase, setLaunchConsolePhase] = useState<'idle' | 'preparing' | 'started' | 'error'>('idle')
  const [launchConsoleEntries, setLaunchConsoleEntries] = useState<LaunchConsoleEntry[]>([])

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
  const [expandedModpacks, setExpandedModpacks] = useState<Set<string>>(new Set())
  const [standaloneExpanded, setStandaloneExpanded] = useState(true)
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
  const launchConsoleViewportRef = useRef<HTMLDivElement | null>(null)
  const isLaunchConsoleView = useMemo(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('view') === 'launch-console',
    []
  )

  const pushLaunchConsoleEntry = (message: string, tone: LaunchConsoleEntry['tone'] = 'info') => {
    const normalized = String(message || '').trim()
    if (!normalized) return

    setLaunchConsoleEntries((prev) => {
      const next = [...prev, { id: Date.now() + Math.random(), message: normalized, tone }]
      return next.slice(-220)
    })
  }

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

  const userInitials = useMemo(() => {
    const source = auth.loggedIn ? auth.email : 'Гость'
    const normalized = source.replace(/@.*$/, '').split(/[^a-zA-Z0-9а-яА-Я]+/).filter(Boolean)
    const initials = normalized.slice(0, 2).map((part) => part[0].toUpperCase()).join('')
    return initials ? initials.slice(0, 2) : 'GU'
  }, [auth])

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

  useEffect(() => {
    if ((!launchConsoleOpen && !isLaunchConsoleView) || !launchConsoleViewportRef.current) return
    const element = launchConsoleViewportRef.current
    element.scrollTop = element.scrollHeight
  }, [launchConsoleEntries, launchConsoleOpen, isLaunchConsoleView])

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
    if (isLaunchConsoleView) return
    const wc = (window as any).windowControls
    if (!wc) return
    wc.isMaximized().then((v: boolean) => setIsMaximized(Boolean(v))).catch(() => {})
    const listener = (_event: any, value: boolean) => setIsMaximized(Boolean(value))
    wc.onMaximizeChange(listener)
    return () => wc.removeMaximizeChange(listener)
  }, [isLaunchConsoleView])

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

  async function loadState() {
    const installedVersions = await window.launcher.getInstalledVersions()
    setInstalled(installedVersions)
    const storedProfiles = await window.launcher.getProfiles()
    const updatedProfiles = storedProfiles.map((p) => ({
      ...p,
      loader: p.loader || 'vanilla',
      loaderVersion: p.loaderVersion || '',
      ram: p.ram || 'auto',
      javaPath: p.javaPath || defaultSettings.javaPath,
      username: p.username || '',
      fullscreenMode: p.fullscreenMode || 'global'
    }))
    setProfiles(updatedProfiles)
    const storedSettings = await window.launcher.getSettings()
    setSettings({ ...defaultSettings, ...storedSettings })
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
  }, [profiles, selectedProfile, editingProfileId])

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
    if (isLaunchConsoleView) {
      window.launcher.getLaunchConsoleState().then((state) => {
        if (!state) return
        setLaunchConsolePhase((state.phase as any) || 'idle')
        setLaunchConsoleEntries(Array.isArray(state.entries) ? state.entries : [])
        if (state.progress) {
          setProgressInfo({ label: 'Запуск Minecraft...', current: state.progress.current, total: state.progress.total })
        }
      }).catch(() => {})
      return
    }

    loadMeta()
    loadState()
    loadInstalledAddons()
  }, [isLaunchConsoleView])



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
        version: modrinthSearchVersion,
        loader: modrinthSearchLoader,
        projectType: modrinthSearchType,
        page,
        pageSize: 20
      })
      setModrinthSearchResults(data.hits || [])
      setModrinthTotalHits(data.total_hits || 0)
      setStatus(`Найдено ${data.hits?.length ?? 0} результатов (${data.total_hits ?? 0} всего)`)
    } catch (error: any) {
      console.error('Modrinth search error', error)
      setStatus(`Ошибка поиска Modrinth: ${error?.message || 'проверьте соединение'}`)
      setModrinthSearchResults([])
      setModrinthTotalHits(0)
    } finally {
      setModrinthLoading(false)
    }
  }

  async function installModrinthProject(projectId: string) {
    setIsBusy(true)
    setStatus('Установка Modrinth проекта...')
    try {
      const result = await window.launcher.installModrinthProject(projectId, {
        gameVersion: modrinthSearchVersion || undefined,
        loader: modrinthSearchLoader || undefined
      })
      if (result?.profile) {
        setStatus(`Модпак установлен. Профиль "${result.profile.name}" создан.`)
        await loadState()
      } else {
        setStatus('Проект установлен. Проверьте папку mods.')
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
  }, [activeTab, modrinthSearchType, modrinthSearchLoader, modrinthSearchVersion])

  async function loadInstalledAddons() {
    try {
      const addons = await window.launcher.getInstalledModrinthAddons()
      setModrinthInstalledAddons(addons)
    } catch (error) {
      console.error('Failed to load installed addons:', error)
    }
  }

  function toggleModpackExpansion(modpackId: string) {
    const newExpanded = new Set(expandedModpacks)
    if (newExpanded.has(modpackId)) {
      newExpanded.delete(modpackId)
    } else {
      newExpanded.add(modpackId)
    }
    setExpandedModpacks(newExpanded)
  }

  const organizedAddons = useMemo(() => {
    const modpacks: { [key: string]: any[] } = {}
    const standalone: any[] = []

    modrinthInstalledAddons.forEach(addon => {
      if (addon.origin?.modpackId) {
        const key = `${addon.origin.modpackId}-${addon.origin.modpackVersion || 'latest'}`
        if (!modpacks[key]) {
          modpacks[key] = []
        }
        modpacks[key].push(addon)
      } else {
        standalone.push(addon)
      }
    })

    return { modpacks, standalone }
  }, [modrinthInstalledAddons])

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
        for (const addon of organizedAddons.standalone) {
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
    const launchProgressListener = (_event: any, data: { message: string; progress?: { current: number; total: number }; gameExited?: boolean; gameStarted?: boolean; stream?: string; phase?: string }) => {
      setStatus(data.message)
      setIsBusy(true)

      if (data.phase) {
        setLaunchConsolePhase(data.phase as any)
      }

      const tone: LaunchConsoleEntry['tone'] =
        data.gameStarted
          ? 'success'
          : data.message?.includes('Ошибка') || data.message?.includes('Exception') || data.message?.includes('Error')
            ? 'error'
            : 'info'

      pushLaunchConsoleEntry(data.message, tone)

      if (data.gameExited) {
        setGameRunning(false)
        setIsBusy(false)
        setProgressInfo(null)
        setLaunchConsolePhase('idle')
      } else if (data.gameStarted) {
        setLaunchConsolePhase('started')
        window.setTimeout(() => {
          setLaunchConsoleOpen(false)
        }, 260)
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
    await window.launcher.saveProfile({ ...profileData, id: `${Date.now()}` })
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
    setLaunchConsolePhase('preparing')
    setLaunchConsoleEntries([
      { id: Date.now(), message: `Подготавливаю запуск профиля "${profile.name}"...`, tone: 'info' }
    ])

    try {
      await window.launcher.launchProfile(profile.id)
      setGameRunning(true)
      setStatus(`Игра запущена: ${profile.name}`)
      setProgressInfo(null)
    } catch (error: any) {
      console.error('Launch error', error)
      setStatus(`Ошибка запуска: ${error?.message || 'проверьте Java и установку версии'}`)
      setProgressInfo(null)
      setIsBusy(false)
      setLaunchConsolePhase('error')
      pushLaunchConsoleEntry(`Ошибка запуска: ${error?.message || 'проверьте Java и установку версии'}`, 'error')
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

  async function handleSaveSettings() {
    await window.launcher.saveSettings(settings)
    setStatus('Настройки сохранены')
  }

  const themeClass = settings.theme === 'light' ? 'theme-light' : 'theme-dark'
  const accentColor = settings.accent || 'red'
  
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
    if (isLaunchConsoleView) return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setSettings(s => ({ ...s, theme: e.matches ? 'dark' : 'light' }))
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [isLaunchConsoleView])

  const launchConsolePanel = (
    <div className="launch-console-panel">
      <div className="launch-console-header">
        <div className="launch-console-copy">
          <span className="launch-console-eyebrow">Launch Console</span>
          <h3 className="launch-console-title">Запуск Minecraft</h3>
          <p className="launch-console-subtitle">
            Окно показывает шаги подготовки, загрузку библиотек и сообщения JVM до появления самого Minecraft.
          </p>
        </div>
        <div className="launch-console-header-actions">
          <div className={`launch-console-badge ${launchConsolePhase}`}>
            {launchConsolePhase === 'started'
              ? 'Игра открыта'
              : launchConsolePhase === 'error'
                ? 'Ошибка запуска'
                : 'Подготовка'}
          </div>
          <button
            type="button"
            className="launch-console-close"
            onClick={() => (window as any).windowControls?.close?.()}
            aria-label="Закрыть окно консоли"
          >
            ×
          </button>
        </div>
      </div>

      {progressInfo && (
        <div className="launch-console-progress">
          <div className="launch-console-progress-top">
            <span>{progressInfo.label}</span>
            <span>
              {progressInfo.total
                ? `${Math.min(100, Math.round(((progressInfo.current ?? 0) / progressInfo.total) * 100))}%`
                : 'LIVE'}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: progressInfo.total ? `${Math.min(100, Math.round(((progressInfo.current ?? 0) / progressInfo.total) * 100))}%` : '100%' }}
            />
          </div>
        </div>
      )}

      <div className="launch-console-log" ref={launchConsoleViewportRef}>
        {launchConsoleEntries.length === 0 && (
          <div className="launch-console-empty">Ожидание событий запуска...</div>
        )}
        {launchConsoleEntries.map((entry) => (
          <div key={entry.id} className={`launch-console-line ${entry.tone}`}>
            <span className="launch-console-line-mark" />
            <span className="launch-console-line-text">{entry.message}</span>
          </div>
        ))}
      </div>
    </div>
  )

  if (isLaunchConsoleView) {
    return (
      <div className={`launch-console-shell ${themeClass}`} data-accent={accentColor}>
        <div className="live-bg"></div>
        <div className="noise-overlay"></div>
        {launchConsolePanel}
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="live-bg"></div>
      <div className="noise-overlay"></div>
      <div className="titlebar">
        <div className="titlebar-title">KuroLauncher</div>
        <div className="titlebar-controls">
          <button className="titlebar-btn" onClick={handleMinimize} aria-label="Minimize">
            <svg viewBox="0 0 12 2" xmlns="http://www.w3.org/2000/svg" fill="none">
              <rect x="0" y="0" width="12" height="2" rx="1" fill="currentColor" />
            </svg>
          </button>

          <button className="titlebar-btn" onClick={handleToggleMax} aria-label="Maximize">
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

          <button className="titlebar-btn" onClick={handleClose} aria-label="Close">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
              <path d="M4 4l16 16M20 4L4 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="header glass-panel">
        <div className="header-left">
          <div className="header-logo">
            <img src={logoIcon} alt="KuroLauncher" className="header-logo-icon" />
            <div className="header-logo-text">KuroLauncher</div>
          </div>
          <div className={`header-status ${isBusy ? 'loading' : ''}`}>
            <span className="status-dot"></span>
            {status}
          </div>
        </div>
        <div className="header-right">
          <div className="user-section">
            <button className="user-avatar" onClick={() => setUserMenuOpen((prev) => !prev)}>{userInitials}</button>
            <div className="user-info">
              <div className="user-name">{auth.loggedIn ? 'Пользователь' : 'Гость'}</div>
              <div className="user-email">{auth.loggedIn ? auth.email : 'Не вошёл в систему'}</div>
            </div>
            <div className={`user-dropdown ${userMenuOpen ? 'open' : ''}`}>
              {auth.loggedIn ? (
                <>
                  <button className="outline-button" onClick={() => { setUserMenuOpen(false); setActiveTab('Settings') }}>Профиль</button>
                  <button className="outline-button" onClick={() => { handleLogout(); setUserMenuOpen(false) }}>Выйти</button>
                </>
              ) : (
                <button
                  className="outline-button"
                  onClick={() => {
                    setUserMenuOpen(false)
                    setActiveTab('Settings')
                  }}
                >
                  Войти
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="nav-bar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
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

      <main className="content">
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
          <section className="dashboard-grid">
            <div className="panel">
              <div className="panel-title">Новости</div>
              <div className="news-list">
                {newsItems.map((item, index) => (
                  <motion.article
                    key={item.title}
                    className="news-card animate-fade-in-up"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </motion.article>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-title">Управление</div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">Версий установлено</span>
                    <span className="stat-value">{installed.length}</span>
                  </div>
                  <div className="stat-bar">
                    <motion.div
                      className="stat-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, installed.length * 10)}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">Профилей</span>
                    <span className="stat-value">{profiles.length}</span>
                  </div>
                  <div className="stat-bar">
                    <motion.div
                      className="stat-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, profiles.length * 20)}%` }}
                      transition={{ duration: 1, delay: 0.4 }}
                    />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">RAM использование</span>
                    <span className="stat-value">2.1 GB</span>
                  </div>
                  <div className="stat-bar">
                    <motion.div
                      className="stat-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: '35%' }}
                      transition={{ duration: 1, delay: 0.6 }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '24px' }}>
                <button className="btn btn-primary" onClick={loadMeta}>
                  Обновить версии
                </button>
              </div>
            </div>
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

            <div className="panel panel small">
              <div className="panel-title">Установленные</div>
              <div className="installed-list">
                {installed.length === 0 && <div className="hint">Нет установленных версий</div>}
                {installed.map((item) => (
                  <div key={item.id} className="installed-item">
                    <span>{item.id}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{item.status}</span>
                      <button
                        className="outline-button delete-button"
                        onClick={() => deleteInstalledVersion(item.id)}
                        disabled={isBusy}
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
                        <span className="profile-chip">{profile.ram === 'auto' ? 'RAM: авто' : `RAM: ${profile.ram}`}</span>
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
                    ramOptions={ramOptions}
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
                    ramOptions={ramOptions}
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
              <div className="panel-title">Браузер модов</div>
              <div className="form-grid">
                <label>
                  Поиск
                  <input value={modrinthQuery} onChange={(e) => setModrinthQuery(e.target.value)} placeholder="Имя мода, текст или ID" />
                </label>
                <label>
                  Версия Minecraft
                  <input value={modrinthSearchVersion} onChange={(e) => setModrinthSearchVersion(e.target.value)} placeholder="Например 1.20.1" />
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
                    value={modrinthSearchLoader}
                    onChange={(val: string) => setModrinthSearchLoader(val)}
                    placeholder="Загрузчик"
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
                      <button className="outline-button" onClick={() => installModrinthProject(item.slug)} disabled={modrinthLoading}>Установить</button>
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
                {modrinthInstalledAddons.length === 0 && <div className="hint">Пока нет установленных модов/шейдеров/ресурсов.</div>}

                {/* Standalone addons (not from modpacks) */}
                {organizedAddons.standalone.length > 0 && (
                  <div className="modpack-section">
                    <div className="modpack-header" onClick={() => setStandaloneExpanded(!standaloneExpanded)} style={{ cursor: 'pointer' }}>
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
                        <span style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>
                          {organizedAddons.standalone.length} дополнений
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
                        {organizedAddons.standalone.map((addon) => (
                          <div key={addon.id} className="installed-item">
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                              <span>{addon.name}</span>
                              <span style={{ fontSize: 12, color: '#999' }}>
                                {addon.type} • {addon.enabled ? 'Включен' : 'Отключен'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button className="outline-button" onClick={() => toggleAddon(addon)}>
                                {addon.enabled ? 'Отключить' : 'Включить'}
                              </button>
                              <button className="outline-button delete-button" onClick={() => deleteAddon(addon)}>
                                Удалить
                              </button>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Modpack sections */}
                {Object.entries(organizedAddons.modpacks).map(([modpackKey, addons]) => {
                  const firstAddon = addons[0]
                  const origin = firstAddon.origin
                  const modpackTitle = origin?.projectTitle || origin?.modpackId || 'Modpack'
                  const isExpanded = expandedModpacks.has(modpackKey)

                  return (
                    <div key={modpackKey} className="modpack-section">
                      <div className="modpack-header" onClick={() => toggleModpackExpansion(modpackKey)} style={{ cursor: 'pointer' }}>
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
                          {modpackTitle}
                          <span style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>
                            {origin?.detectedLoader} • {addons.length} дополнений
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            className="outline-button delete-button"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteModpack(modpackKey, modpackTitle)
                            }}
                            style={{ fontSize: 12, padding: '4px 8px' }}
                          >
                            Удалить пак
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
                          {addons.map((addon) => (
                            <div key={addon.id} className="installed-item">
                              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <span>{addon.name}</span>
                                <span style={{ fontSize: 12, color: '#999' }}>
                                  {addon.type} • {addon.enabled ? 'Включен' : 'Отключен'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button className="outline-button" onClick={() => toggleAddon(addon)}>
                                  {addon.enabled ? 'Отключить' : 'Включить'}
                                </button>
                                <button className="outline-button delete-button" onClick={() => deleteAddon(addon)}>
                                  Удалить
                                </button>
                              </div>
                            </div>
                          ))}
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
          </section>
        )}
      </main>

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
