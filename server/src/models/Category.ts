import { Schema, model, type InferSchemaType, type Model } from 'mongoose'

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 120, index: true }
  },
  { timestamps: true }
)

CategorySchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret._id
    return ret
  }
})

export type CategoryDocument = InferSchemaType<typeof CategorySchema>
export const Category: Model<CategoryDocument> = model<CategoryDocument>('Category', CategorySchema)
