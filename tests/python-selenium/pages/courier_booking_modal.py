"""
Courier Booking Modal Page Object.
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from pages.base_page import BasePage


class CourierBookingModal(BasePage):
    MODAL = (By.CSS_SELECTOR, '[role="dialog"], .modal, .booking-modal')
    PROVIDER_SELECT = (By.NAME, 'provider')
    STORE_SELECT = (By.NAME, 'store_id')
    ORDER_SELECT = (By.NAME, 'order_id')
    RECIPIENT_NAME = (By.NAME, 'recipient_name')
    RECIPIENT_PHONE = (By.NAME, 'recipient_phone')
    RECIPIENT_ADDRESS = (By.NAME, 'recipient_address')
    RECIPIENT_CITY = (By.NAME, 'recipient_city')
    RECIPIENT_ZONE = (By.NAME, 'recipient_zone')
    RECIPIENT_AREA = (By.NAME, 'recipient_area')
    WEIGHT_INPUT = (By.NAME, 'weight')
    ITEM_DESCRIPTION = (By.NAME, 'item_description')
    COLLECTION_AMOUNT = (By.NAME, 'collection_amount')
    BOOK_BUTTON = (By.XPATH, '//button[contains(text(), "Book Now") or contains(text(), "Book")]')
    CANCEL_BUTTON = (By.XPATH, '//button[contains(text(), "Cancel")]')
    RECIPIENT_NAME_ERROR = (By.CSS_SELECTOR, 'input[name="recipient_name"]:invalid, [data-testid="recipient_name-error"]')
    
    def __init__(self, driver, base_url=None):
        from conftest import BASE_URL
        super().__init__(driver, base_url or BASE_URL)
    
    def wait_for_modal(self):
        self.find_visible(self.MODAL)
        return self
    
    def select_provider(self, provider):
        self.select_dropdown_option(self.PROVIDER_SELECT, provider)
        self.driver.implicitly_wait(1)
        return self
    
    def select_store(self, store_name):
        if self.is_visible(self.STORE_SELECT, timeout=2):
            self.select_dropdown_option(self.STORE_SELECT, store_name)
        return self
    
    def select_order(self, order_id):
        if self.is_visible(self.ORDER_SELECT, timeout=2):
            self.select_dropdown_option(self.ORDER_SELECT, order_id)
        return self
    
    def fill_recipient_details(self, name, phone, address, city, zone, area):
        self.fill(self.RECIPIENT_NAME, name)
        self.fill(self.RECIPIENT_PHONE, phone)
        self.fill(self.RECIPIENT_ADDRESS, address)
        self.fill(self.RECIPIENT_CITY, city)
        self.fill(self.RECIPIENT_ZONE, zone)
        self.fill(self.RECIPIENT_AREA, area)
        return self
    
    def fill_parcel_details(self, weight, description, collection_amount):
        self.fill(self.WEIGHT_INPUT, str(weight))
        self.fill(self.ITEM_DESCRIPTION, description)
        self.fill(self.COLLECTION_AMOUNT, str(collection_amount))
        return self
    
    def book(self):
        self.click(self.BOOK_BUTTON)
        self.wait_for_staleness(self.find_visible(self.MODAL))
        return self.get_toast_message()
    
    def book_expecting_failure(self):
        self.click(self.BOOK_BUTTON)
        self.driver.implicitly_wait(3)
        return self.get_toast_message()
    
    def cancel(self):
        self.click(self.CANCEL_BUTTON)
        self.wait_for_staleness(self.find_visible(self.MODAL))
        return self
    
    def has_validation_error(self, field_name):
        error_locator = (By.CSS_SELECTOR, f'input[name="{field_name}"]:invalid, [data-testid="{field_name}-error"]')
        return self.is_visible(error_locator, timeout=2)
    
    def get_phone_value(self):
        field = self.find_visible(self.RECIPIENT_PHONE)
        return field.get_attribute('value')