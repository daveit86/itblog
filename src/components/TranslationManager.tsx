'use client'

import { useState, useEffect } from 'react'
import { showToast } from '@/lib/toast'
import { getArticleTranslations, linkTranslation, unlinkTranslation, getAvailableTranslations } from '@/lib/translations'

interface TranslationManagerProps {
  articleId: string
  currentLanguage: string
}

interface Translation {
  id: string
  title: string
  slug: string
  language: string
}

const languageNames: Record<string, string> = {
  en: 'English',
  it: 'Italian',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  ru: 'Russian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean'
}

export default function TranslationManager({ articleId, currentLanguage }: TranslationManagerProps) {
  const [translations, setTranslations] = useState<Translation[]>([])
  const [availableArticles, setAvailableArticles] = useState<Translation[]>([])
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTranslations()
  }, [articleId])

  const loadTranslations = async () => {
    const result = await getArticleTranslations(articleId)
    if (!result.error && result.translations) {
      setTranslations(result.translations)
    }
  }

  const handleUnlink = async (targetId: string) => {
    if (!confirm('Remove this article from the translation group?')) return
    
    const result = await unlinkTranslation(targetId)
    if (result.success) {
      showToast.success('Translation unlinked')
      loadTranslations()
    } else {
      showToast.error(result.error || 'Failed to unlink')
    }
  }

  const openLinkModal = async () => {
    setShowLinkModal(true)
    setLoading(true)
    const result = await getAvailableTranslations(articleId, currentLanguage)
    if (!result.error && result.articles) {
      setAvailableArticles(result.articles)
    }
    setLoading(false)
  }

  const handleLink = async (targetId: string) => {
    const result = await linkTranslation(articleId, targetId)
    if (result.success) {
      showToast.success('Translation linked successfully')
      setShowLinkModal(false)
      loadTranslations()
    } else {
      showToast.error(result.error || 'Failed to link translation')
    }
  }

  return (
    <div className="border rounded-lg p-4 bg-muted/30">
      <h3 className="text-lg font-semibold mb-3">Translations</h3>
      
      {/* Current Language */}
      <div className="mb-4">
        <span className="text-sm text-muted-foreground">Current: </span>
        <span className="inline-flex items-center px-2 py-1 rounded bg-primary/10 text-primary text-sm font-medium">
          {languageNames[currentLanguage] || currentLanguage}
        </span>
      </div>

      {/* Linked Translations */}
      {translations.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Available in:</h4>
          <div className="flex flex-wrap gap-2">
            {translations.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-card border rounded-full text-sm"
              >
                <a
                  href={`/admin/articles/${t.id}/edit`}
                  className="text-primary hover:underline"
                >
                  {languageNames[t.language] || t.language}
                </a>
                <button
                  onClick={() => handleUnlink(t.id)}
                  className="text-muted-foreground hover:text-error"
                  title="Unlink translation"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Translation Button */}
      <button
        onClick={openLinkModal}
        className="btn btn-secondary btn-sm"
      >
        + Link Translation
      </button>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold">Link Translation</h3>
              <button
                onClick={() => setShowLinkModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : availableArticles.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No available articles to link as translations.
                </p>
              ) : (
                <div className="space-y-2">
                  {availableArticles.map((article) => (
                    <div
                      key={article.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{article.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {languageNames[article.language] || article.language} • /{article.slug}
                        </p>
                      </div>
                      <button
                        onClick={() => handleLink(article.id)}
                        className="btn btn-primary btn-sm"
                      >
                        Link
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
