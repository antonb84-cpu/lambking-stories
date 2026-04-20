import { apiClient } from './client'

export type ImageKind = 'cover' | 'preview' | 'content'
type UploadResult = { url: string; path: string }

export const uploadsApi = {
  audio(file: File, bookId: string, lang: 'de' | 'en'): Promise<UploadResult> {
    const form = new FormData()
    form.append('file', file)
    return apiClient.upload<UploadResult>(
      `/api/audiobooks?bookId=${encodeURIComponent(bookId)}&lang=${lang}`,
      form
    )
  },
  image(file: File, kind: ImageKind): Promise<UploadResult & { kind: ImageKind }> {
    const form = new FormData()
    form.append('file', file)
    return apiClient.upload<UploadResult & { kind: ImageKind }>(`/api/images?kind=${kind}`, form)
  },
  attachment(file: File): Promise<UploadResult & { filename: string }> {
    const form = new FormData()
    form.append('file', file)
    return apiClient.upload<UploadResult & { filename: string }>('/api/attachments', form)
  }
}
