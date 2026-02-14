export const normalizeApiBase = (rawValue, fallback = '') => {
    const raw = String(rawValue || fallback || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw.replace(/\/+$/, '');
    if (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(raw)) return `http://${raw}`.replace(/\/+$/, '');
    return `https://${raw}`.replace(/\/+$/, '');
};

export const defaultNodeBase = () => {
    if (typeof window === 'undefined') return 'http://localhost:5000';
    return `http://${window.location.hostname || 'localhost'}:5000`;
};
