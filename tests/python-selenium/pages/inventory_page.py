"""
Inventory Page Object.
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from pages.base_page import BasePage


class InventoryPage(BasePage):
    # Locators
    ADD_PRODUCT_BUTTON = (By.XPATH, '//button[contains(text(), "Add Product")]')
    PRODUCTS_TABLE = (By.CSS_SELECTOR, '[data-testid="products-table"], .products-table, table')
    PRODUCT_ROWS = (By.CSS_SELECTOR, 'tbody tr, .product-row')
    CATEGORY_FILTER = (By.NAME, 'categoryFilter')
    SEARCH_INPUT = (By.CSS_SELECTOR, 'input[placeholder*="search" i], input[name="search"], #search')
    PAGINATION = (By.CSS_SELECTOR, '.pagination, .page-numbers, nav[aria-label="pagination"]')
    NEXT_PAGE_BUTTON = (By.CSS_SELECTOR, 'button[aria-label="Next"], .next-page, a:contains("Next")')
    CURRENT_PAGE = (By.CSS_SELECTOR, '.current-page, .active-page, [aria-current="page"]')
    
    def __init__(self, driver, base_url=None):
        from conftest import BASE_URL
        super().__init__(driver, base_url or BASE_URL)
    
    def open(self):
        return super().open('/inventory')
    
    def click_add_product(self):
        self.click(self.ADD_PRODUCT_BUTTON)
        from pages.products_page import ProductsPage
        return ProductsPage(self.driver, self.base_url, modal=True)
    
    def get_product_count(self):
        return len(self.find_all(self.PRODUCT_ROWS))
    
    def get_product_names(self):
        rows = self.find_all(self.PRODUCT_ROWS)
        names = []
        for row in rows:
            text = row.text
            if text.strip():
                names.append(text.split('\n')[0])
        return names
    
    def find_product_row(self, product_name):
        return self.find((By.XPATH, f'//tr[contains(., "{product_name}")]'))
    
    def click_edit_product(self, product_name):
        row = self.find_product_row(product_name)
        edit_btn = row.find_element(By.CSS_SELECTOR, 'button[aria-label="Edit"], .edit-btn, button:contains("Edit")')
        edit_btn.click()
        from pages.products_page import ProductsPage
        return ProductsPage(self.driver, self.base_url, modal=True)
    
    def click_delete_product(self, product_name):
        row = self.find_product_row(product_name)
        delete_btn = row.find_element(By.CSS_SELECTOR, 'button[aria-label="Delete"], .delete-btn, button:contains("Delete")')
        delete_btn.click()
        return self
    
    def confirm_delete(self):
        self.click((By.XPATH, '//button[contains(text(), "Confirm") or contains(text(), "Delete")]'))
        return self
    
    def filter_by_category(self, category):
        self.select_dropdown_option(self.CATEGORY_FILTER, category)
        self.driver.implicitly_wait(1)
        return self
    
    def search(self, query):
        search_input = self.find_visible(self.SEARCH_INPUT)
        search_input.clear()
        search_input.send_keys(query)
        self.driver.implicitly_wait(1)
        return self
    
    def go_to_next_page(self):
        self.click(self.NEXT_PAGE_BUTTON)
        return self
    
    def get_current_page_number(self):
        try:
            return int(self.get_text(self.CURRENT_PAGE))
        except:
            return 1
    
    def has_pagination(self):
        return self.is_visible(self.PAGINATION)
    
    def get_low_stock_badges_count(self):
        badges = self.find_all((By.CSS_SELECTOR, '.low-stock, .badge-warning, [data-testid="low-stock"]'))
        return len(badges)