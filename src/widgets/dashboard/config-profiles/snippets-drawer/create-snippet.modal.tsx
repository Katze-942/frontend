import type { editor } from 'monaco-editor'

import { MonacoSetupSnippetsFeature } from '@features/dashboard/config-profiles/monaco-setup'
import { Button, Code, Group, Paper, Stack, TextInput } from '@mantine/core'
import { useForm, schemaResolver } from '@mantine/form'
import { modals } from '@mantine/modals'
import { Editor, Monaco, useMonaco } from '@monaco-editor/react'
import { CreateSnippetCommand } from '@remnawave/backend-contract'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { queryClient } from '@shared/api'
import { QueryKeys } from '@shared/api/hooks/keys-factory'
import { useCreateSnippet } from '@shared/api/hooks/snippets/snippets.mutation.hooks'
import { monacoTheme } from '@shared/constants/monaco-theme'
import {
    type BrowserDraft,
    createBrowserDraftHash,
    getCreateSnippetDraftKey,
    readBrowserDraft,
    removeBrowserDraft,
    writeBrowserDraft
} from '@shared/utils/browser-draft-storage'

import classes from './SnippetsDrawer.module.css'

export const CREATE_SNIPPET_MODAL_ID = 'create-snippet-modal'

export const CreateSnippetModal = () => {
    const { t, i18n } = useTranslation()

    const monaco = useMonaco()
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
    const draftAutosaveTimeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null)
    const pendingDraftRef = useRef<BrowserDraft<{ name: string }> | null>(null)
    const isDraftCheckedRef = useRef(false)
    const skippedDraftValueRef = useRef<null | string>(null)
    const draftKey = getCreateSnippetDraftKey()
    const emptySnippetValue = JSON.stringify([], null, 2)
    const snippetNameRef = useRef('')

    const createSnippetForm = useForm<CreateSnippetCommand.RequestBody>({
        name: 'create-snippet-form',
        mode: 'uncontrolled',
        validateInputOnBlur: true,
        validate: schemaResolver(CreateSnippetCommand.RequestBodySchema),
        initialValues: {
            name: '',
            snippet: []
        }
    })

    useEffect(() => {
        if (!monaco) return

        MonacoSetupSnippetsFeature.setup(monaco, i18n.language)
    }, [i18n.language, monaco])

    const clearDraftAutosaveTimeout = () => {
        if (!draftAutosaveTimeoutRef.current) return

        clearTimeout(draftAutosaveTimeoutRef.current)
        draftAutosaveTimeoutRef.current = null
    }

    const saveDraftNow = (name: string, value: string) => {
        clearDraftAutosaveTimeout()

        const draft = {
            baseHash: createBrowserDraftHash(emptySnippetValue),
            meta: { name },
            updatedAt: Date.now(),
            value
        }

        pendingDraftRef.current = null
        writeBrowserDraft<{ name: string }>(draftKey, draft)
    }

    const scheduleDraftSave = (name: string, value: string) => {
        clearDraftAutosaveTimeout()

        pendingDraftRef.current = {
            baseHash: createBrowserDraftHash(emptySnippetValue),
            meta: { name },
            updatedAt: Date.now(),
            value
        }

        draftAutosaveTimeoutRef.current = setTimeout(() => {
            const pendingDraft = pendingDraftRef.current
            pendingDraftRef.current = null
            draftAutosaveTimeoutRef.current = null

            if (pendingDraft) {
                writeBrowserDraft<{ name: string }>(draftKey, pendingDraft)
            }
        }, 1000)
    }

    const clearDraft = () => {
        clearDraftAutosaveTimeout()
        pendingDraftRef.current = null
        removeBrowserDraft(draftKey)
    }

    const { mutate: createSnippet, isPending: isCreating } = useCreateSnippet({
        mutationFns: {
            onSuccess: () => {
                queryClient.refetchQueries({ queryKey: QueryKeys.snippets.getSnippets.queryKey })

                clearDraft()
                modals.close(CREATE_SNIPPET_MODAL_ID)
            }
        }
    })

    const validateSnippetValue = (value: string) => {
        try {
            JSON.parse(value || '[]')

            createSnippetForm.clearErrors()
        } catch {
            createSnippetForm.setFieldError('snippet', t('snippets.drawer.widget.invalid-json'))
        }
    }

    const restoreDraftIfNeeded = () => {
        if (isDraftCheckedRef.current || !editorRef.current) return
        isDraftCheckedRef.current = true

        const draft = readBrowserDraft<{ name: string }>(draftKey)
        if (!draft) return

        const draftName = draft.meta?.name ?? ''

        if (!draftName && draft.value === emptySnippetValue) {
            removeBrowserDraft(draftKey)
            return
        }

        modals.openConfirmModal({
            title: t('config-editor.widget.local-draft-found'),
            children: (
                <Stack gap="xs">
                    <TextInput
                        disabled
                        label={t('snippets.drawer.widget.snippet-name')}
                        value={draftName}
                    />
                    <Code block>{draft.value}</Code>
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
                snippetNameRef.current = draftName
                createSnippetForm.setFieldValue('name', draftName)
                skippedDraftValueRef.current = draft.value
                editorRef.current?.setValue(draft.value)
                validateSnippetValue(draft.value)
            },
            onCancel: clearDraft
        })
    }

    useEffect(() => {
        return () => {
            clearDraftAutosaveTimeout()

            const pendingDraft = pendingDraftRef.current
            pendingDraftRef.current = null

            if (pendingDraft) {
                writeBrowserDraft<{ name: string }>(draftKey, pendingDraft)
            }
        }
    }, [])

    const handleCreate = (values: CreateSnippetCommand.RequestBody) => {
        if (!editorRef.current) return

        const currentTextValue = editorRef.current.getValue()
        let currentValue = currentTextValue

        saveDraftNow(values.name, currentTextValue)

        try {
            currentValue = JSON.parse(currentValue)
        } catch {
            createSnippetForm.setFieldError('snippet', t('snippets.drawer.widget.invalid-json'))
            return
        }

        if (!Array.isArray(currentValue) || currentValue.length === 0) {
            createSnippetForm.setFieldError(
                'snippet',
                t('snippets.drawer.widget.snippet-cannot-be-empty')
            )
            return
        }

        if (currentValue.some((item) => Object.keys(item).length === 0)) {
            createSnippetForm.setFieldError(
                'snippet',
                t('snippets.drawer.widget.snippet-cannot-contain-empty-objects')
            )
            return
        }

        createSnippet({
            variables: {
                name: values.name,
                snippet: currentValue
            }
        })
    }

    const handleEditorDidMount = (monaco: Monaco) => {
        monaco.editor.defineTheme('GithubDark', {
            ...monacoTheme,
            base: 'vs-dark'
        })
    }

    return (
        <form onSubmit={(e) => createSnippetForm.onSubmit(handleCreate)(e)}>
            <Stack gap="md">
                <TextInput
                    key={createSnippetForm.key('name')}
                    label={t('snippets.drawer.widget.snippet-name')}
                    placeholder={t(
                        'snippets.drawer.widget.enter-snippet-name-cannot-be-changed-later'
                    )}
                    required
                    {...createSnippetForm.getInputProps('name')}
                    onChange={(event) => {
                        const nextName = event.currentTarget.value

                        snippetNameRef.current = nextName
                        createSnippetForm.setFieldValue('name', nextName)
                        scheduleDraftSave(
                            nextName,
                            editorRef.current?.getValue() ?? emptySnippetValue
                        )
                    }}
                />

                <Paper
                    p={0}
                    style={{
                        border: createSnippetForm.getInputProps('snippet').error
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

                            if (skippedDraftValueRef.current === nextValue) {
                                skippedDraftValueRef.current = null
                            } else {
                                skippedDraftValueRef.current = null
                                scheduleDraftSave(snippetNameRef.current, nextValue)
                            }

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
                        value={JSON.stringify(createSnippetForm.getValues().snippet || [], null, 2)}
                    />
                </Paper>

                <Paper
                    mb="md"
                    p="md"
                    radius="sm"
                    style={{
                        backgroundColor: createSnippetForm.getInputProps('snippet').error
                            ? 'rgba(241, 65, 65, 0.1)'
                            : 'rgba(51, 171, 132, 0.1)',
                        border: `1px solid ${createSnippetForm.getInputProps('snippet').error ? 'rgb(241, 65, 65)' : 'rgb(51, 171, 132)'}`
                    }}
                >
                    <Code
                        block
                        color={createSnippetForm.getInputProps('snippet').error ? 'red' : 'teal'}
                        style={{
                            backgroundColor: 'transparent',
                            fontSize: '0.9rem',
                            padding: 0
                        }}
                    >
                        {createSnippetForm.getInputProps('snippet').error ||
                            t('snippets.drawer.widget.snippet-is-valid')}
                    </Code>
                </Paper>

                <Group gap="sm" justify="flex-end">
                    <Button
                        disabled={isCreating}
                        onClick={() => {
                            createSnippetForm.reset()
                            snippetNameRef.current = ''
                            clearDraft()
                            modals.close(CREATE_SNIPPET_MODAL_ID)
                        }}
                        variant="subtle"
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button loading={isCreating} type="submit">
                        {t('common.create')}
                    </Button>
                </Group>
            </Stack>
        </form>
    )
}
