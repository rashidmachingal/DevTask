'use client';

import { useCallback, useMemo, useState } from 'react';
import { AppProvider, Frame } from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';
import TopBar from './TopBar';
import Navigation from './Navigation';
import ProductsPage from './ProductsPage';

export default function App() {
  const [mobileNavigationActive, setMobileNavigationActive] = useState(false);

  const toggleMobileNavigationActive = useCallback(
    () => setMobileNavigationActive((value) => !value),
    [],
  );

  const topBarMarkup = useMemo(
    () => <TopBar onNavigationToggle={toggleMobileNavigationActive} />,
    [toggleMobileNavigationActive],
  );

  const navigationMarkup = useMemo(() => <Navigation />, []);

  return (
    <AppProvider i18n={enTranslations}>
      <Frame
        navigation={navigationMarkup}
        topBar={topBarMarkup}
        showMobileNavigation={mobileNavigationActive}
        onNavigationDismiss={toggleMobileNavigationActive}
        skipToContentTarget="Products"
      >
        <ProductsPage />
      </Frame>
    </AppProvider>
  );
}

