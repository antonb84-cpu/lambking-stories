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
    description: { type: String, default: '' },
    // Single non-localised banner image (16:9). Uploaded via the
    // AdminUI dropzone embedded in each series chip; surfaced by the
    // public app on the SeriesView hero. Empty string means "not yet set".
    coverImage: { type: String, default: '' },
    // Display position for the app's series list and the AdminUI chips —
    // lower sorts first. Assigned automatically on create (next free
    // integer, so a new series lands last) and rewritten as a contiguous
    // 1..n run whenever the editor moves one, which keeps the numbers
    // gap-free and free of ties. 0 means "never ordered"; the startup
    // backfill in `config/series.ts` replaces those with real positions.
    sortOrder: { type: Number, default: 0, index: true }
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
