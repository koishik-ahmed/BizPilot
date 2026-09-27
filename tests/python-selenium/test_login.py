"""
Authentication Tests - Login & Registration
"""
import pytest
import time
from pages.login_page import LoginPage
from pages.register_page import RegisterPage
from pages.dashboard_page import DashboardPage


class TestLogin:
    """TC-LOGIN: Login functionality tests"""
    
    def test_valid_login(self, logged_in_driver):
        """TC-LOGIN-001: Should login with valid demo credentials"""
        dashboard = DashboardPage(logged_in_driver)
        assert '/dashboard' in logged_in_driver.current_url
        assert dashboard.get_metric_cards_count() >= 4
    
    def test_invalid_credentials(self, driver):
        """TC-LOGIN-002: Should show error with invalid credentials"""
        login_page = LoginPage(driver)
        login_page.open()
        login_page.login_expecting_failure('invalid@test.com', 'wrongpassword')
        
        error = login_page.get_error_message()
        assert error is not None
        assert any(word in error.lower() for word in ['invalid', 'error', 'incorrect', 'failed'])
    
    def test_empty_fields_validation(self, driver):
        """TC-LOGIN-003: Should show validation errors for empty fields"""
        login_page = LoginPage(driver)
        login_page.open()
        login_page.click(login_page.SUBMIT_BUTTON)
        
        # Check HTML5 validation
        email_invalid = login_page.is_visible((login_page.EMAIL_INPUT[0], f'{login_page.EMAIL_INPUT[1]}:invalid'))
        password_invalid = login_page.is_visible((login_page.PASSWORD_INPUT[0], f'{login_page.PASSWORD_INPUT[1]}:invalid'))
        
        assert email_invalid or password_invalid
    
    def test_protected_route_redirect(self, driver):
        """TC-LOGIN-004: Should redirect to login when accessing protected route"""
        driver.get(f'{driver.base_url}/inventory')
        login_page = LoginPage(driver)
        login_page.wait_for_url_contains('/login')
        assert '/login' in driver.current_url
    
    def test_logout(self, logged_in_driver):
        """TC-LOGIN-005: Should logout successfully"""
        dashboard = DashboardPage(logged_in_driver)
        dashboard.logout()
        assert '/login' in logged_in_driver.current_url


class TestRegistration:
    """TC-REG: Registration functionality tests"""
    
    def test_register_new_user(self, driver):
        """TC-REG-001: Should register new user successfully"""
        login_page = LoginPage(driver)
        login_page.open()
        register_page = login_page.go_to_register()
        
        test_email = f'test{int(time.time())}@bizpilot.com'
        register_page.register(
            name='Test User',
            email=test_email,
            password='TestPass123!',
            confirm_password='TestPass123!',
            business_name='Test Business',
            phone='+8801712345678'
        )
        
        assert '/dashboard' in driver.current_url
    
    def test_duplicate_email_error(self, driver):
        """TC-REG-002: Should show error for duplicate email"""
        login_page = LoginPage(driver)
        login_page.open()
        register_page = login_page.go_to_register()
        
        register_page.register_expecting_failure(
            name='Test User',
            email='demo@bizpilot.com',  # Existing email
            password='TestPass123!',
            confirm_password='TestPass123!',
            business_name='Test Business',
            phone='+8801712345678'
        )
        
        error = register_page.get_error_message()
        assert error is not None
        assert any(word in error.lower() for word in ['exist', 'already', 'duplicate'])
    
    def test_password_mismatch_validation(self, driver):
        """TC-REG-003: Should validate password confirmation mismatch"""
        login_page = LoginPage(driver)
        login_page.open()
        register_page = login_page.go_to_register()
        
        register_page.register_expecting_failure(
            name='Test User',
            email=f'test{int(time.time())}@bizpilot.com',
            password='TestPass123!',
            confirm_password='DifferentPass123!',
            business_name='Test Business',
            phone='+8801712345678'
        )
        
        error = register_page.get_error_message()
        assert error is not None
        assert any(word in error.lower() for word in ['match', 'confirm', 'mismatch'])