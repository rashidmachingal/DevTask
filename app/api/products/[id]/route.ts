import { NextRequest, NextResponse } from "next/server";
import Product from "@/models/Product";
import { connectToDatabase } from "@/lib/mongodb";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(_: NextRequest, { params }: Params) {
  await connectToDatabase();

  const product = await Product.findById(params.id);
  if (!product) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: Params) {
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

export async function DELETE(_: NextRequest, { params }: Params) {
  await connectToDatabase();
  const result = await Product.findByIdAndDelete(params.id);

  if (!result) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Deleted" });
}

