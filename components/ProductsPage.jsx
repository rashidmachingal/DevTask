"use client";

import Image from "next/image";
import { useMemo, useState, useCallback, useEffect } from "react";
import {
  BlockStack,
  Box,
  Card,
  ChoiceList,
  Filters,
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
  Thumbnail,
} from "@shopify/polaris";

// Polaris-like table size that keeps pagination compact
const PAGE_SIZE = 10;

const formatCategoryLabel = (value) =>
  value
    ? value
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "";

export default function ProductsPage() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [queryValue, setQueryValue] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeProduct, setActiveProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch Shopify-like catalog data from Fakestore API
  useEffect(() => {
    let mounted = true;
    fetch("https://fakestoreapi.com/products")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to load products");
        }
        return response.json();
      })
      .then((data) => {
        if (!mounted) return;
        const normalized = data.map((item) => ({
          id: String(item.id),
          title: item.title,
          image: item.image,
          category: item.category,
          price: item.price,
          description: item.description,
          ratingRate: item.rating?.rate ?? null,
          ratingCount: item.rating?.count ?? null,
        }));
        setProducts(normalized);
        setCurrentPage(1);
        setError("");
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || "Failed to fetch products");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Build tab set dynamically from API categories so UI mirrors data
  const tabs = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(products.map((product) => product.category))
    );
    return [
      { id: "all", content: "All" },
      ...uniqueCategories.map((category) => ({
        id: category,
        content: formatCategoryLabel(category),
      })),
    ];
  }, [products]);

  const categoryChoices = useMemo(
    () =>
      Array.from(new Set(products.map(({ category }) => category))).map(
        (category) => ({
          label: formatCategoryLabel(category),
          value: category,
        })
      ),
    [products]
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

  // Apply tab/category/search filters locally for snappy UX
  const filteredProducts = useMemo(() => {
    const currentTab = tabs[selectedTab]?.id || "all";
    return products.filter((product) => {
      const matchesTab =
        currentTab === "all" || product.category === currentTab;

      const matchesQuery = product.title
        .toLowerCase()
        .includes(queryValue.toLowerCase().trim());

      const matchesCategoryFilter =
        !selectedCategories.length ||
        selectedCategories.includes(product.category);

      return matchesTab && matchesQuery && matchesCategoryFilter;
    });
  }, [products, queryValue, selectedCategories, selectedTab, tabs]);

  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  // Slice the filtered results for the current page
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  const handleQueryChange = useCallback((value) => {
    setQueryValue(value);
    setCurrentPage(1);
  }, []);
  const handleQueryClear = useCallback(() => {
    setQueryValue("");
    setCurrentPage(1);
  }, []);
  const dismissProductModal = useCallback(() => setActiveProduct(null), []);

  const tabsWithCounts = useMemo(
    () =>
      tabs.map((tab) => ({
        ...tab,
        badge:
          tab.id === "all"
            ? products.length
            : products.filter((product) => product.category === tab.id).length,
      })),
    [products, tabs]
  );

  const tableRowsMarkup = paginatedProducts.map(
    (
      {
        id,
        title,
        image,
        category,
        price,
        description,
        ratingRate,
        ratingCount,
      },
      index
    ) => (
      <IndexTable.Row
        id={id}
        key={id}
        position={index}
        onClick={() =>
          setActiveProduct({
            id,
            title,
            image,
            category,
            price,
            description,
            ratingRate,
            ratingCount,
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
            {ratingRate ?? "—"}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" tone="subdued">
            {ratingCount ?? "—"}
          </Text>
        </IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  return (
    <Page
      title="Products List"
      primaryAction={{ content: "Add product", disabled: true }}
      secondaryActions={[{ content: "Export", disabled: true }]}
    >
      <BlockStack gap="4">
        <Card padding="0">
          <Tabs
            tabs={tabsWithCounts}
            selected={selectedTab}
            onSelect={(index) => {
              setSelectedTab(index);
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
                {/* Skeleton header mirrors table columns */}
                <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
                  <SkeletonDisplayText size="small" />
                  <SkeletonDisplayText size="small" />
                  <SkeletonDisplayText size="small" />
                </InlineGrid>

                {/* Skeleton rows mimic table stripes */}
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
              itemCount={paginatedProducts.length}
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
              {/* Compact Polaris pagination summary */}
              <InlineStack align="space-between">
                <Text tone="subdued">
                  {totalItems
                    ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(
                        totalItems,
                        (currentPage - 1) * PAGE_SIZE + paginatedProducts.length
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
          {!loading && !error && filteredProducts.length === 0 ? (
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
                {/* LARGE IMAGE */}
                <InlineStack align="center">
                  <Box maxWidth="300px">
                    <Image
                      src={activeProduct.image}
                      alt={activeProduct.title}
                      width={600}
                      height={600}
                      style={{
                        width: "100%",
                        height: "auto",
                        borderRadius: "12px",
                        objectFit: "contain",
                      }}
                    />
                  </Box>
                </InlineStack>

                {/* Product Title */}
                <Text
                  as="h2"
                  variant="headingMd"
                  fontWeight="semibold"
                  align="center"
                >
                  {activeProduct.title}
                </Text>

                {/* Product Info */}
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
                    <b>Rating:</b> {activeProduct.ratingRate ?? "—"}
                  </Text>
                  <Text tone="subdued">
                    <b>Reviews:</b> {activeProduct.ratingCount ?? "—"}
                  </Text>
                </BlockStack>

                {/* Description */}
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
    </Page>
  );
}
