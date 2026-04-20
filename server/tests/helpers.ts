import type { Express } from 'express'

export const ADMIN_AUTH = 'Basic ' + Buffer.from('admin:test-password-123').toString('base64')

export function sampleBook(overrides: Record<string, unknown> = {}) {
  return {
    bookId: 'fa-1-apple',
    author: 'Jane Doe',
    category: 'Früchte',
    bookSeriesId: 'fruit-agents',
    releaseDate: '2026-01-15',
    badges: ['new'],
    coverImage: 'https://example.test/cover.webp',
    previewImage: 'https://example.test/preview.webp',
    audio: { de: '', en: '' },
    attachments: [],
    localizations: {
      de: {
        title: 'Der Apfel',
        shortDescription: 'Eine Geschichte über den Apfel',
        description: 'Lange Beschreibung auf Deutsch.',
        content: [{ page: 1, title: 'Seite 1', text: 'Es war einmal ein Apfel.' }]
      }
    },
    isPublished: true,
    ...overrides
  }
}

export async function createApp(): Promise<Express> {
  const { createApp } = await import('../src/app.js')
  return createApp()
}
