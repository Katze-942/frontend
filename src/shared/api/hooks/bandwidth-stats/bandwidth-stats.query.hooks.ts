import { createQueryKeys } from '@lukemorales/query-key-factory'
import {
    GetLegacyStatsNodeUserUsageCommand,
    GetLegacyStatsUserUsageCommand,
    GetStatsNodesUsageCommand,
    GetStatsNodesUsersUsageCommand,
    GetStatsNodeUsersUsageCommand,
    GetStatsUserUsageCommand
} from '@remnawave/backend-contract'

import { sToMs } from '@shared/utils/time-utils'

import { createBodyQueryHook, createGetQueryHook, errorHandler } from '../../tsq-helpers'

export const bandwidthStatsQueryKeys = createQueryKeys('bandwidthStats', {
    getStatsNodesUsageCommand: (filters: GetStatsNodesUsageCommand.RequestQuery) => ({
        queryKey: [filters]
    }),
    getStatsUserUsageCommand: (
        query: GetStatsUserUsageCommand.RequestParam & GetStatsUserUsageCommand.RequestQuery
    ) => ({
        queryKey: [query]
    }),
    getStatsNodeUsersUsageCommand: (
        query: GetStatsNodeUsersUsageCommand.RequestParam &
            GetStatsNodeUsersUsageCommand.RequestQuery
    ) => ({
        queryKey: [query]
    }),
    getStatsNodesUsersUsageCommand: (
        params: GetStatsNodesUsersUsageCommand.RequestBody &
            GetStatsNodesUsersUsageCommand.RequestQuery
    ) => ({
        queryKey: [params]
    }),
    getLegacyStatsUserUsageCommand: (
        query: GetLegacyStatsUserUsageCommand.RequestParam &
            GetLegacyStatsUserUsageCommand.RequestQuery
    ) => ({
        queryKey: [query]
    }),
    getLegacyStatsNodeUserUsageCommand: (
        query: GetLegacyStatsNodeUserUsageCommand.RequestParam &
            GetLegacyStatsNodeUserUsageCommand.RequestQuery
    ) => ({
        queryKey: [query]
    })
})

export const useGetStatsNodesUsage = createGetQueryHook({
    endpoint: GetStatsNodesUsageCommand.TSQ_url,
    responseSchema: GetStatsNodesUsageCommand.ResponseSchema,
    requestQuerySchema: GetStatsNodesUsageCommand.RequestQuerySchema,
    getQueryKey: ({ query }) => bandwidthStatsQueryKeys.getStatsNodesUsageCommand(query!).queryKey,
    rQueryParams: {
        staleTime: sToMs(60)
    },
    errorHandler: (error) => errorHandler(error, 'Get Nodes Usage By Range')
})

export const useGetStatsUserUsage = createGetQueryHook({
    endpoint: GetStatsUserUsageCommand.TSQ_url,
    responseSchema: GetStatsUserUsageCommand.ResponseSchema,
    requestQuerySchema: GetStatsUserUsageCommand.RequestQuerySchema,
    routeParamsSchema: GetStatsUserUsageCommand.RequestParamSchema,
    getQueryKey: ({ route, query }) =>
        bandwidthStatsQueryKeys.getStatsUserUsageCommand({ ...route!, ...query! }).queryKey,
    rQueryParams: {
        staleTime: sToMs(30)
    },
    errorHandler: (error) => errorHandler(error, 'Get User Usage By Range')
})

export const useGetStatsNodeUsersUsage = createGetQueryHook({
    endpoint: GetStatsNodeUsersUsageCommand.TSQ_url,
    responseSchema: GetStatsNodeUsersUsageCommand.ResponseSchema,
    requestQuerySchema: GetStatsNodeUsersUsageCommand.RequestQuerySchema,
    routeParamsSchema: GetStatsNodeUsersUsageCommand.RequestParamSchema,
    getQueryKey: ({ route, query }) =>
        bandwidthStatsQueryKeys.getStatsNodeUsersUsageCommand({ ...route!, ...query! }).queryKey,
    rQueryParams: {
        staleTime: sToMs(60)
    },
    errorHandler: (error) => errorHandler(error, 'Get Node Users Usage By Range')
})

export const useGetStatsNodesUsersUsage = createBodyQueryHook({
    endpoint: GetStatsNodesUsersUsageCommand.TSQ_url,
    requestMethod: GetStatsNodesUsersUsageCommand.endpointDetails.REQUEST_METHOD,
    responseSchema: GetStatsNodesUsersUsageCommand.ResponseSchema,
    requestQuerySchema: GetStatsNodesUsersUsageCommand.RequestQuerySchema,
    bodySchema: GetStatsNodesUsersUsageCommand.RequestBodySchema,
    getQueryKey: ({ query, body }) =>
        bandwidthStatsQueryKeys.getStatsNodesUsersUsageCommand({ ...query!, ...body! }).queryKey,
    rQueryParams: {
        staleTime: sToMs(60)
    },
    errorHandler: (error) => errorHandler(error, 'Get Nodes Users Usage By Range')
})

export const useGetLegacyStatsNodeUserUsage = createGetQueryHook({
    endpoint: GetLegacyStatsNodeUserUsageCommand.TSQ_url,
    responseSchema: GetLegacyStatsNodeUserUsageCommand.ResponseSchema,
    requestQuerySchema: GetLegacyStatsNodeUserUsageCommand.RequestQuerySchema,
    routeParamsSchema: GetLegacyStatsNodeUserUsageCommand.RequestParamSchema,
    getQueryKey: ({ route, query }) =>
        bandwidthStatsQueryKeys.getLegacyStatsNodeUserUsageCommand({ ...route!, ...query! })
            .queryKey,
    rQueryParams: {
        staleTime: sToMs(60)
    },
    errorHandler: (error) => errorHandler(error, 'Get Node Users Usage By Range')
})

export const useGetLegacyStatsUserUsage = createGetQueryHook({
    endpoint: GetLegacyStatsUserUsageCommand.TSQ_url,
    responseSchema: GetLegacyStatsUserUsageCommand.ResponseSchema,
    requestQuerySchema: GetLegacyStatsUserUsageCommand.RequestQuerySchema,
    routeParamsSchema: GetLegacyStatsUserUsageCommand.RequestParamSchema,
    getQueryKey: ({ route, query }) =>
        bandwidthStatsQueryKeys.getLegacyStatsUserUsageCommand({ ...route!, ...query! }).queryKey,
    rQueryParams: {
        staleTime: sToMs(15)
    },
    errorHandler: (error) => errorHandler(error, 'Get User Usage By Range')
})
