import { Schema, model, type InferSchemaType, type Model } from 'mongoose'

const BookSeriesSchema = new Schema(
  {
    seriesId: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    prefix: {
      type: String,
      required: true,
      unique: true,
      index: true,
      match: [/^[a-z]{2}$/, 'prefix must be exactly 2 lowercase letters']
    },
    description: { type: String, default: '' }
  },
  { timestamps: true }
)

BookSeriesSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret._id
    return ret
  }
})

export type BookSeriesDocument = InferSchemaType<typeof BookSeriesSchema>
export const BookSeries: Model<BookSeriesDocument> = model<BookSeriesDocument>('BookSeries', BookSeriesSchema)
