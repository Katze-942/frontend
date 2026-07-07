import NiceModal, { useModal } from '@ebay/nice-modal-react'
import {
    ActionIcon,
    Badge,
    Box,
    Card,
    Center,
    CopyButton,
    Drawer,
    Group,
    Loader,
    Stack,
    Text,
    Tooltip
} from '@mantine/core'
import { modals } from '@mantine/modals'
import ColorHash from 'color-hash'
import { githubDarkTheme, JsonEditor } from 'json-edit-react'
import { useTranslation } from 'react-i18next'
import { PiCheck, PiCopy } from 'react-icons/pi'
import { TbCirclesRelation, TbTag } from 'react-icons/tb'

import { useNiceMantineModal } from '@shared/_modals/use-nice-modal'
import { useGetConfigProfileInbounds, useGetInternalSquads } from '@shared/api/hooks'
import { InternalSquadsListSimpleWidgetShared } from '@shared/ui/internal-squads/internal-squads-list-simple'
import { BaseOverlayHeader } from '@shared/ui/overlays/base-overlay-header'

interface IProps {
    uuid: string
}

export const ConfigProfileInboundsDrawer = NiceModal.create((props: IProps) => {
    const { uuid } = props

    const { t } = useTranslation()

    const modal = useModal()
    const { modalProps } = useNiceMantineModal({ modal })

    const { data: configProfileInbounds, isLoading } = useGetConfigProfileInbounds({
        route: {
            uuid
        }
    })

    const { data: internalSquads, isLoading: isLoadingInternalSquads } = useGetInternalSquads({})

    const returnLoading = () => {
        return (
            <Center h={200}>
                <Stack align="center" gap="md">
                    <Loader size="lg" />
                    <Text c="dimmed">
                        {t('config-profile-inbounds.drawer.widget.fetching-inbounds')}
                    </Text>
                </Stack>
            </Center>
        )
    }

    const renderInbounds = () => {
        if (!configProfileInbounds) return null
        if (!internalSquads) return null

        const colorHash = new ColorHash({ lightness: 0.7, saturation: 0.6 })

        return (
            <Stack gap="xl">
                <Stack gap="lg">
                    {configProfileInbounds.inbounds.map((inbound) => {
                        const filteredSquads = internalSquads.internalSquads.filter((squad) =>
                            inbound.activeSquads.some((squadUuid) => squadUuid === squad.uuid)
                        )
                        const tagColor = colorHash.hex(inbound.tag)

                        return (
                            <Card
                                bg="dark.6"
                                key={inbound.uuid}
                                p="xs"
                                style={{
                                    borderLeft: `4px solid ${tagColor}`
                                }}
                                withBorder
                            >
                                <Stack gap="sm">
                                    <Group align="center" justify="space-between" wrap="nowrap">
                                        <Group align="center" gap="sm" wrap="nowrap">
                                            <ActionIcon
                                                color={tagColor}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    modals.open({
                                                        children: (
                                                            <Box>
                                                                <JsonEditor
                                                                    collapse={3}
                                                                    data={
                                                                        inbound.rawInbound as object
                                                                    }
                                                                    indent={4}
                                                                    maxWidth="100%"
                                                                    rootName=""
                                                                    theme={githubDarkTheme}
                                                                    viewOnly
                                                                />
                                                            </Box>
                                                        ),
                                                        title: (
                                                            <BaseOverlayHeader
                                                                iconColor="teal"
                                                                IconComponent={TbTag}
                                                                iconVariant="soft"
                                                                title={inbound.tag}
                                                                titleOrder={5}
                                                            />
                                                        ),
                                                        size: 'xl'
                                                    })
                                                }}
                                                size="md"
                                                variant="filled"
                                            >
                                                <TbTag
                                                    color="var(--mantine-color-dark-8)"
                                                    size={20}
                                                />
                                            </ActionIcon>

                                            <Text fw={600} size="md" truncate>
                                                {inbound.tag}
                                            </Text>
                                        </Group>

                                        <Group gap={0} mr="md" wrap="nowrap">
                                            <Badge
                                                leftSection={<TbCirclesRelation size="18" />}
                                                size="lg"
                                                variant="transparent"
                                            >
                                                {filteredSquads.length}
                                            </Badge>
                                            <CopyButton timeout={2000} value={inbound.uuid}>
                                                {({ copied, copy }) => (
                                                    <Tooltip
                                                        label={copied ? 'Copied!' : 'Copy UUID'}
                                                    >
                                                        <ActionIcon
                                                            color={copied ? 'teal' : 'gray'}
                                                            onClick={copy}
                                                            size="sm"
                                                            variant="subtle"
                                                        >
                                                            {copied ? (
                                                                <PiCheck size={18} />
                                                            ) : (
                                                                <PiCopy size={18} />
                                                            )}
                                                        </ActionIcon>
                                                    </Tooltip>
                                                )}
                                            </CopyButton>
                                        </Group>
                                    </Group>

                                    {filteredSquads.length > 0 && (
                                        <InternalSquadsListSimpleWidgetShared
                                            filteredInternalSquads={filteredSquads}
                                        />
                                    )}
                                </Stack>
                            </Card>
                        )
                    })}
                </Stack>
            </Stack>
        )
    }

    return (
        <Drawer
            {...modalProps}
            padding="lg"
            position="right"
            size="500px"
            title={
                <BaseOverlayHeader
                    iconColor="teal"
                    IconComponent={TbCirclesRelation}
                    iconVariant="soft"
                    title={t('config-profile-inbounds.drawer.widget.inbounds-with-active-squads')}
                />
            }
        >
            {(isLoading || isLoadingInternalSquads) && returnLoading()}
            {!isLoading && !isLoadingInternalSquads && configProfileInbounds && renderInbounds()}
        </Drawer>
    )
})
