import { Schema, model, type InferSchemaType, type Model } from 'mongoose'
import { BOOK_ID_PATTERN } from '../utils/bookId.js'

const PageSchema = new Schema(
  {
    page: { type: Number, required: true, min: 1 },
    title: { type: String, default: '' },
    text: { type: String, required: true }
  },
  { _id: false }
)

const LocalizationSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 300 },
    shortDescription: { type: String, required: true, trim: true, maxlength: 1000 },
    description: { type: String, required: true, trim: true, maxlength: 8000 },
    content: { type: [PageSchema], default: [] }
  },
  { _id: false }
)

const AudioSchema = new Schema(
  {
    de: { type: String, default: '' },
    en: { type: String, default: '' }
  },
  { _id: false }
)

const BookSchema = new Schema(
  {
    bookId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      match: [BOOK_ID_PATTERN, 'bookId must match pattern <prefix>-<volume>-<shortname>']
    },
    author: { type: String, required: true, trim: true, maxlength: 200 },
    category: { type: String, required: true, trim: true, maxlength: 120 },
    bookSeriesId: { type: String, required: true, trim: true, index: true },
    releaseDate: { type: Date, required: true },
    updatedDate: { type: Date, required: true, default: () => new Date() },
    badges: { type: [String], default: [] },
    cover: { type: String, default: '' },
    coverImage: { type: String, required: true },
    previewImage: { type: String, required: true },
    contentCoverImage: { type: AudioSchema, default: () => ({}) },
    audio: { type: AudioSchema, default: () => ({}) },
    attachments: { type: [String], default: [] },
    localizations: {
      de: { type: LocalizationSchema, required: true },
      en: { type: LocalizationSchema, required: false, default: null }
    },
    isPublished: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
)

BookSchema.pre('save', function(next) {
  this.updatedDate = new Date()
  next()
})

BookSchema.set('toJSON', {
  virtuals: false,
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret._id
    return ret
  }
})

export type BookDocument = InferSchemaType<typeof BookSchema>
export const Book: Model<BookDocument> = model<BookDocument>('Book', BookSchema)
