"""
Order Detail Modal Page Object.
"""
from selenium.webdriver.common.by import By
from pages.base_page import BasePage


class OrderDetailModal(BasePage):
    MODAL = (By.CSS_SELECTOR, '[role="dialog"], .modal, .order-detail')
    ORDER_NUMBER = (By.XPATH, '//div[contains(text(), "Order") or contains(text(), "BP-")]')
    CLOSE_BUTTON = (By.CSS_SELECTOR, 'button[aria-label="Close"], .close-btn')
    
    def __init__(self, driver, base_url=None):
        from conftest import BASE_URL
        super().__init__(driver, base_url or BASE_URL)
    
    def wait_for_modal(self):
        self.find_visible(self.MODAL)
        return self
    
    def get_order_number(self):
        return self.get_text(self.ORDER_NUMBER)
    
    def close(self):
        self.click(self.CLOSE_BUTTON)
        self.wait_for_staleness(self.find_visible(self.MODAL))
        return self