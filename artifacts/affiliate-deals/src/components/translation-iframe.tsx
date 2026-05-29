import { useEffect, useMemo, useState } from "react";
import type { GoogleLangCode } from "@/lib/google-translate";
import { getPreferredGoogleLang, getPreferredGoogleLangForAdmin } from "@/lib/google-translate";

type TranslationScope = "user" | "admin";

function getLangFromScope(scope: TranslationScope): GoogleLangCode {
    return scope === "admin" ? getPreferredGoogleLangForAdmin() : getPreferredGoogleLang();
}

function buildTranslateIframeSrc(targetLang: string): string {
    const href = typeof window !== "undefined" ? window.location.href : "";
    const url = encodeURIComponent(href);

    // Google will translate the page content inside the iframe.
    return `https://translate.google.com/translate?sl=auto&tl=${encodeURIComponent(
        targetLang,
    )}&u=${url}&client=webapp&hl=${encodeURIComponent(targetLang)}`;
}

export function TranslationIFrame({
    scope,
    children,
}: {
    scope: TranslationScope;
    children: React.ReactNode;
}) {
    const [lang, setLang] = useState<GoogleLangCode>(() => getLangFromScope(scope));
    const iframeVisible = useMemo(() => lang !== "en", [lang]);

    useEffect(() => {
        const handler = () => setLang(getLangFromScope(scope));
        window.addEventListener("affiliateDeals:i18n-change", handler);
        window.addEventListener("storage", handler);
        return () => {
            window.removeEventListener("affiliateDeals:i18n-change", handler);
            window.removeEventListener("storage", handler);
        };
    }, [scope]);

    if (!iframeVisible) return <>{children}</>;

    return (
        <div className="relative">
            {children}
            <iframe
                title="Google Translate"
                className="fixed inset-0 w-full h-full"
                style={{ border: "0", zIndex: 9999, pointerEvents: "none" }}
                src={buildTranslateIframeSrc(lang)}
            />
        </div>
    );
}
