"""
Products Page Object (Add/Edit Product Modal).
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from pages.base_page import BasePage


class ProductsPage(BasePage):
    # Modal locators
    MODAL = (By.CSS_SELECTOR, '[role="dialog"], .modal, .product-modal')
    MODAL_TITLE = (By.XPATH, '//h2[contains(text(), "Add Product") or contains(text(), "New Product") or contains(text(), "Edit Product")]')
    NAME_INPUT = (By.NAME, 'name')
    SKU_INPUT = (By.NAME, 'sku')
    CATEGORY_SELECT = (By.NAME, 'category')
    DESCRIPTION_INPUT = (By.NAME, 'description')
    COST_PRICE_INPUT = (By.NAME, 'cost_price')
    SELLING_PRICE_INPUT = (By.NAME, 'selling_price')
    STOCK_INPUT = (By.NAME, 'stock')
    LOW_STOCK_THRESHOLD_INPUT = (By.NAME, 'low_stock_threshold')
    IMAGE_INPUT = (By.CSS_SELECTOR, 'input[type="file"]')
    SAVE_BUTTON = (By.XPATH, '//button[contains(text(), "Save") or contains(text(), "Create") or contains(text(), "Update")]')
    CANCEL_BUTTON = (By.XPATH, '//button[contains(text(), "Cancel")]')
    NAME_ERROR = (By.CSS_SELECTOR, 'input[name="name"]:invalid, [data-testid="name-error"]')
    
    def __init__(self, driver, base_url=None, modal=False):
        from conftest import BASE_URL
        super().__init__(driver, base_url or BASE_URL)
        self.modal = modal
    
    def open(self):
        if not self.modal:
            return super().open('/inventory')
        return self
    
    def wait_for_modal(self):
        self.find_visible(self.MODAL)
        return self
    
    def fill_product_form(self, name, sku, category, description, cost_price, selling_price, stock, low_stock_threshold):
        self.fill(self.NAME_INPUT, name)
        self.fill(self.SKU_INPUT, sku)
        self.select_dropdown_option(self.CATEGORY_SELECT, category)
        self.fill(self.DESCRIPTION_INPUT, description)
        self.fill(self.COST_PRICE_INPUT, str(cost_price))
        self.fill(self.SELLING_PRICE_INPUT, str(selling_price))
        self.fill(self.STOCK_INPUT, str(stock))
        self.fill(self.LOW_STOCK_THRESHOLD_INPUT, str(low_stock_threshold))
        return self
    
    def upload_image(self, file_path):
        self.upload_file(self.IMAGE_INPUT, file_path)
        return self
    
    def save(self):
        self.click(self.SAVE_BUTTON)
        self.wait_for_staleness(self.find_visible(self.MODAL))
        return self
    
    def cancel(self):
        self.click(self.CANCEL_BUTTON)
        self.wait_for_staleness(self.find_visible(self.MODAL))
        return self
    
    def get_toast_message(self):
        return super().get_toast_message()
    
    def has_validation_error(self, field_name):
        error_locator = (By.CSS_SELECTOR, f'input[name="{field_name}"]:invalid, [data-testid="{field_name}-error"]')
        return self.is_visible(error_locator, timeout=2)
    
    def get_field_value(self, field_name):
        field = self.find_visible((By.NAME, field_name))
        return field.get_attribute('value')