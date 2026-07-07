import type { editor } from 'monaco-editor'

import { MonacoSetupSnippetsFeature } from '@features/dashboard/config-profiles/monaco-setup'
import { Button, Code, Group, Paper, Stack } from '@mantine/core'
import { useForm, schemaResolver } from '@mantine/form'
import { modals } from '@mantine/modals'
import { Editor, Monaco, useMonaco } from '@monaco-editor/react'
import { UpdateSnippetCommand } from '@remnawave/backend-contract'
import { t } from 'i18next'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { queryClient } from '@shared/api'
import { useUpdateSnippet } from '@shared/api/hooks'
import { QueryKeys } from '@shared/api/hooks/keys-factory'
import { monacoTheme } from '@shared/constants/monaco-theme'
import { CopyableFieldShared } from '@shared/ui/copyable-field/copyable-field'
import {
    createBrowserDraftHash,
    getEditSnippetDraftKey,
    readBrowserDraft,
    removeBrowserDraft,
    writeBrowserDraft
} from '@shared/utils/browser-draft-storage'

import classes from './SnippetsDrawer.module.css'

export const EDIT_SNIPPET_MODAL_ID = 'edit-snippet-modal'

interface IProps {
    snippet: UpdateSnippetCommand.Response['response']['snippets'][number]
}

export const EditSnippetModal = (props: IProps) => {
    const { snippet } = props

    const { i18n } = useTranslation()

    const monaco = useMonaco()
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
    const draftAutosaveTimeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null)
    const isDraftCheckedRef = useRef(false)
    const draftKey = getEditSnippetDraftKey(snippet.name)
    const originalSnippetValue = JSON.stringify(snippet.snippet || [], null, 2)

    const { mutate: updateSnippet, isPending: isUpdating } = useUpdateSnippet({
        mutationFns: {
            onSuccess: () => {
                queryClient.refetchQueries({ queryKey: QueryKeys.snippets.getSnippets.queryKey })
                clearDraft()
                modals.close(EDIT_SNIPPET_MODAL_ID)
            }
        }
    })

    const editSnippetForm = useForm<UpdateSnippetCommand.RequestBody>({
        name: 'edit-snippet-form',
        mode: 'uncontrolled',
        validateInputOnBlur: true,
        validate: schemaResolver(UpdateSnippetCommand.RequestBodySchema),
        initialValues: {
            name: snippet.name,
            snippet: snippet.snippet as unknown as UpdateSnippetCommand.RequestBody['snippet']
        }
    })

    const clearDraftAutosaveTimeout = () => {
        if (!draftAutosaveTimeoutRef.current) return

        clearTimeout(draftAutosaveTimeoutRef.current)
        draftAutosaveTimeoutRef.current = null
    }

    const saveDraftNow = (value: string) => {
        clearDraftAutosaveTimeout()

        writeBrowserDraft(draftKey, {
            baseHash: createBrowserDraftHash(originalSnippetValue),
            updatedAt: Date.now(),
            value
        })
    }

    const scheduleDraftSave = (value: string) => {
        clearDraftAutosaveTimeout()

        draftAutosaveTimeoutRef.current = setTimeout(() => {
            saveDraftNow(value)
        }, 1000)
    }

    const clearDraft = () => {
        clearDraftAutosaveTimeout()
        removeBrowserDraft(draftKey)
    }

    const validateSnippetValue = (value: string) => {
        try {
            JSON.parse(value || '[]')

            editSnippetForm.clearErrors()
        } catch {
            editSnippetForm.setFieldError('snippet', t('snippets.drawer.widget.invalid-json'))
        }
    }

    const restoreDraftIfNeeded = () => {
        if (isDraftCheckedRef.current || !editorRef.current) return
        isDraftCheckedRef.current = true

        const draft = readBrowserDraft(draftKey)
        if (!draft) return

        if (draft.value === originalSnippetValue) {
            removeBrowserDraft(draftKey)
            return
        }

        const isServerChanged = draft.baseHash !== createBrowserDraftHash(originalSnippetValue)

        modals.openConfirmModal({
            title: t('config-editor.widget.local-draft-found'),
            children: (
                <Stack gap="xs">
                    <Code block>{draft.value}</Code>
                    {isServerChanged && (
                        <Code color="yellow">
                            {t('config-editor.widget.server-version-changed')}
                        </Code>
                    )}
                    <Code color="yellow">
                        {t('config-editor.widget.local-draft-warning', {
                            date: new Date(draft.updatedAt).toLocaleString()
                        })}
                    </Code>
                </Stack>
            ),
            centered: true,
            closeOnClickOutside: false,
            closeOnEscape: false,
            labels: {
                confirm: t('config-editor.widget.restore-draft'),
                cancel: t('config-editor.widget.discard-draft')
            },
            confirmProps: {
                color: 'teal'
            },
            cancelProps: {
                color: 'red',
                variant: 'light'
            },
            onConfirm: () => {
                editorRef.current?.setValue(draft.value)
                validateSnippetValue(draft.value)
            },
            onCancel: clearDraft
        })
    }

    useEffect(() => {
        return () => {
            clearDraftAutosaveTimeout()
        }
    }, [])

    const handleEditorDidMount = (monaco: Monaco) => {
        monaco.editor.defineTheme('GithubDark', {
            ...monacoTheme,
            base: 'vs-dark'
        })
    }

    const handleUpdate = (values: UpdateSnippetCommand.RequestBody) => {
        if (!editorRef.current) return

        const currentTextValue = editorRef.current.getValue()
        let currentValue = currentTextValue

        saveDraftNow(currentTextValue)

        try {
            currentValue = JSON.parse(currentValue)
        } catch {
            editSnippetForm.setFieldError('snippet', t('snippets.drawer.widget.invalid-json'))
            return
        }

        if (!Array.isArray(currentValue) || currentValue.length === 0) {
            editSnippetForm.setFieldError(
                'snippet',
                t('snippets.drawer.widget.snippet-cannot-be-empty')
            )
            return
        }

        if (currentValue.some((item) => Object.keys(item).length === 0)) {
            editSnippetForm.setFieldError(
                'snippet',
                t('snippets.drawer.widget.snippet-cannot-contain-empty-objects')
            )
            return
        }

        updateSnippet({
            variables: {
                name: values.name,
                snippet: currentValue
            }
        })
    }

    useEffect(() => {
        if (!monaco) return

        MonacoSetupSnippetsFeature.setup(monaco, i18n.language)
    }, [i18n.language, monaco])

    return (
        <form onSubmit={(e) => editSnippetForm.onSubmit(handleUpdate)(e)}>
            <Stack gap="md">
                <CopyableFieldShared
                    label={t('snippets.drawer.widget.snippet-name')}
                    value={editSnippetForm.getValues().name}
                />

                <Paper
                    p={0}
                    style={{
                        border: editSnippetForm.getInputProps('snippet').error
                            ? '1px solid var(--mantine-color-red-5)'
                            : '1px solid var(--mantine-color-dark-4)'
                    }}
                    withBorder
                >
                    <Editor
                        beforeMount={handleEditorDidMount}
                        className={classes.editor}
                        defaultLanguage="json"
                        height={400}
                        loading={t('config-editor.widget.loading-editor')}
                        onChange={(value) => {
                            const nextValue = value ?? ''

                            scheduleDraftSave(nextValue)
                            validateSnippetValue(nextValue)
                        }}
                        onMount={(editor) => {
                            editorRef.current = editor
                            restoreDraftIfNeeded()
                        }}
                        options={{
                            autoClosingBrackets: 'always',
                            autoClosingQuotes: 'always',
                            autoIndent: 'full',
                            automaticLayout: true,
                            bracketPairColorization: {
                                enabled: true,
                                independentColorPoolPerBracketType: true
                            },
                            scrollbar: {
                                useShadows: false,
                                verticalHasArrows: true,
                                horizontalHasArrows: true,
                                vertical: 'visible',
                                horizontal: 'visible',
                                arrowSize: 30,
                                alwaysConsumeMouseWheel: false
                            },
                            detectIndentation: true,
                            folding: true,
                            foldingStrategy: 'indentation',
                            fontSize: 14,
                            formatOnPaste: true,
                            formatOnType: true,
                            guides: {
                                bracketPairs: true,
                                indentation: true
                            },
                            insertSpaces: true,
                            minimap: { enabled: true },
                            quickSuggestions: true,
                            renderLineHighlight: 'all',
                            scrollBeyondLastLine: false,
                            smoothScrolling: true,
                            tabSize: 2,
                            padding: {
                                top: 10,
                                bottom: 10
                            }
                        }}
                        path="snippet://*"
                        theme="GithubDark"
                        value={JSON.stringify(editSnippetForm.getValues().snippet || [], null, 2)}
                    />
                </Paper>

                <Paper
                    mb="md"
                    p="md"
                    radius="sm"
                    style={{
                        backgroundColor: editSnippetForm.getInputProps('snippet').error
                            ? 'rgba(241, 65, 65, 0.1)'
                            : 'rgba(51, 171, 132, 0.1)',
                        border: `1px solid ${editSnippetForm.getInputProps('snippet').error ? 'rgb(241, 65, 65)' : 'rgb(51, 171, 132)'}`
                    }}
                >
                    <Code
                        color={editSnippetForm.getInputProps('snippet').error ? 'red' : 'teal'}
                        style={{
                            backgroundColor: 'transparent',
                            fontSize: '0.9rem',
                            padding: 0
                        }}
                    >
                        {editSnippetForm.getInputProps('snippet').error ||
                            t('snippets.drawer.widget.snippet-is-valid')}
                    </Code>
                </Paper>

                <Group gap="sm" justify="flex-end">
                    <Button
                        disabled={isUpdating}
                        onClick={() => {
                            editSnippetForm.reset()
                            clearDraft()
                            modals.close(EDIT_SNIPPET_MODAL_ID)
                        }}
                        variant="subtle"
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button loading={isUpdating} type="submit">
                        {t('common.save')}
                    </Button>
                </Group>
            </Stack>
        </form>
    )
}
