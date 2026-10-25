import { useT } from '../i18n/useT'

export function Header() {
  const { t } = useT()
  return (
    <header className="app-header">
      <h1 className="app-title">{t('app.title')}</h1>
      <p className="app-subtitle">{t('app.subtitle')}</p>
    </header>
  )
}
