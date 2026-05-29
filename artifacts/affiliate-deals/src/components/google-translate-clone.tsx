import { useEffect, useMemo, useRef, useState } from "react";
import type { GoogleLangCode } from "@/lib/google-translate";
import {
    applyGoogleTranslateLanguage,
    ensureGoogleTranslateWidgetInjected,
    getGoogleTranslateWidgetContainerId,
    getPreferredGoogleLang,
    getPreferredGoogleLangForAdmin,
} from "@/lib/google-translate";

type TranslationScope = "user" | "admin";

function getLangFromScope(scope: TranslationScope): GoogleLangCode {
    return scope === "admin" ? getPreferredGoogleLangForAdmin() : getPreferredGoogleLang();
}

function syncClone(sourceEl: HTMLDivElement | null, cloneEl: HTMLDivElement | null): void {
    if (!sourceEl || !cloneEl) return;
    // Copy current rendered HTML (React DOM stays in "notranslate" so Google won't mutate it).
    cloneEl.innerHTML = sourceEl.innerHTML;
}

export function GoogleTranslateClone({
    scope,
    children,
}: {
    scope: TranslationScope;
    children: React.ReactNode;
}) {
    const sourceRef = useRef<HTMLDivElement | null>(null);
    const cloneRef = useRef<HTMLDivElement | null>(null);

    const [lang, setLang] = useState<GoogleLangCode>(() => getLangFromScope(scope));
    const isTranslated = useMemo(() => lang !== "en", [lang]);

    useEffect(() => {
        ensureGoogleTranslateWidgetInjected();
    }, []);

    useEffect(() => {
        const onChange = () => setLang(getLangFromScope(scope));
        window.addEventListener("affiliateDeals:i18n-change", onChange);
        return () => window.removeEventListener("affiliateDeals:i18n-change", onChange);
    }, [scope]);

    useEffect(() => {
        const sourceEl = sourceRef.current;
        const cloneEl = cloneRef.current;

        if (!sourceEl || !cloneEl) return;

        if (!isTranslated) {
            sourceEl.style.display = "";
            cloneEl.style.display = "none";
            cloneEl.innerHTML = "";
            return;
        }

        // 1) Clone DOM before switching language so Google translates the cloned nodes.
        syncClone(sourceEl, cloneEl);
        cloneEl.style.display = "";
        sourceEl.style.display = "none";

        // 2) Switch language in Google widget.
        applyGoogleTranslateLanguage(lang);
    }, [isTranslated, lang]);

    const widgetContainerId = useMemo(() => getGoogleTranslateWidgetContainerId(), []);

    return (
        <>
            {/* Google translate mount point */}
            <div id={widgetContainerId} className="hidden" />

            {/* Source DOM must be skipped by Google Translate */}
            <div ref={sourceRef} className="notranslate">
                {children}
            </div>

            {/* Clone that Google Translate is allowed to mutate */}
            <div ref={cloneRef} />
        </>
    );
}
