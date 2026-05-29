import { useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    getGoogleTranslateWidgetContainerId,
    getPreferredGoogleLang,
    getPreferredGoogleLangForAdmin,
    ensureGoogleTranslateWidgetInjected,
    setPreferredGoogleLang,
    setPreferredGoogleLangForAdmin,
    applyGoogleTranslateLanguage,
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

        ensureGoogleTranslateWidgetInjected();
        applyGoogleTranslateLanguage(initial);
    }, [scope]);

    const onChange = (next: GoogleLangCode) => {
        setLang(next);

        if (scope === "admin") setPreferredGoogleLangForAdmin(next);
        else setPreferredGoogleLang(next);

        applyGoogleTranslateLanguage(next);
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
