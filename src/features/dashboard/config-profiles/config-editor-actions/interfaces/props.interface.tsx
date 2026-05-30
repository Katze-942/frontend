import type { editor } from 'monaco-editor'

import { GetConfigProfilesCommand } from '@remnawave/backend-contract'
import { RefObject } from 'react'

export interface Props {
    clearDraft: () => void
    configProfile: GetConfigProfilesCommand.Response['response']['configProfiles'][number]
    editorRef: RefObject<editor.IStandaloneCodeEditor | null>
    hasUnsavedChanges: boolean
    isConfigValid: boolean
    originalValue: string
    saveDraftNow: (value: string) => void
    setHasUnsavedChanges: (value: boolean) => void
    setIsConfigValid: (value: boolean) => void
    setOriginalValue: (value: string) => void
    setResult: (value: string) => void
    skipDraftSaveForValue: (value: string) => void
}
