"""
Register Page Object.
"""
from selenium.webdriver.common.by import By
from pages.base_page import BasePage


class RegisterPage(BasePage):
    # Locators
    NAME_INPUT = (By.NAME, 'name')
    EMAIL_INPUT = (By.NAME, 'email')
    PASSWORD_INPUT = (By.NAME, 'password')
    CONFIRM_PASSWORD_INPUT = (By.NAME, 'confirmPassword')
    BUSINESS_NAME_INPUT = (By.NAME, 'business_name')
    PHONE_INPUT = (By.NAME, 'phone')
    SUBMIT_BUTTON = (By.CSS_SELECTOR, 'button[type="submit"]')
    ERROR_MESSAGE = (By.CSS_SELECTOR, '.error-message, .alert-error, [data-testid="error"]')
    LOGIN_LINK = (By.CSS_SELECTOR, 'a[href="/login"]')
    
    def __init__(self, driver, base_url=None):
        from conftest import BASE_URL
        super().__init__(driver, base_url or BASE_URL)
    
    def open(self):
        return super().open('/register')
    
    def register(self, name, email, password, confirm_password, business_name, phone):
        self.fill(self.NAME_INPUT, name)
        self.fill(self.EMAIL_INPUT, email)
        self.fill(self.PASSWORD_INPUT, password)
        self.fill(self.CONFIRM_PASSWORD_INPUT, confirm_password)
        self.fill(self.BUSINESS_NAME_INPUT, business_name)
        self.fill(self.PHONE_INPUT, phone)
        self.click(self.SUBMIT_BUTTON)
        self.wait_for_url_contains('/dashboard')
        return self
    
    def register_expecting_failure(self, name, email, password, confirm_password, business_name, phone):
        self.fill(self.NAME_INPUT, name)
        self.fill(self.EMAIL_INPUT, email)
        self.fill(self.PASSWORD_INPUT, password)
        self.fill(self.CONFIRM_PASSWORD_INPUT, confirm_password)
        self.fill(self.BUSINESS_NAME_INPUT, business_name)
        self.fill(self.PHONE_INPUT, phone)
        self.click(self.SUBMIT_BUTTON)
        return self
    
    def get_error_message(self):
        try:
            return self.get_text(self.ERROR_MESSAGE)
        except:
            return None
    
    def go_to_login(self):
        self.click(self.LOGIN_LINK)
        from pages.login_page import LoginPage
        return LoginPage(self.driver, self.base_url)