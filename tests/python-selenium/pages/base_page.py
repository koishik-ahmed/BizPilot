"""
Base Page Object class with common functionality.
"""
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException


class BasePage:
    def __init__(self, driver, base_url):
        self.driver = driver
        self.base_url = base_url
        self.wait = WebDriverWait(driver, 10)
    
    def open(self, path=''):
        self.driver.get(f'{self.base_url}{path}')
        return self
    
    def find(self, locator, timeout=10):
        return WebDriverWait(self.driver, timeout).until(
            EC.presence_of_element_located(locator)
        )
    
    def find_visible(self, locator, timeout=10):
        return WebDriverWait(self.driver, timeout).until(
            EC.visibility_of_element_located(locator)
        )
    
    def find_clickable(self, locator, timeout=10):
        return WebDriverWait(self.driver, timeout).until(
            EC.element_to_be_clickable(locator)
        )
    
    def find_all(self, locator, timeout=10):
        return WebDriverWait(self.driver, timeout).until(
            EC.presence_of_all_elements_located(locator)
        )
    
    def click(self, locator):
        element = self.find_clickable(locator)
        element.click()
        return element
    
    def fill(self, locator, text, clear=True):
        element = self.find_visible(locator)
        if clear:
            element.clear()
        element.send_keys(text)
        return element
    
    def get_text(self, locator):
        return self.find_visible(locator).text
    
    def is_visible(self, locator, timeout=5):
        try:
            self.find_visible(locator, timeout)
            return True
        except TimeoutException:
            return False
    
    def wait_for_url_contains(self, fragment, timeout=10):
        self.wait.until(EC.url_contains(fragment))
        return self
    
    def wait_for_staleness(self, element, timeout=10):
        self.wait.until(EC.staleness_of(element))
        return self
    
    def get_toast_message(self, timeout=3):
        """Try to get toast/notification message."""
        toast_locators = [
            (By.CSS_SELECTOR, '.toast'),
            (By.CSS_SELECTOR, '.alert'),
            (By.CSS_SELECTOR, '[role="alert"]'),
            (By.CSS_SELECTOR, '.notification'),
            (By.CSS_SELECTOR, '.toast-message'),
        ]
        for locator in toast_locators:
            try:
                element = WebDriverWait(self.driver, timeout).until(
                    EC.visibility_of_element_located(locator)
                )
                return element.text
            except TimeoutException:
                continue
        return None
    
    def select_dropdown_option(self, select_locator, option_text):
        """Select option from dropdown by visible text."""
        from selenium.webdriver.support.ui import Select
        select_element = self.find_visible(select_locator)
        select = Select(select_element)
        select.select_by_visible_text(option_text)
        return self
    
    def select_dropdown_by_value(self, select_locator, value):
        from selenium.webdriver.support.ui import Select
        select_element = self.find_visible(select_locator)
        select = Select(select_element)
        select.select_by_value(value)
        return self
    
    def upload_file(self, file_input_locator, file_path):
        file_input = self.find_visible(file_input_locator)
        file_input.send_keys(file_path)
        return self