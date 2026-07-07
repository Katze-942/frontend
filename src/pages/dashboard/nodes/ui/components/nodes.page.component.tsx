import { MultiSelectNodesFeature } from '@features/dashboard/nodes/multi-select-nodes/multi-select-nodes.feature'
import { NodesHeaderActionButtonsFeature } from '@features/ui/dashboard/nodes/nodes-header-action-buttons'
import { Grid, Stack } from '@mantine/core'
/* eslint-disable no-nested-ternary */
import { GetNodesCommand } from '@remnawave/backend-contract'
import { NodesDataTableWidget } from '@widgets/dashboard/nodes/nodes-datatable/nodes-datatable.widget'
import { NodesRealtimeUsageMetrics } from '@widgets/dashboard/nodes/nodes-realtime-metrics'
import { NodesTableWidget } from '@widgets/dashboard/nodes/nodes-table'
import { motion } from 'motion/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HiServer } from 'react-icons/hi'

import { LoadingScreen, Page, PageHeaderShared } from '@shared/ui'

import {
    NODES_VIEW_MODE,
    useNodesViewMode,
    useViewPreferencesStoreActions
} from '@entities/dashboard/view-preferences-store'

import { IProps } from './interfaces'

export default function NodesPageComponent(props: IProps) {
    const { nodes, isLoading } = props

    const { t } = useTranslation()

    const viewMode = useNodesViewMode()
    const { setNodesViewMode } = useViewPreferencesStoreActions()
    const [selectedRecords, setSelectedRecords] = useState<
        GetNodesCommand.Response['response'][number][]
    >([])

    return (
        <Page title={t('constants.nodes')}>
            <Grid>
                <Grid.Col span={12}>
                    <Stack>
                        <NodesRealtimeUsageMetrics isLoading={isLoading} nodes={nodes} />

                        <PageHeaderShared
                            actions={
                                <NodesHeaderActionButtonsFeature
                                    setViewMode={setNodesViewMode}
                                    viewMode={viewMode}
                                />
                            }
                            icon={<HiServer size={24} />}
                            title={t('constants.nodes')}
                        />
                    </Stack>

                    {isLoading ? (
                        <LoadingScreen height="60vh" />
                    ) : viewMode === NODES_VIEW_MODE.TABLE ? (
                        <motion.div
                            animate={{ opacity: 1 }}
                            initial={{ opacity: 0 }}
                            transition={{
                                duration: 0.5
                            }}
                        >
                            <NodesDataTableWidget
                                nodes={nodes}
                                selectedRecords={selectedRecords}
                                setSelectedRecords={setSelectedRecords}
                            />
                        </motion.div>
                    ) : (
                        <NodesTableWidget nodes={nodes} />
                    )}
                </Grid.Col>
            </Grid>

            <MultiSelectNodesFeature
                selectedRecords={selectedRecords}
                setSelectedRecords={setSelectedRecords}
            />
        </Page>
    )
}
