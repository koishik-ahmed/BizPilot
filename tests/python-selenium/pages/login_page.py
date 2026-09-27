"""
Login Page Object.
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from pages.base_page import BasePage


class LoginPage(BasePage):
    # Locators
    EMAIL_INPUT = (By.NAME, 'email')
    PASSWORD_INPUT = (By.NAME, 'password')
    SUBMIT_BUTTON = (By.CSS_SELECTOR, 'button[type="submit"]')
    ERROR_MESSAGE = (By.CSS_SELECTOR, '.error-message, .alert-error, [data-testid="error"]')
    REGISTER_LINK = (By.CSS_SELECTOR, 'a[href="/register"]')
    
    def __init__(self, driver, base_url=None):
        from conftest import BASE_URL
        super().__init__(driver, base_url or BASE_URL)
    
    def open(self):
        return super().open('/login')
    
    def login(self, email, password):
        self.fill(self.EMAIL_INPUT, email)
        self.fill(self.PASSWORD_INPUT, password)
        self.click(self.SUBMIT_BUTTON)
        self.wait_for_url_contains('/dashboard')
        return self
    
    def login_expecting_failure(self, email, password):
        self.fill(self.EMAIL_INPUT, email)
        self.fill(self.PASSWORD_INPUT, password)
        self.click(self.SUBMIT_BUTTON)
        return self
    
    def get_error_message(self):
        try:
            return self.get_text(self.ERROR_MESSAGE)
        except:
            return None
    
    def go_to_register(self):
        self.click(self.REGISTER_LINK)
        from pages.register_page import RegisterPage
        return RegisterPage(self.driver, self.base_url)
    
    def is_on_login_page(self):
        return self.is_visible(self.EMAIL_INPUT) and self.is_visible(self.PASSWORD_INPUT)