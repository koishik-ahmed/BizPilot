"""
Tracking Modal Page Object.
"""
from selenium.webdriver.common.by import By
from pages.base_page import BasePage


class TrackingModal(BasePage):
    MODAL = (By.CSS_SELECTOR, '[role="dialog"], .modal, .tracking-modal')
    TIMELINE_ITEMS = (By.CSS_SELECTOR, '.timeline-item, .tracking-event, .status-history')
    CLOSE_BUTTON = (By.CSS_SELECTOR, 'button[aria-label="Close"], .close-btn')
    
    def __init__(self, driver, base_url=None):
        from conftest import BASE_URL
        super().__init__(driver, base_url or BASE_URL)
    
    def wait_for_modal(self):
        self.find_visible(self.MODAL)
        return self
    
    def get_timeline_count(self):
        return len(self.find_all(self.TIMELINE_ITEMS))
    
    def get_timeline_events(self):
        items = self.find_all(self.TIMELINE_ITEMS)
        return [item.text for item in items]
    
    def close(self):
        self.click(self.CLOSE_BUTTON)
        self.wait_for_staleness(self.find_visible(self.MODAL))
        return self