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

    // Clear first so Google Translate re-reads fresh DOM.
    cloneEl.innerHTML = "";
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

    const widgetContainerId = useMemo(() => getGoogleTranslateWidgetContainerId(), []);

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

      // Make sure clone is visible before triggering translate.
      sourceEl.style.display = "none";
      cloneEl.style.display = "";

      // Clone and trigger translation.
      syncClone(sourceEl, cloneEl);

      // Let DOM settle then request translation.
      const t = window.setTimeout(() => {
      applyGoogleTranslateLanguage(lang);
    }, 50);

      return () => window.clearTimeout(t);
  }, [isTranslated, lang]);

    useEffect(() => {
      const sourceEl = sourceRef.current;
      const cloneEl = cloneRef.current;
      if (!isTranslated || !sourceEl || !cloneEl) return;

      let timer: number | undefined;

      const observer = new MutationObserver(() => {
          if (timer) window.clearTimeout(timer);
          timer = window.setTimeout(() => {
          // Re-sync DOM for async routes (like /categories)
          syncClone(sourceEl, cloneEl);
          applyGoogleTranslateLanguage(lang);
      }, 250);
    });

      observer.observe(sourceEl, {
          subtree: true,
          childList: true,
          characterData: true,
      });

      return () => {
          observer.disconnect();
          if (timer) window.clearTimeout(timer);
      };
  }, [isTranslated, lang]);

    return (
        <>
            {/* Google translate mount point */}
            <div id={widgetContainerId} className="hidden" />

          {/* React-managed DOM: skip translation */}
          <div ref={sourceRef} translate="no" aria-hidden={isTranslated} className="notranslate">
              {children}
          </div>

          {/* Clone: Google is allowed to mutate this */}
          <div ref={cloneRef} style={{ display: "none" }} />
      </>
  );
}
