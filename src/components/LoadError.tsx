import { useTranslation } from "react-i18next";

/** Shown instead of an empty state when data could not be loaded, so a failure never looks like "you have nothing". */
export default function LoadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="empty-state">
      <div className="empty-state__title">{t("common.loadErrorTitle")}</div>
      <div className="empty-state__sub">{t("common.loadErrorSub")}</div>
      <button className="btn--primary empty-state__cta" onClick={onRetry}>{t("common.retry")}</button>
    </div>
  );
}
