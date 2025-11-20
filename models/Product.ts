import mongoose, { Schema, InferSchemaType } from "mongoose";

const ProductSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: null,
    },
    reviews: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true }
);

export type ProductDocument = InferSchemaType<typeof ProductSchema>;

const Product =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);

export default Product;

