import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
const tabs = [
    { id: 'Dashboard', label: 'Главная' },
    { id: 'Versions', label: 'Версии' },
    { id: 'Profiles', label: 'Профили' },
    { id: 'Settings', label: 'Настройки' },
    { id: 'Mods', label: 'Моды' },
    { id: 'Skins', label: 'Скины' }
];
const defaultSteveSkinUrl = new URL('../skins/default-skin.png', import.meta.url).href;
// Custom select component to replace native <select> for better styling
function CustomSelect({ options, value, onChange, placeholder }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        function onDoc(e) {
            if (!ref.current)
                return;
            if (!ref.current.contains(e.target))
                setOpen(false);
        }
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, []);
    const selected = options.find((o) => o.value === value);
    return (_jsxs("div", { className: "custom-select", ref: ref, children: [_jsxs("button", { type: "button", className: `custom-select-trigger ${!value ? 'placeholder' : ''}`, onClick: () => setOpen((s) => !s), "aria-haspopup": "listbox", "aria-expanded": open, children: [_jsx("span", { className: "trigger-label", children: selected ? selected.label : placeholder }), _jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M7 10l5 5 5-5", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" }) })] }), open && (_jsx("div", { className: "custom-options", role: "listbox", children: options.map((opt) => (_jsx("div", { role: "option", tabIndex: 0, className: `custom-option ${opt.value === value ? 'selected' : ''}`, onMouseDown: (e) => {
                        e.preventDefault();
                        onChange(opt.value);
                        setOpen(false);
                    }, onKeyDown: (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onChange(opt.value);
                            setOpen(false);
                        }
                    }, children: opt.label }, opt.value))) }))] }));
}
// Profile Form Component
function ProfileForm({ onSave, settings, installed, availableLoaderVersions, loaderVersionLoading, ramOptions, resetTrigger, onLoaderVersionChange, showAlert }) {
    const [formData, setFormData] = useState({
        name: '',
        versionId: '',
        ram: 'auto',
        javaPath: settings.javaPath,
        username: '',
        offline: true,
        loader: 'vanilla',
        loaderVersion: ''
    });
    // Reset form when resetTrigger changes
    useEffect(() => {
        setFormData({
            name: '',
            versionId: '',
            ram: 'auto',
            javaPath: settings.javaPath,
            username: '',
            offline: true,
            loader: 'vanilla',
            loaderVersion: ''
        });
    }, [resetTrigger, settings.javaPath]);
    // Auto-fetch loader versions when version or loader changes
    useEffect(() => {
        if (formData.versionId && formData.loader !== 'vanilla') {
            // This would need to be passed from parent or we need to move fetchLoaderVersions logic here
            // For now, we'll handle this in the parent component
        }
    }, [formData.versionId, formData.loader]);
    const handleSubmit = () => {
        if (!formData.name || !formData.versionId) {
            showAlert('Введите имя и выберите версию профиля');
            return;
        }
        onSave(formData);
    };
    const updateFormData = (updates) => {
        const newData = { ...formData, ...updates };
        setFormData(newData);
        // Trigger loader version fetch when version or loader changes
        if (updates.versionId || updates.loader) {
            if (newData.versionId && newData.loader !== 'vanilla') {
                onLoaderVersionChange(newData.versionId, newData.loader);
            }
        }
    };
    return (_jsxs("div", { className: "form-grid", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "\u0418\u043C\u044F \u043F\u0440\u043E\u0444\u0438\u043B\u044F" }), _jsx("input", { className: "form-input", value: formData.name, onChange: (e) => updateFormData({ name: e.target.value }), placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0438\u043C\u044F \u043F\u0440\u043E\u0444\u0438\u043B\u044F" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "\u0412\u0435\u0440\u0441\u0438\u044F" }), _jsx(CustomSelect, { options: [{ value: '', label: 'Выберите версию' }, ...installed.map((it) => ({ value: it.id, label: it.id }))], value: formData.versionId, onChange: (val) => updateFormData({ versionId: val }), placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0432\u0435\u0440\u0441\u0438\u044E" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u0447\u0438\u043A" }), _jsx(CustomSelect, { options: [
                            { value: 'vanilla', label: 'Vanilla' },
                            { value: 'forge', label: 'Forge' },
                            { value: 'fabric', label: 'Fabric' },
                            { value: 'quilt', label: 'Quilt' },
                            { value: 'neoforge', label: 'NeoForge' }
                        ], value: formData.loader, onChange: (val) => updateFormData({ loader: val, loaderVersion: '' }), placeholder: "\u0417\u0430\u0433\u0440\u0443\u0437\u0447\u0438\u043A" })] }), formData.loader !== 'vanilla' && (_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "\u0412\u0435\u0440\u0441\u0438\u044F \u0437\u0430\u0433\u0440\u0443\u0437\u0447\u0438\u043A\u0430" }), _jsx(CustomSelect, { options: loaderVersionLoading
                            ? [{ value: '', label: 'Загрузка...' }]
                            : [{ value: '', label: 'Выберите версию' }, ...availableLoaderVersions], value: formData.loaderVersion || '', onChange: (val) => updateFormData({ loaderVersion: val }), placeholder: loaderVersionLoading ? 'Загрузка...' : 'Выберите версию' })] })), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "RAM" }), _jsx(CustomSelect, { options: ramOptions, value: formData.ram, onChange: (val) => updateFormData({ ram: val }), placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u0430\u043C\u044F\u0442\u044C" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Java \u043F\u0443\u0442\u044C" }), _jsx("input", { className: "form-input", value: formData.javaPath, onChange: (e) => updateFormData({ javaPath: e.target.value }), placeholder: "\u041F\u0443\u0442\u044C \u043A Java" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "\u041D\u0438\u043A\u043D\u0435\u0439\u043C" }), _jsx("input", { className: "form-input", value: formData.username, onChange: (e) => updateFormData({ username: e.target.value }), placeholder: "\u0412\u0430\u0448 \u043D\u0438\u043A\u043D\u0435\u0439\u043C" })] }), _jsxs("label", { className: "checkbox-row", children: [_jsx("span", { children: "\u041E\u0444\u0444\u043B\u0430\u0439\u043D \u0440\u0435\u0436\u0438\u043C" }), _jsx("input", { type: "checkbox", checked: formData.offline, onChange: (e) => updateFormData({ offline: e.target.checked }) })] }), _jsx("button", { className: "btn btn-primary", onClick: handleSubmit, children: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u043F\u0440\u043E\u0444\u0438\u043B\u044C" })] }));
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
];
const defaultSettings = {
    theme: 'dark',
    javaPath: 'java',
    ram: 'auto',
    accent: 'red'
};
const newsItems = [
    {
        title: 'KuroLauncher 0.1.0',
        body: 'Стартовая версия лаунчера с загрузкой версий, профилями и атмосферным интерфейсом.'
    },
    {
        title: 'Новое: оффлайн-режим',
        body: 'Создавайте локальные профили без обязательной авторизации и играйте в режиме оффлайн.'
    },
    {
        title: 'Современный UI',
        body: 'Тёмная японская тема, glassmorphism и анимации для премиальному UX.'
    }
];
function App() {
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [isMaximized, setIsMaximized] = useState(false);
    const [versions, setVersions] = useState([]);
    const [installed, setInstalled] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [settings, setSettings] = useState(defaultSettings);
    const [status, setStatus] = useState('Готово');
    const [auth, setAuth] = useState({ email: '', loggedIn: false });
    const [loginState, setLoginState] = useState({ email: '', password: '' });
    const [registerMode, setRegisterMode] = useState(false);
    const [installingVersion, setInstallingVersion] = useState(null);
    const [isBusy, setIsBusy] = useState(false);
    const [progressInfo, setProgressInfo] = useState(null);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [profileFormResetTrigger, setProfileFormResetTrigger] = useState(0); // Trigger for form reset
    const [availableLoaderVersions, setAvailableLoaderVersions] = useState([]);
    const [loaderVersionLoading, setLoaderVersionLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [versionsPerPage] = useState(20);
    const [versionFilter, setVersionFilter] = useState('all');
    const [versionSearch, setVersionSearch] = useState('');
    const [gameRunning, setGameRunning] = useState(false);
    const [modrinthQuery, setModrinthQuery] = useState('');
    const [modrinthSearchVersion, setModrinthSearchVersion] = useState('');
    const [modrinthSearchLoader, setModrinthSearchLoader] = useState('');
    const [modrinthSearchType, setModrinthSearchType] = useState('mod');
    const [modrinthSearchResults, setModrinthSearchResults] = useState([]);
    const [modrinthPage, setModrinthPage] = useState(1);
    const [modrinthTotalHits, setModrinthTotalHits] = useState(0);
    const [modrinthLoading, setModrinthLoading] = useState(false);
    const [modrinthInstalledAddons, setModrinthInstalledAddons] = useState([]);
    const [skinFile, setSkinFile] = useState(null);
    const [skinDataUrl, setSkinDataUrl] = useState(null);
    const [skinModel, setSkinModel] = useState('classic');
    const [profileSkinUrl, setProfileSkinUrl] = useState(defaultSteveSkinUrl);
    const [skinUploading, setSkinUploading] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const fileInputRef = useRef(null);
    const skinViewerContainerRef = useRef(null);
    const viewerRef = useRef(null);
    // Custom confirm dialog - doesn't steal focus like window.confirm
    const showConfirm = (message) => {
        return new Promise((resolve) => {
            setConfirmDialog({
                message,
                onConfirm: () => {
                    setConfirmDialog(null);
                    resolve(true);
                },
                onCancel: () => {
                    setConfirmDialog(null);
                    resolve(false);
                }
            });
        });
    };
    // Custom alert dialog - doesn't steal focus like window.alert
    const showAlert = (message) => {
        setConfirmDialog({
            message,
            onConfirm: () => setConfirmDialog(null)
        });
    };
    const activeProfile = useMemo(() => profiles.find((profile) => profile.id === selectedProfile), [profiles, selectedProfile]);
    useEffect(() => {
        async function syncProfileSkin() {
            setSkinFile(null);
            setSkinDataUrl(null);
            if (!activeProfile) {
                setSkinModel('classic');
                setProfileSkinUrl(defaultSteveSkinUrl);
                return;
            }
            setSkinModel(activeProfile.skin?.model === 'slim' ? 'slim' : 'classic');
            const defaultUrl = activeProfile.skin?.url || defaultSteveSkinUrl;
            setProfileSkinUrl(defaultUrl);
            if (!activeProfile.skin?.url) {
                try {
                    const url = await window.launcher.getSkinUrl(activeProfile.id);
                    setProfileSkinUrl(url || defaultUrl);
                }
                catch (e) {
                    setProfileSkinUrl(defaultUrl);
                }
            }
        }
        syncProfileSkin();
    }, [activeProfile, defaultSteveSkinUrl]);
    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const target = event.target;
            if (!target.closest('.user-section')) {
                setUserMenuOpen(false);
            }
        };
        if (userMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [userMenuOpen]);
    // Initialize dynamic 3D viewer (skinview3d) if available; fallback to 2D image
    useEffect(() => {
        let mounted = true;
        async function initViewer() {
            const container = skinViewerContainerRef.current;
            if (!container)
                return;
            const skinUrl = skinDataUrl || profileSkinUrl || defaultSteveSkinUrl;
            const destroyViewer = () => {
                try {
                    if (viewerRef.current && typeof viewerRef.current.destroy === 'function')
                        viewerRef.current.destroy();
                    if (viewerRef.current && viewerRef.current.controls && typeof viewerRef.current.controls.dispose === 'function')
                        viewerRef.current.controls.dispose();
                }
                catch { }
                viewerRef.current = null;
            };
            destroyViewer();
            container.innerHTML = '';
            if (!skinUrl) {
                const hint = document.createElement('div');
                hint.className = 'hint';
                hint.textContent = 'Нет выбранного скина';
                container.appendChild(hint);
                return;
            }
            try {
                const mod = await import('skinview3d');
                const SkinViewer = mod.SkinViewer || mod.default?.SkinViewer || mod.default;
                const createOrbitControls = mod.createOrbitControls || mod.default?.createOrbitControls;
                if (!SkinViewer)
                    throw new Error('SkinViewer not found');
                const viewer = new SkinViewer({
                    domElement: container,
                    width: 176,
                    height: 352,
                    skinUrl,
                    detectModel: false
                });
                viewerRef.current = viewer;
                if (createOrbitControls) {
                    try {
                        viewerRef.current.controls = createOrbitControls(viewer);
                    }
                    catch { }
                }
                const applySlim = () => {
                    try {
                        if (viewer.playerObject && viewer.playerObject.skin) {
                            viewer.playerObject.skin.slim = skinModel === 'slim';
                        }
                    }
                    catch { }
                };
                applySlim();
                setTimeout(applySlim, 100);
            }
            catch (e) {
                const img = document.createElement('img');
                img.src = skinDataUrl || profileSkinUrl || '';
                img.style.width = '160px';
                img.style.height = '320px';
                img.style.objectFit = 'cover';
                img.style.imageRendering = 'pixelated';
                container.appendChild(img);
            }
        }
        initViewer();
        return () => {
            mounted = false;
            try {
                if (viewerRef.current && typeof viewerRef.current.destroy === 'function')
                    viewerRef.current.destroy();
                if (viewerRef.current && viewerRef.current.controls && typeof viewerRef.current.controls.dispose === 'function')
                    viewerRef.current.controls.dispose();
            }
            catch { }
            viewerRef.current = null;
        };
    }, [skinDataUrl, profileSkinUrl, skinModel]);
    // Pagination logic with filtering and search
    const filteredVersions = versions.filter(v => {
        const matchesFilter = versionFilter === 'all' || v.type === versionFilter;
        const matchesSearch = versionSearch === '' || v.id.toLowerCase().includes(versionSearch.toLowerCase());
        return matchesFilter && matchesSearch;
    });
    const totalPages = Math.ceil(filteredVersions.length / versionsPerPage);
    const startIndex = (currentPage - 1) * versionsPerPage;
    const endIndex = startIndex + versionsPerPage;
    const currentVersions = filteredVersions.slice(startIndex, endIndex);
    async function loadMeta() {
        setStatus('Загрузка списка версий...');
        const manifest = await window.launcher.fetchVersionManifest();
        // Sort by release time, newest first
        const sortedVersions = manifest.sort((a, b) => new Date(b.releaseTime).getTime() - new Date(a.releaseTime).getTime());
        setVersions(sortedVersions);
        setStatus('Готово');
    }
    useEffect(() => {
        const wc = window.windowControls;
        if (!wc)
            return;
        wc.isMaximized().then((v) => setIsMaximized(Boolean(v))).catch(() => { });
        const listener = (_event, value) => setIsMaximized(Boolean(value));
        wc.onMaximizeChange(listener);
        return () => wc.removeMaximizeChange(listener);
    }, []);
    const handleMinimize = () => {
        ;
        window.windowControls?.minimize();
    };
    const handleToggleMax = async () => {
        try {
            const res = await window.windowControls?.toggleMaximize();
            setIsMaximized(Boolean(res));
        }
        catch { }
    };
    const handleClose = () => {
        ;
        window.windowControls?.close();
    };
    async function loadState() {
        const installedVersions = await window.launcher.getInstalledVersions();
        setInstalled(installedVersions);
        const storedProfiles = await window.launcher.getProfiles();
        // Ensure all profiles have loader field
        const updatedProfiles = storedProfiles.map(p => ({ ...p, loader: p.loader || 'vanilla', loaderVersion: p.loaderVersion || '' }));
        setProfiles(updatedProfiles);
        const storedSettings = await window.launcher.getSettings();
        setSettings(storedSettings);
        const authState = await window.launcher.getAuthState();
        setAuth(authState);
    }
    async function fetchLoaderVersions(versionId, loader) {
        setAvailableLoaderVersions([]);
        if (!versionId || loader === 'vanilla') {
            return;
        }
        setLoaderVersionLoading(true);
        try {
            const versions = await window.launcher.getLoaderVersions(versionId, loader);
            const items = Array.isArray(versions)
                ? versions
                    .map((item) => {
                    if (typeof item === 'string') {
                        return { value: item, label: item };
                    }
                    if (item && typeof item === 'object') {
                        return { value: item.version || item.id || String(item), label: item.label || item.version || item.id || String(item) };
                    }
                    return null;
                })
                    .filter((item) => Boolean(item))
                : [];
            setAvailableLoaderVersions(items);
        }
        catch (error) {
            console.error('Ошибка загрузки версий загрузчика', error);
            setStatus(`Ошибка загрузки версий загрузчика: ${error?.message || 'проверьте соединение'}`);
            setAvailableLoaderVersions([]);
        }
        finally {
            setLoaderVersionLoading(false);
        }
    }
    useEffect(() => {
        loadMeta();
        loadState();
        loadModrinthState();
    }, []);
    async function loadModrinthState() {
        setModrinthLoading(true);
        try {
            const addons = await window.launcher.getInstalledModrinthAddons();
            setModrinthInstalledAddons(addons || []);
        }
        catch (error) {
            console.error('Modrinth addon load error', error);
        }
        finally {
            setModrinthLoading(false);
        }
    }
    async function searchModrinth(page = 1) {
        setModrinthLoading(true);
        setModrinthPage(page);
        try {
            const data = await window.launcher.searchModrinth(modrinthQuery, {
                version: modrinthSearchVersion,
                loader: modrinthSearchLoader,
                projectType: modrinthSearchType,
                page,
                pageSize: 20
            });
            setModrinthSearchResults(data.hits || []);
            setModrinthTotalHits(data.total_hits || 0);
            setStatus(`Найдено ${data.hits?.length ?? 0} результатов (${data.total_hits ?? 0} всего)`);
        }
        catch (error) {
            console.error('Modrinth search error', error);
            setStatus(`Ошибка поиска Modrinth: ${error?.message || 'проверьте соединение'}`);
            setModrinthSearchResults([]);
            setModrinthTotalHits(0);
        }
        finally {
            setModrinthLoading(false);
        }
    }
    async function installModrinthProject(projectId) {
        setIsBusy(true);
        setStatus('Установка Modrinth проекта...');
        try {
            await window.launcher.installModrinthProject(projectId, {
                gameVersion: modrinthSearchVersion || undefined,
                loader: modrinthSearchLoader || undefined
            });
            setStatus('Проект установлен. Проверьте папку mods.');
            await loadModrinthState();
        }
        catch (error) {
            console.error('Modrinth install error', error);
            setStatus(`Ошибка установки Modrinth: ${error?.message || 'проверьте лог'}`);
        }
        finally {
            setIsBusy(false);
        }
    }
    useEffect(() => {
        if (activeTab === 'Mods') {
            searchModrinth(1);
        }
    }, [activeTab, modrinthSearchType, modrinthSearchLoader, modrinthSearchVersion]);
    useEffect(() => {
        if (activeTab === 'Versions') {
            setCurrentPage(1);
        }
    }, [activeTab, versionFilter, versionSearch]);
    useEffect(() => {
        const installProgressListener = (_event, data) => {
            setStatus(data.message);
            setIsBusy(true);
            setProgressInfo({ label: data.message });
        };
        window.launcher.onInstallProgress(installProgressListener);
        return () => window.launcher.removeInstallProgress(installProgressListener);
    }, []);
    useEffect(() => {
        const launchProgressListener = (_event, data) => {
            setStatus(data.message);
            setIsBusy(true);
            if (data.gameExited) {
                setGameRunning(false);
                setIsBusy(false);
                setProgressInfo(null);
            }
            else if (data.progress?.total) {
                setProgressInfo({ label: data.message, current: data.progress.current, total: data.progress.total });
            }
            else {
                setProgressInfo({ label: data.message });
            }
        };
        window.launcher.onLaunchProgress(launchProgressListener);
        return () => window.launcher.removeLaunchProgress(launchProgressListener);
    }, []);
    async function installVersion(versionId) {
        setInstallingVersion(versionId);
        setIsBusy(true);
        setProgressInfo({ label: `Установка версии ${versionId}...` });
        setStatus(`Установка версии ${versionId}...`);
        try {
            await window.launcher.installVersion(versionId);
            await loadState();
            setStatus(`Версия ${versionId} установлена`);
            setProgressInfo(null);
        }
        catch (error) {
            console.error('Install error', error);
            setStatus(`Ошибка установки: ${error?.message || 'проверьте соединение и путь'}`);
            setProgressInfo(null);
        }
        finally {
            setInstallingVersion(null);
            setIsBusy(false);
        }
    }
    async function deleteInstalledVersion(versionId) {
        const confirmed = await showConfirm(`Удалить установленную версию ${versionId}?`);
        if (!confirmed)
            return;
        try {
            setIsBusy(true);
            setProgressInfo({ label: `Удаление версии ${versionId}...` });
            await window.launcher.deleteInstalledVersion(versionId);
            await loadState();
            setStatus(`Версия ${versionId} удалена`);
            setProgressInfo(null);
        }
        catch (error) {
            console.error('Delete installed version error', error);
            setStatus(`Ошибка удаления версии: ${error?.message || 'проверьте доступ'}`);
            setProgressInfo(null);
        }
        finally {
            setIsBusy(false);
        }
    }
    async function saveNewProfile(profileData) {
        if (!profileData.name || !profileData.versionId) {
            setStatus('Введите имя и выберите версию профиля');
            return;
        }
        await window.launcher.saveProfile({ ...profileData, id: `${Date.now()}` });
        setStatus('Профиль сохранён');
        loadState();
    }
    async function launchProfile(profile) {
        setIsBusy(true);
        setProgressInfo({ label: `Запуск ${profile.name}...` });
        setStatus(`Запуск ${profile.name}...`);
        try {
            await window.launcher.launchProfile(profile.id);
            setGameRunning(true);
            setStatus(`Игра запущена: ${profile.name}`);
            setProgressInfo(null);
        }
        catch (error) {
            console.error('Launch error', error);
            setStatus(`Ошибка запуска: ${error?.message || 'проверьте Java и установку версии'}`);
            setProgressInfo(null);
            setIsBusy(false);
        }
    }
    async function deleteProfile(profileId) {
        const confirmed = await showConfirm('Удалить профиль? Это действие необратимо.');
        if (!confirmed)
            return;
        try {
            await window.launcher.deleteProfile(profileId);
            setStatus('Профиль удалён');
            // Clear selected profile if it was deleted
            if (selectedProfile === profileId) {
                setSelectedProfile(null);
            }
            // Trigger form reset
            setProfileFormResetTrigger(k => k + 1);
            // Reload state after form reset
            await loadState();
        }
        catch (error) {
            console.error('Delete profile error', error);
            setStatus(`Ошибка удаления профиля: ${error?.message || 'проверьте доступ'}`);
        }
    }
    async function handleLogin() {
        const result = registerMode
            ? await window.launcher.registerUser(loginState.email, loginState.password)
            : await window.launcher.loginUser(loginState.email, loginState.password);
        setAuth({ email: result.email, loggedIn: result.loggedIn });
        setStatus(result.message);
    }
    async function handleSaveSettings() {
        await window.launcher.saveSettings(settings);
        setStatus('Настройки сохранены');
    }
    const themeClass = settings.theme === 'light' ? 'theme-light' : 'theme-dark';
    const accentColor = settings.accent || 'red';
    useEffect(() => {
        try {
            document.body.classList.remove('theme-light', 'theme-dark');
            document.body.classList.add(themeClass);
            document.body.setAttribute('data-accent', accentColor);
        }
        catch (e) { }
        return () => {
            try {
                document.body.classList.remove(themeClass);
            }
            catch (e) { }
        };
    }, [themeClass, accentColor]);
    return (_jsxs("div", { className: "app-shell", children: [_jsx("div", { className: "live-bg" }), _jsx("div", { className: "noise-overlay" }), _jsxs("div", { className: "titlebar", children: [_jsx("div", { className: "titlebar-title", children: "KuroLauncher" }), _jsxs("div", { className: "titlebar-controls", children: [_jsx("button", { className: "titlebar-btn", onClick: handleMinimize, "aria-label": "Minimize", children: _jsx("svg", { viewBox: "0 0 12 2", xmlns: "http://www.w3.org/2000/svg", fill: "none", children: _jsx("rect", { x: "0", y: "0", width: "12", height: "2", rx: "1", fill: "currentColor" }) }) }), _jsx("button", { className: "titlebar-btn", onClick: handleToggleMax, "aria-label": "Maximize", children: isMaximized ? (_jsxs("svg", { viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", fill: "none", children: [_jsx("rect", { x: "3", y: "6", width: "14", height: "12", stroke: "currentColor", strokeWidth: "1.6", rx: "1" }), _jsx("path", { d: "M7 6V4h10v10h-2", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" })] })) : (_jsx("svg", { viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", fill: "none", children: _jsx("rect", { x: "4", y: "4", width: "16", height: "16", stroke: "currentColor", strokeWidth: "1.6", rx: "1" }) })) }), _jsx("button", { className: "titlebar-btn", onClick: handleClose, "aria-label": "Close", children: _jsx("svg", { viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", fill: "none", children: _jsx("path", { d: "M4 4l16 16M20 4L4 20", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }) }) })] })] }), _jsxs("div", { className: "header", children: [_jsxs("div", { className: "header-left", children: [_jsx("div", { className: "header-logo", children: _jsx("div", { className: "header-logo-text", children: "KuroLauncher" }) }), _jsxs("div", { className: `header-status ${isBusy ? 'loading' : ''}`, children: [_jsx("span", { className: "status-dot" }), status] })] }), _jsx("div", { className: "header-right", children: _jsx("div", { className: "email-badge", children: auth.loggedIn ? auth.email : 'Offline' }) })] }), _jsx("div", { className: "nav-bar", children: tabs.map((tab) => (_jsx("button", { className: `nav-button ${activeTab === tab.id ? 'active' : ''}`, onClick: () => setActiveTab(tab.id), children: tab.label }, tab.id))) }), isBusy && progressInfo && (_jsxs("div", { className: "progress-panel", children: [_jsx("div", { className: "progress-label", children: progressInfo.label }), _jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-bar-fill", style: { width: progressInfo.total ? `${Math.min(100, Math.round((progressInfo.current ?? 0) / progressInfo.total * 100))}%` : '100%' } }) })] })), _jsxs("main", { className: "content", children: [activeTab === 'Skins' && (_jsx("section", { className: "skins-grid", children: _jsxs("div", { className: "panel panel large", children: [_jsx("div", { className: "panel-title", children: "\u0421\u043A\u0438\u043D\u044B" }), _jsxs("div", { className: "form-grid", children: [_jsxs("label", { children: ["\u041F\u0440\u043E\u0444\u0438\u043B\u044C", _jsx("div", { style: { marginTop: 8 }, children: _jsx(CustomSelect, { options: [{ value: '', label: 'Выберите профиль' }, ...profiles.map(p => ({ value: p.id, label: p.name || p.id }))], value: selectedProfile || '', onChange: (val) => setSelectedProfile(val), placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u0440\u043E\u0444\u0438\u043B\u044C" }) })] }), _jsxs("label", { children: ["\u041C\u043E\u0434\u0435\u043B\u044C", _jsxs("div", { style: { marginTop: 8, display: 'flex', gap: 8 }, children: [_jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: 6 }, children: [_jsx("input", { type: "radio", name: "skinModel", checked: skinModel === 'classic', onChange: () => setSkinModel('classic') }), " \u041E\u0431\u044B\u0447\u043D\u044B\u0439"] }), _jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: 6 }, children: [_jsx("input", { type: "radio", name: "skinModel", checked: skinModel === 'slim', onChange: () => setSkinModel('slim') }), " \u0421\u043B\u0438\u043C"] })] })] }), _jsxs("label", { children: ["\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0441\u043A\u0438\u043D (PNG)", _jsxs("div", { className: "skin-file-row", style: { marginTop: 8 }, children: [_jsx("input", { ref: fileInputRef, type: "file", accept: "image/png", style: { display: 'none' }, onChange: (e) => {
                                                                const f = e.target.files && e.target.files[0];
                                                                if (!f)
                                                                    return;
                                                                setSkinFile(f);
                                                                const reader = new FileReader();
                                                                reader.onload = () => setSkinDataUrl(String(reader.result));
                                                                reader.readAsDataURL(f);
                                                            } }), _jsx("button", { className: "btn btn-secondary", onClick: () => fileInputRef.current?.click(), children: "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0444\u0430\u0439\u043B" }), _jsx("span", { className: "small-text", children: skinFile?.name || '' })] })] }), _jsxs("div", { className: "skin-preview-section", children: [_jsx("div", { className: "panel-subtitle", children: "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440" }), _jsxs("div", { className: "skin-preview-row", children: [_jsx("div", { className: "skin-preview-box", children: _jsx("div", { ref: skinViewerContainerRef, className: "skin-preview-canvas" }) }), _jsxs("div", { className: "skin-preview-controls", children: [_jsxs("div", { className: "skin-preview-actions", children: [_jsx("button", { className: "button", disabled: !selectedProfile || (!skinDataUrl && profileSkinUrl === defaultSteveSkinUrl) || skinUploading, onClick: async () => {
                                                                                if (!selectedProfile)
                                                                                    return;
                                                                                setSkinUploading(true);
                                                                                try {
                                                                                    const prof = profiles.find(p => p.id === selectedProfile);
                                                                                    if (!prof) {
                                                                                        showAlert('Профиль не найден');
                                                                                        return;
                                                                                    }
                                                                                    const updatedSkin = {
                                                                                        ...(prof.skin || {}),
                                                                                        model: skinModel
                                                                                    };
                                                                                    const updatedProfile = { ...prof, skin: updatedSkin };
                                                                                    if (skinDataUrl) {
                                                                                        const res = await window.launcher.saveSkin(selectedProfile, skinDataUrl);
                                                                                        if (!res || !res.ok) {
                                                                                            showAlert('Не удалось сохранить скин');
                                                                                            return;
                                                                                        }
                                                                                        updatedProfile.skin.url = res.url;
                                                                                    }
                                                                                    await window.launcher.saveProfile(updatedProfile);
                                                                                    await loadState();
                                                                                    setProfileSkinUrl(updatedProfile.skin.url || defaultSteveSkinUrl);
                                                                                    setSkinFile(null);
                                                                                }
                                                                                catch (e) {
                                                                                    console.error(e);
                                                                                    showAlert('Ошибка при сохранении скина');
                                                                                }
                                                                                finally {
                                                                                    setSkinUploading(false);
                                                                                }
                                                                            }, children: skinUploading ? 'Сохранение...' : 'Сохранить скин' }), _jsx("button", { className: "btn btn-secondary", onClick: () => {
                                                                                setSkinFile(null);
                                                                                setSkinDataUrl(null);
                                                                            }, children: "\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C" })] }), _jsxs("div", { className: "hint", children: ["\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 64\u00D764 PNG-\u0441\u043A\u0438\u043D\u044B. \u041F\u043E\u0432\u0435\u0440\u043D\u0438\u0442\u0435 \u043C\u043E\u0434\u0435\u043B\u044C \u043C\u044B\u0448\u044C\u044E \u0432 \u043E\u043A\u043D\u0435 \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430. \u0415\u0441\u043B\u0438 3D \u043D\u0435 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442, \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0435 \u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0441\u0442\u044C ", _jsx("code", { children: "skinview3d" }), "."] })] })] })] })] })] }) })), activeTab === 'Dashboard' && (_jsxs("section", { className: "dashboard-grid", children: [_jsxs("div", { className: "panel", children: [_jsx("div", { className: "panel-title", children: "\u041D\u043E\u0432\u043E\u0441\u0442\u0438" }), _jsx("div", { className: "news-list", children: newsItems.map((item, index) => (_jsxs(motion.article, { className: "news-card animate-fade-in-up", initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: index * 0.1 }, children: [_jsx("h3", { children: item.title }), _jsx("p", { children: item.body })] }, item.title))) })] }), _jsxs("div", { className: "panel", children: [_jsx("div", { className: "panel-title", children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435" }), _jsxs("div", { className: "stats-grid", children: [_jsxs("div", { className: "stat-card", children: [_jsxs("div", { className: "stat-header", children: [_jsx("span", { className: "stat-label", children: "\u0412\u0435\u0440\u0441\u0438\u0439 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E" }), _jsx("span", { className: "stat-value", children: installed.length })] }), _jsx("div", { className: "stat-bar", children: _jsx(motion.div, { className: "stat-bar-fill", initial: { width: 0 }, animate: { width: `${Math.min(100, installed.length * 10)}%` }, transition: { duration: 1, delay: 0.2 } }) })] }), _jsxs("div", { className: "stat-card", children: [_jsxs("div", { className: "stat-header", children: [_jsx("span", { className: "stat-label", children: "\u041F\u0440\u043E\u0444\u0438\u043B\u0435\u0439" }), _jsx("span", { className: "stat-value", children: profiles.length })] }), _jsx("div", { className: "stat-bar", children: _jsx(motion.div, { className: "stat-bar-fill", initial: { width: 0 }, animate: { width: `${Math.min(100, profiles.length * 20)}%` }, transition: { duration: 1, delay: 0.4 } }) })] }), _jsxs("div", { className: "stat-card", children: [_jsxs("div", { className: "stat-header", children: [_jsx("span", { className: "stat-label", children: "RAM \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0435" }), _jsx("span", { className: "stat-value", children: "2.1 GB" })] }), _jsx("div", { className: "stat-bar", children: _jsx(motion.div, { className: "stat-bar-fill", initial: { width: 0 }, animate: { width: '35%' }, transition: { duration: 1, delay: 0.6 } }) })] })] }), _jsx("div", { style: { marginTop: '24px' }, children: _jsx("button", { className: "btn btn-primary", onClick: loadMeta, children: "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0432\u0435\u0440\u0441\u0438\u0438" }) })] })] })), activeTab === 'Versions' && (_jsxs("section", { className: "versions-grid scrollable-content", children: [_jsxs("div", { className: "panel panel large", children: [_jsxs("div", { className: "panel-title", children: ["\u0414\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0435 \u0432\u0435\u0440\u0441\u0438\u0438 (", filteredVersions.length, ")"] }), _jsxs("div", { className: "version-filters", children: [_jsxs("div", { className: "filter-group", children: [_jsx("label", { children: "\u041F\u043E\u0438\u0441\u043A \u0432\u0435\u0440\u0441\u0438\u0438:" }), _jsx("input", { type: "text", placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 ID \u0432\u0435\u0440\u0441\u0438\u0438...", value: versionSearch, onChange: (e) => setVersionSearch(e.target.value), className: "search-input" })] }), _jsxs("div", { className: "filter-group", children: [_jsx("label", { children: "\u0422\u0438\u043F \u0432\u0435\u0440\u0441\u0438\u0438:" }), _jsx("div", { className: "filter-buttons", children: [
                                                            { value: 'all', label: 'Все' },
                                                            { value: 'release', label: 'Релизы' },
                                                            { value: 'snapshot', label: 'Снапшоты' },
                                                            { value: 'old_beta', label: 'Бета' },
                                                            { value: 'old_alpha', label: 'Альфа' }
                                                        ].map(filter => (_jsx("button", { className: `filter-btn ${versionFilter === filter.value ? 'active' : ''}`, onClick: () => setVersionFilter(filter.value), children: filter.label }, filter.value))) })] })] }), _jsx("div", { className: "version-list", children: currentVersions.map((version) => (_jsxs("article", { className: "version-card", children: [_jsxs("div", { children: [_jsx("div", { className: "version-id", children: version.id }), _jsxs("div", { className: "version-meta", children: [version.type, " \u2022 ", new Date(version.releaseTime).toLocaleDateString()] })] }), _jsx("button", { className: "outline-button", disabled: installingVersion === version.id, onClick: () => installVersion(version.id), children: installingVersion === version.id ? 'Установка...' : 'Установить' })] }, version.id))) }), totalPages > 1 && (_jsxs("div", { className: "pagination", children: [_jsx("button", { className: "pagination-btn", disabled: currentPage === 1, onClick: () => setCurrentPage(currentPage - 1), children: "\u2039 \u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0430\u044F" }), _jsxs("div", { className: "pagination-info", children: ["\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 ", currentPage, " \u0438\u0437 ", totalPages] }), _jsx("button", { className: "pagination-btn", disabled: currentPage === totalPages, onClick: () => setCurrentPage(currentPage + 1), children: "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0430\u044F \u203A" })] }))] }), _jsxs("div", { className: "panel panel small", children: [_jsx("div", { className: "panel-title", children: "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044B\u0435" }), _jsxs("div", { className: "installed-list", children: [installed.length === 0 && _jsx("div", { className: "hint", children: "\u041D\u0435\u0442 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044B\u0445 \u0432\u0435\u0440\u0441\u0438\u0439" }), installed.map((item) => (_jsxs("div", { className: "installed-item", children: [_jsx("span", { children: item.id }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("span", { children: item.status }), _jsx("button", { className: "outline-button delete-button", onClick: () => deleteInstalledVersion(item.id), disabled: isBusy, children: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C" })] })] }, item.id)))] })] })] })), activeTab === 'Profiles' && (_jsxs("section", { className: "profiles-grid", children: [_jsxs("div", { className: "panel panel small", children: [_jsx("div", { className: "panel-title", children: "\u041F\u0440\u043E\u0444\u0438\u043B\u0438" }), _jsxs("div", { className: "profiles-list", children: [profiles.map((profile) => (_jsxs("article", { className: "profile-card", children: [_jsxs("div", { children: [_jsx("div", { className: "profile-name", children: profile.name }), _jsxs("div", { className: "profile-meta", children: [profile.versionId, profile.loader !== 'vanilla' ? ` • ${profile.loader.charAt(0).toUpperCase() + profile.loader.slice(1)}` : '', profile.loaderVersion ? ` ${profile.loaderVersion}` : '', ' • ', profile.ram === 'auto' ? 'Авто' : profile.ram, " \u2022 ", profile.offline ? 'Offline' : 'Online'] })] }), _jsxs("div", { className: "profile-actions", children: [_jsx("button", { className: "button", onClick: () => launchProfile(profile), disabled: gameRunning, children: gameRunning ? 'Игра запущена' : 'Запустить' }), _jsx("button", { className: "btn btn-ghost delete-button", onClick: () => deleteProfile(profile.id), children: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C" })] })] }, profile.id))), profiles.length === 0 && _jsx("div", { className: "hint", children: "\u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u043F\u0440\u043E\u0444\u0438\u043B\u044C \u0434\u043B\u044F \u0437\u0430\u043F\u0443\u0441\u043A\u0430" })] })] }), _jsxs("div", { className: "panel panel large", children: [_jsx("div", { className: "panel-title", children: "\u041D\u043E\u0432\u044B\u0439 \u043F\u0440\u043E\u0444\u0438\u043B\u044C" }), _jsx(ProfileForm, { onSave: saveNewProfile, settings: settings, installed: installed, availableLoaderVersions: availableLoaderVersions, loaderVersionLoading: loaderVersionLoading, ramOptions: ramOptions, resetTrigger: profileFormResetTrigger, onLoaderVersionChange: (versionId, loader) => fetchLoaderVersions(versionId, loader), showAlert: showAlert })] })] })), activeTab === 'Mods' && (_jsxs("section", { className: "modrinth-grid scrollable-content", children: [_jsxs("div", { className: "panel panel large", children: [_jsx("div", { className: "panel-title", children: "\u0411\u0440\u0430\u0443\u0437\u0435\u0440 \u043C\u043E\u0434\u043E\u0432" }), _jsxs("div", { className: "form-grid", children: [_jsxs("label", { children: ["\u041F\u043E\u0438\u0441\u043A", _jsx("input", { value: modrinthQuery, onChange: (e) => setModrinthQuery(e.target.value), placeholder: "\u0418\u043C\u044F \u043C\u043E\u0434\u0430, \u0442\u0435\u043A\u0441\u0442 \u0438\u043B\u0438 ID" })] }), _jsxs("label", { children: ["\u0412\u0435\u0440\u0441\u0438\u044F Minecraft", _jsx("input", { value: modrinthSearchVersion, onChange: (e) => setModrinthSearchVersion(e.target.value), placeholder: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 1.20.1" })] }), _jsxs("label", { children: ["\u0417\u0430\u0433\u0440\u0443\u0437\u0447\u0438\u043A", _jsx(CustomSelect, { options: [
                                                            { value: '', label: 'Любой' },
                                                            { value: 'fabric', label: 'Fabric' },
                                                            { value: 'forge', label: 'Forge' },
                                                            { value: 'quilt', label: 'Quilt' },
                                                            { value: 'neoforge', label: 'NeoForge' }
                                                        ], value: modrinthSearchLoader, onChange: (val) => setModrinthSearchLoader(val), placeholder: "\u0417\u0430\u0433\u0440\u0443\u0437\u0447\u0438\u043A" })] }), _jsxs("label", { children: ["\u0422\u0438\u043F \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0430", _jsx(CustomSelect, { options: [
                                                            { value: 'all', label: 'Все' },
                                                            { value: 'mod', label: 'Моды' },
                                                            { value: 'modpack', label: 'Модпаки' },
                                                            { value: 'resourcepack', label: 'Ресурсы' },
                                                            { value: 'shader', label: 'Шейдеры' }
                                                        ], value: modrinthSearchType, onChange: (val) => setModrinthSearchType(val), placeholder: "\u0422\u0438\u043F" })] }), _jsx("button", { className: "button", onClick: () => searchModrinth(1), disabled: modrinthLoading, children: "\u0418\u0441\u043A\u0430\u0442\u044C" })] }), _jsxs("div", { className: "panel-title", style: { marginTop: 18 }, children: ["\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u044B \u043F\u043E\u0438\u0441\u043A\u0430 ", modrinthTotalHits ? `(${modrinthTotalHits} найдено)` : ''] }), _jsxs("div", { className: "search-results grid", children: [modrinthLoading && _jsx("div", { className: "hint", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u043E\u0432..." }), !modrinthLoading && modrinthSearchResults.length === 0 && _jsx("div", { className: "hint", children: "\u041D\u0435\u0442 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u043E\u0432. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0434\u0440\u0443\u0433\u043E\u0439 \u0437\u0430\u043F\u0440\u043E\u0441 \u0438\u043B\u0438 \u0441\u043C\u0435\u043D\u0438\u0442\u0435 \u0444\u0438\u043B\u044C\u0442\u0440\u044B." }), modrinthSearchResults.map((item) => (_jsxs("article", { className: "search-card modrinth-card", children: [_jsxs("div", { className: "search-card-header", children: [_jsx("img", { src: item.icon_url || '', alt: item.title || item.name, className: "search-card-icon" }), _jsxs("div", { children: [_jsx("div", { className: "search-title", children: item.title || item.name }), _jsxs("div", { className: "search-meta", children: [item.project_type, " \u2022 ", item.primary_category || item.loader_type || 'Без категории'] })] })] }), _jsxs("div", { className: "search-body", children: [_jsx("p", { children: item.description ? item.description.slice(0, 160) : 'Описание отсутствует.' }), _jsx("div", { className: "search-tags", children: Array.isArray(item.categories) && item.categories.slice(0, 4).map((category) => (_jsx("span", { className: "tag", children: category }, category))) })] }), _jsxs("div", { className: "search-footer", children: [_jsxs("div", { children: [_jsxs("span", { className: "small-text", children: ["\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0438: ", item.downloads ?? 0] }), _jsxs("span", { className: "small-text", children: ["   \u0412\u0435\u0440\u0441\u0438\u0439: ", item.versions?.length ?? 0] })] }), _jsx("button", { className: "outline-button", onClick: () => installModrinthProject(item.slug), disabled: modrinthLoading, children: "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C" })] })] }, item.id)))] }), modrinthTotalHits > 20 && (_jsxs("div", { className: "pagination", style: { marginTop: 16 }, children: [_jsx("button", { className: "pagination-btn", disabled: modrinthPage <= 1 || modrinthLoading, onClick: () => searchModrinth(modrinthPage - 1), children: "\u2039 \u041D\u0430\u0437\u0430\u0434" }), _jsxs("div", { className: "pagination-info", children: ["\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 ", modrinthPage, " \u0438\u0437 ", Math.ceil(modrinthTotalHits / 20)] }), _jsx("button", { className: "pagination-btn", disabled: modrinthPage >= Math.ceil(modrinthTotalHits / 20) || modrinthLoading, onClick: () => searchModrinth(modrinthPage + 1), children: "\u0412\u043F\u0435\u0440\u0451\u0434 \u203A" })] }))] }), _jsxs("div", { className: "panel panel small", children: [_jsx("div", { className: "panel-title", children: "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044B\u0435 \u0434\u043E\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F" }), _jsxs("div", { className: "installed-list", children: [modrinthInstalledAddons.length === 0 && _jsx("div", { className: "hint", children: "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044B\u0445 \u043C\u043E\u0434\u043E\u0432/\u0448\u0435\u0439\u0434\u0435\u0440\u043E\u0432/\u0440\u0435\u0441\u0443\u0440\u0441\u043E\u0432." }), modrinthInstalledAddons.map((addon) => (_jsxs("div", { className: "installed-item", children: [_jsx("span", { children: addon.name }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("button", { className: "outline-button", onClick: async () => {
                                                                    await window.launcher.toggleInstalledAddon(addon.type, addon.name, !addon.enabled);
                                                                    await loadModrinthState();
                                                                }, children: addon.enabled ? 'Отключить' : 'Включить' }), _jsx("button", { className: "outline-button delete-button", onClick: async () => {
                                                                    const confirmed = await showConfirm(`Удалить ${addon.name}?`);
                                                                    if (!confirmed)
                                                                        return;
                                                                    await window.launcher.deleteInstalledAddon(addon.type, addon.name);
                                                                    await loadModrinthState();
                                                                }, children: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C" })] })] }, addon.id)))] })] })] })), activeTab === 'Settings' && (_jsxs("section", { className: "settings-grid", children: [_jsxs("div", { className: "panel large", children: [_jsx("div", { className: "panel-title", children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438" }), _jsxs("div", { className: "form-grid", children: [_jsxs("label", { children: ["\u0410\u043A\u0446\u0435\u043D\u0442", _jsx("div", { style: { marginTop: 8 }, children: _jsx(CustomSelect, { options: [
                                                                { value: 'red', label: 'Красный' },
                                                                { value: 'violet', label: 'Фиолетовый' },
                                                                { value: 'white', label: 'Белый' }
                                                            ], value: settings.accent || 'red', onChange: (val) => setSettings({ ...settings, accent: val }), placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0430\u043A\u0446\u0435\u043D\u0442" }) })] }), _jsxs("label", { children: ["\u0422\u0435\u043C\u0430", _jsx("div", { style: { marginTop: 8 }, children: _jsx(CustomSelect, { options: [{ value: 'dark', label: 'Тёмная' }, { value: 'light', label: 'Светлая' }], value: settings.theme, onChange: (val) => setSettings({ ...settings, theme: val }), placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0442\u0435\u043C\u0443" }) })] }), _jsxs("label", { children: ["\u041F\u0443\u0442\u044C \u043A Java", _jsx("input", { value: settings.javaPath, onChange: (e) => setSettings({ ...settings, javaPath: e.target.value }) })] }), _jsxs("label", { children: ["\u041F\u0430\u043C\u044F\u0442\u044C (RAM)", _jsx("div", { style: { marginTop: 8 }, children: _jsx(CustomSelect, { options: ramOptions, value: settings.ram || 'auto', onChange: (val) => setSettings({ ...settings, ram: val }), placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u0430\u043C\u044F\u0442\u044C" }) })] }), _jsx("button", { className: "button", onClick: handleSaveSettings, children: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438" })] })] }), _jsxs("div", { className: "panel small auth-panel", children: [_jsx("div", { className: "panel-title", children: "\u0410\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F" }), _jsxs("label", { children: ["Email", _jsx("input", { value: loginState.email, onChange: (e) => setLoginState({ ...loginState, email: e.target.value }) })] }), _jsxs("label", { children: ["\u041F\u0430\u0440\u043E\u043B\u044C", _jsx("input", { type: "password", value: loginState.password, onChange: (e) => setLoginState({ ...loginState, password: e.target.value }) })] }), _jsxs("div", { className: "button-row", children: [_jsx("button", { className: "outline-button", onClick: () => setRegisterMode(!registerMode), children: registerMode ? 'Войти' : 'Регистрация' }), _jsx("button", { className: "button", onClick: handleLogin, children: registerMode ? 'Зарегистрироваться' : 'Войти' })] }), _jsx("p", { className: "hint", children: "\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u0430\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F \u0445\u0440\u0430\u043D\u0438\u0442\u0441\u044F \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E \u0432 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435 KuroLauncher." })] })] }))] }), confirmDialog && (_jsx("div", { className: "modal-overlay", onClick: () => confirmDialog.onCancel?.(), children: _jsxs("div", { className: "modal-content", onClick: (e) => e.stopPropagation(), children: [_jsx("h3", { children: confirmDialog.onCancel ? 'Подтверждение' : 'Внимание' }), _jsx("p", { children: confirmDialog.message }), _jsxs("div", { className: "modal-actions", children: [confirmDialog.onCancel && (_jsx("button", { className: "outline-button", onClick: () => confirmDialog.onCancel?.(), children: "\u041E\u0442\u043C\u0435\u043D\u0430" })), _jsx("button", { className: "btn btn-primary", onClick: () => confirmDialog.onConfirm(), children: "OK" })] })] }) }))] }));
}
export default App;
