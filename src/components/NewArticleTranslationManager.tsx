'use client'

import { useState, useEffect } from 'react'
import { showToast } from '@/lib/toast'
import { getAvailableTranslations, linkTranslation } from '@/lib/translations'

interface NewArticleTranslationManagerProps {
  currentLanguage: string
  onLink: (articleId: string) => void
}

interface Article {
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

export default function NewArticleTranslationManager({ 
  currentLanguage, 
  onLink 
}: NewArticleTranslationManagerProps) {
  const [linkedArticle, setLinkedArticle] = useState<Article | null>(null)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [availableArticles, setAvailableArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)

  const openLinkModal = async () => {
    setShowLinkModal(true)
    setLoading(true)
    const result = await getAvailableTranslations('', currentLanguage)
    if (!result.error && result.articles) {
      setAvailableArticles(result.articles)
    }
    setLoading(false)
  }

  const handleLink = (article: Article) => {
    setLinkedArticle(article)
    onLink(article.id)
    setShowLinkModal(false)
    showToast.success(`Linked to "${article.title}"`)
  }

  const handleUnlink = () => {
    setLinkedArticle(null)
    onLink('')
    showToast.success('Unlinked article')
  }

  return (
    <div className="border rounded-lg p-4 bg-muted/30">
      <h3 className="text-lg font-semibold mb-3">Translation</h3>
      
      {/* Current Language */}
      <div className="mb-4">
        <span className="text-sm text-muted-foreground">Creating in: </span>
        <span className="inline-flex items-center px-2 py-1 rounded bg-primary/10 text-primary text-sm font-medium">
          {languageNames[currentLanguage] || currentLanguage}
        </span>
      </div>

      {/* Linked Article */}
      {linkedArticle ? (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Linked to:</h4>
          <div className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg">
            <span className="text-lg">
              {linkedArticle.language === 'en' && '🇬🇧'}
              {linkedArticle.language === 'it' && '🇮🇹'}
              {linkedArticle.language === 'es' && '🇪🇸'}
              {linkedArticle.language === 'fr' && '🇫🇷'}
              {linkedArticle.language === 'de' && '🇩🇪'}
              {linkedArticle.language === 'pt' && '🇵🇹'}
              {linkedArticle.language === 'ru' && '🇷🇺'}
              {linkedArticle.language === 'zh' && '🇨🇳'}
              {linkedArticle.language === 'ja' && '🇯🇵'}
              {linkedArticle.language === 'ko' && '🇰🇷'}
            </span>
            <span className="font-medium">{linkedArticle.title}</span>
            <button
              type="button"
              onClick={handleUnlink}
              className="ml-auto text-muted-foreground hover:text-error"
              title="Remove link"
            >
              ×
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            This article will be linked as a translation
          </p>
        </div>
      ) : (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">
            Link this article to an existing article in another language
          </p>
        </div>
      )}

      {/* Link Button */}
      <button
        type="button"
        onClick={openLinkModal}
        className="btn btn-secondary btn-sm"
      >
        {linkedArticle ? 'Change Link' : '+ Link to Existing Article'}
      </button>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold">Link to Existing Article</h3>
              <button
                type="button"
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
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {article.language === 'en' && '🇬🇧'}
                          {article.language === 'it' && '🇮🇹'}
                          {article.language === 'es' && '🇪🇸'}
                          {article.language === 'fr' && '🇫🇷'}
                          {article.language === 'de' && '🇩🇪'}
                          {article.language === 'pt' && '🇵🇹'}
                          {article.language === 'ru' && '🇷🇺'}
                          {article.language === 'zh' && '🇨🇳'}
                          {article.language === 'ja' && '🇯🇵'}
                          {article.language === 'ko' && '🇰🇷'}
                        </span>
                        <div>
                          <p className="font-medium">{article.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {languageNames[article.language] || article.language} • /{article.slug}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleLink(article)}
                        className="btn btn-primary btn-sm"
                      >
                        Select
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
