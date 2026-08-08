import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconChevronLeft, IconEye, IconEyeOff } from "./icons";
import { getCategoryIcon, CATEGORY_ICON_NAMES } from "./categoryIcons";
import { UserCategory } from "./types";

const COLOR_PALETTE = [
  "#f97316", "#3b82f6", "#a855f7", "#ef4444", "#10b981", "#ec4899", "#f59e0b", "#6b7280",
  "#06b6d4", "#84cc16", "#6366f1", "#14b8a6", "#d946ef", "#78716c",
];

interface Props {
  categories: UserCategory[];
  addCategory: (name: string, icon: string, color: string) => Promise<boolean>;
  updateCategory: (name: string, changes: Partial<Pick<UserCategory, "icon" | "color" | "hidden">>) => Promise<boolean>;
  deleteCategory: (name: string) => Promise<boolean>;
  onBack: () => void;
}

export default function CategoryManager({ categories, addCategory, updateCategory, deleteCategory, onBack }: Props) {
  const { t } = useTranslation();
  const catLabel = (name: string) => t(`categories.${name}`, { defaultValue: name });

  const [editing, setEditing] = useState<UserCategory | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(CATEGORY_ICON_NAMES[0]);
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [hidden, setHidden] = useState(false);
  const [err, setErr] = useState("");

  const openEdit = (c: UserCategory) => {
    setEditing(c);
    setAdding(false);
    setName(c.name);
    setIcon(c.icon);
    setColor(c.color);
    setHidden(c.hidden);
    setErr("");
  };

  const openNew = () => {
    setEditing(null);
    setAdding(true);
    setName("");
    setIcon(CATEGORY_ICON_NAMES[0]);
    setColor(COLOR_PALETTE[0]);
    setHidden(false);
    setErr("");
  };

  const close = () => { setEditing(null); setAdding(false); };

  const toggleHidden = (c: UserCategory) => updateCategory(c.name, { hidden: !c.hidden });

  const handleSave = async () => {
    if (adding) {
      if (!name.trim()) return setErr(t("categoryManager.errNameRequired"));
      const ok = await addCategory(name, icon, color);
      if (ok) close();
      return;
    }
    if (editing) {
      const ok = await updateCategory(editing.name, { icon, color, hidden });
      if (ok) close();
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    const ok = await deleteCategory(editing.name);
    if (ok) close();
  };

  const isOpen = adding || editing !== null;

  return (
    <div className="settings">
      <div className="auth-glow auth-glow--1" />
      <div className="auth-glow auth-glow--2" />

      <header className="settings__header">
        <button type="button" className="settings__back" onClick={onBack} aria-label={t("settings.backAria")}>
          {IconChevronLeft}
        </button>
        <div className="settings__title">{t("categoryManager.title")}</div>
      </header>

      <div className="settings__container">
        <div className="card card--list">
          {categories.map(c => (
            <div key={c.name} className="catmgr__row" onClick={() => openEdit(c)}>
              <div className="catmgr__icon" style={{ background: `${c.color}22`, color: c.color }}>
                {getCategoryIcon(c.icon)}
              </div>
              <div className="catmgr__info">
                <div className="catmgr__name">
                  {catLabel(c.name)}
                  {c.isDefault && <span className="settings__badge">{t("categoryManager.defaultBadge")}</span>}
                </div>
                {c.hidden && <div className="catmgr__hidden-label">{t("categoryManager.hiddenBadge")}</div>}
              </div>
              <button
                type="button"
                className="catmgr__hide-btn"
                onClick={e => { e.stopPropagation(); toggleHidden(c); }}
                aria-label={c.hidden ? t("categoryManager.showAria") : t("categoryManager.hideAria")}
              >
                {c.hidden ? IconEyeOff : IconEye}
              </button>
            </div>
          ))}
        </div>

        <button type="button" className="btn--primary catmgr__add" onClick={openNew}>
          {t("categoryManager.addButton")}
        </button>
      </div>

      {isOpen && (
        <div className="confirm__overlay" onClick={close}>
          <div className="catmgr__editor" onClick={e => e.stopPropagation()}>
            <div className="confirm__title">
              {adding ? t("categoryManager.newTitle") : t("categoryManager.editTitle")}
            </div>

            <label className="form__label">{t("categoryManager.nameLabel")}</label>
            <input
              className="form__input"
              value={adding ? name : catLabel(name)}
              placeholder={t("categoryManager.namePlaceholder")}
              disabled={!adding}
              onChange={e => { setErr(""); setName(e.target.value); }}
            />
            {err && <div className="alert alert--error">{err}</div>}

            <label className="form__label">{t("categoryManager.iconLabel")}</label>
            <div className="catmgr__icon-grid">
              {CATEGORY_ICON_NAMES.map(iconName => (
                <button
                  key={iconName}
                  type="button"
                  className={`catmgr__icon-btn${icon === iconName ? " catmgr__icon-btn--active" : ""}`}
                  style={icon === iconName ? { borderColor: color, color } : undefined}
                  onClick={() => setIcon(iconName)}
                >
                  {getCategoryIcon(iconName)}
                </button>
              ))}
            </div>

            <label className="form__label">{t("categoryManager.colorLabel")}</label>
            <div className="catmgr__color-grid">
              {COLOR_PALETTE.map(hex => (
                <button
                  key={hex}
                  type="button"
                  className={`catmgr__color-btn${color === hex ? " catmgr__color-btn--active" : ""}`}
                  style={{ background: hex }}
                  onClick={() => setColor(hex)}
                />
              ))}
            </div>

            {!adding && (
              <div className="settings__row catmgr__visibility-row">
                <span>{t("categoryManager.visibility")}</span>
                <div className="settings__theme-toggle">
                  <button
                    type="button"
                    className={`settings__theme-btn${!hidden ? " settings__theme-btn--active" : ""}`}
                    onClick={() => setHidden(false)}
                  >
                    {t("categoryManager.visibilityShown")}
                  </button>
                  <button
                    type="button"
                    className={`settings__theme-btn${hidden ? " settings__theme-btn--active" : ""}`}
                    onClick={() => setHidden(true)}
                  >
                    {t("categoryManager.visibilityHidden")}
                  </button>
                </div>
              </div>
            )}

            <div className="confirm__actions">
              <button className="confirm__btn confirm__btn--cancel" onClick={close}>{t("common.cancel")}</button>
              <button className="confirm__btn confirm__btn--primary" onClick={handleSave}>{t("common.save")}</button>
            </div>

            {editing && !editing.isDefault && (
              <button className="confirm__remove" onClick={handleDelete}>
                {t("categoryManager.deleteButton")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
