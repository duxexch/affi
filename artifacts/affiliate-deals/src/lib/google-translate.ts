export type GoogleLangCode =
    | "en"
    | "ar"
    | "fr"
    | "es"
    | "de"
    | "it"
    | "pt"
    | "ru"
    | "tr"
    | "id"
    | "hi"
    | "bn"
    | "ur"
    | "vi"
    | "th"
    | "zh-CN"
    | "ja"
    | "ko";

export interface LanguageOption {
    code: GoogleLangCode;
    label: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
    { code: "en", label: "English" },
    { code: "ar", label: "العربية" },
    { code: "fr", label: "Français" },
    { code: "es", label: "Español" },
    { code: "de", label: "Deutsch" },
    { code: "it", label: "Italiano" },
    { code: "pt", label: "Português" },
    { code: "ru", label: "Русский" },
    { code: "tr", label: "Türkçe" },
    { code: "id", label: "Bahasa Indonesia" },
    { code: "hi", label: "हिन्दी" },
    { code: "bn", label: "বাংলা" },
    { code: "ur", label: "اردو" },
    { code: "vi", label: "Tiếng Việt" },
    { code: "th", label: "ไทย" },
    { code: "zh-CN", label: "中文（简体）" },
    { code: "ja", label: "日本語" },
    { code: "ko", label: "한국어" },
];

const DEFAULT_PAGE_LANGUAGE: GoogleLangCode = "en";

const WIDGET_SCRIPT_ID = "google-translate-element-script";
const WIDGET_INIT_FN = "googleTranslateElementInit";
const WIDGET_CONTAINER_ID = "google_translate_element";

const USER_LS_KEY = "affiliateDeals.lang";
const ADMIN_LS_KEY = "affiliateDeals.adminLang";

function getLocalStorageLang(): GoogleLangCode | null {
    try {
        const raw = localStorage.getItem(USER_LS_KEY);
        if (!raw) return null;
        const allowed = new Set(LANGUAGE_OPTIONS.map((l) => l.code));
        if (!allowed.has(raw as GoogleLangCode)) return null;
        return raw as GoogleLangCode;
    } catch {
        return null;
    }
}

export function getPreferredGoogleLang(): GoogleLangCode {
    const stored = typeof window !== "undefined" ? getLocalStorageLang() : null;
    if (stored) return stored;

    const nav = typeof navigator !== "undefined" ? navigator.language : undefined;
    if (!nav) return DEFAULT_PAGE_LANGUAGE;

    const lower = nav.toLowerCase();
    // very small heuristic
    if (lower.startsWith("ar")) return "ar";
    if (lower.startsWith("fr")) return "fr";
    if (lower.startsWith("es")) return "es";
    if (lower.startsWith("de")) return "de";
    if (lower.startsWith("it")) return "it";
    if (lower.startsWith("pt")) return "pt";
    if (lower.startsWith("ru")) return "ru";
    if (lower.startsWith("tr")) return "tr";
    if (lower.startsWith("id")) return "id";
    if (lower.startsWith("hi")) return "hi";
    if (lower.startsWith("bn")) return "bn";
    if (lower.startsWith("ur")) return "ur";
    if (lower.startsWith("vi")) return "vi";
    if (lower.startsWith("th")) return "th";
    if (lower.startsWith("zh")) return "zh-CN";
    if (lower.startsWith("ja")) return "ja";
    if (lower.startsWith("ko")) return "ko";
    return DEFAULT_PAGE_LANGUAGE;
}

export function setPreferredGoogleLang(lang: GoogleLangCode): void {
    try {
        localStorage.setItem(USER_LS_KEY, lang);
    } catch {
        // ignore
    }
}

export function getPreferredGoogleLangForAdmin(): GoogleLangCode {
    const stored = typeof window !== "undefined"
        ? (() => {
            try {
                const raw = localStorage.getItem(ADMIN_LS_KEY);
                if (!raw) return null;
                const allowed = new Set(LANGUAGE_OPTIONS.map((l) => l.code));
                if (!allowed.has(raw as GoogleLangCode)) return null;
                return raw as GoogleLangCode;
            } catch {
                return null;
            }
        })()
        : null;

    if (stored) return stored;

    const nav = typeof navigator !== "undefined" ? navigator.language : undefined;
    if (!nav) return DEFAULT_PAGE_LANGUAGE;

    const lower = nav.toLowerCase();
    // very small heuristic
    if (lower.startsWith("ar")) return "ar";
    if (lower.startsWith("fr")) return "fr";
    if (lower.startsWith("es")) return "es";
    if (lower.startsWith("de")) return "de";
    if (lower.startsWith("it")) return "it";
    if (lower.startsWith("pt")) return "pt";
    if (lower.startsWith("ru")) return "ru";
    if (lower.startsWith("tr")) return "tr";
    if (lower.startsWith("id")) return "id";
    if (lower.startsWith("hi")) return "hi";
    if (lower.startsWith("bn")) return "bn";
    if (lower.startsWith("ur")) return "ur";
    if (lower.startsWith("vi")) return "vi";
    if (lower.startsWith("th")) return "th";
    if (lower.startsWith("zh")) return "zh-CN";
    if (lower.startsWith("ja")) return "ja";
    if (lower.startsWith("ko")) return "ko";
    return DEFAULT_PAGE_LANGUAGE;
}

export function setPreferredGoogleLangForAdmin(lang: GoogleLangCode): void {
    try {
        localStorage.setItem(ADMIN_LS_KEY, lang);
    } catch {
        // ignore
    }
}

export function setGoogTransCookie(targetLang: GoogleLangCode): void {
    // Google's cookie format: googtrans=/source/target
    // Example: googtrans=/en/ar
    const pageLang = DEFAULT_PAGE_LANGUAGE;
    const cookieValue = `/` + `${pageLang}/` + `${targetLang}`;

    // Best-effort. Google expects this cookie before widget init.
    try {
        document.cookie = `googtrans=${encodeURIComponent(cookieValue)}; path=/; max-age=${60 * 60 * 24 * 365}`;
    } catch {
        // ignore
    }
}

export function ensureGoogleTranslateWidgetInjected(): void {
    if (typeof document === "undefined") return;

    if (document.getElementById(WIDGET_SCRIPT_ID)) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;

    // Define init callback expected by Google.
    w[WIDGET_INIT_FN] = () => {
        const container = document.getElementById(WIDGET_CONTAINER_ID);
        if (!container) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const googleW = window as any;
        const TranslateElement = googleW?.google?.translate?.TranslateElement;
        if (!TranslateElement) return;

        const included = LANGUAGE_OPTIONS.map((l) => l.code).join(",");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new googleW.google.translate.TranslateElement(
            {
                pageLanguage: DEFAULT_PAGE_LANGUAGE,
                includedLanguages: included,
                autoDisplay: true,
            },
            container,
        );
    };

    const script = document.createElement("script");
    script.id = WIDGET_SCRIPT_ID;
    script.type = "text/javascript";
    script.async = true;
    script.src = `https://translate.google.com/translate_a/element.js?cb=${encodeURIComponent(WIDGET_INIT_FN)}`;
    document.head.appendChild(script);
}

export function getGoogleTranslateWidgetContainerId(): string {
    return WIDGET_CONTAINER_ID;
}
