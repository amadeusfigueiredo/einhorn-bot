import { useT } from '../i18n/useT'

export function LoadingScreen() {
  const { t } = useT()
  return (
    <div className="loading" role="status">
      <span className="loading__star" aria-hidden="true">
        ✦
      </span>
      <p className="loading__text">{t('loading.text')}</p>
    </div>
  )
}
