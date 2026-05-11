import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
const logoIcon = new URL('../logo/KuroLauncher.png', import.meta.url).href;
const heroReleaseArtwork = new URL('./assets/hero-release.png', import.meta.url).href;
const heroWorkshopArtwork = new URL('./assets/hero-workshop.png', import.meta.url).href;
const heroProfilesArtwork = new URL('./assets/hero-profiles.png', import.meta.url).href;
const heroBoostArtwork = new URL('./assets/hero-boost.png', import.meta.url).href;
const newsUpdateArtwork = new URL('./assets/news-update.png', import.meta.url).href;
const newsReleaseArtwork = new URL('./assets/news-release.png', import.meta.url).href;
const newsBoostArtwork = new URL('./assets/news-boost.png', import.meta.url).href;
const APP_VERSION = '0.3.0';
const tabs = [
    { id: 'Dashboard', label: 'Главная', icon: 'home' },
    { id: 'Versions', label: 'Версии', icon: 'versions' },
    { id: 'Profiles', label: 'Профили', icon: 'profiles' },
    { id: 'Mods', label: 'Моды', icon: 'mods' },
    { id: 'Skins', label: 'Скины', icon: 'skins' },
    { id: 'Settings', label: 'Настройки', icon: 'settings' }
];
const defaultSteveSkinUrl = new URL('../skins/default-skin.png', import.meta.url).href;
const socialLinks = [
    { id: 'discord', title: 'Discord', url: 'https://discord.gg/4WmemBZzut', icon: 'discord' },
    { id: 'telegram', title: 'Telegram', url: 'https://t.me/+kYL4EsOD7c1jYjUy', icon: 'telegram' },
    { id: 'telegram-updates', title: 'Telegram: обновления', url: 'https://t.me/+8zlPNjNz6QNjMTdi', icon: 'download' }
];
function Icon({ name, className = '' }) {
    const common = {
        width: 20,
        height: 20,
        viewBox: '0 0 24 24',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        'aria-hidden': true,
        className
    };
    switch (name) {
        case 'home':
            return (_jsx("svg", { ...common, children: _jsx("path", { d: "M3 11.4 12 4l9 7.4V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.6Z", stroke: "currentColor", strokeWidth: "1.7", strokeLinejoin: "round" }) }));
        case 'versions':
            return (_jsxs("svg", { ...common, children: [_jsx("path", { d: "M12 3 4 7l8 4 8-4-8-4Z", stroke: "currentColor", strokeWidth: "1.7", strokeLinejoin: "round" }), _jsx("path", { d: "M4 12l8 4 8-4M4 17l8 4 8-4", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round" })] }));
        case 'profiles':
            return (_jsxs("svg", { ...common, children: [_jsx("path", { d: "M16 20c0-2.2-1.8-4-4-4H8c-2.2 0-4 1.8-4 4", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round" }), _jsx("path", { d: "M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 19c0-1.9-1.1-3.5-2.8-4.2M16.4 4.4a3.5 3.5 0 0 1 0 6.2", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round" })] }));
        case 'settings':
            return (_jsxs("svg", { ...common, children: [_jsx("path", { d: "M9.7 4.1a2.35 2.35 0 0 1 4.6 0 2.35 2.35 0 0 0 3.3 1.9 2.35 2.35 0 0 1 2.3 4 2.35 2.35 0 0 0 0 3.9 2.35 2.35 0 0 1-2.3 4 2.35 2.35 0 0 0-3.3 1.9 2.35 2.35 0 0 1-4.6 0 2.35 2.35 0 0 0-3.3-1.9 2.35 2.35 0 0 1-2.3-4 2.35 2.35 0 0 0 0-3.9 2.35 2.35 0 0 1 2.3-4 2.35 2.35 0 0 0 3.3-1.9Z", stroke: "currentColor", strokeWidth: "1.65", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("circle", { cx: "12", cy: "12", r: "3", stroke: "currentColor", strokeWidth: "1.65" })] }));
        case 'mods':
            return (_jsx("svg", { ...common, children: _jsx("path", { d: "M8.5 3.5 6 6l2 2-2 2-2-2-2.5 2.5L5 14l-2 2 5 5 2-2 3.5 3.5L16 20l-2-2 2-2 2 2 2.5-2.5L17 12l2-2-5-5-2 2-3.5-3.5Z", stroke: "currentColor", strokeWidth: "1.6", strokeLinejoin: "round" }) }));
        case 'skins':
            return (_jsx("svg", { ...common, children: _jsx("path", { d: "M8 5 5 7l2 4 2-1v9h6v-9l2 1 2-4-3-2-2 2h-4L8 5Z", stroke: "currentColor", strokeWidth: "1.7", strokeLinejoin: "round" }) }));
        case 'play':
            return (_jsx("svg", { ...common, children: _jsx("path", { d: "M8 5.5v13l10-6.5-10-6.5Z", stroke: "currentColor", strokeWidth: "1.8", strokeLinejoin: "round" }) }));
        case 'download':
            return (_jsx("svg", { ...common, children: _jsx("path", { d: "M12 4v10m0 0 4-4m-4 4-4-4M5 19h14", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }) }));
        case 'discord':
            return (_jsxs("svg", { ...common, children: [_jsx("path", { d: "M7.4 7.7c3-1.3 6.2-1.3 9.2 0l.6.3 1.5 6.1c.1.5-.1 1-.5 1.3-1 .8-2.2 1.4-3.5 1.8l-.9-1.3c-1.2.2-2.4.2-3.6 0l-.9 1.3c-1.3-.4-2.5-1-3.5-1.8-.4-.3-.6-.8-.5-1.3L6.8 8l.6-.3Z", stroke: "currentColor", strokeWidth: "1.55", strokeLinejoin: "round" }), _jsx("path", { d: "M9.1 12.7c.55 0 1-.5 1-1.1s-.45-1.1-1-1.1-1 .5-1 1.1.45 1.1 1 1.1ZM14.9 12.7c.55 0 1-.5 1-1.1s-.45-1.1-1-1.1-1 .5-1 1.1.45 1.1 1 1.1Z", fill: "currentColor" }), _jsx("path", { d: "M9.4 8.2 8.8 6.7M14.6 8.2l.6-1.5", stroke: "currentColor", strokeWidth: "1.55", strokeLinecap: "round" })] }));
        case 'telegram':
            return (_jsxs("svg", { ...common, children: [_jsx("path", { d: "M20.4 4.7 4 11.1c-.9.35-.85 1.65.08 1.92l4.22 1.22 1.6 4.78c.32.94 1.55 1.1 2.1.27l2.28-3.42 4.15 3.03c.75.55 1.83.14 2.01-.77l2.08-12.02c.17-.98-.92-1.75-1.84-1.4Z", stroke: "currentColor", strokeWidth: "1.55", strokeLinejoin: "round" }), _jsx("path", { d: "m8.4 14.2 11.5-8.5-8.9 11.2", stroke: "currentColor", strokeWidth: "1.55", strokeLinecap: "round", strokeLinejoin: "round" })] }));
        case 'spark':
            return (_jsx("svg", { ...common, children: _jsx("path", { d: "M13 3 9.8 10.2 3 13l6.8 2.8L13 23l3.2-7.2L23 13l-6.8-2.8L13 3Z", stroke: "currentColor", strokeWidth: "1.6", strokeLinejoin: "round" }) }));
        case 'folder':
            return (_jsx("svg", { ...common, children: _jsx("path", { d: "M3 7.5A1.5 1.5 0 0 1 4.5 6h5l2 2h8A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-10Z", stroke: "currentColor", strokeWidth: "1.7", strokeLinejoin: "round" }) }));
        case 'shirt':
            return (_jsx("svg", { ...common, children: _jsx("path", { d: "M8 5 5 7l2 4 2-1v9h6v-9l2 1 2-4-3-2-2 2h-4L8 5Z", stroke: "currentColor", strokeWidth: "1.7", strokeLinejoin: "round" }) }));
        case 'search':
            return (_jsx("svg", { ...common, children: _jsx("path", { d: "M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14ZM16.5 16.5 21 21", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" }) }));
        case 'user':
            return (_jsxs("svg", { ...common, children: [_jsx("path", { d: "M20 20c0-3.3-2.7-6-6-6h-4c-3.3 0-6 2.7-6 6", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round" }), _jsx("path", { d: "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", stroke: "currentColor", strokeWidth: "1.7" })] }));
        case 'friends':
            return (_jsx("svg", { ...common, children: _jsx("path", { d: "M8 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2.5 20c.6-2.9 2.8-5 5.5-5 1.4 0 2.6.5 3.6 1.4M17 11a3 3 0 1 0 0-6M14.8 14.5c2.5.2 4.6 2.1 5.2 4.7", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round" }) }));
        case 'shield':
            return (_jsxs("svg", { ...common, children: [_jsx("path", { d: "M12 3 5 6v5.2c0 4.4 2.8 8.4 7 9.8 4.2-1.4 7-5.4 7-9.8V6l-7-3Z", stroke: "currentColor", strokeWidth: "1.7", strokeLinejoin: "round" }), _jsx("path", { d: "m8.8 12 2.1 2.1 4.4-4.6", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round" })] }));
        case 'refresh':
            return (_jsxs("svg", { ...common, children: [_jsx("path", { d: "M20 7v5h-5M4 17v-5h5", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("path", { d: "M18.4 9A7 7 0 0 0 6 7.8M5.6 15A7 7 0 0 0 18 16.2", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" })] }));
        case 'chevron':
            return (_jsx("svg", { ...common, children: _jsx("path", { d: "m9 5 7 7-7 7", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }) }));
        case 'globe':
            return (_jsxs("svg", { ...common, children: [_jsx("path", { d: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", stroke: "currentColor", strokeWidth: "1.7" }), _jsx("path", { d: "M3.6 9h16.8M3.6 15h16.8M12 3c2.1 2.5 3.1 5.5 3.1 9s-1 6.5-3.1 9c-2.1-2.5-3.1-5.5-3.1-9S9.9 5.5 12 3Z", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round" })] }));
        default:
            return null;
    }
}
function createProfileDraft(settings, initialProfile) {
    return {
        name: initialProfile?.name || '',
        versionId: initialProfile?.versionId || '',
        ram: initialProfile?.ram || 'global',
        javaPath: initialProfile?.javaPath || settings.javaPath,
        loader: (initialProfile?.loader || 'vanilla'),
        loaderVersion: initialProfile?.loaderVersion || '',
        fullscreenMode: (initialProfile?.fullscreenMode || 'global')
    };
}
function formatProfileFullscreen(mode) {
    if (mode === 'on')
        return 'Фуллскрин';
    if (mode === 'off')
        return 'Окно';
    return 'Экран: по лаунчеру';
}
function formatRamLabel(value) {
    if (!value || value === 'global')
        return 'по лаунчеру';
    if (value === 'auto')
        return 'авто';
    return value;
}
function formatProfileRam(profile, settings) {
    if (!profile.ram || profile.ram === 'global') {
        return `RAM: по лаунчеру (${formatRamLabel(settings.ram)})`;
    }
    return `RAM: ${formatRamLabel(profile.ram)}`;
}
const addonCategoryLabels = {
    mods: 'Моды',
    resourcepacks: 'Ресурспаки',
    shaderpacks: 'Шейдеры'
};
function createAddonBuckets() {
    return {
        mods: [],
        resourcepacks: [],
        shaderpacks: []
    };
}
function getDefaultAddonCategory(categories) {
    if (categories.mods.length > 0)
        return 'mods';
    if (categories.resourcepacks.length > 0)
        return 'resourcepacks';
    if (categories.shaderpacks.length > 0)
        return 'shaderpacks';
    return 'mods';
}
function getProfileModpackKey(profile) {
    if (!profile?.modpackPath)
        return profile?.id || '';
    const parts = profile.modpackPath.split(/[\\/]/).filter(Boolean);
    return parts[parts.length - 1] || profile.id;
}
function formatLoaderName(loader, loaderVersion) {
    const labels = {
        vanilla: 'Vanilla',
        forge: 'Forge',
        fabric: 'Fabric',
        quilt: 'Quilt',
        neoforge: 'NeoForge'
    };
    const label = labels[loader || 'vanilla'] || loader || 'Vanilla';
    return loaderVersion ? `${label} ${loaderVersion}` : label;
}
function formatAddonType(type) {
    return addonCategoryLabels[type || ''] || type || 'Дополнение';
}
const modrinthProjectTypeLabels = {
    mod: 'Мод',
    modpack: 'Модпак',
    resourcepack: 'Ресурспак',
    shader: 'Шейдер'
};
const modrinthVersionTypeLabels = {
    release: 'Релиз',
    beta: 'Бета',
    alpha: 'Альфа'
};
function formatModrinthProjectType(type) {
    return modrinthProjectTypeLabels[type || ''] || type || 'Проект';
}
function formatCompactNumber(value) {
    const number = typeof value === 'number' && Number.isFinite(value) ? value : 0;
    return new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 }).format(number);
}
function formatModrinthDate(value) {
    if (!value)
        return 'Дата не указана';
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return 'Дата не указана';
    return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).format(date);
}
function getModrinthProjectId(item) {
    return item?.slug || item?.project_id || item?.id || '';
}
function getModrinthProjectUrl(project) {
    const slug = project?.slug || project?.project_id || project?.id;
    return slug ? `https://modrinth.com/${project?.project_type || 'mod'}/${slug}` : 'https://modrinth.com';
}
function formatSideSupport(value) {
    if (value === 'required')
        return 'требуется';
    if (value === 'optional')
        return 'опционально';
    if (value === 'unsupported')
        return 'не поддерживается';
    return value || 'не указано';
}
function getVersionPrimaryFile(version) {
    const files = Array.isArray(version?.files) ? version.files : [];
    return files.find((file) => file?.primary) || files[0] || null;
}
function formatFileSize(bytes) {
    if (!bytes || !Number.isFinite(bytes))
        return '';
    const mb = bytes / 1024 / 1024;
    if (mb >= 1)
        return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
function summarizeVersionFile(version) {
    const file = getVersionPrimaryFile(version);
    if (!file)
        return 'Файл не указан';
    const size = formatFileSize(file.size);
    return [file.filename, size].filter(Boolean).join(' • ');
}
function normalizeMarkdownText(value) {
    return String(value || '')
        .replace(/\r\n/g, '\n')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/<img\b[^>]*>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .split('\n')
        .map((line) => line.replace(/[*_~`>#]/g, '').trim())
        .filter((line) => line && !/^https?:\/\//i.test(line) && !/^(src|alt|width|height)=/i.test(line))
        .join('\n')
        .trim();
}
function getProjectBodySummary(project) {
    const body = normalizeMarkdownText(project?.body || project?.description || '');
    if (!body)
        return 'Описание отсутствует.';
    return body.length > 2400 ? `${body.slice(0, 2400).trim()}...` : body;
}
function getProjectGalleryImages(project) {
    const gallery = Array.isArray(project?.gallery) ? project.gallery : [];
    return gallery
        .map((image, index) => ({
        ...image,
        index,
        url: image?.url || image?.raw_url || image?.thumbnail_url || '',
        title: image?.title || `Изображение ${index + 1}`,
        description: normalizeMarkdownText(image?.description || '').slice(0, 220)
    }))
        .filter((image) => image.url)
        .sort((a, b) => {
        if (Boolean(a.featured) !== Boolean(b.featured))
            return a.featured ? -1 : 1;
        const aOrder = typeof a.ordering === 'number' ? a.ordering : a.index;
        const bOrder = typeof b.ordering === 'number' ? b.ordering : b.index;
        return aOrder - bOrder;
    });
}
function normalizeAccent(accent) {
    if (accent === 'violet' || accent === 'white')
        return accent;
    return 'red';
}
function normalizeProfileText(value, maxLength) {
    return typeof value === 'string' ? value.slice(0, maxLength) : '';
}
function normalizeAvatarDataUrl(value) {
    return typeof value === 'string' && value.startsWith('data:image/') ? value : '';
}
function formatRamStat(value) {
    if (!value || value === 'auto')
        return 'Авто';
    const match = value.match(/^(\d+)G$/i);
    return match ? `${match[1]} GB` : value;
}
function getRamStatWidth(value) {
    if (!value || value === 'auto')
        return '42%';
    const match = value.match(/^(\d+)G$/i);
    if (!match)
        return '42%';
    return `${Math.min(100, Math.max(18, Math.round(Number(match[1]) / 16 * 100)))}%`;
}
function formatCompactDate(value) {
    if (!value)
        return 'Актуальный релиз';
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return 'Актуальный релиз';
    return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'short'
    }).format(date);
}
function openExternalLink(event, targetUrl) {
    event.preventDefault();
    const openExternal = window.launcher?.openExternal;
    if (typeof openExternal === 'function') {
        void openExternal(targetUrl);
        return;
    }
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
}
// Custom select component to replace native <select> for better styling
function CustomSelect({ options, value, onChange, placeholder, disabled = false }) {
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
    return (_jsxs("div", { className: "custom-select", ref: ref, children: [_jsxs("button", { type: "button", className: `custom-select-trigger ${!value ? 'placeholder' : ''} ${open ? 'open' : ''} ${disabled ? 'disabled' : ''}`, onClick: () => !disabled && setOpen((s) => !s), "aria-haspopup": "listbox", "aria-expanded": open, disabled: disabled, children: [_jsx("span", { className: "trigger-label", children: selected ? selected.label : placeholder }), _jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M7 10l5 5 5-5", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" }) })] }), open && (_jsx("div", { className: "custom-options", role: "listbox", children: options.map((opt) => (_jsx("div", { role: "option", tabIndex: 0, className: `custom-option ${opt.value === value ? 'selected' : ''}`, onMouseDown: (e) => {
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
function ProfileForm({ onSave, settings, installed, availableLoaderVersions, loaderVersionLoading, ramOptions, resetTrigger, onLoaderVersionChange, showAlert, initialProfile, mode = 'create', submitLabel, onCancel }) {
    const [formData, setFormData] = useState(() => createProfileDraft(settings, initialProfile || undefined));
    const isEditMode = mode === 'edit';
    useEffect(() => {
        setFormData(createProfileDraft(settings, initialProfile || undefined));
    }, [resetTrigger, initialProfile?.id, mode, settings.javaPath]);
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
        if (isEditMode)
            return;
        if (updates.versionId || updates.loader) {
            if (newData.versionId && newData.loader !== 'vanilla') {
                onLoaderVersionChange(newData.versionId, newData.loader);
            }
        }
    };
    return (_jsxs("div", { className: "form-grid", children: [isEditMode && (_jsxs("div", { className: "profile-form-intro", children: [_jsx("div", { className: "profile-form-eyebrow", children: "\u041F\u0440\u043E\u0444\u0438\u043B\u044C" }), _jsx("div", { className: "profile-form-title", children: "\u0422\u043E\u043D\u043A\u0430\u044F \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430 \u0437\u0430\u043F\u0443\u0441\u043A\u0430" }), _jsx("div", { className: "profile-form-text", children: "\u0414\u043B\u044F \u043C\u043E\u0434\u043F\u0430\u043A\u043E\u0432 \u043C\u043E\u0436\u043D\u043E \u043F\u043E\u0434\u043D\u044F\u0442\u044C \u043F\u0430\u043C\u044F\u0442\u044C, \u0443\u043A\u0430\u0437\u0430\u0442\u044C \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u0443\u044E Java \u0438 \u043F\u0435\u0440\u0435\u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0438\u0442\u044C \u0440\u0435\u0436\u0438\u043C \u044D\u043A\u0440\u0430\u043D\u0430 \u0431\u0435\u0437 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0433\u043B\u043E\u0431\u0430\u043B\u044C\u043D\u044B\u0445 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A \u043B\u0430\u0443\u043D\u0447\u0435\u0440\u0430." })] })), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "\u0418\u043C\u044F \u043F\u0440\u043E\u0444\u0438\u043B\u044F" }), _jsx("input", { className: "form-input", value: formData.name, onChange: (e) => updateFormData({ name: e.target.value }), placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0438\u043C\u044F \u043F\u0440\u043E\u0444\u0438\u043B\u044F" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "\u0412\u0435\u0440\u0441\u0438\u044F" }), _jsx(CustomSelect, { options: [{ value: '', label: 'Выберите версию' }, ...installed.map((it) => ({ value: it.id, label: it.id }))], value: formData.versionId, onChange: (val) => updateFormData({ versionId: val }), placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0432\u0435\u0440\u0441\u0438\u044E", disabled: isEditMode })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u0447\u0438\u043A" }), _jsx(CustomSelect, { options: [
                            { value: 'vanilla', label: 'Vanilla' },
                            { value: 'forge', label: 'Forge' },
                            { value: 'fabric', label: 'Fabric' },
                            { value: 'quilt', label: 'Quilt' },
                            { value: 'neoforge', label: 'NeoForge' }
                        ], value: formData.loader, onChange: (val) => updateFormData({ loader: val, loaderVersion: '' }), placeholder: "\u0417\u0430\u0433\u0440\u0443\u0437\u0447\u0438\u043A", disabled: isEditMode })] }), formData.loader !== 'vanilla' && (_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "\u0412\u0435\u0440\u0441\u0438\u044F \u0437\u0430\u0433\u0440\u0443\u0437\u0447\u0438\u043A\u0430" }), (() => {
                        const mcParts = formData.versionId.split('.');
                        const mcMajor = parseInt(mcParts[1] || '0', 10);
                        const mcMinor = parseInt(mcParts[2] || '0', 10);
                        const neoforgeUnsupported = formData.loader === 'neoforge' && formData.versionId &&
                            (mcMajor < 20 || (mcMajor === 20 && mcMinor < 1));
                        if (neoforgeUnsupported) {
                            return (_jsxs("div", { className: "loader-version-warning warning", children: [_jsx("span", { className: "warning-icon", children: "\u26A0" }), "\u0414\u043E\u0441\u0442\u0443\u043F\u043D\u043E \u0442\u043E\u043B\u044C\u043A\u043E \u0434\u043B\u044F MC 1.20.1 \u0438 \u043D\u043E\u0432\u0435\u0435"] }));
                        }
                        if (isEditMode) {
                            return (_jsx(CustomSelect, { options: [{ value: formData.loaderVersion || '', label: formData.loaderVersion || 'Автовыбор при запуске' }], value: formData.loaderVersion || '', onChange: () => { }, placeholder: "\u0412\u0435\u0440\u0441\u0438\u044F \u0437\u0430\u0433\u0440\u0443\u0437\u0447\u0438\u043A\u0430", disabled: true }));
                        }
                        if (!loaderVersionLoading && formData.versionId && availableLoaderVersions.length === 0) {
                            return (_jsx("div", { className: "loader-version-warning", children: "\u0412\u0435\u0440\u0441\u0438\u0438 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B \u0434\u043B\u044F \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0439 MC \u0432\u0435\u0440\u0441\u0438\u0438" }));
                        }
                        return (_jsx(CustomSelect, { options: loaderVersionLoading
                                ? [{ value: '', label: 'Загрузка...' }]
                                : [{ value: '', label: 'Выберите версию' }, ...availableLoaderVersions], value: formData.loaderVersion || '', onChange: (val) => updateFormData({ loaderVersion: val }), placeholder: loaderVersionLoading ? 'Загрузка...' : 'Выберите версию', disabled: isEditMode }));
                    })()] })), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "RAM" }), _jsx(CustomSelect, { options: ramOptions, value: formData.ram, onChange: (val) => updateFormData({ ram: val }), placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u0430\u043C\u044F\u0442\u044C" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Java \u043F\u0443\u0442\u044C" }), _jsx("input", { className: "form-input", value: formData.javaPath, onChange: (e) => updateFormData({ javaPath: e.target.value }), placeholder: "\u041F\u0443\u0442\u044C \u043A Java" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "\u0420\u0435\u0436\u0438\u043C \u044D\u043A\u0440\u0430\u043D\u0430" }), _jsx(CustomSelect, { options: [
                            { value: 'global', label: 'Как в настройках лаунчера' },
                            { value: 'on', label: 'Всегда полный экран' },
                            { value: 'off', label: 'Всегда оконный режим' }
                        ], value: formData.fullscreenMode, onChange: (val) => updateFormData({ fullscreenMode: val }), placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0440\u0435\u0436\u0438\u043C" })] }), _jsxs("div", { className: "profile-form-actions", children: [_jsx("button", { className: "btn btn-primary", onClick: handleSubmit, children: submitLabel || (isEditMode ? 'Сохранить изменения' : 'Сохранить профиль') }), isEditMode && onCancel && (_jsx("button", { className: "btn btn-ghost", type: "button", onClick: onCancel, children: "\u0412\u044B\u0439\u0442\u0438 \u043A \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044E" }))] })] }));
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
const profileRamOptions = [
    { value: 'global', label: 'Как в настройках лаунчера' },
    ...ramOptions
];
const getSystemTheme = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
};
const defaultSettings = {
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
};
function normalizeSettings(settings) {
    const next = { ...defaultSettings, ...(settings || {}) };
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
    };
}
const newsItems = [
    {
        title: 'Скины ставятся в игру',
        tag: 'Скины',
        date: 'Сегодня',
        icon: 'shirt',
        image: newsUpdateArtwork,
        body: 'Лаунчер сам готовит CustomSkinLoader, кладёт PNG в профиль и подключает его через модлоадер.'
    },
    {
        title: 'Modrinth стал полноценным',
        tag: 'Моды',
        date: 'Сегодня',
        icon: 'mods',
        image: newsReleaseArtwork,
        body: 'У проектов появились страницы с версиями, фильтрами, установкой конкретного релиза и изображениями.'
    },
    {
        title: 'Модпаки запускаются стабильнее',
        tag: 'Запуск',
        date: 'Обновлено',
        icon: 'shield',
        image: newsBoostArtwork,
        body: 'Установщик стал аккуратнее с зависимостями, ресурсами и шейдерами, а запуск лаунчера ускорен.'
    }
];
function App() {
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [isMaximized, setIsMaximized] = useState(false);
    const [versions, setVersions] = useState([]);
    const [installed, setInstalled] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [settings, setSettings] = useState(defaultSettings);
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const [status, setStatus] = useState('Готово');
    const [auth, setAuth] = useState({ email: '', loggedIn: false });
    const [loginState, setLoginState] = useState({ email: '', password: '' });
    const [registerMode, setRegisterMode] = useState(false);
    const [activeHeroIndex, setActiveHeroIndex] = useState(0);
    const [heroAutoplayResetKey, setHeroAutoplayResetKey] = useState(0);
    const [installingVersion, setInstallingVersion] = useState(null);
    const [isBusy, setIsBusy] = useState(false);
    const [progressInfo, setProgressInfo] = useState(null);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [editingProfileId, setEditingProfileId] = useState(null);
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
    const [modrinthBrowserView, setModrinthBrowserView] = useState('search');
    const [selectedModrinthProject, setSelectedModrinthProject] = useState(null);
    const [selectedModrinthVersions, setSelectedModrinthVersions] = useState([]);
    const [selectedModrinthVersionId, setSelectedModrinthVersionId] = useState('');
    const [modrinthProjectTab, setModrinthProjectTab] = useState('versions');
    const [selectedModrinthImageIndex, setSelectedModrinthImageIndex] = useState(0);
    const [modrinthDetailLoading, setModrinthDetailLoading] = useState(false);
    const [modrinthVersionGameFilter, setModrinthVersionGameFilter] = useState('');
    const [modrinthVersionLoaderFilter, setModrinthVersionLoaderFilter] = useState('');
    const [modrinthVersionReleaseFilter, setModrinthVersionReleaseFilter] = useState('');
    const [selectedModpackTarget, setSelectedModpackTarget] = useState('');
    const [modpackCreateForm, setModpackCreateForm] = useState({
        name: '',
        versionId: '',
        loader: 'forge',
        loaderVersion: ''
    });
    const [modpackCreateLoaderVersions, setModpackCreateLoaderVersions] = useState([]);
    const [modpackCreateLoading, setModpackCreateLoading] = useState(false);
    const [modpackCreateLoaderLoading, setModpackCreateLoaderLoading] = useState(false);
    const [expandedModpacks, setExpandedModpacks] = useState(new Set());
    const [standaloneExpanded, setStandaloneExpanded] = useState(true);
    const [openAddonCategories, setOpenAddonCategories] = useState({});
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
    const viewerIdRef = useRef(0);
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
    const editingProfile = useMemo(() => profiles.find((profile) => profile.id === editingProfileId), [profiles, editingProfileId]);
    const modpackProfiles = useMemo(() => profiles.filter((profile) => Boolean(profile.modpackPath)), [profiles]);
    const selectedModpackProfile = useMemo(() => modpackProfiles.find((profile) => profile.id === selectedModpackTarget) || null, [modpackProfiles, selectedModpackTarget]);
    const versionSelectOptions = useMemo(() => versions
        .filter((version) => version.type === 'release')
        .slice(0, 160)
        .map((version) => ({ value: version.id, label: version.id })), [versions]);
    const modpackTargetOptions = useMemo(() => [
        { value: '', label: 'Выберите модпак' },
        ...modpackProfiles.map((profile) => ({
            value: profile.id,
            label: `${profile.name} • ${profile.versionId} • ${formatLoaderName(profile.loader, profile.loaderVersion)}`
        }))
    ], [modpackProfiles]);
    const isTargetedModrinthType = modrinthSearchType !== 'modpack';
    const effectiveModrinthVersion = isTargetedModrinthType && selectedModpackProfile
        ? selectedModpackProfile.versionId
        : modrinthSearchVersion;
    const effectiveModrinthLoader = isTargetedModrinthType && selectedModpackProfile
        ? (modrinthSearchType === 'mod'
            ? (selectedModpackProfile.loader === 'vanilla' ? '' : selectedModpackProfile.loader)
            : '')
        : modrinthSearchLoader;
    const selectedModrinthProjectType = selectedModrinthProject?.project_type || '';
    const modrinthVersionGameOptions = useMemo(() => {
        const values = new Set();
        selectedModrinthVersions.forEach((version) => {
            if (Array.isArray(version.game_versions)) {
                version.game_versions.forEach((item) => values.add(item));
            }
        });
        return Array.from(values).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    }, [selectedModrinthVersions]);
    const modrinthVersionLoaderOptions = useMemo(() => {
        const values = new Set();
        selectedModrinthVersions.forEach((version) => {
            if (Array.isArray(version.loaders)) {
                version.loaders.forEach((item) => values.add(item));
            }
        });
        return Array.from(values).sort((a, b) => a.localeCompare(b));
    }, [selectedModrinthVersions]);
    const filteredModrinthVersions = useMemo(() => {
        return selectedModrinthVersions.filter((version) => {
            const matchesGame = !modrinthVersionGameFilter || version.game_versions?.includes(modrinthVersionGameFilter);
            const matchesLoader = !modrinthVersionLoaderFilter || version.loaders?.includes(modrinthVersionLoaderFilter);
            const matchesRelease = !modrinthVersionReleaseFilter || version.version_type === modrinthVersionReleaseFilter;
            return matchesGame && matchesLoader && matchesRelease;
        });
    }, [selectedModrinthVersions, modrinthVersionGameFilter, modrinthVersionLoaderFilter, modrinthVersionReleaseFilter]);
    const selectedModrinthVersion = useMemo(() => selectedModrinthVersions.find((version) => version.id === selectedModrinthVersionId) || filteredModrinthVersions[0] || null, [selectedModrinthVersions, filteredModrinthVersions, selectedModrinthVersionId]);
    const selectedModrinthProjectImages = useMemo(() => getProjectGalleryImages(selectedModrinthProject), [selectedModrinthProject]);
    const selectedModrinthImage = selectedModrinthProjectImages[selectedModrinthImageIndex] || selectedModrinthProjectImages[0] || null;
    const latestRelease = useMemo(() => versions.find((version) => version.type === 'release') || null, [versions]);
    const dashboardNewsItems = newsItems;
    const launchCandidate = activeProfile || profiles[0] || null;
    const featuredVersionId = latestRelease?.id || installed[0]?.id || launchCandidate?.versionId || 'Загрузка релиза';
    const featuredProfile = useMemo(() => profiles.find((profile) => profile.versionId === featuredVersionId) || null, [profiles, featuredVersionId]);
    const featuredInstalled = installed.some((item) => item.id === featuredVersionId);
    const ramLabel = formatRamStat(settings.ram);
    const ramBarWidth = getRamStatWidth(settings.ram);
    const kuroBoostEnabled = settings.kuroBoost !== false;
    const setKuroBoost = (enabled) => {
        setSettings((current) => ({
            ...current,
            kuroBoost: enabled,
            kuroBoostPreset: 'ai'
        }));
        setStatus(enabled ? 'KuroBoost включён: профиль будет оптимизирован при запуске' : 'KuroBoost выключен');
    };
    const heroPrimaryDisabled = featuredVersionId === 'Загрузка релиза' || installingVersion === featuredVersionId || Boolean(featuredProfile && gameRunning);
    const heroPrimaryLabel = featuredProfile
        ? (gameRunning ? 'Игра запущена' : 'Играть')
        : featuredInstalled
            ? 'Создать профиль'
            : installingVersion === featuredVersionId
                ? 'Установка...'
                : 'Установить релиз';
    const profileSubtitle = featuredProfile
        ? `${featuredProfile.name} • ${formatLoaderName(featuredProfile.loader, featuredProfile.loaderVersion)}`
        : featuredInstalled
            ? 'Версия установлена, профиль ещё не создан'
            : 'Официальный актуальный релиз';
    const releaseDateLabel = latestRelease?.releaseTime ? `Релиз ${formatCompactDate(latestRelease.releaseTime)}` : 'Релиз загружается';
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
                    icon: featuredProfile ? 'play' : featuredInstalled ? 'profiles' : 'download',
                    variant: 'primary',
                    disabled: heroPrimaryDisabled,
                    onClick: () => {
                        if (featuredProfile) {
                            void launchProfile(featuredProfile);
                        }
                        else if (featuredInstalled) {
                            setActiveTab('Profiles');
                        }
                        else {
                            void installVersion(featuredVersionId);
                        }
                    }
                },
                {
                    id: 'release-versions',
                    label: 'Выбрать версию',
                    icon: 'versions',
                    variant: 'secondary',
                    onClick: () => {
                        setVersionSearch(featuredVersionId === 'Загрузка релиза' ? '' : featuredVersionId);
                        setActiveTab('Versions');
                    }
                },
                {
                    id: 'release-workshop',
                    label: 'Мастерская',
                    icon: 'mods',
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
                { id: 'workshop-open', label: 'Открыть мастерскую', icon: 'mods', variant: 'primary', onClick: () => setActiveTab('Mods') },
                { id: 'workshop-versions', label: 'Версии Minecraft', icon: 'versions', variant: 'secondary', onClick: () => setActiveTab('Versions') }
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
                { id: 'profiles-open', label: 'Мои профили', icon: 'profiles', variant: 'primary', onClick: () => setActiveTab('Profiles') },
                { id: 'profiles-skins', label: 'Скины', icon: 'skins', variant: 'secondary', onClick: () => setActiveTab('Skins') },
                { id: 'profiles-settings', label: 'Настройки', icon: 'settings', variant: 'ghost', onClick: () => setActiveTab('Settings') }
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
                    icon: 'shield',
                    variant: 'primary',
                    onClick: () => {
                        setKuroBoost(true);
                    }
                },
                { id: 'boost-settings', label: 'Профили', icon: 'profiles', variant: 'secondary', onClick: () => setActiveTab('Profiles') }
            ]
        }
    ];
    const activeHeroSlide = heroSlides[activeHeroIndex] || heroSlides[0];
    const changeHeroSlide = (nextIndex) => {
        if (heroSlides.length < 1)
            return;
        setHeroAutoplayResetKey((key) => key + 1);
        setActiveHeroIndex((currentIndex) => {
            const resolvedIndex = typeof nextIndex === 'function' ? nextIndex(currentIndex) : nextIndex;
            return (resolvedIndex + heroSlides.length) % heroSlides.length;
        });
    };
    const launcherAvatar = normalizeAvatarDataUrl(settings.avatarDataUrl);
    const launcherProfileName = (settings.profileName || '').trim()
        || auth.name
        || (auth.loggedIn ? 'Пользователь' : 'Гость');
    const launcherProfileSubtitle = (settings.profileStatus || '').trim()
        || (auth.loggedIn ? auth.email : 'Не вошёл в систему');
    const userInitials = useMemo(() => {
        const source = launcherProfileName || auth.email || 'Гость';
        const normalized = source.replace(/@.*$/, '').split(/[^a-zA-Z0-9а-яА-Я]+/).filter(Boolean);
        const initials = normalized.slice(0, 2).map((part) => part[0].toUpperCase()).join('');
        return initials ? initials.slice(0, 2) : 'GU';
    }, [auth.email, launcherProfileName]);
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
            try {
                const url = await window.launcher.getSkinUrl(activeProfile.id);
                if (url) {
                    setProfileSkinUrl(url);
                }
                else if (activeProfile.skin?.url) {
                    setProfileSkinUrl(activeProfile.skin.url);
                }
                else {
                    setProfileSkinUrl(defaultSteveSkinUrl);
                }
            }
            catch (e) {
                if (activeProfile.skin?.url) {
                    setProfileSkinUrl(activeProfile.skin.url);
                }
                else {
                    setProfileSkinUrl(defaultSteveSkinUrl);
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
    useEffect(() => {
        const currentId = ++viewerIdRef.current;
        if (activeTab === 'Skins' && skinViewerContainerRef.current) {
            const container = skinViewerContainerRef.current;
            const skinUrl = skinDataUrl || profileSkinUrl || defaultSteveSkinUrl;
            container.innerHTML = '';
            if (!skinUrl) {
                const hint = document.createElement('div');
                hint.className = 'hint';
                hint.textContent = 'Нет выбранного скина';
                container.appendChild(hint);
                return;
            }
            const initViewer = async () => {
                if (currentId !== viewerIdRef.current)
                    return;
                try {
                    const mod = await import('skinview3d');
                    const SkinViewer = mod.SkinViewer || mod.default?.SkinViewer || mod.default;
                    const createOrbitControls = mod.createOrbitControls || mod.default?.createOrbitControls;
                    if (!SkinViewer)
                        throw new Error('SkinViewer not found');
                    if (currentId !== viewerIdRef.current)
                        return;
                    const viewer = new SkinViewer({
                        domElement: container,
                        width: 176,
                        height: 352,
                        skinUrl,
                        model: skinModel === 'slim' ? 'slim' : 'classic',
                        detectModel: false,
                        background: settings.theme === 'light' ? 0xf0f0f0 : 0x1a1a1a
                    });
                    if (currentId !== viewerIdRef.current) {
                        viewer.destroy();
                        return;
                    }
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
                    setTimeout(() => {
                        if (currentId === viewerIdRef.current)
                            applySlim();
                    }, 100);
                }
                catch (e) {
                    if (currentId !== viewerIdRef.current)
                        return;
                    const img = document.createElement('img');
                    img.src = skinDataUrl || profileSkinUrl || defaultSteveSkinUrl;
                    img.style.width = '160px';
                    img.style.height = '320px';
                    img.style.objectFit = 'cover';
                    img.style.imageRendering = 'pixelated';
                    container.appendChild(img);
                }
            };
            initViewer();
        }
        return () => {
            if (currentId === viewerIdRef.current) {
                if (skinViewerContainerRef.current) {
                    skinViewerContainerRef.current.innerHTML = '';
                }
                try {
                    if (viewerRef.current && typeof viewerRef.current.destroy === 'function')
                        viewerRef.current.destroy();
                    if (viewerRef.current && viewerRef.current.controls && typeof viewerRef.current.controls.dispose === 'function')
                        viewerRef.current.controls.dispose();
                }
                catch { }
                viewerRef.current = null;
            }
        };
    }, [activeTab, skinModel, skinDataUrl, profileSkinUrl, defaultSteveSkinUrl]);
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
    const createTitlebarMouseHandler = (action) => (event) => {
        if (event.button !== 0)
            return;
        action();
    };
    async function loadState() {
        const installedVersions = await window.launcher.getInstalledVersions();
        setInstalled(installedVersions);
        const storedProfiles = await window.launcher.getProfiles();
        const updatedProfiles = storedProfiles.map((p) => ({
            ...p,
            loader: p.loader || 'vanilla',
            loaderVersion: p.loaderVersion || '',
            ram: p.ram || 'global',
            javaPath: p.javaPath || defaultSettings.javaPath,
            username: p.username || '',
            fullscreenMode: p.fullscreenMode || 'global'
        }));
        setProfiles(updatedProfiles);
        const storedSettings = await window.launcher.getSettings();
        setSettings(normalizeSettings(storedSettings));
        setSettingsLoaded(true);
        const authState = await window.launcher.getAuthState();
        setAuth(authState);
    }
    useEffect(() => {
        if (selectedProfile && !profiles.some((profile) => profile.id === selectedProfile)) {
            setSelectedProfile(null);
        }
        if (editingProfileId && !profiles.some((profile) => profile.id === editingProfileId)) {
            setEditingProfileId(null);
        }
        if (selectedModpackTarget && !profiles.some((profile) => profile.id === selectedModpackTarget && profile.modpackPath)) {
            setSelectedModpackTarget('');
        }
    }, [profiles, selectedProfile, editingProfileId, selectedModpackTarget]);
    useEffect(() => {
        let cancelled = false;
        async function loadCreateLoaderVersions() {
            setModpackCreateLoaderVersions([]);
            if (!modpackCreateForm.versionId || modpackCreateForm.loader === 'vanilla') {
                if (modpackCreateForm.loaderVersion) {
                    setModpackCreateForm((prev) => ({ ...prev, loaderVersion: '' }));
                }
                return;
            }
            setModpackCreateLoaderLoading(true);
            try {
                const versions = await window.launcher.getLoaderVersions(modpackCreateForm.versionId, modpackCreateForm.loader);
                if (cancelled)
                    return;
                const items = Array.isArray(versions)
                    ? versions
                        .map((item) => {
                        if (typeof item === 'string')
                            return { value: item, label: item };
                        if (item && typeof item === 'object') {
                            return { value: item.version || item.id || String(item), label: item.label || item.version || item.id || String(item) };
                        }
                        return null;
                    })
                        .filter((item) => Boolean(item))
                    : [];
                setModpackCreateLoaderVersions(items);
                setModpackCreateForm((prev) => {
                    if (prev.loaderVersion && items.some((item) => item.value === prev.loaderVersion))
                        return prev;
                    return { ...prev, loaderVersion: items[0]?.value || '' };
                });
            }
            catch (error) {
                if (!cancelled) {
                    setModpackCreateLoaderVersions([]);
                    setStatus(`Не удалось загрузить версии модлоадера: ${error?.message || 'проверьте соединение'}`);
                }
            }
            finally {
                if (!cancelled)
                    setModpackCreateLoaderLoading(false);
            }
        }
        loadCreateLoaderVersions();
        return () => {
            cancelled = true;
        };
    }, [modpackCreateForm.versionId, modpackCreateForm.loader]);
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
        loadInstalledAddons();
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
                version: effectiveModrinthVersion,
                loader: effectiveModrinthLoader,
                projectType: modrinthSearchType,
                page,
                pageSize: 20
            });
            setModrinthSearchResults(data.hits || []);
            setModrinthTotalHits(data.total_hits || 0);
            const targetText = selectedModpackProfile && isTargetedModrinthType ? ` для "${selectedModpackProfile.name}"` : '';
            setStatus(`Найдено ${data.hits?.length ?? 0} результатов${targetText} (${data.total_hits ?? 0} всего)`);
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
    function pickPreferredModrinthVersion(versionList, gameVersion = '', loader = '', releaseType = '') {
        return versionList.find((version) => {
            const matchesGame = !gameVersion || version.game_versions?.includes(gameVersion);
            const matchesLoader = !loader || version.loaders?.includes(loader);
            const matchesRelease = !releaseType || version.version_type === releaseType;
            return matchesGame && matchesLoader && matchesRelease;
        }) || versionList[0] || null;
    }
    async function openModrinthProject(item, refresh = true) {
        const projectId = getModrinthProjectId(item);
        if (!projectId)
            return;
        const sameProject = modrinthBrowserView === 'project' && getModrinthProjectId(selectedModrinthProject) === projectId;
        setModrinthBrowserView('project');
        setSelectedModrinthProject(item);
        setSelectedModrinthVersions([]);
        setSelectedModrinthVersionId('');
        if (!sameProject) {
            setModrinthProjectTab('versions');
            setSelectedModrinthImageIndex(0);
        }
        setModrinthDetailLoading(true);
        setStatus('Загрузка проекта Modrinth...');
        try {
            const [project, rawVersions] = await Promise.all([
                window.launcher.getModrinthProject(projectId, { refresh }),
                window.launcher.getModrinthVersions(projectId, { refresh })
            ]);
            const versionList = Array.isArray(rawVersions)
                ? [...rawVersions].sort((a, b) => new Date(b.date_published || 0).getTime() - new Date(a.date_published || 0).getTime())
                : [];
            const projectType = project?.project_type || item?.project_type || modrinthSearchType;
            const targetGame = projectType !== 'modpack' && selectedModpackProfile
                ? selectedModpackProfile.versionId
                : effectiveModrinthVersion;
            const targetLoader = projectType === 'mod' && selectedModpackProfile
                ? (selectedModpackProfile.loader === 'vanilla' ? '' : selectedModpackProfile.loader)
                : effectiveModrinthLoader;
            const safeGameFilter = targetGame && versionList.some((version) => version.game_versions?.includes(targetGame)) ? targetGame : '';
            const safeLoaderFilter = targetLoader && versionList.some((version) => version.loaders?.includes(targetLoader)) ? targetLoader : '';
            const preferred = pickPreferredModrinthVersion(versionList, safeGameFilter, safeLoaderFilter);
            setSelectedModrinthProject(project);
            setSelectedModrinthVersions(versionList);
            setModrinthVersionGameFilter(safeGameFilter);
            setModrinthVersionLoaderFilter(safeLoaderFilter);
            setModrinthVersionReleaseFilter('');
            setSelectedModrinthVersionId(preferred?.id || '');
            setStatus(`Открыт проект: ${project?.title || item?.title || projectId}`);
        }
        catch (error) {
            console.error('Modrinth project load error', error);
            setStatus(`Ошибка загрузки проекта Modrinth: ${error?.message || 'проверьте соединение'}`);
        }
        finally {
            setModrinthDetailLoading(false);
        }
    }
    function closeModrinthProject() {
        setModrinthBrowserView('search');
        setSelectedModrinthProject(null);
        setSelectedModrinthVersions([]);
        setSelectedModrinthVersionId('');
        setModrinthProjectTab('versions');
        setSelectedModrinthImageIndex(0);
        setModrinthVersionGameFilter('');
        setModrinthVersionLoaderFilter('');
        setModrinthVersionReleaseFilter('');
    }
    async function createCustomModpack() {
        if (!modpackCreateForm.name.trim()) {
            showAlert('Введите название модпака');
            return;
        }
        if (!modpackCreateForm.versionId) {
            showAlert('Выберите версию Minecraft для модпака');
            return;
        }
        if (modpackCreateForm.loader !== 'vanilla' && !modpackCreateForm.loaderVersion) {
            showAlert('Выберите версию модлоадера');
            return;
        }
        setModpackCreateLoading(true);
        setIsBusy(true);
        setStatus('Создание модпака...');
        try {
            const result = await window.launcher.createCustomModpack(modpackCreateForm);
            if (result?.profile) {
                setSelectedModpackTarget(result.profile.id);
                setSelectedProfile(result.profile.id);
                setStandaloneExpanded(false);
                setExpandedModpacks(new Set([getProfileModpackKey(result.profile)]));
                setModpackCreateForm({ name: '', versionId: '', loader: 'forge', loaderVersion: '' });
                await loadState();
                await loadInstalledAddons();
                setStatus(`Модпак "${result.profile.name}" создан`);
            }
        }
        catch (error) {
            console.error('Create modpack error', error);
            setStatus(`Ошибка создания модпака: ${error?.message || 'проверьте параметры'}`);
        }
        finally {
            setModpackCreateLoading(false);
            setIsBusy(false);
        }
    }
    async function installModrinthProject(item) {
        const projectId = item?.slug || item?.project_id || item?.id;
        const projectType = item?.project_type || modrinthSearchType;
        if (!projectId)
            return;
        if (projectType !== 'modpack' && !selectedModpackProfile) {
            showAlert('Выберите модпак, куда установить моды, ресурспаки или шейдеры');
            return;
        }
        setIsBusy(true);
        setStatus('Установка Modrinth проекта...');
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
                };
            const result = await window.launcher.installModrinthProject(projectId, installOptions);
            if (result?.profile) {
                setStatus(`Модпак установлен. Профиль "${result.profile.name}" создан.`);
                await loadState();
                setSelectedModpackTarget(result.profile.id);
                setStandaloneExpanded(false);
                setExpandedModpacks(new Set([getProfileModpackKey(result.profile)]));
            }
            else {
                setStatus(`Установлено в "${selectedModpackProfile?.name || result?.targetProfile?.name || 'модпак'}"`);
            }
            await loadInstalledAddons();
        }
        catch (error) {
            console.error('Modrinth install error', error);
            setStatus(`Ошибка установки Modrinth: ${error?.message || 'проверьте лог'}`);
        }
        finally {
            setIsBusy(false);
        }
    }
    async function installSelectedModrinthVersion() {
        if (!selectedModrinthProject || !selectedModrinthVersion) {
            showAlert('Выберите версию для установки');
            return;
        }
        const projectId = getModrinthProjectId(selectedModrinthProject);
        const projectType = selectedModrinthProject.project_type || 'mod';
        if (!projectId)
            return;
        if (projectType !== 'modpack' && !selectedModpackProfile) {
            showAlert('Выберите модпак, куда установить мод, ресурспак или шейдер');
            return;
        }
        setIsBusy(true);
        setStatus(`Установка ${selectedModrinthVersion.version_number || selectedModrinthVersion.name}...`);
        try {
            const installOptions = projectType === 'modpack'
                ? {
                    versionId: selectedModrinthVersion.id,
                    gameVersion: modrinthVersionGameFilter || selectedModrinthVersion.game_versions?.[0],
                    loader: modrinthVersionLoaderFilter || selectedModrinthVersion.loaders?.[0]
                }
                : {
                    versionId: selectedModrinthVersion.id,
                    targetProfileId: selectedModpackProfile?.id,
                    gameVersion: selectedModpackProfile?.versionId,
                    loader: projectType === 'mod' && selectedModpackProfile?.loader !== 'vanilla' ? selectedModpackProfile?.loader : undefined
                };
            const result = await window.launcher.installModrinthProject(projectId, installOptions);
            if (result?.profile) {
                setStatus(`Модпак установлен. Профиль "${result.profile.name}" создан.`);
                await loadState();
                setSelectedModpackTarget(result.profile.id);
                setStandaloneExpanded(false);
                setExpandedModpacks(new Set([getProfileModpackKey(result.profile)]));
            }
            else {
                setStatus(`Установлено: ${selectedModrinthProject.title || projectId} ${selectedModrinthVersion.version_number || ''}`);
            }
            await loadInstalledAddons();
        }
        catch (error) {
            console.error('Modrinth version install error', error);
            setStatus(`Ошибка установки версии Modrinth: ${error?.message || 'проверьте лог'}`);
        }
        finally {
            setIsBusy(false);
        }
    }
    useEffect(() => {
        if (activeTab === 'Mods') {
            searchModrinth(1);
            loadInstalledAddons();
        }
    }, [activeTab, modrinthSearchType, effectiveModrinthLoader, effectiveModrinthVersion]);
    useEffect(() => {
        if (modrinthBrowserView !== 'project')
            return;
        if (filteredModrinthVersions.length === 0) {
            setSelectedModrinthVersionId('');
            return;
        }
        if (!filteredModrinthVersions.some((version) => version.id === selectedModrinthVersionId)) {
            setSelectedModrinthVersionId(filteredModrinthVersions[0].id);
        }
    }, [modrinthBrowserView, filteredModrinthVersions, selectedModrinthVersionId]);
    useEffect(() => {
        if (selectedModrinthImageIndex >= selectedModrinthProjectImages.length && selectedModrinthImageIndex !== 0) {
            setSelectedModrinthImageIndex(0);
        }
    }, [selectedModrinthProjectImages.length, selectedModrinthImageIndex]);
    useEffect(() => {
        if (modrinthBrowserView !== 'project' || !selectedModrinthProject || selectedModrinthProject.project_type === 'modpack' || !selectedModpackProfile)
            return;
        const nextGameFilter = selectedModpackProfile.versionId && modrinthVersionGameOptions.includes(selectedModpackProfile.versionId)
            ? selectedModpackProfile.versionId
            : '';
        const nextLoaderFilter = selectedModrinthProject.project_type === 'mod' && selectedModpackProfile.loader !== 'vanilla' && modrinthVersionLoaderOptions.includes(selectedModpackProfile.loader)
            ? selectedModpackProfile.loader
            : '';
        setModrinthVersionGameFilter(nextGameFilter);
        setModrinthVersionLoaderFilter(nextLoaderFilter);
    }, [modrinthBrowserView, selectedModrinthProject, selectedModpackProfile, modrinthVersionGameOptions, modrinthVersionLoaderOptions]);
    async function loadInstalledAddons() {
        try {
            const addons = await window.launcher.getInstalledModrinthAddons();
            setModrinthInstalledAddons(addons);
        }
        catch (error) {
            console.error('Failed to load installed addons:', error);
        }
    }
    function toggleModpackExpansion(modpackId) {
        if (expandedModpacks.has(modpackId)) {
            setExpandedModpacks(new Set());
        }
        else {
            setStandaloneExpanded(false);
            setExpandedModpacks(new Set([modpackId]));
        }
    }
    const organizedAddons = useMemo(() => {
        const modpacks = {};
        const standalone = createAddonBuckets();
        modpackProfiles.forEach((profile) => {
            const key = getProfileModpackKey(profile);
            if (!key)
                return;
            modpacks[key] = {
                key,
                title: profile.name,
                gameVersion: profile.versionId,
                loader: profile.loader,
                loaderVersion: profile.loaderVersion || '',
                categories: createAddonBuckets(),
                total: 0,
                profile
            };
        });
        modrinthInstalledAddons.forEach(addon => {
            const type = addon.type;
            if (!['mods', 'resourcepacks', 'shaderpacks'].includes(type))
                return;
            if (addon.origin?.modpackKey || addon.origin?.modpackId) {
                const key = addon.origin.modpackKey || `${addon.origin.modpackId}-${addon.origin.modpackVersion || 'latest'}`;
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
                    };
                }
                modpacks[key].categories[type].push(addon);
                modpacks[key].total += 1;
            }
            else {
                standalone[type].push(addon);
            }
        });
        const standaloneTotal = Object.values(standalone).reduce((sum, items) => sum + items.length, 0);
        return { modpacks, standalone, standaloneTotal };
    }, [modrinthInstalledAddons, modpackProfiles]);
    async function deleteModpack(modpackKey, modpackTitle) {
        if (await showConfirm(`Удалить модпак "${modpackTitle}" и все его дополнения?`)) {
            try {
                await window.launcher.deleteModpackDirectory(modpackKey);
                await loadInstalledAddons();
                await loadState();
            }
            catch (error) {
                console.error('Failed to delete modpack:', error);
            }
        }
    }
    async function deleteAllStandalone() {
        if (await showConfirm('Удалить все отдельные дополнения?')) {
            try {
                // Delete all standalone addons
                for (const addon of Object.values(organizedAddons.standalone).flat()) {
                    await window.launcher.deleteInstalledAddon(addon.type, addon.name, addon.path);
                }
                await loadInstalledAddons(); // Reload to get updated state
            }
            catch (error) {
                console.error('Failed to delete standalone addons:', error);
            }
        }
    }
    async function toggleAddon(addon) {
        try {
            await window.launcher.toggleInstalledAddon(addon.type, addon.name, !addon.enabled, addon.path);
            await loadInstalledAddons(); // Reload to get updated state
        }
        catch (error) {
            console.error('Failed to toggle addon:', error);
        }
    }
    async function deleteAddon(addon) {
        if (await showConfirm(`Удалить ${addon.name}?`)) {
            try {
                await window.launcher.deleteInstalledAddon(addon.type, addon.name, addon.path);
                await loadInstalledAddons(); // Reload to get updated state
            }
            catch (error) {
                console.error('Failed to delete addon:', error);
            }
        }
    }
    function renderAddonCategory(scopeKey, categoryKey, addons, defaultCategory) {
        const hasStoredCategory = Object.prototype.hasOwnProperty.call(openAddonCategories, scopeKey);
        const openCategory = hasStoredCategory ? openAddonCategories[scopeKey] : defaultCategory;
        const isOpen = openCategory === categoryKey;
        return (_jsxs("div", { className: `addon-category ${isOpen ? 'open' : ''}`, children: [_jsxs("button", { type: "button", className: "addon-category-header", onClick: () => {
                        setOpenAddonCategories((prev) => ({
                            ...prev,
                            [scopeKey]: isOpen ? '' : categoryKey
                        }));
                    }, children: [_jsxs("span", { className: "addon-category-title", children: [_jsx("span", { className: "addon-category-chevron", children: isOpen ? '▾' : '▸' }), addonCategoryLabels[categoryKey]] }), _jsx("span", { className: "addon-category-count", children: addons.length })] }), isOpen && (_jsxs("div", { className: "addon-category-list", children: [addons.length === 0 && _jsx("div", { className: "addon-empty", children: "\u041F\u0443\u0441\u0442\u043E" }), addons.map((addon) => (_jsxs("div", { className: "installed-item addon-row", children: [_jsxs("div", { className: "addon-row-main", children: [_jsx("span", { children: addon.name }), _jsxs("span", { children: [formatAddonType(addon.type), " \u2022 ", addon.enabled ? 'Включен' : 'Отключен'] })] }), _jsxs("div", { className: "addon-row-actions", children: [_jsx("button", { className: "outline-button", onClick: () => toggleAddon(addon), children: addon.enabled ? 'Отключить' : 'Включить' }), _jsx("button", { className: "outline-button delete-button", onClick: () => deleteAddon(addon), children: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C" })] })] }, addon.id)))] }))] }, categoryKey));
    }
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
        await window.launcher.saveProfile({ ...profileData, username: '', id: `${Date.now()}` });
        setStatus('Профиль сохранён');
        setProfileFormResetTrigger((k) => k + 1);
        await loadState();
    }
    async function saveProfileSettings(profileData) {
        if (!editingProfile)
            return;
        const nextProfile = {
            ...editingProfile,
            ...profileData,
            id: editingProfile.id,
            username: '',
            modpackPath: editingProfile.modpackPath,
            skin: editingProfile.skin
        };
        await window.launcher.saveProfile(nextProfile);
        setStatus(`Настройки профиля "${nextProfile.name}" сохранены`);
        await loadState();
    }
    async function launchProfile(profile) {
        setIsBusy(true);
        setProgressInfo({ label: `Запуск ${profile.name}...` });
        setStatus(`Запуск ${profile.name}...`);
        try {
            await window.launcher.launchProfile(profile.id, launcherProfileName);
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
            if (editingProfileId === profileId) {
                setEditingProfileId(null);
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
    async function handleLogout() {
        await window.launcher.logoutUser();
        setAuth({ email: '', loggedIn: false });
        setStatus('Вы вышли из аккаунта');
    }
    function handleAvatarUpload(event) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file)
            return;
        if (!file.type.startsWith('image/')) {
            showAlert('Выберите изображение для аватарки.');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            showAlert('Аватарка должна быть меньше 2 МБ.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const result = typeof reader.result === 'string' ? reader.result : '';
            if (!result.startsWith('data:image/')) {
                showAlert('Не удалось прочитать изображение.');
                return;
            }
            setSettings((current) => ({ ...current, avatarDataUrl: result }));
            setStatus('Аватар профиля обновлён');
        };
        reader.onerror = () => {
            showAlert('Не удалось загрузить аватарку.');
        };
        reader.readAsDataURL(file);
    }
    async function handleSaveSettings() {
        const normalizedSettings = normalizeSettings(settings);
        setSettings(normalizedSettings);
        await window.launcher.saveSettings(normalizedSettings);
        setStatus('Настройки сохранены');
    }
    useEffect(() => {
        if (!settingsLoaded)
            return;
        void window.launcher.saveSettings(normalizeSettings(settings)).catch((error) => {
            console.error('Ошибка автосохранения настроек', error);
        });
    }, [settings, settingsLoaded]);
    const themeClass = settings.theme === 'light' ? 'theme-light' : 'theme-dark';
    const accentColor = normalizeAccent(settings.accent);
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
    useEffect(() => {
        try {
            window.localStorage.setItem('kuroBoost', kuroBoostEnabled ? 'on' : 'off');
        }
        catch (e) { }
    }, [kuroBoostEnabled]);
    useEffect(() => {
        if (activeHeroIndex >= heroSlides.length) {
            setActiveHeroIndex(0);
        }
    }, [activeHeroIndex, heroSlides.length]);
    useEffect(() => {
        if (activeTab !== 'Dashboard' || heroSlides.length < 2)
            return;
        const timer = window.setTimeout(() => {
            setActiveHeroIndex((index) => (index + 1) % heroSlides.length);
        }, 6500);
        return () => window.clearTimeout(timer);
    }, [activeTab, activeHeroIndex, heroAutoplayResetKey, heroSlides.length]);
    return (_jsxs("div", { className: "app-shell", children: [_jsx("div", { className: "live-bg" }), _jsx("div", { className: "noise-overlay" }), _jsxs("div", { className: "titlebar", children: [_jsx("div", { className: "titlebar-title", children: "KuroLauncher" }), _jsxs("div", { className: "titlebar-controls", children: [_jsx("button", { type: "button", className: "titlebar-btn", onMouseUp: createTitlebarMouseHandler(handleMinimize), "aria-label": "Minimize", children: _jsx("svg", { viewBox: "0 0 12 2", xmlns: "http://www.w3.org/2000/svg", fill: "none", children: _jsx("rect", { x: "0", y: "0", width: "12", height: "2", rx: "1", fill: "currentColor" }) }) }), _jsx("button", { type: "button", className: "titlebar-btn", onMouseUp: createTitlebarMouseHandler(() => {
                                    void handleToggleMax();
                                }), "aria-label": "Maximize", children: isMaximized ? (_jsxs("svg", { viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", fill: "none", children: [_jsx("rect", { x: "3", y: "6", width: "14", height: "12", stroke: "currentColor", strokeWidth: "1.6", rx: "1" }), _jsx("path", { d: "M7 6V4h10v10h-2", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" })] })) : (_jsx("svg", { viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", fill: "none", children: _jsx("rect", { x: "4", y: "4", width: "16", height: "16", stroke: "currentColor", strokeWidth: "1.6", rx: "1" }) })) }), _jsx("button", { type: "button", className: "titlebar-btn", onMouseUp: createTitlebarMouseHandler(handleClose), "aria-label": "Close", children: _jsx("svg", { viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", fill: "none", children: _jsx("path", { d: "M4 4l16 16M20 4L4 20", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }) }) })] })] }), _jsxs("aside", { className: "launcher-sidebar glass-panel", children: [_jsxs("div", { className: "sidebar-brand", children: [_jsx("img", { src: logoIcon, alt: "KuroLauncher", className: "sidebar-logo" }), _jsxs("div", { className: "sidebar-brand-copy", children: [_jsx("div", { className: "sidebar-title", children: "KuroLauncher" }), _jsxs("div", { className: "sidebar-version", children: ["v", APP_VERSION] })] })] }), _jsx("nav", { className: "nav-bar", "aria-label": "\u0413\u043B\u0430\u0432\u043D\u0430\u044F \u043D\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044F", children: tabs.map((tab) => (_jsxs("button", { className: `nav-button ${activeTab === tab.id ? 'active' : ''}`, onClick: () => setActiveTab(tab.id), "aria-label": tab.label, children: [_jsx(Icon, { name: tab.icon }), _jsx("span", { children: tab.label })] }, tab.id))) }), _jsx("div", { className: "sidebar-spacer" }), _jsxs("div", { className: "sidebar-profile-card", children: [_jsxs("div", { className: "sidebar-profile-main", children: [_jsx("button", { className: `user-avatar ${launcherAvatar ? 'has-image' : ''}`, onClick: () => setActiveTab('Settings'), "aria-label": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043F\u0440\u043E\u0444\u0438\u043B\u044F", children: launcherAvatar ? _jsx("img", { src: launcherAvatar, alt: "" }) : userInitials }), _jsxs("div", { className: "user-info", children: [_jsx("div", { className: "user-name", children: launcherProfileName }), _jsx("div", { className: "user-email", children: launcherProfileSubtitle })] })] }), auth.loggedIn ? (_jsx("button", { className: "outline-button sidebar-wide-button", onClick: handleLogout, children: "\u0412\u044B\u0439\u0442\u0438" })) : (_jsxs("button", { className: "outline-button sidebar-wide-button", onClick: () => setActiveTab('Settings'), children: [_jsx(Icon, { name: "user" }), "\u0412\u043E\u0439\u0442\u0438"] }))] }), _jsxs("button", { type: "button", className: `boost-card ${kuroBoostEnabled ? 'active' : ''}`, onClick: () => setKuroBoost(!kuroBoostEnabled), "aria-pressed": kuroBoostEnabled, title: "KuroBoost \u043E\u043F\u0442\u0438\u043C\u0438\u0437\u0438\u0440\u0443\u0435\u0442 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B Minecraft \u0438 Java \u043F\u0435\u0440\u0435\u0434 \u0437\u0430\u043F\u0443\u0441\u043A\u043E\u043C \u043F\u0440\u043E\u0444\u0438\u043B\u044F.", children: [_jsxs("div", { className: "boost-head", children: [_jsx(Icon, { name: "shield" }), _jsxs("div", { children: [_jsx("div", { className: "boost-title", children: "KuroBoost" }), _jsx("div", { className: "boost-text", children: "AI-\u043F\u0440\u043E\u0444\u0438\u043B\u044C \u0437\u0430\u043F\u0443\u0441\u043A\u0430" })] })] }), _jsxs("div", { className: "boost-toggle", children: [_jsx("span", { children: kuroBoostEnabled ? 'Вкл' : 'Выкл' }), _jsx("span", { className: `toggle-pill ${kuroBoostEnabled ? 'active' : ''}`, children: _jsx("span", {}) })] })] })] }), _jsxs("div", { className: "workspace-shell", children: [_jsxs("div", { className: "header glass-panel", children: [_jsx("div", { className: "header-left", children: _jsxs("div", { className: `header-status ${isBusy ? 'loading' : ''}`, children: [_jsx("span", { className: "status-dot" }), status] }) }), _jsxs("label", { className: "top-search", children: [_jsx(Icon, { name: "search" }), _jsx("input", { value: versionSearch, onChange: (e) => {
                                            setVersionSearch(e.target.value);
                                            setCurrentPage(1);
                                            setActiveTab('Versions');
                                        }, placeholder: "\u041F\u043E\u0438\u0441\u043A \u0432\u0435\u0440\u0441\u0438\u0438..." })] })] }), isBusy && progressInfo && (_jsxs("div", { className: "progress-panel", children: [_jsx("div", { className: "progress-label", children: progressInfo.label }), _jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-bar-fill", style: { width: progressInfo.total ? `${Math.min(100, Math.round((progressInfo.current ?? 0) / progressInfo.total * 100))}%` : '100%' } }) })] })), _jsxs("main", { className: `content ${activeTab === 'Settings' ? 'settings-content' : ''}`, children: [activeTab === 'Skins' && (_jsx("section", { className: "skins-grid", children: _jsxs("div", { className: "panel panel large", children: [_jsx("div", { className: "panel-title", children: "\u0421\u043A\u0438\u043D\u044B" }), _jsxs("div", { className: "form-grid", children: [_jsxs("label", { children: ["\u041F\u0440\u043E\u0444\u0438\u043B\u044C", _jsx("div", { style: { marginTop: 8 }, children: _jsx(CustomSelect, { options: [{ value: '', label: 'Выберите профиль' }, ...profiles.map(p => ({ value: p.id, label: p.name || p.id }))], value: selectedProfile || '', onChange: (val) => setSelectedProfile(val), placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u0440\u043E\u0444\u0438\u043B\u044C" }) })] }), _jsxs("label", { children: ["\u041C\u043E\u0434\u0435\u043B\u044C", _jsxs("div", { style: { marginTop: 8, display: 'flex', gap: 8 }, children: [_jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: 6 }, children: [_jsx("input", { type: "radio", name: "skinModel", checked: skinModel === 'classic', onChange: () => setSkinModel('classic') }), " \u041E\u0431\u044B\u0447\u043D\u044B\u0439"] }), _jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: 6 }, children: [_jsx("input", { type: "radio", name: "skinModel", checked: skinModel === 'slim', onChange: () => setSkinModel('slim') }), " \u0421\u043B\u0438\u043C"] })] })] }), _jsxs("label", { children: ["\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0441\u043A\u0438\u043D (PNG)", _jsxs("div", { className: "skin-file-row", style: { marginTop: 8 }, children: [_jsx("input", { ref: fileInputRef, type: "file", accept: "image/png", style: { display: 'none' }, onChange: (e) => {
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
                                                                                            const res = await window.launcher.saveSkin(selectedProfile, skinDataUrl, {
                                                                                                model: skinModel,
                                                                                                username: launcherProfileName
                                                                                            });
                                                                                            if (!res || !res.ok) {
                                                                                                showAlert('Не удалось сохранить скин');
                                                                                                return;
                                                                                            }
                                                                                            if (res.url) {
                                                                                                updatedProfile.skin.url = res.url;
                                                                                            }
                                                                                            await window.launcher.saveProfile(updatedProfile);
                                                                                            await loadState();
                                                                                            setProfileSkinUrl(updatedProfile.skin.url || defaultSteveSkinUrl);
                                                                                            setSkinFile(null);
                                                                                            setSkinDataUrl(null);
                                                                                            if (res.customSkinLoader?.ok === false) {
                                                                                                showAlert(`Скин сохранён, но CustomSkinLoader не подключился: ${res.customSkinLoader.error || 'проверьте соединение'}`);
                                                                                            }
                                                                                            else if (res.customSkinLoader?.mod?.reason === 'vanilla') {
                                                                                                setStatus('Скин сохранён. CustomSkinLoader подключается для профилей Forge/Fabric/Quilt/NeoForge.');
                                                                                            }
                                                                                            else {
                                                                                                setStatus('Скин сохранён и подключён через CustomSkinLoader');
                                                                                            }
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
                                                                                    }, children: "\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C" })] }), _jsx("div", { className: "hint", children: "\u0421\u043A\u0438\u043D\u044B \u043F\u0440\u0438\u043C\u0435\u043D\u044F\u044E\u0442\u0441\u044F \u0432 \u0438\u0433\u0440\u0435 \u0447\u0435\u0440\u0435\u0437 CustomSkinLoader. \u0414\u043B\u044F \u0440\u0430\u0431\u043E\u0442\u044B \u043D\u0443\u0436\u0435\u043D \u043F\u0440\u043E\u0444\u0438\u043B\u044C \u0441 \u043C\u043E\u0434\u043B\u043E\u0430\u0434\u0435\u0440\u043E\u043C: Forge, Fabric, Quilt \u0438\u043B\u0438 NeoForge; \u043D\u0430 Vanilla \u0441\u043A\u0438\u043D \u043E\u0441\u0442\u0430\u043D\u0435\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0432 \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0435." })] })] })] })] })] }) })), activeTab === 'Dashboard' && (_jsxs("section", { className: "dashboard-grid dashboard-modern", children: [_jsxs("div", { className: "dashboard-main-column", children: [_jsxs(motion.section, { className: "hero-card hero-carousel-card", initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45 }, children: [_jsx(AnimatePresence, { initial: false, children: _jsx(motion.div, { className: "hero-slide-bg", style: { '--hero-image': `url(${activeHeroSlide.image})` }, initial: { opacity: 0, scale: 1.045, x: 18 }, animate: { opacity: 1, scale: 1, x: 0 }, exit: { opacity: 0, scale: 1.025, x: -16 }, transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] }, "aria-hidden": "true" }, `${activeHeroSlide.id}-background`) }), _jsx("button", { type: "button", className: "hero-nav hero-nav-prev", onClick: () => changeHeroSlide((index) => index - 1), "aria-label": "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0430\u044F \u043D\u043E\u0432\u043E\u0441\u0442\u044C", title: "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0430\u044F \u043D\u043E\u0432\u043E\u0441\u0442\u044C", children: _jsx(Icon, { name: "chevron" }) }), _jsx("button", { type: "button", className: "hero-nav hero-nav-next", onClick: () => changeHeroSlide((index) => index + 1), "aria-label": "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0430\u044F \u043D\u043E\u0432\u043E\u0441\u0442\u044C", title: "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0430\u044F \u043D\u043E\u0432\u043E\u0441\u0442\u044C", children: _jsx(Icon, { name: "chevron" }) }), _jsx(AnimatePresence, { mode: "wait", initial: false, children: _jsxs(motion.div, { className: "hero-copy", initial: { opacity: 0, x: 24, filter: 'blur(8px)' }, animate: { opacity: 1, x: 0, filter: 'blur(0px)' }, exit: { opacity: 0, x: -18, filter: 'blur(8px)' }, transition: { duration: 0.46, ease: [0.22, 1, 0.36, 1] }, children: [_jsx("span", { className: "hero-kicker", children: activeHeroSlide.kicker }), _jsx("h1", { children: activeHeroSlide.title }), _jsx("p", { children: activeHeroSlide.body }), _jsx("div", { className: "hero-meta-row", children: activeHeroSlide.meta.map((item) => (_jsx("span", { children: item }, item))) }), _jsx("div", { className: "hero-actions", children: activeHeroSlide.actions.map((action) => (_jsxs("button", { className: `btn btn-${action.variant}`, disabled: action.disabled, onClick: action.onClick, children: [_jsx(Icon, { name: action.icon }), action.label] }, action.id))) })] }, activeHeroSlide.id) }), _jsx("div", { className: "hero-progress", "aria-hidden": "true", children: _jsx("span", {}) }, `${activeHeroSlide.id}-${heroAutoplayResetKey}`), _jsxs("div", { className: "hero-dots", "aria-label": "\u041D\u043E\u0432\u043E\u0441\u0442\u0438 \u043D\u0430 \u0433\u043B\u0430\u0432\u043D\u043E\u043C \u044D\u043A\u0440\u0430\u043D\u0435", style: { '--dot-offset': `${activeHeroIndex * 38}px` }, children: [_jsx("span", { className: "hero-dot-glider", "aria-hidden": "true" }), heroSlides.map((slide, index) => (_jsx("button", { type: "button", className: index === activeHeroIndex ? 'active' : '', onClick: () => changeHeroSlide(index), "aria-label": `Открыть новость: ${slide.title}`, "aria-current": index === activeHeroIndex ? 'true' : undefined }, slide.id)))] })] }), _jsxs("div", { className: "section-heading", children: [_jsxs("div", { children: [_jsx("span", { className: "section-marker" }), _jsx("h2", { children: "\u041D\u043E\u0432\u043E\u0441\u0442\u0438 \u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F" })] }), _jsx("button", { className: "icon-button", onClick: loadMeta, title: "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0432\u0435\u0440\u0441\u0438\u0438", children: _jsx(Icon, { name: "refresh" }) })] }), _jsx("div", { className: "news-grid", children: dashboardNewsItems.map((item, index) => (_jsxs(motion.article, { className: `news-card rich-news-card news-card-${index + 1}`, style: { '--news-image': `url(${item.image})` }, initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, delay: index * 0.08 }, children: [_jsxs("div", { className: "news-media", children: [_jsx(Icon, { name: item.icon }), _jsx("span", { children: item.tag })] }), _jsxs("div", { className: "news-content", children: [_jsx("h3", { children: item.title }), _jsx("p", { children: item.body }), _jsx("span", { children: item.date })] })] }, item.title))) }), _jsx("div", { className: "section-heading quick-heading", children: _jsxs("div", { children: [_jsx("span", { className: "section-marker" }), _jsx("h2", { children: "\u0411\u044B\u0441\u0442\u0440\u044B\u0439 \u0434\u043E\u0441\u0442\u0443\u043F" })] }) }), _jsxs("div", { className: "quick-grid", children: [_jsxs("button", { className: "quick-card", onClick: () => setActiveTab('Profiles'), children: [_jsx("span", { className: "quick-icon red", children: _jsx(Icon, { name: "folder" }) }), _jsxs("span", { children: [_jsx("strong", { children: "\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0435 \u043F\u0440\u043E\u0444\u0438\u043B\u0438" }), _jsx("small", { children: "\u0411\u044B\u0441\u0442\u0440\u0430\u044F \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043F\u0440\u043E\u0444\u0438\u043B\u0435\u0439" })] })] }), _jsxs("button", { className: "quick-card", onClick: () => setActiveTab('Mods'), children: [_jsx("span", { className: "quick-icon dark-red", children: _jsx(Icon, { name: "mods" }) }), _jsxs("span", { children: [_jsx("strong", { children: "\u041C\u043E\u0434\u044B" }), _jsx("small", { children: "\u041C\u043E\u0434\u043F\u0430\u043A\u0438, \u0440\u0435\u0441\u0443\u0440\u0441\u044B \u0438 \u0448\u0435\u0439\u0434\u0435\u0440\u044B" })] })] }), _jsxs("button", { className: "quick-card", onClick: () => setActiveTab('Skins'), children: [_jsx("span", { className: "quick-icon wine", children: _jsx(Icon, { name: "shirt" }) }), _jsxs("span", { children: [_jsx("strong", { children: "\u0421\u043A\u0438\u043D\u044B" }), _jsx("small", { children: "\u0411\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430 \u0441\u043A\u0438\u043D\u043E\u0432 \u0438 \u043F\u043B\u0430\u0449\u0435\u0439" })] })] }), _jsxs("button", { className: "quick-card", onClick: () => setActiveTab('Settings'), children: [_jsx("span", { className: "quick-icon ember", children: _jsx(Icon, { name: "settings" }) }), _jsxs("span", { children: [_jsx("strong", { children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438" }), _jsx("small", { children: "Java, RAM \u0438 \u0437\u0430\u043F\u0443\u0441\u043A" })] })] })] })] }), _jsxs("aside", { className: "dashboard-side-column", children: [_jsxs("section", { className: "side-widget profile-widget", children: [_jsxs("div", { className: "widget-title-row", children: [_jsx("span", { className: "section-marker" }), _jsx("h2", { children: "\u0412\u0430\u0448 \u043F\u0440\u043E\u0444\u0438\u043B\u044C" }), _jsx("button", { className: "icon-button", onClick: () => setActiveTab('Settings'), title: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438", children: _jsx(Icon, { name: "settings" }) })] }), _jsxs("div", { className: "profile-widget-body", children: [_jsx("button", { className: `user-avatar big-avatar ${launcherAvatar ? 'has-image' : ''}`, onClick: () => setActiveTab('Settings'), "aria-label": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043F\u0440\u043E\u0444\u0438\u043B\u044F", children: launcherAvatar ? _jsx("img", { src: launcherAvatar, alt: "" }) : userInitials }), _jsxs("div", { children: [_jsx("div", { className: "user-name", children: launcherProfileName }), _jsx("div", { className: "user-email", children: launcherProfileSubtitle })] })] }), _jsxs("button", { className: "outline-button sidebar-wide-button", onClick: () => setActiveTab(auth.loggedIn ? 'Profiles' : 'Settings'), children: [_jsx(Icon, { name: auth.loggedIn ? 'profiles' : 'user' }), auth.loggedIn ? 'Мои профили' : 'Войти в аккаунт'] })] }), _jsxs("section", { className: "side-widget friends-widget", children: [_jsxs("div", { className: "widget-title-row", children: [_jsx("h2", { children: "\u0414\u0440\u0443\u0437\u044C\u044F" }), _jsx("span", { className: "online-label", children: "0 \u043E\u043D\u043B\u0430\u0439\u043D" })] }), _jsxs("div", { className: "empty-friends", children: [_jsx(Icon, { name: "friends" }), _jsx("p", { children: "\u0412\u043E\u0439\u0434\u0438\u0442\u0435, \u0447\u0442\u043E\u0431\u044B \u0432\u0438\u0434\u0435\u0442\u044C \u0441\u0442\u0430\u0442\u0443\u0441 \u0434\u0440\u0443\u0437\u0435\u0439 \u0438 \u0438\u0433\u0440\u0430\u0442\u044C \u0432\u043C\u0435\u0441\u0442\u0435." })] })] }), _jsxs("section", { className: "side-widget stats-widget", children: [_jsx("div", { className: "widget-title-row", children: _jsx("h2", { children: "\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430" }) }), _jsxs("div", { className: "stats-grid compact-stats", children: [_jsxs("div", { className: "stat-card", children: [_jsxs("div", { className: "stat-header", children: [_jsx("span", { className: "stat-label", children: "\u0412\u0435\u0440\u0441\u0438\u0439 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E" }), _jsx("span", { className: "stat-value", children: installed.length })] }), _jsx("div", { className: "stat-bar", children: _jsx(motion.div, { className: "stat-bar-fill", initial: { width: 0 }, animate: { width: `${Math.min(100, installed.length * 10)}%` }, transition: { duration: 1, delay: 0.2 } }) })] }), _jsxs("div", { className: "stat-card", children: [_jsxs("div", { className: "stat-header", children: [_jsx("span", { className: "stat-label", children: "\u041F\u0440\u043E\u0444\u0438\u043B\u0435\u0439" }), _jsx("span", { className: "stat-value", children: profiles.length })] }), _jsx("div", { className: "stat-bar", children: _jsx(motion.div, { className: "stat-bar-fill", initial: { width: 0 }, animate: { width: `${Math.min(100, profiles.length * 20)}%` }, transition: { duration: 1, delay: 0.4 } }) })] }), _jsxs("div", { className: "stat-card", children: [_jsxs("div", { className: "stat-header", children: [_jsx("span", { className: "stat-label", children: "RAM \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u043E" }), _jsx("span", { className: "stat-value", children: ramLabel })] }), _jsx("div", { className: "stat-bar", children: _jsx(motion.div, { className: "stat-bar-fill", initial: { width: 0 }, animate: { width: ramBarWidth }, transition: { duration: 1, delay: 0.6 } }) })] })] })] }), _jsx("div", { className: "social-row", children: socialLinks.map((link) => (_jsx("a", { className: "social-button", href: link.url, target: "_blank", rel: "noreferrer", title: link.title, "aria-label": link.title, onClick: (event) => openExternalLink(event, link.url), children: _jsx(Icon, { name: link.icon }) }, link.id))) }), _jsxs("div", { className: "launcher-footnote", children: ["KuroLauncher ", APP_VERSION, " \u2022 2026"] })] })] })), activeTab === 'Versions' && (_jsxs("section", { className: "versions-grid scrollable-content", children: [_jsxs("div", { className: "panel panel large", children: [_jsxs("div", { className: "panel-title", children: ["\u0414\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0435 \u0432\u0435\u0440\u0441\u0438\u0438 (", filteredVersions.length, ")"] }), _jsxs("div", { className: "version-filters", children: [_jsxs("div", { className: "filter-group", children: [_jsx("label", { children: "\u041F\u043E\u0438\u0441\u043A \u0432\u0435\u0440\u0441\u0438\u0438:" }), _jsx("input", { type: "text", placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 ID \u0432\u0435\u0440\u0441\u0438\u0438...", value: versionSearch, onChange: (e) => setVersionSearch(e.target.value), className: "search-input" })] }), _jsxs("div", { className: "filter-group", children: [_jsx("label", { children: "\u0422\u0438\u043F \u0432\u0435\u0440\u0441\u0438\u0438:" }), _jsx("div", { className: "filter-buttons", children: [
                                                                    { value: 'all', label: 'Все' },
                                                                    { value: 'release', label: 'Релизы' },
                                                                    { value: 'snapshot', label: 'Снапшоты' },
                                                                    { value: 'old_beta', label: 'Бета' },
                                                                    { value: 'old_alpha', label: 'Альфа' }
                                                                ].map(filter => (_jsx("button", { className: `filter-btn ${versionFilter === filter.value ? 'active' : ''}`, onClick: () => setVersionFilter(filter.value), children: filter.label }, filter.value))) })] })] }), _jsx("div", { className: "version-list", children: currentVersions.map((version) => (_jsxs("article", { className: "version-card", children: [_jsxs("div", { children: [_jsx("div", { className: "version-id", children: version.id }), _jsxs("div", { className: "version-meta", children: [version.type, " \u2022 ", new Date(version.releaseTime).toLocaleDateString()] })] }), _jsx("button", { className: "outline-button", disabled: installingVersion === version.id, onClick: () => installVersion(version.id), children: installingVersion === version.id ? 'Установка...' : 'Установить' })] }, version.id))) }), totalPages > 1 && (_jsxs("div", { className: "pagination", children: [_jsx("button", { className: "pagination-btn", disabled: currentPage === 1, onClick: () => setCurrentPage(currentPage - 1), children: "\u2039 \u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0430\u044F" }), _jsxs("div", { className: "pagination-info", children: ["\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 ", currentPage, " \u0438\u0437 ", totalPages] }), _jsx("button", { className: "pagination-btn", disabled: currentPage === totalPages, onClick: () => setCurrentPage(currentPage + 1), children: "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0430\u044F \u203A" })] }))] }), _jsxs("div", { className: "panel panel small installed-versions-panel", children: [_jsx("div", { className: "panel-title", children: "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044B\u0435" }), _jsxs("div", { className: "installed-list installed-version-list", children: [installed.length === 0 && _jsx("div", { className: "hint", children: "\u041D\u0435\u0442 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044B\u0445 \u0432\u0435\u0440\u0441\u0438\u0439" }), installed.map((item) => (_jsxs("div", { className: "installed-item installed-version-item", children: [_jsxs("div", { className: "installed-version-main", children: [_jsx("span", { className: "installed-version-id", title: item.id, children: item.id }), _jsx("span", { className: "installed-version-status", children: item.status })] }), _jsx("div", { className: "installed-version-actions", children: _jsx("button", { className: "outline-button delete-button installed-version-delete", onClick: () => deleteInstalledVersion(item.id), disabled: isBusy, title: `Удалить ${item.id}`, children: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C" }) })] }, item.id)))] })] })] })), activeTab === 'Profiles' && (_jsxs("section", { className: "profiles-grid scrollable-content", children: [_jsxs("div", { className: "panel panel small", children: [_jsx("div", { className: "panel-title", children: "\u041F\u0440\u043E\u0444\u0438\u043B\u0438" }), _jsxs("div", { className: "profiles-list", children: [profiles.map((profile) => (_jsxs("article", { className: `profile-card ${selectedProfile === profile.id ? 'selected' : ''}`, onClick: () => setSelectedProfile(profile.id), children: [_jsxs("div", { className: "profile-details", children: [_jsxs("div", { className: "profile-card-top", children: [_jsx("div", { className: "profile-name", children: profile.name }), profile.modpackPath && _jsx("span", { className: "profile-badge", children: "\u041C\u043E\u0434\u043F\u0430\u043A" })] }), _jsxs("div", { className: "profile-meta", children: [profile.versionId, profile.loader !== 'vanilla' ? ` • ${profile.loader.charAt(0).toUpperCase() + profile.loader.slice(1)}` : '', profile.loaderVersion ? ` ${profile.loaderVersion}` : ''] }), _jsxs("div", { className: "profile-chip-row", children: [_jsx("span", { className: "profile-chip", children: formatProfileRam(profile, settings) }), _jsx("span", { className: "profile-chip", children: profile.javaPath && profile.javaPath !== settings.javaPath ? 'Java: своя' : 'Java: общая' }), _jsx("span", { className: "profile-chip", children: formatProfileFullscreen(profile.fullscreenMode) })] })] }), _jsxs("div", { className: "profile-actions", children: [_jsx("button", { className: "button launch-button", onClick: (e) => {
                                                                            e.stopPropagation();
                                                                            launchProfile(profile);
                                                                        }, disabled: gameRunning, children: gameRunning ? 'Игра запущена' : 'Запустить' }), _jsx("button", { className: "outline-button", onClick: (e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedProfile(profile.id);
                                                                            setEditingProfileId(profile.id);
                                                                        }, children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0438\u0442\u044C" }), _jsx("button", { className: "btn btn-ghost delete-button", onClick: (e) => {
                                                                            e.stopPropagation();
                                                                            deleteProfile(profile.id);
                                                                        }, children: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C" })] })] }, profile.id))), profiles.length === 0 && _jsx("div", { className: "hint", children: "\u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u043F\u0440\u043E\u0444\u0438\u043B\u044C \u0434\u043B\u044F \u0437\u0430\u043F\u0443\u0441\u043A\u0430" })] })] }), _jsx("div", { className: "panel panel large", children: _jsxs("div", { className: `profile-config-panel ${editingProfile ? '' : 'profile-config-panel-muted'}`, children: [_jsxs("div", { className: "profile-panel-header", children: [_jsx("div", { className: "panel-title", children: editingProfile ? `Настройка: ${editingProfile.name}` : 'Новый профиль' }), editingProfile && (_jsx("button", { type: "button", className: "btn btn-ghost", onClick: () => setEditingProfileId(null), children: "\u041D\u0430\u0437\u0430\u0434 \u043A \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044E" }))] }), editingProfile ? (_jsx(ProfileForm, { onSave: saveProfileSettings, settings: settings, installed: installed, availableLoaderVersions: availableLoaderVersions, loaderVersionLoading: loaderVersionLoading, ramOptions: profileRamOptions, resetTrigger: profileFormResetTrigger, onLoaderVersionChange: (versionId, loader) => fetchLoaderVersions(versionId, loader), showAlert: showAlert, initialProfile: editingProfile, mode: "edit", submitLabel: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043F\u0440\u043E\u0444\u0438\u043B\u044F", onCancel: () => setEditingProfileId(null) }, `edit-${editingProfile.id}`)) : (_jsx(ProfileForm, { onSave: saveNewProfile, settings: settings, installed: installed, availableLoaderVersions: availableLoaderVersions, loaderVersionLoading: loaderVersionLoading, ramOptions: profileRamOptions, resetTrigger: profileFormResetTrigger, onLoaderVersionChange: (versionId, loader) => fetchLoaderVersions(versionId, loader), showAlert: showAlert, mode: "create", submitLabel: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u0440\u043E\u0444\u0438\u043B\u044C" }))] }) })] })), activeTab === 'Mods' && (_jsxs("section", { className: `modrinth-grid scrollable-content ${modrinthBrowserView === 'project' ? 'modrinth-project-mode' : ''}`, children: [_jsxs("div", { className: "panel panel large", children: [modrinthBrowserView === 'search' && (_jsxs(_Fragment, { children: [_jsx("div", { className: "panel-title", children: "\u041C\u043E\u0434\u043F\u0430\u043A\u0438" }), _jsxs("div", { className: "modpack-workbench", children: [_jsxs("div", { className: "modpack-workbench-panel", children: [_jsx("div", { className: "workbench-title", children: "\u0426\u0435\u043B\u044C \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438" }), _jsx(CustomSelect, { options: modpackTargetOptions, value: selectedModpackTarget, onChange: (val) => setSelectedModpackTarget(val), placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043C\u043E\u0434\u043F\u0430\u043A" }), selectedModpackProfile ? (_jsxs("div", { className: "target-summary", children: [_jsx("div", { className: "target-name", children: selectedModpackProfile.name }), _jsxs("div", { className: "target-chip-row", children: [_jsx("span", { className: "target-chip", children: selectedModpackProfile.versionId }), _jsx("span", { className: "target-chip", children: formatLoaderName(selectedModpackProfile.loader, selectedModpackProfile.loaderVersion) }), _jsx("span", { className: "target-chip", children: formatProfileRam(selectedModpackProfile, settings) })] })] })) : (_jsx("div", { className: "target-warning", children: "\u041F\u0435\u0440\u0435\u0434 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u043E\u0439 \u043C\u043E\u0434\u043E\u0432, \u0440\u0435\u0441\u0443\u0440\u0441\u043F\u0430\u043A\u043E\u0432 \u0438\u043B\u0438 \u0448\u0435\u0439\u0434\u0435\u0440\u043E\u0432 \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043C\u043E\u0434\u043F\u0430\u043A." }))] }), _jsxs("div", { className: "modpack-workbench-panel", children: [_jsx("div", { className: "workbench-title", children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0441\u0432\u043E\u0439 \u043C\u043E\u0434\u043F\u0430\u043A" }), _jsxs("div", { className: "modpack-create-grid", children: [_jsxs("label", { children: ["\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", _jsx("input", { value: modpackCreateForm.name, onChange: (e) => setModpackCreateForm((prev) => ({ ...prev, name: e.target.value })), placeholder: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 Kuro Survival" })] }), _jsxs("label", { children: ["\u0412\u0435\u0440\u0441\u0438\u044F Minecraft", _jsx(CustomSelect, { options: [{ value: '', label: 'Выберите версию' }, ...versionSelectOptions], value: modpackCreateForm.versionId, onChange: (val) => setModpackCreateForm((prev) => ({ ...prev, versionId: val, loaderVersion: '' })), placeholder: "\u0412\u0435\u0440\u0441\u0438\u044F" })] }), _jsxs("label", { children: ["\u041C\u043E\u0434\u043B\u043E\u0430\u0434\u0435\u0440", _jsx(CustomSelect, { options: [
                                                                                            { value: 'forge', label: 'Forge' },
                                                                                            { value: 'fabric', label: 'Fabric' },
                                                                                            { value: 'quilt', label: 'Quilt' },
                                                                                            { value: 'neoforge', label: 'NeoForge' },
                                                                                            { value: 'vanilla', label: 'Vanilla' }
                                                                                        ], value: modpackCreateForm.loader, onChange: (val) => setModpackCreateForm((prev) => ({ ...prev, loader: val, loaderVersion: '' })), placeholder: "\u041C\u043E\u0434\u043B\u043E\u0430\u0434\u0435\u0440" })] }), _jsxs("label", { children: ["\u0412\u0435\u0440\u0441\u0438\u044F \u043C\u043E\u0434\u043B\u043E\u0430\u0434\u0435\u0440\u0430", _jsx(CustomSelect, { options: [
                                                                                            { value: '', label: modpackCreateForm.loader === 'vanilla' ? 'Не требуется' : modpackCreateLoaderLoading ? 'Загрузка...' : 'Выберите версию' },
                                                                                            ...modpackCreateLoaderVersions
                                                                                        ], value: modpackCreateForm.loaderVersion, onChange: (val) => setModpackCreateForm((prev) => ({ ...prev, loaderVersion: val })), placeholder: "\u0412\u0435\u0440\u0441\u0438\u044F \u043C\u043E\u0434\u043B\u043E\u0430\u0434\u0435\u0440\u0430", disabled: modpackCreateForm.loader === 'vanilla' || modpackCreateLoaderLoading })] }), _jsx("button", { className: "button", onClick: createCustomModpack, disabled: modpackCreateLoading || modpackCreateLoaderLoading, children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043C\u043E\u0434\u043F\u0430\u043A" })] })] })] })] })), modrinthBrowserView === 'search' && _jsx("div", { className: "panel-title", style: { marginTop: 18 }, children: "\u0411\u0440\u0430\u0443\u0437\u0435\u0440 Modrinth" }), modrinthBrowserView === 'search' ? (_jsxs(_Fragment, { children: [selectedModpackProfile && isTargetedModrinthType && (_jsxs("div", { className: "modrinth-filter-note", children: ["\u041F\u043E\u0438\u0441\u043A \u0434\u043E\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0439 \u0438\u0434\u0451\u0442 \u043F\u043E\u0434 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u043C\u043E\u0434\u043F\u0430\u043A: ", selectedModpackProfile.versionId, " \u2022 ", formatLoaderName(selectedModpackProfile.loader, selectedModpackProfile.loaderVersion)] })), _jsxs("div", { className: "form-grid", children: [_jsxs("label", { children: ["\u041F\u043E\u0438\u0441\u043A", _jsx("input", { value: modrinthQuery, onChange: (e) => setModrinthQuery(e.target.value), placeholder: "\u0418\u043C\u044F \u043C\u043E\u0434\u0430, \u0442\u0435\u043A\u0441\u0442 \u0438\u043B\u0438 ID" })] }), _jsxs("label", { children: ["\u0412\u0435\u0440\u0441\u0438\u044F Minecraft", _jsx("input", { value: effectiveModrinthVersion, onChange: (e) => setModrinthSearchVersion(e.target.value), placeholder: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 1.20.1", disabled: Boolean(selectedModpackProfile && isTargetedModrinthType) })] }), _jsxs("label", { children: ["\u0417\u0430\u0433\u0440\u0443\u0437\u0447\u0438\u043A", _jsx(CustomSelect, { options: [
                                                                            { value: '', label: 'Любой' },
                                                                            { value: 'fabric', label: 'Fabric' },
                                                                            { value: 'forge', label: 'Forge' },
                                                                            { value: 'quilt', label: 'Quilt' },
                                                                            { value: 'neoforge', label: 'NeoForge' }
                                                                        ], value: effectiveModrinthLoader, onChange: (val) => setModrinthSearchLoader(val), placeholder: "\u0417\u0430\u0433\u0440\u0443\u0437\u0447\u0438\u043A", disabled: Boolean(selectedModpackProfile && isTargetedModrinthType) })] }), _jsxs("label", { children: ["\u0422\u0438\u043F \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0430", _jsx(CustomSelect, { options: [
                                                                            { value: 'all', label: 'Все' },
                                                                            { value: 'mod', label: 'Моды' },
                                                                            { value: 'modpack', label: 'Модпаки' },
                                                                            { value: 'resourcepack', label: 'Ресурсы' },
                                                                            { value: 'shader', label: 'Шейдеры' }
                                                                        ], value: modrinthSearchType, onChange: (val) => setModrinthSearchType(val), placeholder: "\u0422\u0438\u043F" })] }), _jsx("button", { className: "button", onClick: () => searchModrinth(1), disabled: modrinthLoading, children: "\u0418\u0441\u043A\u0430\u0442\u044C" })] }), _jsxs("div", { className: "panel-title", style: { marginTop: 18 }, children: ["\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u044B \u043F\u043E\u0438\u0441\u043A\u0430 ", modrinthTotalHits ? `(${modrinthTotalHits} найдено)` : ''] }), _jsxs("div", { className: "search-results grid", children: [modrinthLoading && _jsx("div", { className: "hint", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u043E\u0432..." }), !modrinthLoading && modrinthSearchResults.length === 0 && _jsx("div", { className: "hint", children: "\u041D\u0435\u0442 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u043E\u0432. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0434\u0440\u0443\u0433\u043E\u0439 \u0437\u0430\u043F\u0440\u043E\u0441 \u0438\u043B\u0438 \u0441\u043C\u0435\u043D\u0438\u0442\u0435 \u0444\u0438\u043B\u044C\u0442\u0440\u044B." }), modrinthSearchResults.map((item) => (_jsxs("article", { className: "search-card modrinth-card", tabIndex: 0, onClick: () => openModrinthProject(item), onKeyDown: (event) => {
                                                                    if (event.key === 'Enter' || event.key === ' ') {
                                                                        event.preventDefault();
                                                                        openModrinthProject(item);
                                                                    }
                                                                }, children: [_jsxs("div", { className: "search-card-header", children: [_jsx("img", { src: item.icon_url || '', alt: item.title || item.name, className: "search-card-icon" }), _jsxs("div", { children: [_jsx("div", { className: "search-title", children: item.title || item.name }), _jsxs("div", { className: "search-meta", children: [formatModrinthProjectType(item.project_type), " \u2022 ", item.primary_category || item.loader_type || 'Без категории'] })] })] }), _jsxs("div", { className: "search-body", children: [_jsx("p", { children: item.description ? item.description.slice(0, 160) : 'Описание отсутствует.' }), _jsx("div", { className: "search-tags", children: Array.isArray(item.categories) && item.categories.slice(0, 4).map((category) => (_jsx("span", { className: "tag", children: category }, category))) })] }), _jsxs("div", { className: "search-footer", children: [_jsxs("div", { children: [_jsxs("span", { className: "small-text", children: ["\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0438: ", formatCompactNumber(item.downloads)] }), _jsxs("span", { className: "small-text", children: ["   \u0412\u0435\u0440\u0441\u0438\u0439: ", item.versions?.length ?? 0] })] }), _jsxs("div", { className: "search-footer-actions", children: [_jsx("button", { className: "outline-button", onClick: (event) => {
                                                                                            event.stopPropagation();
                                                                                            openModrinthProject(item);
                                                                                        }, disabled: modrinthLoading, children: "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435" }), _jsx("button", { className: "outline-button", onClick: (event) => {
                                                                                            event.stopPropagation();
                                                                                            installModrinthProject(item);
                                                                                        }, disabled: modrinthLoading || isBusy, children: item.project_type === 'modpack' ? 'Скачать модпак' : 'Скачать' })] })] })] }, item.id)))] }), modrinthTotalHits > 20 && (_jsxs("div", { className: "pagination", style: { marginTop: 16 }, children: [_jsx("button", { className: "pagination-btn", disabled: modrinthPage <= 1 || modrinthLoading, onClick: () => searchModrinth(modrinthPage - 1), children: "\u2039 \u041D\u0430\u0437\u0430\u0434" }), _jsxs("div", { className: "pagination-info", children: ["\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 ", modrinthPage, " \u0438\u0437 ", Math.ceil(modrinthTotalHits / 20)] }), _jsx("button", { className: "pagination-btn", disabled: modrinthPage >= Math.ceil(modrinthTotalHits / 20) || modrinthLoading, onClick: () => searchModrinth(modrinthPage + 1), children: "\u0412\u043F\u0435\u0440\u0451\u0434 \u203A" })] }))] })) : (_jsxs("div", { className: "modrinth-project-view", children: [_jsxs("div", { className: "modrinth-project-toolbar", children: [_jsx("button", { className: "outline-button", onClick: closeModrinthProject, children: "\u2190 \u041A \u043F\u043E\u0438\u0441\u043A\u0443" }), _jsxs("div", { className: "modrinth-project-toolbar-actions", children: [_jsx("button", { className: "outline-button", onClick: () => selectedModrinthProject && openModrinthProject(selectedModrinthProject, true), disabled: modrinthDetailLoading, children: "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C" }), _jsx("button", { className: "outline-button", onClick: () => selectedModrinthProject && window.launcher.openExternal(getModrinthProjectUrl(selectedModrinthProject)), children: "Modrinth" })] })] }), modrinthDetailLoading && _jsx("div", { className: "hint", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043F\u0440\u043E\u0435\u043A\u0442\u0430 \u0438 \u0432\u0435\u0440\u0441\u0438\u0439..." }), selectedModrinthProject && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "modrinth-project-hero", children: [_jsx("img", { src: selectedModrinthProject.icon_url || '', alt: selectedModrinthProject.title || selectedModrinthProject.name, className: "modrinth-project-icon" }), _jsxs("div", { className: "modrinth-project-copy", children: [_jsxs("div", { className: "modrinth-project-kicker", children: [formatModrinthProjectType(selectedModrinthProject.project_type), " \u2022 ", selectedModrinthProject.slug || selectedModrinthProject.id] }), _jsx("h2", { children: selectedModrinthProject.title || selectedModrinthProject.name }), _jsx("p", { children: selectedModrinthProject.description || 'Описание отсутствует.' }), _jsx("div", { className: "search-tags", children: Array.isArray(selectedModrinthProject.categories) && selectedModrinthProject.categories.slice(0, 8).map((category) => (_jsx("span", { className: "tag", children: category }, category))) })] }), _jsxs("div", { className: "modrinth-project-metrics", children: [_jsxs("span", { children: [_jsx("strong", { children: formatCompactNumber(selectedModrinthProject.downloads) }), " \u0437\u0430\u0433\u0440\u0443\u0437\u043E\u043A"] }), _jsxs("span", { children: [_jsx("strong", { children: formatCompactNumber(selectedModrinthProject.followers) }), " \u043F\u043E\u0434\u043F\u0438\u0441\u0447\u0438\u043A\u043E\u0432"] }), _jsxs("span", { children: [_jsx("strong", { children: selectedModrinthVersions.length }), " \u0432\u0435\u0440\u0441\u0438\u0439"] }), _jsxs("span", { children: ["\u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E ", _jsx("strong", { children: formatModrinthDate(selectedModrinthProject.updated || selectedModrinthProject.date_modified) })] })] })] }), _jsxs("div", { className: "modrinth-project-tabs", role: "tablist", "aria-label": "\u0420\u0430\u0437\u0434\u0435\u043B\u044B \u043F\u0440\u043E\u0435\u043A\u0442\u0430", children: [_jsxs("button", { type: "button", className: modrinthProjectTab === 'versions' ? 'active' : '', onClick: () => setModrinthProjectTab('versions'), children: ["\u0412\u0435\u0440\u0441\u0438\u0438 ", _jsx("span", { children: selectedModrinthVersions.length })] }), _jsxs("button", { type: "button", className: modrinthProjectTab === 'images' ? 'active' : '', onClick: () => setModrinthProjectTab('images'), children: ["\u0418\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F ", _jsx("span", { children: selectedModrinthProjectImages.length })] }), _jsx("button", { type: "button", className: modrinthProjectTab === 'description' ? 'active' : '', onClick: () => setModrinthProjectTab('description'), children: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" })] }), _jsxs("div", { className: "modrinth-project-layout", children: [_jsxs("div", { className: `modrinth-project-content-panel modrinth-project-content-${modrinthProjectTab}`, children: [modrinthProjectTab === 'versions' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "modrinth-section-row", children: [_jsx("div", { className: "modrinth-section-title", children: "\u0412\u0435\u0440\u0441\u0438\u0438" }), _jsxs("span", { children: [filteredModrinthVersions.length, " \u0438\u0437 ", selectedModrinthVersions.length] })] }), _jsxs("div", { className: "modrinth-version-controls", children: [_jsx(CustomSelect, { options: [{ value: '', label: 'Все версии Minecraft' }, ...modrinthVersionGameOptions.map((item) => ({ value: item, label: item }))], value: modrinthVersionGameFilter, onChange: (val) => setModrinthVersionGameFilter(val), placeholder: "Minecraft" }), _jsx(CustomSelect, { options: [{ value: '', label: 'Все загрузчики' }, ...modrinthVersionLoaderOptions.map((item) => ({ value: item, label: item }))], value: modrinthVersionLoaderFilter, onChange: (val) => setModrinthVersionLoaderFilter(val), placeholder: "\u0417\u0430\u0433\u0440\u0443\u0437\u0447\u0438\u043A" }), _jsx(CustomSelect, { options: [
                                                                                                    { value: '', label: 'Любой релиз' },
                                                                                                    { value: 'release', label: 'Релиз' },
                                                                                                    { value: 'beta', label: 'Бета' },
                                                                                                    { value: 'alpha', label: 'Альфа' }
                                                                                                ], value: modrinthVersionReleaseFilter, onChange: (val) => setModrinthVersionReleaseFilter(val), placeholder: "\u0422\u0438\u043F" })] }), _jsxs("div", { className: "modrinth-version-list", children: [filteredModrinthVersions.length === 0 && _jsx("div", { className: "hint", children: "\u041D\u0435\u0442 \u0432\u0435\u0440\u0441\u0438\u0439 \u043F\u043E\u0434 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0435 \u0444\u0438\u043B\u044C\u0442\u0440\u044B." }), filteredModrinthVersions.map((version) => {
                                                                                                const selected = selectedModrinthVersion?.id === version.id;
                                                                                                return (_jsxs("button", { type: "button", className: `modrinth-version-row ${selected ? 'selected' : ''}`, onClick: () => setSelectedModrinthVersionId(version.id), children: [_jsxs("span", { className: "modrinth-version-main", children: [_jsx("strong", { children: version.name || version.version_number }), _jsxs("span", { children: [version.version_number, " \u2022 ", modrinthVersionTypeLabels[version.version_type] || version.version_type || 'версия', " \u2022 ", formatModrinthDate(version.date_published)] })] }), _jsxs("span", { className: "modrinth-version-tags", children: [Array.isArray(version.game_versions) && version.game_versions.slice(0, 2).map((gameVersion) => (_jsx("span", { children: gameVersion }, gameVersion))), Array.isArray(version.loaders) && version.loaders.slice(0, 1).map((loaderName) => (_jsx("span", { children: loaderName }, loaderName)))] })] }, version.id));
                                                                                            })] })] })), modrinthProjectTab === 'images' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "modrinth-section-row", children: [_jsx("div", { className: "modrinth-section-title", children: "\u0418\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F \u043F\u0440\u043E\u0435\u043A\u0442\u0430" }), _jsx("span", { children: selectedModrinthProjectImages.length || 'нет изображений' })] }), selectedModrinthProjectImages.length === 0 ? (_jsx("div", { className: "hint", children: "\u0423 \u044D\u0442\u043E\u0433\u043E \u043F\u0440\u043E\u0435\u043A\u0442\u0430 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0439 \u043D\u0430 Modrinth." })) : (_jsxs("div", { className: "modrinth-gallery", children: [selectedModrinthImage && (_jsxs("div", { className: "modrinth-gallery-stage", children: [_jsx("img", { src: selectedModrinthImage.url, alt: selectedModrinthImage.title }), _jsxs("div", { className: "modrinth-gallery-caption", children: [_jsxs("div", { children: [_jsx("strong", { children: selectedModrinthImage.title }), selectedModrinthImage.description && _jsx("span", { children: selectedModrinthImage.description })] }), _jsx("button", { className: "outline-button", onClick: () => window.launcher.openExternal(selectedModrinthImage.raw_url || selectedModrinthImage.url), children: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C" })] })] })), _jsx("div", { className: "modrinth-gallery-thumbs", children: selectedModrinthProjectImages.map((image, index) => (_jsxs("button", { type: "button", className: index === selectedModrinthImageIndex ? 'active' : '', onClick: () => setSelectedModrinthImageIndex(index), children: [_jsx("img", { src: image.url, alt: image.title }), _jsx("span", { children: image.title })] }, `${image.url}-${index}`))) })] }))] })), modrinthProjectTab === 'description' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "modrinth-section-row", children: [_jsx("div", { className: "modrinth-section-title", children: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043F\u0440\u043E\u0435\u043A\u0442\u0430" }), _jsx("span", { children: "Modrinth" })] }), _jsx("div", { className: "modrinth-markdown-text modrinth-description-panel-text", children: getProjectBodySummary(selectedModrinthProject).split('\n').filter(Boolean).map((line, index) => (_jsx("p", { children: line }, `${line.slice(0, 18)}-${index}`))) })] }))] }), _jsxs("aside", { className: "modrinth-install-panel", children: [selectedModrinthProjectType !== 'modpack' && (_jsxs("div", { className: "modrinth-install-target", children: [_jsx("span", { children: "\u0426\u0435\u043B\u044C \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438" }), _jsx(CustomSelect, { options: modpackTargetOptions, value: selectedModpackTarget, onChange: (val) => setSelectedModpackTarget(val), placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043C\u043E\u0434\u043F\u0430\u043A" })] })), selectedModrinthProjectType !== 'modpack' && !selectedModpackProfile && (_jsx("div", { className: "target-warning", children: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043C\u043E\u0434\u043F\u0430\u043A \u0432 \u0431\u043B\u043E\u043A\u0435 \u0432\u044B\u0448\u0435, \u0447\u0442\u043E\u0431\u044B \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u0443\u044E \u0432\u0435\u0440\u0441\u0438\u044E." })), _jsxs("div", { className: "modrinth-install-bar", children: [_jsxs("div", { children: [_jsx("span", { children: "\u0412\u044B\u0431\u0440\u0430\u043D\u043E" }), _jsx("strong", { children: selectedModrinthVersion ? selectedModrinthVersion.version_number || selectedModrinthVersion.name : 'нет версии' })] }), _jsx("button", { className: "button", onClick: installSelectedModrinthVersion, disabled: !selectedModrinthVersion || isBusy || modrinthDetailLoading, children: selectedModrinthProjectType === 'modpack' ? 'Установить модпак' : 'Установить версию' })] }), selectedModrinthVersion && (_jsxs("div", { className: "modrinth-version-detail", children: [_jsxs("div", { children: [_jsx("span", { children: "\u0424\u0430\u0439\u043B" }), _jsx("strong", { children: summarizeVersionFile(selectedModrinthVersion) })] }), _jsxs("div", { children: [_jsx("span", { children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0432\u0435\u0440\u0441\u0438\u0438" }), _jsx("strong", { children: formatCompactNumber(selectedModrinthVersion.downloads) })] }), _jsxs("div", { children: [_jsx("span", { children: "\u0417\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0441\u0442\u0438" }), _jsx("strong", { children: selectedModrinthVersion.dependencies?.length || 0 })] }), selectedModrinthVersion.changelog && (_jsx("p", { children: normalizeMarkdownText(selectedModrinthVersion.changelog).slice(0, 520) }))] })), _jsxs("div", { className: "modrinth-project-facts", children: [_jsxs("div", { children: [_jsx("span", { children: "\u041A\u043B\u0438\u0435\u043D\u0442" }), _jsx("strong", { children: formatSideSupport(selectedModrinthProject.client_side) })] }), _jsxs("div", { children: [_jsx("span", { children: "\u0421\u0435\u0440\u0432\u0435\u0440" }), _jsx("strong", { children: formatSideSupport(selectedModrinthProject.server_side) })] }), _jsxs("div", { children: [_jsx("span", { children: "\u041B\u0438\u0446\u0435\u043D\u0437\u0438\u044F" }), _jsx("strong", { children: selectedModrinthProject.license?.name || selectedModrinthProject.license?.id || 'не указана' })] }), _jsxs("div", { children: [_jsx("span", { children: "\u0421\u043E\u0437\u0434\u0430\u043D\u043E" }), _jsx("strong", { children: formatModrinthDate(selectedModrinthProject.published || selectedModrinthProject.date_created) })] })] }), _jsxs("div", { className: "modrinth-link-row", children: [selectedModrinthProject.source_url && _jsx("button", { className: "outline-button", onClick: () => window.launcher.openExternal(selectedModrinthProject.source_url), children: "Source" }), selectedModrinthProject.issues_url && _jsx("button", { className: "outline-button", onClick: () => window.launcher.openExternal(selectedModrinthProject.issues_url), children: "Issues" }), selectedModrinthProject.wiki_url && _jsx("button", { className: "outline-button", onClick: () => window.launcher.openExternal(selectedModrinthProject.wiki_url), children: "Wiki" }), selectedModrinthProject.discord_url && _jsx("button", { className: "outline-button", onClick: () => window.launcher.openExternal(selectedModrinthProject.discord_url), children: "Discord" })] })] })] })] }))] }))] }), modrinthBrowserView === 'search' && (_jsxs("div", { className: "panel panel small", children: [_jsx("div", { className: "panel-title", children: "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044B\u0435 \u0434\u043E\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F" }), _jsxs("div", { className: "installed-list", children: [modrinthInstalledAddons.length === 0 && Object.keys(organizedAddons.modpacks).length === 0 && (_jsx("div", { className: "hint", children: "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044B\u0445 \u043C\u043E\u0434\u043E\u0432/\u0448\u0435\u0439\u0434\u0435\u0440\u043E\u0432/\u0440\u0435\u0441\u0443\u0440\u0441\u043E\u0432." })), organizedAddons.standaloneTotal > 0 && (_jsxs("div", { className: "modpack-section", children: [_jsxs("div", { className: "modpack-header", onClick: () => {
                                                                    setStandaloneExpanded(!standaloneExpanded);
                                                                    if (!standaloneExpanded)
                                                                        setExpandedModpacks(new Set());
                                                                }, style: { cursor: 'pointer' }, children: [_jsxs("div", { className: "modpack-title", children: [_jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", style: {
                                                                                    marginRight: 8,
                                                                                    transform: standaloneExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                                                                    transition: 'transform 0.2s'
                                                                                }, children: _jsx("path", { d: "M9 18l6-6-6-6", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" }) }), _jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", style: { marginRight: 8 }, children: [_jsx("path", { d: "M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z", stroke: "currentColor", strokeWidth: "1.6" }), _jsx("path", { d: "m8 5 4-3 4 3", stroke: "currentColor", strokeWidth: "1.6" })] }), "\u041E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0435 \u0434\u043E\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F", _jsxs("span", { className: "modpack-subtitle", children: [organizedAddons.standaloneTotal, " \u0434\u043E\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0439"] })] }), _jsx("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: _jsx("button", { className: "outline-button delete-button", onClick: (e) => {
                                                                                e.stopPropagation();
                                                                                deleteAllStandalone();
                                                                            }, style: { fontSize: 12, padding: '4px 8px' }, children: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0432\u0441\u0435" }) })] }), standaloneExpanded && (_jsx(motion.div, { className: "modpack-content", initial: { height: 0, opacity: 0 }, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { duration: 0.2 }, children: _jsxs("div", { className: "addon-category-grid", children: [renderAddonCategory('standalone', 'mods', organizedAddons.standalone.mods, getDefaultAddonCategory(organizedAddons.standalone)), renderAddonCategory('standalone', 'resourcepacks', organizedAddons.standalone.resourcepacks, getDefaultAddonCategory(organizedAddons.standalone)), renderAddonCategory('standalone', 'shaderpacks', organizedAddons.standalone.shaderpacks, getDefaultAddonCategory(organizedAddons.standalone))] }) }))] })), Object.values(organizedAddons.modpacks).map((pack) => {
                                                        const isExpanded = expandedModpacks.has(pack.key);
                                                        const categoryCounts = {
                                                            mods: pack.categories.mods.length,
                                                            resourcepacks: pack.categories.resourcepacks.length,
                                                            shaderpacks: pack.categories.shaderpacks.length
                                                        };
                                                        const defaultCategory = getDefaultAddonCategory(pack.categories);
                                                        return (_jsxs("div", { className: "modpack-section", children: [_jsxs("div", { className: "modpack-header", onClick: () => toggleModpackExpansion(pack.key), style: { cursor: 'pointer' }, children: [_jsxs("div", { className: "modpack-title", children: [_jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", style: {
                                                                                        marginRight: 8,
                                                                                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                                                                        transition: 'transform 0.2s'
                                                                                    }, children: _jsx("path", { d: "M9 18l6-6-6-6", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" }) }), _jsxs("div", { className: "modpack-title-stack", children: [_jsx("span", { children: pack.title }), _jsxs("span", { className: "modpack-subtitle", children: [pack.gameVersion || 'Версия не указана', " \u2022 ", formatLoaderName(pack.loader, pack.loaderVersion), " \u2022 ", pack.total, " \u0434\u043E\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0439"] }), _jsxs("span", { className: "modpack-category-pills", children: [_jsxs("span", { children: ["\u041C\u043E\u0434\u044B ", categoryCounts.mods] }), _jsxs("span", { children: ["\u0420\u0435\u0441. ", categoryCounts.resourcepacks] }), _jsxs("span", { children: ["\u0428\u0435\u0439\u0434. ", categoryCounts.shaderpacks] })] })] })] }), _jsx("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: _jsx("button", { className: "outline-button delete-button", onClick: (e) => {
                                                                                    e.stopPropagation();
                                                                                    deleteModpack(pack.key, pack.title);
                                                                                }, style: { fontSize: 12, padding: '4px 8px' }, "aria-label": `Удалить модпак ${pack.title}`, title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043C\u043E\u0434\u043F\u0430\u043A", children: "\u00D7" }) })] }), isExpanded && (_jsx(motion.div, { className: "modpack-content", initial: { height: 0, opacity: 0 }, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { duration: 0.2 }, children: _jsxs("div", { className: "addon-category-grid", children: [renderAddonCategory(pack.key, 'mods', pack.categories.mods, defaultCategory), renderAddonCategory(pack.key, 'resourcepacks', pack.categories.resourcepacks, defaultCategory), renderAddonCategory(pack.key, 'shaderpacks', pack.categories.shaderpacks, defaultCategory)] }) }))] }, pack.key));
                                                    })] })] }))] })), activeTab === 'Settings' && (_jsxs("section", { className: "settings-grid", children: [_jsxs("div", { className: "panel large", children: [_jsx("div", { className: "panel-title", children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438" }), _jsxs("div", { className: "form-grid", children: [_jsxs("label", { children: ["\u0410\u043A\u0446\u0435\u043D\u0442", _jsx("div", { style: { marginTop: 8 }, children: _jsx(CustomSelect, { options: [
                                                                        { value: 'red', label: 'Красный' },
                                                                        { value: 'violet', label: 'Фиолетовый' },
                                                                        { value: 'white', label: 'Белый' }
                                                                    ], value: settings.accent || 'red', onChange: (val) => setSettings({ ...settings, accent: val }), placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0430\u043A\u0446\u0435\u043D\u0442" }) })] }), _jsxs("label", { children: ["\u0422\u0435\u043C\u0430", _jsx("div", { style: { marginTop: 8 }, children: _jsx(CustomSelect, { options: [{ value: 'dark', label: 'Тёмная' }, { value: 'light', label: 'Светлая' }], value: settings.theme, onChange: (val) => setSettings({ ...settings, theme: val }), placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0442\u0435\u043C\u0443" }) })] }), _jsxs("label", { children: ["\u041F\u0443\u0442\u044C \u043A Java", _jsx("input", { value: settings.javaPath, onChange: (e) => setSettings({ ...settings, javaPath: e.target.value }) })] }), _jsxs("label", { children: ["\u041F\u0430\u043C\u044F\u0442\u044C (RAM)", _jsx("div", { style: { marginTop: 8 }, children: _jsx(CustomSelect, { options: ramOptions, value: settings.ram || 'auto', onChange: (val) => setSettings({ ...settings, ram: val }), placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u0430\u043C\u044F\u0442\u044C" }) })] }), _jsxs("button", { type: "button", className: `settings-toggle-card ${settings.fullscreen ? 'active' : ''}`, onClick: () => setSettings({ ...settings, fullscreen: !settings.fullscreen }), "aria-pressed": settings.fullscreen, children: [_jsxs("div", { className: "settings-toggle-copy", children: [_jsx("span", { className: "settings-toggle-eyebrow", children: "\u0417\u0430\u043F\u0443\u0441\u043A" }), _jsx("span", { className: "settings-toggle-title", children: "\u041F\u043E\u043B\u043D\u043E\u044D\u043A\u0440\u0430\u043D\u043D\u044B\u0439 \u0440\u0435\u0436\u0438\u043C" }), _jsx("span", { className: "settings-toggle-text", children: "Minecraft \u0431\u0443\u0434\u0435\u0442 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0442\u044C\u0441\u044F \u0441\u0440\u0430\u0437\u0443 \u043D\u0430 \u0432\u0435\u0441\u044C \u044D\u043A\u0440\u0430\u043D \u043F\u0440\u0438 \u0437\u0430\u043F\u0443\u0441\u043A\u0435 \u0438\u0437 \u043B\u0430\u0443\u043D\u0447\u0435\u0440\u0430." })] }), _jsx("span", { className: `settings-toggle-pill ${settings.fullscreen ? 'active' : ''}`, children: _jsx("span", { className: "settings-toggle-thumb" }) })] }), _jsx("button", { className: "button", onClick: handleSaveSettings, children: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438" })] })] }), _jsxs("div", { className: "panel small auth-panel", children: [_jsx("div", { className: "panel-title", children: "\u0410\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F" }), _jsxs("label", { children: ["Email", _jsx("input", { value: loginState.email, onChange: (e) => setLoginState({ ...loginState, email: e.target.value }) })] }), _jsxs("label", { children: ["\u041F\u0430\u0440\u043E\u043B\u044C", _jsx("input", { type: "password", value: loginState.password, onChange: (e) => setLoginState({ ...loginState, password: e.target.value }) })] }), _jsxs("div", { className: "button-row", children: [_jsx("button", { className: "outline-button", onClick: () => setRegisterMode(!registerMode), children: registerMode ? 'Войти' : 'Регистрация' }), _jsx("button", { className: "button", onClick: handleLogin, children: registerMode ? 'Зарегистрироваться' : 'Войти' })] }), _jsx("p", { className: "hint", children: "\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u0430\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F \u0445\u0440\u0430\u043D\u0438\u0442\u0441\u044F \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E \u0432 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435 KuroLauncher." })] }), _jsxs("div", { className: "panel profile-settings-panel", children: [_jsxs("div", { className: "profile-settings-heading", children: [_jsxs("div", { children: [_jsx("div", { className: "panel-title", children: "\u041F\u0440\u043E\u0444\u0438\u043B\u044C \u043B\u0430\u0443\u043D\u0447\u0435\u0440\u0430" }), _jsx("p", { className: "profile-settings-caption", children: "\u0418\u043C\u044F, \u0441\u0442\u0430\u0442\u0443\u0441 \u0438 \u0430\u0432\u0430\u0442\u0430\u0440 \u0434\u043B\u044F \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430 KuroLauncher." })] }), _jsx("span", { className: "profile-settings-badge", children: auth.loggedIn ? 'Аккаунт' : 'Локальный' })] }), _jsxs("div", { className: "profile-settings-layout", children: [_jsxs("div", { className: "profile-settings-preview", children: [_jsxs("div", { className: "profile-settings-avatar-stack", children: [_jsxs("label", { className: `profile-settings-avatar ${launcherAvatar ? 'has-image' : ''}`, children: [_jsx("input", { type: "file", accept: "image/png,image/jpeg,image/webp", onChange: handleAvatarUpload, "aria-label": "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0430\u0432\u0430\u0442\u0430\u0440 \u043F\u0440\u043E\u0444\u0438\u043B\u044F" }), launcherAvatar ? _jsx("img", { src: launcherAvatar, alt: "" }) : _jsx("span", { children: userInitials })] }), _jsxs("div", { className: "profile-settings-avatar-actions", children: [_jsxs("label", { className: "outline-button profile-avatar-upload", children: ["\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0430\u0432\u0430\u0442\u0430\u0440", _jsx("input", { type: "file", accept: "image/png,image/jpeg,image/webp", onChange: handleAvatarUpload, "aria-label": "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0430\u0432\u0430\u0442\u0430\u0440 \u043F\u0440\u043E\u0444\u0438\u043B\u044F" })] }), _jsx("button", { className: "outline-button", onClick: () => setSettings({ ...settings, avatarDataUrl: '' }), children: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0430\u0432\u0430\u0442\u0430\u0440" })] })] }), _jsxs("div", { className: "profile-settings-preview-copy", children: [_jsx("strong", { children: launcherProfileName }), _jsx("span", { children: launcherProfileSubtitle })] })] }), _jsxs("div", { className: "profile-settings-form", children: [_jsxs("label", { children: ["\u0418\u043C\u044F \u0432 \u043B\u0430\u0443\u043D\u0447\u0435\u0440\u0435", _jsx("input", { value: settings.profileName || '', maxLength: 32, placeholder: auth.loggedIn ? 'Пользователь' : 'Гость', onChange: (e) => setSettings({ ...settings, profileName: e.target.value.slice(0, 32) }) })] }), _jsxs("label", { className: "profile-settings-wide", children: ["\u0421\u0442\u0430\u0442\u0443\u0441", _jsx("textarea", { value: settings.profileStatus || '', maxLength: 80, rows: 2, placeholder: "\u0413\u043E\u0442\u043E\u0432 \u043A \u0437\u0430\u043F\u0443\u0441\u043A\u0443", onChange: (e) => setSettings({ ...settings, profileStatus: e.target.value.slice(0, 80) }) })] }), _jsx("button", { className: "button profile-settings-save", onClick: handleSaveSettings, children: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u043F\u0440\u043E\u0444\u0438\u043B\u044C" })] })] })] })] }))] })] }), confirmDialog && (_jsx("div", { className: "modal-overlay", onClick: () => confirmDialog.onCancel?.(), children: _jsxs("div", { className: "modal-content", onClick: (e) => e.stopPropagation(), children: [_jsx("h3", { children: confirmDialog.onCancel ? 'Подтверждение' : 'Внимание' }), _jsx("p", { children: confirmDialog.message }), _jsxs("div", { className: "modal-actions", children: [confirmDialog.onCancel && (_jsx("button", { className: "outline-button", onClick: () => confirmDialog.onCancel?.(), children: "\u041E\u0442\u043C\u0435\u043D\u0430" })), _jsx("button", { className: "btn btn-primary", onClick: () => confirmDialog.onConfirm(), children: "OK" })] })] }) }))] }));
}
export default App;
