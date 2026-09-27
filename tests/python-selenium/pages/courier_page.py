"""
Courier Page Object.
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from pages.base_page import BasePage


class CourierPage(BasePage):
    # Locators
    BOOK_COURIER_BUTTON = (By.XPATH, '//button[contains(text(), "Book Courier")]')
    TEST_AUTH_BUTTON = (By.XPATH, '//button[contains(text(), "Test Pathao Auth")]')
    FETCH_STORES_BUTTON = (By.XPATH, '//button[contains(text(), "Fetch Stores")]')
    CREATE_TEST_ORDER_BUTTON = (By.XPATH, '//button[contains(text(), "Create Test Order")]')
    PROVIDER_SELECT = (By.CSS_SELECTOR, '[data-testid="provider-select"], select[name="provider"], .provider-dropdown')
    BOOKINGS_TABLE = (By.CSS_SELECTOR, 'tbody tr, .booking-row')
    TRACKING_CELLS = (By.CSS_SELECTOR, 'td[data-tracking], .tracking-id')
    TRACK_BUTTONS = (By.XPATH, '//button[contains(text(), "Track")]')
    TABLE_HEADERS = (By.CSS_SELECTOR, 'th')
    
    def __init__(self, driver, base_url=None):
        from conftest import BASE_URL
        super().__init__(driver, base_url or BASE_URL)
    
    def open(self):
        return super().open('/courier')
    
    def click_book_courier(self):
        self.click(self.BOOK_COURIER_BUTTON)
        from pages.courier_booking_modal import CourierBookingModal
        return CourierBookingModal(self.driver, self.base_url)
    
    def test_pathao_auth(self):
        self.click(self.TEST_AUTH_BUTTON)
        self.driver.implicitly_wait(3)
        return self.get_toast_message()
    
    def fetch_stores(self):
        self.click(self.FETCH_STORES_BUTTON)
        self.driver.implicitly_wait(3)
        return self.get_toast_message()
    
    def create_test_order(self):
        self.click(self.CREATE_TEST_ORDER_BUTTON)
        self.driver.implicitly_wait(5)
        return self.get_toast_message()
    
    def get_providers(self):
        options = self.find_all((By.CSS_SELECTOR, 'option'))
        return [opt.text for opt in options if opt.text.strip()]
    
    def has_pathao_provider(self):
        return len(self.find_all((By.XPATH, '//option[contains(text(), "Pathao")]'))) > 0
    
    def get_booking_count(self):
        return len(self.find_all(self.BOOKINGS_TABLE))
    
    def get_booking_tracking_ids(self):
        cells = self.find_all(self.TRACKING_CELLS)
        return [cell.text for cell in cells]
    
    def click_track_first(self):
        track_btns = self.find_all(self.TRACK_BUTTONS)
        if track_btns:
            track_btns[0].click()
            from pages.tracking_modal import TrackingModal
            return TrackingModal(self.driver, self.base_url)
        return None
    
    def get_table_headers(self):
        headers = self.find_all(self.TABLE_HEADERS)
        return [h.text for h in headers]
    
    def find_booking_row(self, tracking_id):
        return self.find((By.XPATH, f'//tr[contains(., "{tracking_id}")]'))