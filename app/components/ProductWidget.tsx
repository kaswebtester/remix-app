// app/components/ProductWidget.tsx
import { Card, Text, InlineStack, Button, BlockStack } from "@shopify/polaris";

interface ProductWidgetProps {
  title: string;
  price: string;
  onClick?: () => void;
}

export function ProductWidget({ title, price, onClick }: ProductWidgetProps) {
  return (
    <Card>
      <BlockStack gap="400">
        <Text variant="headingMd" as="h2">
          {title}
        </Text>
        <Text>${price}</Text>
        {onClick && (
          <InlineStack>
            <Button variant="primary" onClick={onClick}>
              View Details
            </Button>
          </InlineStack>
        )}
      </BlockStack>
    </Card>
  );
}
