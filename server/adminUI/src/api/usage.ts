import { apiClient } from './client'
import type { UsageRange, UsageReportDTO } from '@/types'

export const usageApi = {
  daily: (range: UsageRange) =>
    apiClient.get<UsageReportDTO>(`/api/admin/usage/daily?range=${encodeURIComponent(range)}`)
}
