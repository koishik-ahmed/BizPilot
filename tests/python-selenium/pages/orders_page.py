"""
Orders Page Object.
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from pages.base_page import BasePage


class OrdersPage(BasePage):
    # Locators
    ORDERS_TABLE = (By.CSS_SELECTOR, '[data-testid="orders-table"], .orders-table, table')
    ORDER_ROWS = (By.CSS_SELECTOR, 'tbody tr, .order-row')
    ADD_ORDER_BUTTON = (By.XPATH, '//button[contains(text(), "Add Order")]')
    STATUS_FILTER = (By.NAME, 'statusFilter')
    SEARCH_INPUT = (By.CSS_SELECTOR, 'input[placeholder*="search" i], input[name="search"], #order-search')
    EXPORT_BUTTON = (By.CSS_SELECTOR, 'button:contains("Export"), .export-btn, [data-testid="export"]')
    PAGINATION = (By.CSS_SELECTOR, '.pagination, .page-numbers')
    STAT_CARDS = (By.CSS_SELECTOR, '.stat-card, .metric-card, [data-testid="order-stats"]')
    PAYMENT_PAID_BADGES = (By.CSS_SELECTOR, '.badge-paid, .payment-paid, [data-payment="Paid"]')
    PAYMENT_UNPAID_BADGES = (By.CSS_SELECTOR, '.badge-unpaid, .payment-unpaid, [data-payment="Unpaid"]')
    
    def __init__(self, driver, base_url=None):
        from conftest import BASE_URL
        super().__init__(driver, base_url or BASE_URL)
    
    def open(self):
        return super().open('/orders')
    
    def click_add_order(self):
        self.click(self.ADD_ORDER_BUTTON)
        from pages.add_order_modal import AddOrderModal
        return AddOrderModal(self.driver, self.base_url)
    
    def get_order_count(self):
        return len(self.find_all(self.ORDER_ROWS))
    
    def get_order_numbers(self):
        rows = self.find_all(self.ORDER_ROWS)
        numbers = []
        for row in rows:
            text = row.text
            for part in text.split():
                if part.startswith('BP-') or part.startswith('GZ-') or part.startswith('BLM-'):
                    numbers.append(part)
                    break
        return numbers
    
    def find_order_row(self, order_number):
        return self.find((By.XPATH, f'//tr[contains(., "{order_number}")]'))
    
    def click_view_order(self, order_number):
        row = self.find_order_row(order_number)
        view_btn = row.find_element(By.CSS_SELECTOR, 'button[aria-label="View"], .view-btn, button:contains("View")')
        view_btn.click()
        from pages.order_detail_modal import OrderDetailModal
        return OrderDetailModal(self.driver, self.base_url)
    
    def filter_by_status(self, status):
        self.select_dropdown_option(self.STATUS_FILTER, status)
        self.driver.implicitly_wait(1)
        return self
    
    def search(self, query):
        search_input = self.find_visible(self.SEARCH_INPUT)
        search_input.clear()
        search_input.send_keys(query)
        self.driver.implicitly_wait(1)
        return self
    
    def update_status(self, order_number, new_status):
        row = self.find_order_row(order_number)
        status_select = row.find_element(By.CSS_SELECTOR, 'select[name="status"], .status-select')
        from selenium.webdriver.support.ui import Select
        Select(status_select).select_by_visible_text(new_status)
        self.driver.implicitly_wait(1)
        return self.get_toast_message()
    
    def export_orders(self):
        if self.is_visible(self.EXPORT_BUTTON):
            self.click(self.EXPORT_BUTTON)
            return self.get_toast_message()
        return None
    
    def get_paid_count(self):
        return len(self.find_all(self.PAYMENT_PAID_BADGES))
    
    def get_unpaid_count(self):
        return len(self.find_all(self.PAYMENT_UNPAID_BADGES))
    
    def has_stats_cards(self):
        return len(self.find_all(self.STAT_CARDS)) > 0