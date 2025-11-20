import { NextRequest, NextResponse } from "next/server";
import Product from "@/models/Product";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "10", 10);
  const search = searchParams.get("search") ?? "";
  const filterCategories = searchParams.getAll("category").filter(Boolean);

  const query: Record<string, unknown> = {};

  if (search) {
    query.title = { $regex: search, $options: "i" };
  }

  if (filterCategories.length) {
    query.category = { $in: filterCategories };
  }

  const skip = Math.max(0, (page - 1) * pageSize);

  const [items, total, categoryAggregation] = await Promise.all([
    Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
    Product.countDocuments(query),
    Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const availableCategories = categoryAggregation.map(
    (entry) => entry._id as string
  );
  const categoryCounts = categoryAggregation.reduce<Record<string, number>>(
    (acc, entry) => {
      acc[entry._id as string] = entry.count;
      return acc;
    },
    {}
  );

  return NextResponse.json({
    items,
    total,
    categories: availableCategories,
    categoryCounts,
  });
}

export async function POST(req: NextRequest) {
  await connectToDatabase();

  const body = await req.json();
  const {
    title,
    description,
    image,
    category,
    price,
    rating,
    reviews,
  } = body;

  if (
    !title ||
    !description ||
    !image ||
    !category ||
    price === undefined ||
    price === null
  ) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 }
    );
  }

  const product = await Product.create({
    title,
    description,
    image,
    category,
    price,
    rating: rating ?? null,
    reviews: reviews ?? 0,
  });

  return NextResponse.json(product, { status: 201 });
}

