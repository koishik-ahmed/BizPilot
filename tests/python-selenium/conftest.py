"""
Pytest configuration and fixtures for BizPilot Selenium tests.
"""
import os
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', 'backend', '.env'))

BASE_URL = os.getenv('FRONTEND_URL', 'http://localhost:3002')
API_BASE_URL = os.getenv('API_URL', 'http://localhost:5000/api')

DEMO_USER = {
    'email': 'demo@bizpilot.com',
    'password': 'password123'
}


@pytest.fixture(scope='session')
def driver():
    """Create a Chrome WebDriver instance for the test session."""
    chrome_options = Options()
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--window-size=1920,1080')
    # chrome_options.add_argument('--headless')  # Uncomment for headless mode
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.implicitly_wait(5)
    
    yield driver
    
    driver.quit()


@pytest.fixture(scope='function')
def logged_in_driver(driver):
    """Login and return authenticated driver."""
    login_page = LoginPage(driver)
    login_page.open()
    login_page.login(DEMO_USER['email'], DEMO_USER['password'])
    yield driver
    # Optional: logout after test
    try:
        dashboard_page = DashboardPage(driver)
        dashboard_page.logout()
    except:
        pass


@pytest.fixture
def api_headers():
    """Get API headers with JWT token."""
    import requests
    response = requests.post(
        f'{API_BASE_URL}/auth/login',
        json=DEMO_USER,
        timeout=10
    )
    token = response.json().get('token')
    return {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}


# Page Object imports for easy access in tests
from pages.login_page import LoginPage
from pages.dashboard_page import DashboardPage
from pages.inventory_page import InventoryPage
from pages.orders_page import OrdersPage
from pages.courier_page import CourierPage
from pages.courier_booking_modal import CourierBookingModal
from pages.products_page import ProductsPage

__all__ = [
    'driver',
    'logged_in_driver',
    'api_headers',
    'BASE_URL',
    'API_BASE_URL',
    'DEMO_USER',
    'LoginPage',
    'DashboardPage',
    'InventoryPage',
    'OrdersPage',
    'CourierPage',
    'CourierBookingModal',
    'ProductsPage',
]