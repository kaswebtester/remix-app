// app/routes/_index.tsx
import { useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";

import {
  Page,
  Card,
  Button,
  BlockStack,
  Text,
  InlineStack,
} from "@shopify/polaris";

import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";

// Make sure you also import your custom widget.
// Adjust the relative path as needed:
import { ProductWidget } from "../components/ProductWidget";

export default function Index() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  // Define the generateProduct function to trigger your fetcher action.
  const generateProduct = () =>
    fetcher.submit({}, { method: "POST" });

  // Optionally, use an effect when product is generated (if data is returned).
  useEffect(() => {
    if (fetcher.data?.product) {
      // Example: Toast notification using app bridge (if available)
      shopify.toast && shopify.toast.show("Product created");
    }
  }, [fetcher.data, shopify]);

  return (
    <Page>
      <TitleBar title="Remix app template">
        <button variant="primary" onClick={generateProduct}>
          Generate a product
        </button>
      </TitleBar>

      <BlockStack>
        <ProductWidget
          title="Demo Product"
          price="29.99"
          onClick={() => alert("Clicked")}
        />
      </BlockStack>
    </Page>
  );
}
