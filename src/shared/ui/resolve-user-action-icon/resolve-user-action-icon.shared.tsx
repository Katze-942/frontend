import { ActionIcon } from '@mantine/core'
import { PiUserCircle } from 'react-icons/pi'

import { showModal } from '@shared/_modals/show-modal'
import { useResolveUser } from '@shared/api/hooks'

interface IProps {
    userId: number
}

export function ResolveUserActionShared(props: IProps) {
    const { userId } = props

    const { mutateAsync: resolveUser, isPending } = useResolveUser()

    return (
        <ActionIcon
            loading={isPending}
            onClick={() => {
                resolveUser({
                    variables: {
                        id: Number(userId)
                    }
                }).then(async (result) => {
                    showModal('users_viewUserModal', { userUuid: result.uuid })
                })
            }}
            size="input-sm"
            variant="soft"
        >
            <PiUserCircle size="1.5rem" />
        </ActionIcon>
    )
}
