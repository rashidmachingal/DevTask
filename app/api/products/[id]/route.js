import { NextRequest, NextResponse } from "next/server";
import Product from "@/models/Product";
import { connectToDatabase } from "@/lib/mongodb";

/**
 * @typedef {Object} Params
 * @property {Object} params
 * @property {string} params.id
 */

export async function GET(request, context) {
  const params = await context.params;
  const { id } = params;
  await connectToDatabase();

  const product = await Product.findById(id);
  if (!product) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PUT(req, { params }) {
  await connectToDatabase();
  const updates = await req.json();

  const product = await Product.findByIdAndUpdate(params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function DELETE(_, { params }) {
  await connectToDatabase();
  const result = await Product.findByIdAndDelete(params.id);

  if (!result) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Deleted" });
}

