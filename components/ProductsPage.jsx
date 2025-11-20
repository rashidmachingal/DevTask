"use client";

import Image from "next/image";
import { useMemo, useState, useCallback, useEffect } from "react";
import { pdf } from "@react-pdf/renderer";
import ProductPdfDocument from "./ProductPdfDocument";
import {
  BlockStack,
  Box,
  Card,
  ChoiceList,
  Filters,
  FormLayout,
  IndexTable,
  InlineGrid,
  InlineStack,
  Modal,
  Page,
  Pagination,
  SkeletonBodyText,
  SkeletonDisplayText,
  Tabs,
  Text,
  TextField,
  Thumbnail,
  Toast,
  useToast,
} from "@shopify/polaris";

// Polaris-like table size that keeps pagination compact
const PAGE_SIZE = 10;

const productFormInitialState = {
  title: "",
  description: "",
  image: "",
  category: "",
  price: "",
  rating: "",
  reviews: "",
};

const formatCategoryLabel = (value) =>
  value
    ? value
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "";

const getRandomProductFromFakeStore = async () => {
  const randomId = Math.floor(Math.random() * 20) + 1;
  const response = await fetch(`https://fakestoreapi.com/products/${randomId}`);
  if (!response.ok) throw new Error("Failed to fetch random product");
  return response.json();
};

export default function ProductsPage() {
  const [queryValue, setQueryValue] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTabCategory, setSelectedTabCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeProduct, setActiveProduct] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [productForm, setProductForm] = useState(productFormInitialState);
  const [formErrors, setFormErrors] = useState({});
  const [savingProduct, setSavingProduct] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", tone: "" });
  const [toastActive, setToastActive] = useState(false);

  const tabs = useMemo(
    () => [
      { id: "all", content: "All" },
      ...availableCategories.map((category) => ({
        id: category,
        content: formatCategoryLabel(category),
      })),
    ],
    [availableCategories]
  );

  useEffect(() => {
    if (
      selectedTabCategory !== "all" &&
      !availableCategories.includes(selectedTabCategory)
    ) {
      setSelectedTabCategory("all");
    }
  }, [availableCategories, selectedTabCategory]);

  const selectedTabIndex = useMemo(() => {
    const index = tabs.findIndex((tab) => tab.id === selectedTabCategory);
    return index === -1 ? 0 : index;
  }, [tabs, selectedTabCategory]);

  const categoryChoices = useMemo(
    () =>
      availableCategories.map((category) => ({
        label: formatCategoryLabel(category),
        value: category,
      })),
    [availableCategories]
  );

  const appliedFilters = useMemo(() => {
    return selectedCategories.length
      ? [
          {
            key: "category",
            label: `Category (${selectedCategories.length})`,
            onRemove: () => {
              setSelectedCategories([]);
              setCurrentPage(1);
            },
          },
        ]
      : [];
  }, [selectedCategories.length]);

  const filters = [
    {
      key: "category",
      label: "Category",
      filter: (
        <ChoiceList
          title="Category"
          titleHidden
          allowMultiple
          choices={categoryChoices}
          selected={selectedCategories}
          onChange={(values) => {
            setSelectedCategories(values);
            setCurrentPage(1);
          }}
        />
      ),
    },
  ];

  const resourceName = {
    singular: "product",
    plural: "products",
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: PAGE_SIZE.toString(),
      });

      if (queryValue.trim()) {
        params.set("search", queryValue.trim());
      }

      const categoriesToSend = new Set(selectedCategories);
      if (selectedTabCategory !== "all") {
        categoriesToSend.add(selectedTabCategory);
      }
      categoriesToSend.forEach((category) => params.append("category", category));

      const response = await fetch(`/api/products?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load products");
      }

      const data = await response.json();
      setProducts(data.items || []);
      setTotalItems(data.total || 0);
      setAvailableCategories(data.categories || []);
      setCategoryCounts(data.categoryCounts || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [currentPage, queryValue, selectedCategories, selectedTabCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const tableRowsMarkup = products.map(
    ({ _id, id, title, image, category, price, rating, reviews, description }, index) => {
      const rowId = id || _id;
      return (
        <IndexTable.Row
          id={rowId}
          key={rowId}
          position={index}
          onClick={() =>
            setActiveProduct({
              id: rowId,
              title,
              image,
              category,
              price,
              rating,
              reviews,
              description,
            })
          }
        >
          <IndexTable.Cell>
            <InlineStack gap="300" align="center">
              <Thumbnail source={image} alt={title} size="small" />
              <Box
                as="div"
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <Text as="span" tone="base" fontWeight="medium">
                  {title}
                </Text>
              </Box>
            </InlineStack>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Text as="span" tone="subdued">
              {formatCategoryLabel(category)}
            </Text>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Text as="span" tone="base" fontWeight="medium">
              {typeof price === "number" ? `$${price.toFixed(2)}` : "—"}
            </Text>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Text as="span" tone="subdued">
              {rating ?? "—"}
            </Text>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Text as="span" tone="subdued">
              {reviews ?? "—"}
            </Text>
          </IndexTable.Cell>
        </IndexTable.Row>
      );
    }
  );

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleQueryChange = useCallback((value) => {
    setQueryValue(value);
    setCurrentPage(1);
  }, []);

  const handleQueryClear = useCallback(() => {
    setQueryValue("");
    setCurrentPage(1);
  }, []);

  const dismissProductModal = useCallback(() => setActiveProduct(null), []);

  const handleCreateProduct = useCallback(async () => {
    const errors = {};

    if (!productForm.title.trim()) errors.title = "Title is required";
    if (!productForm.description.trim()) {
      errors.description = "Description is required";
    }
    if (!productForm.image.trim()) errors.image = "Image URL is required";
    if (!productForm.category.trim()) errors.category = "Category is required";

    const priceValue = Number(productForm.price);
    if (Number.isNaN(priceValue) || priceValue < 0) {
      errors.price = "Price must be a positive number";
    }

    if (productForm.rating !== "") {
      const ratingValue = Number(productForm.rating);
      if (
        Number.isNaN(ratingValue) ||
        ratingValue < 0 ||
        ratingValue > 5
      ) {
        errors.rating = "Rating must be between 0 and 5";
      }
    }

    if (productForm.reviews !== "") {
      const reviewsValue = Number(productForm.reviews);
      if (Number.isNaN(reviewsValue) || reviewsValue < 0) {
        errors.reviews = "Reviews must be 0 or greater";
      }
    }

    setFormErrors(errors);

    if (Object.keys(errors).length) {
      return;
    }

    setSavingProduct(true);
    setFeedback({ message: "", tone: "" });

    try {
      const payload = {
        title: productForm.title.trim(),
        description: productForm.description.trim(),
        image: productForm.image.trim(),
        category: productForm.category.trim(),
        price: Number(productForm.price),
        rating:
          productForm.rating === "" ? null : Number(productForm.rating),
        reviews:
          productForm.reviews === "" ? 0 : Number(productForm.reviews),
      };

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Unable to save product");
      }

      setProductForm(productFormInitialState);
      setFormErrors({});
      setIsAddModalOpen(false);
      setFeedback({ message: "Product created successfully", tone: "success" });
      fetchProducts();
    } catch (err) {
      setFeedback({
        message: err instanceof Error ? err.message : "Failed to save product",
        tone: "critical",
      });
    } finally {
      setSavingProduct(false);
    }
  }, [productForm, fetchProducts]);

  const handleExport = useCallback(async () => {
    if (!totalItems) return;

    setExporting(true);
    setFeedback({ message: "", tone: "" });

    try {
      const params = new URLSearchParams({
        page: "1",
        pageSize: Math.max(totalItems, PAGE_SIZE).toString(),
      });

      if (queryValue.trim()) {
        params.set("search", queryValue.trim());
      }

      const categoriesToSend = new Set(selectedCategories);
      if (selectedTabCategory !== "all") {
        categoriesToSend.add(selectedTabCategory);
      }
      categoriesToSend.forEach((category) => params.append("category", category));

      const response = await fetch(`/api/products?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to fetch products for export");
      }

      const data = await response.json();
      const pdfBlob = await pdf(
        <ProductPdfDocument
          products={(data.items || []).map((item) => ({
            id: item.id || item._id,
            title: item.title,
            image: item.image,
            category: item.category,
            price: item.price,
            rating: item.rating,
            reviews: item.reviews,
          }))}
        />
      ).toBlob();

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `products-${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setFeedback({ message: "PDF exported successfully", tone: "success" });
    } catch (err) {
      setFeedback({
        message:
          err instanceof Error ? err.message : "Failed to export products",
        tone: "critical",
      });
    } finally {
      setExporting(false);
    }
  }, [
    queryValue,
    selectedCategories,
    selectedTabCategory,
    totalItems,
  ]);

  const handleAddModalClose = () => {
    setIsAddModalOpen(false);
    setProductForm(productFormInitialState);
    setFormErrors({});
  };

  const handleAddProductClick = useCallback(async () => {
    setIsAddModalOpen(true);
    setProductForm(productFormInitialState);
    setFormErrors({});
    try {
      const product = await getRandomProductFromFakeStore();
      setProductForm({
        title: product.title || "",
        description: product.description || "",
        image: product.image || "",
        category: product.category || "",
        price: product.price?.toString() || "",
        rating: product.rating?.rate?.toString() || "",
        reviews: product.rating?.count?.toString() || "",
      });
    } catch (err) {
      // Optionally handle error (e.g., show a message)
    }
  }, []);

  useEffect(() => {
    if (feedback.message) {
      setToastActive(true);
    }
  }, [feedback.message]);

  const handleToastDismiss = () => {
    setToastActive(false);
    setFeedback({ message: "", tone: "" });
  };

  return (
    <Page
      title="Products"
      primaryAction={{
        content: "Add product",
        onAction: handleAddProductClick, // <-- use new handler
      }}
      secondaryActions={[
        {
          content: "Export",
          onAction: handleExport,
          disabled: loading || !totalItems,
          loading: exporting,
        },
      ]}
    >
      <BlockStack gap="4">
        {/* Replace Card feedback with Toast */}
        {toastActive && feedback.message ? (
          <Toast
            content={feedback.message}
            onDismiss={handleToastDismiss}
            tone={feedback.tone === "critical" ? "critical" : "success"}
          />
        ) : null}
        <Card padding="0">
          <Tabs
            tabs={tabs.map((tab) => ({
              ...tab,
              badge:
                tab.id === "all"
                  ? totalItems
                  : categoryCounts[tab.id] || 0,
            }))}
            selected={selectedTabIndex}
            onSelect={(index) => {
              const tab = tabs[index];
              setSelectedTabCategory(tab?.id ?? "all");
              setCurrentPage(1);
            }}
            fitted
          />
          <Box paddingInline="5" paddingBlockStart="5" paddingBlockEnd="3">
            <Filters
              queryValue={queryValue}
              filters={filters}
              appliedFilters={appliedFilters}
              onQueryChange={handleQueryChange}
              onQueryClear={handleQueryClear}
              onClearAll={() => {
                setSelectedCategories([]);
                handleQueryClear();
                setCurrentPage(1);
              }}
              queryPlaceholder="Filter items"
            />
          </Box>
          {loading ? (
            <Card>
              <BlockStack gap="400" padding="500">
                <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
                  <SkeletonDisplayText size="small" />
                  <SkeletonDisplayText size="small" />
                  <SkeletonDisplayText size="small" />
                </InlineGrid>
                <BlockStack gap="300">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <InlineGrid
                      key={index}
                      columns={{ xs: 1, sm: 2, md: 3 }}
                      gap="400"
                      align="center"
                      padding="400"
                      background="bg-surface-secondary"
                      border="divider"
                    >
                      <SkeletonBodyText lines={1} />
                      <SkeletonBodyText lines={1} />
                      <SkeletonBodyText lines={1} />
                    </InlineGrid>
                  ))}
                </BlockStack>
              </BlockStack>
            </Card>
          ) : (
            <IndexTable
              resourceName={resourceName}
              itemCount={products.length}
              headings={[
                { title: "Product" },
                { title: "Category" },
                { title: "Price" },
                { title: "Rating" },
                { title: "Reviews" },
              ]}
              selectable={false}
              hasZebraStriping
            >
              {tableRowsMarkup}
            </IndexTable>
          )}
          {!loading && (
            <Box padding="200" paddingBlockStart="200" paddingBlockEnd="2">
              <InlineStack align="space-between">
                <Text tone="subdued">
                  {totalItems
                    ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(
                        totalItems,
                        (currentPage - 1) * PAGE_SIZE + products.length
                      )} of ${totalItems}`
                    : "No products available"}
                </Text>
                <Pagination
                  hasPrevious={currentPage > 1}
                  onPrevious={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  hasNext={currentPage < totalPages}
                  onNext={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  label={`Page ${currentPage} of ${totalPages}`}
                />
              </InlineStack>
            </Box>
          )}
          {error ? (
            <Box padding="5">
              <Text tone="critical">{error}</Text>
            </Box>
          ) : null}
          {!loading && !error && !totalItems ? (
            <Box padding="5">
              <Text tone="subdued">No products match your filters.</Text>
            </Box>
          ) : null}
        </Card>
        {activeProduct ? (
          <Modal
            open
            onClose={dismissProductModal}
            title={activeProduct.title}
            secondaryActions={[
              { content: "Close", onAction: dismissProductModal },
            ]}
          >
            <Modal.Section>
              <BlockStack gap="600">
                <InlineStack align="center">
                  <Box maxWidth="300px">
                    <Image
                      src={activeProduct.image}
                      alt={activeProduct.title}
                      width={600}
                      height={600}
                      unoptimized
                      style={{
                        width: "100%",
                        height: "auto",
                        borderRadius: "12px",
                        objectFit: "contain",
                      }}
                    />
                  </Box>
                </InlineStack>
                <Text
                  as="h2"
                  variant="headingMd"
                  fontWeight="semibold"
                  align="center"
                >
                  {activeProduct.title}
                </Text>
                <BlockStack gap="300">
                  <Text tone="subdued">
                    <b>Category:</b>{" "}
                    {formatCategoryLabel(activeProduct.category)}
                  </Text>
                  <Text tone="subdued">
                    <b>Price:</b>{" "}
                    {typeof activeProduct.price === "number"
                      ? `$${activeProduct.price.toFixed(2)}`
                      : "—"}
                  </Text>
                  <Text tone="subdued">
                    <b>Rating:</b> {activeProduct.rating ?? "—"}
                  </Text>
                  <Text tone="subdued">
                    <b>Reviews:</b> {activeProduct.reviews ?? "—"}
                  </Text>
                </BlockStack>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">
                    Description
                  </Text>
                  <Text>{activeProduct.description}</Text>
                </BlockStack>
              </BlockStack>
            </Modal.Section>
          </Modal>
        ) : null}
      </BlockStack>

      <Modal
        open={isAddModalOpen}
        onClose={handleAddModalClose}
        title="Add product"
        primaryAction={{
          content: "Save product",
          onAction: handleCreateProduct,
          loading: savingProduct,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleAddModalClose,
            disabled: savingProduct,
          },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Title"
              value={productForm.title}
              onChange={(value) =>
                setProductForm((prev) => ({ ...prev, title: value }))
              }
              autoComplete="off"
              error={formErrors.title}
            />
            <TextField
              label="Description"
              value={productForm.description}
              onChange={(value) =>
                setProductForm((prev) => ({ ...prev, description: value }))
              }
              multiline
              autoComplete="off"
              error={formErrors.description}
            />
            <TextField
              label="Image URL"
              value={productForm.image}
              onChange={(value) =>
                setProductForm((prev) => ({ ...prev, image: value }))
              }
              autoComplete="off"
              error={formErrors.image}
            />
            <TextField
              label="Category"
              value={productForm.category}
              onChange={(value) =>
                setProductForm((prev) => ({ ...prev, category: value }))
              }
              autoComplete="off"
              error={formErrors.category}
            />
            <TextField
              label="Price"
              type="number"
              min={0}
              value={productForm.price}
              onChange={(value) =>
                setProductForm((prev) => ({ ...prev, price: value }))
              }
              autoComplete="off"
              error={formErrors.price}
            />
            <TextField
              label="Rating"
              type="number"
              min={0}
              max={5}
              value={productForm.rating}
              onChange={(value) =>
                setProductForm((prev) => ({ ...prev, rating: value }))
              }
              autoComplete="off"
              helpText="Optional — value between 0 and 5"
              error={formErrors.rating}
            />
            <TextField
              label="Reviews"
              type="number"
              min={0}
              value={productForm.reviews}
              onChange={(value) =>
                setProductForm((prev) => ({ ...prev, reviews: value }))
              }
              autoComplete="off"
              helpText="Optional — number of reviews"
              error={formErrors.reviews}
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
