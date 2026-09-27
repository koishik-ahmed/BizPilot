"""
Add Order Modal Page Object.
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from pages.base_page import BasePage


class AddOrderModal(BasePage):
    MODAL = (By.CSS_SELECTOR, '[role="dialog"], .modal')
    CUSTOMER_SELECT = (By.NAME, 'customer_id')
    ADD_PRODUCT_BUTTON = (By.CSS_SELECTOR, 'button:contains("Add Product"), .add-product-btn')
    PRODUCT_SELECT = (By.NAME, 'product_id')
    QUANTITY_INPUT = (By.NAME, 'quantity')
    CREATE_BUTTON = (By.XPATH, '//button[contains(text(), "Create Order")]')
    CANCEL_BUTTON = (By.XPATH, '//button[contains(text(), "Cancel")]')
    
    def __init__(self, driver, base_url=None):
        from conftest import BASE_URL
        super().__init__(driver, base_url or BASE_URL)
    
    def wait_for_modal(self):
        self.find_visible(self.MODAL)
        return self
    
    def select_customer(self, customer_name):
        self.select_dropdown_option(self.CUSTOMER_SELECT, customer_name)
        return self
    
    def add_product(self, product_name, quantity):
        self.click(self.ADD_PRODUCT_BUTTON)
        self.driver.implicitly_wait(1)
        self.select_dropdown_option(self.PRODUCT_SELECT, product_name)
        self.fill(self.QUANTITY_INPUT, str(quantity))
        return self
    
    def create(self):
        self.click(self.CREATE_BUTTON)
        self.wait_for_staleness(self.find_visible(self.MODAL))
        return self.get_toast_message()
    
    def cancel(self):
        self.click(self.CANCEL_BUTTON)
        self.wait_for_staleness(self.find_visible(self.MODAL))
        return self