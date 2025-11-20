"use client";

import {
  Document,
  Page as PdfPage,
  Text as PdfText,
  View,
  Image as PdfImage,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  subtitle: {
    marginTop: 4,
    color: "#6b7280",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1 solid #e5e7eb",
    paddingBottom: 6,
    marginBottom: 4,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottom: "1 solid #f3f4f6",
    alignItems: "center",
  },
  cell: {
    paddingRight: 8,
    minWidth: 0,
  },
  image: {
    width: 40,
    height: 40,
    marginRight: 8,
    objectFit: "contain",
  },
  productCell: {
    width: "40%",
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    minWidth: 0,
  },
  productTitle: {
    flex: 1,
    flexWrap: "wrap",
    wordBreak: "break-word",
  },
});

export default function ProductPdfDocument({ products }) {
  return (
    <Document>
      <PdfPage size="A4" style={styles.page}>
        <View style={styles.header}>
          <PdfText style={styles.title}>Products Export</PdfText>
          <PdfText style={styles.subtitle}>
            Generated on {new Date().toLocaleDateString()}
          </PdfText>
        </View>

        <View style={styles.tableHeader}>
          <PdfText style={{ ...styles.cell, width: "40%" }}>Product</PdfText>
          <PdfText style={{ ...styles.cell, width: "20%" }}>Category</PdfText>
          <PdfText style={{ ...styles.cell, width: "15%" }}>Price</PdfText>
          <PdfText style={{ ...styles.cell, width: "15%" }}>Rating</PdfText>
          <PdfText style={{ ...styles.cell, width: "10%" }}>Reviews</PdfText>
        </View>

        {products.map((product) => (
          <View key={product.id} style={styles.row}>
            <View style={styles.productCell}>
              {product.image ? (
                <PdfImage source={product.image} style={styles.image} />
              ) : null}
              <PdfText style={styles.productTitle}>{product.title}</PdfText>
            </View>
            <PdfText style={{ ...styles.cell, width: "20%" }}>
              {product.category}
            </PdfText>
            <PdfText style={{ ...styles.cell, width: "15%" }}>
              {typeof product.price === "number"
                ? `$${product.price.toFixed(2)}`
                : "—"}
            </PdfText>
            <PdfText style={{ ...styles.cell, width: "15%" }}>
              {product.rating ?? "—"}
            </PdfText>
            <PdfText style={{ ...styles.cell, width: "10%" }}>
              {product.reviews ?? "—"}
            </PdfText>
          </View>
        ))}
      </PdfPage>
    </Document>
  );
}

