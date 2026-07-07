import { createMrtTableStore } from '@shared/lib/mrt-table-store'

export const useSrhInspectorTableStore = createMrtTableStore({
    name: 'x-rmnw-srh-inspector-table',
    version: 2,
    defaults: {
        sorting: [{ id: 'id', desc: true }]
    }
})

export const useSrhInspectorTableStoreActions = () =>
    useSrhInspectorTableStore((store) => store.actions)
