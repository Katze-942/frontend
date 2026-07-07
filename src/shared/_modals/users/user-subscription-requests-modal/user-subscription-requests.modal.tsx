import NiceModal, { useModal } from '@ebay/nice-modal-react'
import { Modal } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { TbTimeline } from 'react-icons/tb'

import { useNiceMantineModal } from '@shared/_modals/use-nice-modal'
import { useIsMobile } from '@shared/hooks/use-is-mobile'
import { BaseOverlayHeader } from '@shared/ui/overlays/base-overlay-header'

import { UserSubscriptionRequestsModalContent } from './user-subscription-requests.content.widget'

interface IProps {
    userUuid: string
}

export const UserSubscriptionRequestsModal = NiceModal.create((props: IProps) => {
    const { userUuid } = props
    const { t } = useTranslation()
    const isMobile = useIsMobile()

    const modal = useModal()
    const { modalProps } = useNiceMantineModal({
        modal
    })

    return (
        <Modal
            {...modalProps}
            size="min(800pxs, 70vw)"
            styles={{
                body: {
                    height: 'calc(100% - 60px)',
                    display: 'flex',
                    flexDirection: 'column'
                }
            }}
            title={
                <BaseOverlayHeader
                    iconColor="teal"
                    IconComponent={TbTimeline}
                    iconVariant="soft"
                    title={t(
                        'get-user-subscription-request-history.feature.subscription-request-history'
                    )}
                />
            }
        >
            <UserSubscriptionRequestsModalContent userUuid={userUuid} mobile={isMobile} />
        </Modal>
    )
})
