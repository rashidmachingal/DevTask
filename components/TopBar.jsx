import { useCallback, useState } from 'react';
import {
  ActionList,
  Box,
  Card,
  Icon,
  Text,
  TopBar as PolarisTopBar,
  InlineStack,
} from '@shopify/polaris';
import {
  NotificationIcon,
  StoreIcon,
} from '@shopify/polaris-icons';

export default function TopBar({ onNavigationToggle }) {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [userMenuActive, setUserMenuActive] = useState(false);
  const [storeSwitcherActive, setStoreSwitcherActive] = useState(false);
  const [notificationMenuActive, setNotificationMenuActive] = useState(false);

  const handleSearchResultsDismiss = useCallback(() => {
    setIsSearchActive(false);
    setSearchValue('');
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearchValue(value);
    setIsSearchActive(value.length > 0);
  }, []);

  const toggleUserMenuActive = useCallback(
    () => setUserMenuActive((active) => !active),
    [],
  );

  const toggleStoreSwitcher = useCallback(
    () => setStoreSwitcherActive((active) => !active),
    [],
  );

  const toggleNotificationMenu = useCallback(
    () => setNotificationMenuActive((active) => !active),
    [],
  );

  const searchFieldMarkup = (
    <PolarisTopBar.SearchField
      value={searchValue}
      placeholder="Search"
      onChange={handleSearchChange}
      onCancel={handleSearchResultsDismiss}
      showFocusBorder
    />
  );

  const searchResultsMarkup = (
    <Card sectioned>
      <Text as="h3" variant="headingSm">
        Quick links
      </Text>
      <ActionList
        items={[
          { content: 'View products' },
          { content: 'Create collection' },
          { content: 'Manage inventory' },
        ]}
      />
    </Card>
  );

  // ============================
  //     USER MENU (Right Side)
  // ============================
  const userMenuMarkup = (
    <Box paddingInline="300">
      <PolarisTopBar.UserMenu
        actions={[
          {
            items: [{ content: 'View profile' }, { content: 'Log out' }],
          },
        ]}
        initials="A"
        name="Rashid M"
        detail="ABC Company"
        open={userMenuActive}
        onToggle={toggleUserMenuActive}
      />
    </Box>
  );

  // ============================
  //     STORE SWITCHER (Left)
  // ============================
  const storeSwitcherMarkup = (
    <Box paddingInline="300">
      <PolarisTopBar.Menu
        activatorContent={
          <InlineStack align="center" gap="100">
            <Icon source={StoreIcon} />
            <Text as="span" fontWeight="medium">
              Rashid&apos;s Store
            </Text>
          </InlineStack>
        }
        open={storeSwitcherActive}
        onOpen={toggleStoreSwitcher}
        onClose={toggleStoreSwitcher}
        actions={[
          {
            items: [
              { content: 'Acme Outdoors', onAction: toggleStoreSwitcher },
              { content: 'Partners Demo', onAction: toggleStoreSwitcher },
            ],
          },
        ]}
        accessibilityLabel="Store switcher"
      />
    </Box>
  );

  // ============================
  // NOTIFICATIONS (Right side)
  // ============================
  const notificationsMenuMarkup = (
    <Box paddingInline="0">
      <PolarisTopBar.Menu
        activatorContent={<Icon source={NotificationIcon} />}
        open={notificationMenuActive}
        onOpen={toggleNotificationMenu}
        onClose={toggleNotificationMenu}
        actions={[
          {
            items: [
              { content: 'View notifications', onAction: toggleNotificationMenu },
              { content: 'Notification settings', onAction: toggleNotificationMenu },
            ],
          },
        ]}
        accessibilityLabel="Notifications"
      />
    </Box>
  );

  return (
    <PolarisTopBar
      showNavigationToggle
      userMenu={userMenuMarkup}
      contextControl={storeSwitcherMarkup}
      secondaryMenu={notificationsMenuMarkup}
      searchField={searchFieldMarkup}
      searchResults={searchResultsMarkup}
      searchResultsVisible={isSearchActive}
      onSearchResultsDismiss={handleSearchResultsDismiss}
      onNavigationToggle={onNavigationToggle}
    />
  );
}
