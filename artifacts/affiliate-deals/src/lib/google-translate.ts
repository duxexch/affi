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

const HIDE_STYLE_ID = "affiliate-deals-google-translate-hide-style";

function getLocalStorageLang(key: string): GoogleLangCode | null {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const allowed = new Set(LANGUAGE_OPTIONS.map((l) => l.code));
        if (!allowed.has(raw as GoogleLangCode)) return null;
        return raw as GoogleLangCode;
    } catch {
        return null;
    }
}

export function getPreferredGoogleLang(): GoogleLangCode {
    const stored = typeof window !== "undefined" ? getLocalStorageLang(USER_LS_KEY) : null;
    if (stored) return stored;

    const nav = typeof navigator !== "undefined" ? navigator.language : undefined;
    if (!nav) return DEFAULT_PAGE_LANGUAGE;

    const lower = nav.toLowerCase();
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
    const stored =
        typeof window !== "undefined" ? getLocalStorageLang(ADMIN_LS_KEY) : null;
    if (stored) return stored;

    const nav = typeof navigator !== "undefined" ? navigator.language : undefined;
    if (!nav) return DEFAULT_PAGE_LANGUAGE;

    const lower = nav.toLowerCase();
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

function ensureHideStyleInjected(): void {
    if (typeof document === "undefined") return;
    if (document.getElementById(HIDE_STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = HIDE_STYLE_ID;

    // Hide the widget UI/banner injected by Google Translate.
    // Note: Google uses different containers; we hide the common ones.
    style.textContent = `
    body { top: 0 !important; }
    #google_translate_element, #google_translate_element2 { display: none !important; }
    .goog-te-banner-frame { display: none !important; }
    .skiptranslate { display: none !important; }
    .goog-te-gadget { display: none !important; }
    iframe.goog-te-banner-frame { display: none !important; }
    iframe.goog-te-banner-frame { height: 0 !important; }
    .goog-te-combo { display: none !important; }
  `;

    document.head.appendChild(style);
}

function setGoogleTranslateLanguage(targetLang: GoogleLangCode): void {
    if (typeof document === "undefined") return;

    const trySet = (): boolean => {
        const select = document.querySelector<HTMLSelectElement>("select.goog-te-combo");
        if (!select) return false;

        select.value = targetLang;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
    };

    // Retry for a short time because the widget init is async.
    let attempts = 0;
    const maxAttempts = 12; // ~6s

    const timer = window.setInterval(() => {
        attempts += 1;
        const ok = trySet();

        if (ok || attempts >= maxAttempts) {
            window.clearInterval(timer);
        }
    }, 500);
}

export function ensureGoogleTranslateWidgetInjected(): void {
    if (typeof document === "undefined") return;

    if (document.getElementById(WIDGET_SCRIPT_ID)) return;

    ensureHideStyleInjected();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;

    w[WIDGET_INIT_FN] = () => {
        const container = document.getElementById(WIDGET_CONTAINER_ID);
        if (!container) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const googleW = window as any;
        const TranslateElement = googleW?.google?.translate?.TranslateElement;
        if (!TranslateElement) return;

        const included = LANGUAGE_OPTIONS.map((l) => l.code).join(",");

        // autoDisplay:false prevents Google from showing its own banner/ui.
        // We then programmatically select the target language.
        new googleW.google.translate.TranslateElement(
            {
                pageLanguage: DEFAULT_PAGE_LANGUAGE,
                includedLanguages: included,
              autoDisplay: false,
          },
          container,
      );

        // If user already selected a language in localStorage, apply it.
        const preferred: GoogleLangCode = getPreferredGoogleLang();
        setGoogleTranslateLanguage(preferred);
    };

    const script = document.createElement("script");
    script.id = WIDGET_SCRIPT_ID;
    script.type = "text/javascript";
    script.async = true;
    script.src = `https://translate.google.com/translate_a/element.js?cb=${encodeURIComponent(WIDGET_INIT_FN)}`;

    document.head.appendChild(script);
}

export function applyGoogleTranslateLanguage(targetLang: GoogleLangCode): void {
    // Apply immediately if widget already created; otherwise it will be picked on init and/or retry.
    setGoogleTranslateLanguage(targetLang);
}

export function getGoogleTranslateWidgetContainerId(): string {
    return WIDGET_CONTAINER_ID;
}
