import { apiClient } from './client'

export const translateApi = {
  translate(from: 'de' | 'en', to: 'de' | 'en', strings: Record<string, string>) {
    return apiClient
      .post<{ translations: Record<string, string> }>('/api/translate', { from, to, strings })
      .then((r) => r.translations)
  }
}
