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

function syncClone(sourceEl: HTMLDivElement | null, cloneEl: HTMLDivElement | null): string | null {
    if (!sourceEl || !cloneEl) return null;

    const sourceHtml = sourceEl.innerHTML;
    // Clear first so Google Translate re-reads fresh DOM.
    cloneEl.innerHTML = "";
    cloneEl.innerHTML = sourceHtml;
    return sourceHtml;
}

function requestTranslate(lang: GoogleLangCode): void {
    // Single request is enough in most cases; we still call a couple times
    // because widget init + async routes can race.
    applyGoogleTranslateLanguage(lang);
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

    // Track last source HTML we copied to clone to avoid resync loops.
    const lastCopiedSourceHtmlRef = useRef<string>("");
    // Track whether we successfully detected Google mutations (so we can hide source).
    const translationAppliedRef = useRef<boolean>(false);
    // Track if we’re currently waiting for translation.
    const translationWaitTokenRef = useRef<number>(0);

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
        translationAppliedRef.current = false;
        const token = ++translationWaitTokenRef.current;

        // Ensure UI is visible and clone is not interfering.
        sourceEl.style.display = "";
        cloneEl.style.display = "none";
        cloneEl.innerHTML = "";

        // In case there are pending timers/observers, keep token logic consistent.
        void token;
        return;
    }

      // Translated mode: IMPORTANT - never leave user with blank UI.
      // We keep the source visible initially and only hide it after Google mutation is detected.
      const token = ++translationWaitTokenRef.current;

      sourceEl.style.display = "";
      cloneEl.style.display = "";
      cloneEl.innerHTML = "";

      // Copy the latest content into clone.
      const copied = syncClone(sourceEl, cloneEl);
      if (copied != null) lastCopiedSourceHtmlRef.current = copied;

      translationAppliedRef.current = false;

      // Ask Google to translate (multiple short retries).
      requestTranslate(lang);
      const t1 = window.setTimeout(() => {
        if (translationWaitTokenRef.current !== token) return;
        requestTranslate(lang);
    }, 750);

      const t2 = window.setTimeout(() => {
        if (translationWaitTokenRef.current !== token) return;
        requestTranslate(lang);
    }, 2000);

      // Detect whether Google mutated clone (so translation really happened).
      let mutationTimer: number | undefined;
      const mutationObserver = new MutationObserver(() => {
          // Throttle detection.
          if (mutationTimer) window.clearTimeout(mutationTimer);
          mutationTimer = window.setTimeout(() => {
              if (translationWaitTokenRef.current !== token) return;

              const currentHtml = cloneEl.innerHTML;
              const lastSourceHtml = lastCopiedSourceHtmlRef.current;

              // Heuristic: Google should mutate markup/html; if clone changed from the raw copied HTML
              // we consider translation applied.
              const mutated = currentHtml && currentHtml !== lastSourceHtml;

              if (mutated) {
                  translationAppliedRef.current = true;
                  // Now that clone has translated content, hide source to prevent double content.
                  sourceEl.style.display = "none";
                  cloneEl.style.display = "";
              }
          }, 150);
      });

      mutationObserver.observe(cloneEl, {
          subtree: true,
          childList: true,
          characterData: true,
      });

      // Fallback: if Google doesn't mutate within a window, keep source visible (no blank).
      const fallbackMs = 4500;
      const fallback = window.setTimeout(() => {
          if (translationWaitTokenRef.current !== token) return;
          if (!translationAppliedRef.current) {
              // Translation failed/timed out -> keep source visible.
              sourceEl.style.display = "";
              cloneEl.style.display = "none";
              cloneEl.innerHTML = "";
          }
      }, fallbackMs);

      return () => {
          window.clearTimeout(t1);
          window.clearTimeout(t2);
        window.clearTimeout(fallback);
        if (mutationTimer) window.clearTimeout(mutationTimer);
        mutationObserver.disconnect();
    };
  }, [isTranslated, lang]);

    useEffect(() => {
        const sourceEl = sourceRef.current;
        const cloneEl = cloneRef.current;

      if (!sourceEl || !cloneEl) return;
      if (!isTranslated) return;

      // On async route transitions (categories/offers), React updates source content.
      // Resync clone only when HTML truly changes to avoid infinite loops/flicker.
      let resyncTimer: number | undefined;

      const observer = new MutationObserver(() => {
        if (resyncTimer) window.clearTimeout(resyncTimer);
        resyncTimer = window.setTimeout(() => {
            if (!sourceRef.current || !cloneRef.current) return;
            const currentHtml = sourceRef.current.innerHTML;
            if (currentHtml === lastCopiedSourceHtmlRef.current) return;

            // Reset wait: we’ll re-apply translation and again keep source visible until clone mutates.
            lastCopiedSourceHtmlRef.current = currentHtml;
            translationAppliedRef.current = false;

            // Ensure source stays visible during resync.
            sourceEl.style.display = "";
            cloneEl.style.display = "";

            syncClone(sourceEl, cloneEl);
          requestTranslate(lang);
      }, 250);
    });

      observer.observe(sourceEl, {
          subtree: true,
          childList: true,
          characterData: true,
      });

      return () => {
          observer.disconnect();
        if (resyncTimer) window.clearTimeout(resyncTimer);
    };
  }, [isTranslated, lang]);

    return (
        <>
            {/* Google translate mount point */}
            <div id={widgetContainerId} className="hidden" />

          {/* React-managed DOM: skip translation */}
          <div
              ref={sourceRef}
              translate="no"
              aria-hidden={isTranslated}
              className="notranslate"
          >
              {children}
          </div>

          {/* Clone: Google is allowed to mutate this */}
          <div ref={cloneRef} style={{ display: isTranslated ? "" : "none" }} />
      </>
  );
}
