import { useEffect } from "react";
import type {
  LoaderFunctionArgs,
  ActionFunctionArgs
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";

import {
  Page,
  Card,
  Text,
  BlockStack,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

// 🧠 Load Products
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin } = await authenticate.admin(request);

    const response = await admin.graphql(`
      {
        products(first: 20) {
          edges {
            node {
              id
              title
              status
              handle
              featuredImage {
                url
                altText
              }
              variants(first: 1) {
                edges {
                  node {
                    id
                    price
                  }
                }
              }
            }
          }
        }
      }
    `);

    const responseJson = await response.json();
    const products = responseJson?.data?.products?.edges || [];

    return json({ products });
  } catch (error) {
    console.error("Loader error:", error);

    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    if (!shop) {
      return new Response("Missing shop parameter", { status: 400 });
    }

    return redirect(`/auth?shop=${shop}`);
  }
};

// 🧠 Create Product
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { admin } = await authenticate.admin(request);

    const color = ["Red", "Orange", "Yellow", "Green"][
      Math.floor(Math.random() * 4)
    ];

    const response = await admin.graphql(
      `
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }
    `,
      {
        variables: {
          product: {
            title: `${color} Snowboard`,
          },
        },
      }
    );

    const responseJson = await response.json();
    const product = responseJson.data.productCreate.product;
    const variantId = product.variants.edges[0]?.node?.id;

    const variantResponse = await admin.graphql(
      `
      mutation updateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          productVariants {
            id
            price
          }
        }
      }
    `,
      {
        variables: {
          productId: product.id,
          variants: [{ id: variantId, price: "100.00" }],
        },
      }
    );

    const variantResponseJson = await variantResponse.json();

    return json({
      product,
      variant:
        variantResponseJson.data.productVariantsBulkUpdate.productVariants,
    });
  } catch (error) {
    console.error("Action error:", error);
    return json({ error: "Failed to create product" }, { status: 500 });
  }
};

// 📦 UI
export default function Index() {
  const fetcher = useFetcher<typeof action>();
  const { products } = useLoaderData<typeof loader>();
  const shopify = useAppBridge();

  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

  const productId = fetcher.data?.product?.id?.replace(
    "gid://shopify/Product/",
    ""
  );

  useEffect(() => {
    if (productId && shopify.toast) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);

  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  return (
    <Page>
      <TitleBar
        title="Remix app template"
        primaryAction={{
          content: isLoading ? "Creating..." : "Generate a product",
          onAction: generateProduct,
          disabled: isLoading,
        }}
      />

      <BlockStack gap="400">
        {products.length > 0 ? (
          products.map(({ node }) => (
            <Card key={node.id} title={node.title} sectioned>
              <BlockStack>
                <Text variant="headingSm">{node.title}</Text>
                <Text>Status: {node.status}</Text>
                <Text>
                  Price: ${node.variants.edges[0]?.node?.price || "N/A"}
                </Text>
                {node.featuredImage?.url && (
                  <img
                    src={node.featuredImage.url}
                    alt={node.featuredImage.altText || "Product image"}
                    className="product-image"
                    style={{
                      maxWidth: "200px",
                      height: "auto",
                      borderRadius: "8px",
                    }}
                  />
                )}
              </BlockStack>
            </Card>
          ))
        ) : (
          <Text>No products found.</Text>
        )}
      </BlockStack>

      <div className="custom_cls">this is only for testing</div>
    </Page>
  );
}
