"""
Dashboard Page Object.
"""
from selenium.webdriver.common.by import By
from pages.base_page import BasePage


class DashboardPage(BasePage):
    # Locators
    USER_MENU = (By.CSS_SELECTOR, '[data-testid="user-menu"], .user-menu, button[aria-label="User menu"]')
    LOGOUT_BUTTON = (By.XPATH, '//button[contains(text(), "Logout") or contains(text(), "Sign out")]')
    METRIC_CARDS = (By.CSS_SELECTOR, '.metric-card, .stat-card, [data-testid="metric"]')
    RECENT_ORDERS_TABLE = (By.CSS_SELECTOR, '.recent-orders table, [data-testid="recent-orders"] tbody')
    LOW_STOCK_ALERTS = (By.CSS_SELECTOR, '.low-stock-alert, [data-testid="low-stock"]')
    REVENUE_CHART = (By.CSS_SELECTOR, 'canvas, .revenue-chart, [data-testid="revenue-chart"]')
    NAV_INVENTORY = (By.CSS_SELECTOR, 'a[href="/inventory"], button:contains("Inventory")')
    NAV_ORDERS = (By.CSS_SELECTOR, 'a[href="/orders"], button:contains("Orders")')
    NAV_COURIER = (By.CSS_SELECTOR, 'a[href="/courier"], button:contains("Courier")')
    MOBILE_MENU_BUTTON = (By.CSS_SELECTOR, '.mobile-menu-btn, .hamburger, [aria-label="Menu"]')
    
    def __init__(self, driver, base_url=None):
        from conftest import BASE_URL
        super().__init__(driver, base_url or BASE_URL)
    
    def open(self):
        return super().open('/dashboard')
    
    def logout(self):
        try:
            self.click(self.USER_MENU)
            self.click(self.LOGOUT_BUTTON)
            self.wait_for_url_contains('/login')
        except:
            self.driver.get(f'{self.base_url}/logout')
            self.wait_for_url_contains('/login')
        return self
    
    def get_metric_cards_count(self):
        return len(self.find_all(self.METRIC_CARDS))
    
    def get_metric_names(self):
        cards = self.find_all(self.METRIC_CARDS)
        names = []
        for card in cards:
            text = card.text
            for metric in ['Orders', 'Revenue', 'Products', 'Customers']:
                if metric in text:
                    names.append(metric)
        return names
    
    def has_recent_orders(self):
        return self.is_visible(self.RECENT_ORDERS_TABLE)
    
    def has_low_stock_alerts(self):
        return len(self.find_all(self.LOW_STOCK_ALERTS)) > 0
    
    def has_revenue_chart(self):
        return self.is_visible(self.REVENUE_CHART)
    
    def navigate_to_inventory(self):
        self.click(self.NAV_INVENTORY)
        from pages.inventory_page import InventoryPage
        return InventoryPage(self.driver, self.base_url)
    
    def navigate_to_orders(self):
        self.click(self.NAV_ORDERS)
        from pages.orders_page import OrdersPage
        return OrdersPage(self.driver, self.base_url)
    
    def navigate_to_courier(self):
        self.click(self.NAV_COURIER)
        from pages.courier_page import CourierPage
        return CourierPage(self.driver, self.base_url)
    
    def is_mobile_view(self):
        return self.is_visible(self.MOBILE_MENU_BUTTON, timeout=2)
    
    def get_user_info(self):
        try:
            user_elements = self.find_all(self.USER_MENU)
            return [el.text for el in user_elements if el.text.strip()]
        except:
            return []