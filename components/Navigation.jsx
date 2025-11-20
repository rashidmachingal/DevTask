import { Navigation as PolarisNavigation } from '@shopify/polaris';
import { ProductIcon } from '@shopify/polaris-icons';

const navigationItems = [
  { label: 'Products', icon: ProductIcon, url: '/products', selected: true },
];

export default function Navigation() {
  return (
    <PolarisNavigation location="/products">
      <PolarisNavigation.Section
        items={navigationItems}
      />
    </PolarisNavigation>
  );
}
