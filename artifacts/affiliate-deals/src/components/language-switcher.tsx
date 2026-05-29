import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    getPreferredGoogleLang,
    getPreferredGoogleLangForAdmin,
    setPreferredGoogleLang,
    setPreferredGoogleLangForAdmin,
    LANGUAGE_OPTIONS,
    type GoogleLangCode,
} from "@/lib/google-translate";

type LanguageScope = "user" | "admin";

function dispatchI18nChange(): void {
    window.dispatchEvent(new Event("affiliateDeals:i18n-change"));
}

export function LanguageSwitcher({ scope }: { scope: LanguageScope }) {
    const [lang, setLang] = useState<GoogleLangCode>("en");

    useEffect(() => {
        const initial = scope === "admin" ? getPreferredGoogleLangForAdmin() : getPreferredGoogleLang();
        setLang(initial);
    }, [scope]);

    const onChange = (next: GoogleLangCode) => {
        setLang(next);

        if (scope === "admin") setPreferredGoogleLangForAdmin(next);
        else setPreferredGoogleLang(next);

        dispatchI18nChange();
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
        </div>
    );
}
