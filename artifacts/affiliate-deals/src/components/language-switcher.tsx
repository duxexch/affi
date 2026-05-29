import { useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    getGoogleTranslateWidgetContainerId,
    getPreferredGoogleLang,
    getPreferredGoogleLangForAdmin,
    ensureGoogleTranslateWidgetInjected,
    setGoogTransCookie,
    setPreferredGoogleLang,
    setPreferredGoogleLangForAdmin,
    LANGUAGE_OPTIONS,
    type GoogleLangCode,
} from "@/lib/google-translate";

type LanguageScope = "user" | "admin";

export function LanguageSwitcher({ scope }: { scope: LanguageScope }) {
    const containerId = useMemo(() => getGoogleTranslateWidgetContainerId(), []);
    const [lang, setLang] = useState<GoogleLangCode>("en");

    useEffect(() => {
        const initial =
            scope === "admin" ? getPreferredGoogleLangForAdmin() : getPreferredGoogleLang();

        setLang(initial);

        // Cookie must be set before Google widget script init.
        setGoogTransCookie(initial);
        ensureGoogleTranslateWidgetInjected();
    }, [scope]);

    const onChange = (next: GoogleLangCode) => {
        setLang(next);

        if (scope === "admin") setPreferredGoogleLangForAdmin(next);
        else setPreferredGoogleLang(next);

        setGoogTransCookie(next);

        // Google Translate cookie is expected before widget initialization.
        // The safest way to apply target language reliably is reload.
        window.location.reload();
    };

    return (
        <div className="flex items-center gap-2">
            <Select value={lang} onValueChange={(v) => onChange(v as GoogleLangCode)}>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                    {LANGUAGE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.code} value={opt.code}>
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Google widget mount point (kept hidden; translation still applies). */}
            <div id={containerId} className="hidden" />
        </div>
    );
}
