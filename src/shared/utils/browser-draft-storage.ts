export interface BrowserDraft<TMeta extends Record<string, unknown> = Record<string, unknown>> {
    baseHash: string
    meta?: TMeta
    updatedAt: number
    value: string
}

export const createBrowserDraftHash = (value: string) => {
    let hash = 5381

    for (let index = 0; index < value.length; index++) {
        hash = (hash * 33) ^ value.charCodeAt(index)
    }

    return `${(hash >>> 0).toString(36)}:${value.length}`
}

export const getConfigProfileDraftKey = (uuid: string) => `draft:config-profile:${uuid}`

export const getCreateSnippetDraftKey = () => 'draft:snippet:create'

export const getEditSnippetDraftKey = (name: string) => `draft:snippet:${encodeURIComponent(name)}`

export const removeBrowserDraft = (key: string) => {
    if (typeof window === 'undefined') return

    try {
        window.localStorage.removeItem(key)
    } catch {
        // Ignore unavailable storage.
    }
}

export const readBrowserDraft = <TMeta extends Record<string, unknown> = Record<string, unknown>>(
    key: string
): BrowserDraft<TMeta> | null => {
    if (typeof window === 'undefined') return null

    try {
        const rawDraft = window.localStorage.getItem(key)
        if (!rawDraft) return null

        const draft = JSON.parse(rawDraft) as BrowserDraft<TMeta>

        if (
            typeof draft !== 'object' ||
            typeof draft.value !== 'string' ||
            typeof draft.baseHash !== 'string' ||
            typeof draft.updatedAt !== 'number'
        ) {
            removeBrowserDraft(key)
            return null
        }

        return draft
    } catch {
        removeBrowserDraft(key)
        return null
    }
}

export const writeBrowserDraft = <TMeta extends Record<string, unknown> = Record<string, unknown>>(
    key: string,
    draft: BrowserDraft<TMeta>
) => {
    if (typeof window === 'undefined') return

    try {
        window.localStorage.setItem(key, JSON.stringify(draft))
    } catch {
        // Ignore storage quota/private-mode failures. Losing autosave must not break editing.
    }
}
