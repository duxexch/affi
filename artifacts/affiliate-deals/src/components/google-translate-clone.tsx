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
    // Clone current rendered HTML so Google only mutates the clone.
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

      // Snapshot React DOM -> clone, THEN apply translation.
      syncClone(sourceEl, cloneEl);

      // Hide React-managed DOM while Google translates.
      sourceEl.style.display = "none";
      cloneEl.style.display = "";

      applyGoogleTranslateLanguage(lang);
  }, [isTranslated, lang]);

    const widgetContainerId = useMemo(() => getGoogleTranslateWidgetContainerId(), []);

    return (
        <>
            {/* Google translate mount point */}
            <div id={widgetContainerId} className="hidden" />

          {/* React-managed DOM: block Google translation */}
          <div
              ref={sourceRef}
              translate="no"
              aria-hidden={isTranslated}
              className="notranslate"
          >
              {children}
          </div>

          {/* Clone: Google is allowed to mutate this */}
          <div ref={cloneRef} style={{ display: "none" }} />
      </>
  );
}
