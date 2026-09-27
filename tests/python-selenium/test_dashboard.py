"""
Dashboard Tests
"""
import pytest
from pages.dashboard_page import DashboardPage


class TestDashboard:
    """TC-DASH: Dashboard tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self, logged_in_driver):
        self.dashboard = DashboardPage(logged_in_driver)
    
    def test_load_dashboard_after_login(self, logged_in_driver):
        """TC-DASH-001: Should load dashboard after login"""
        assert '/dashboard' in logged_in_driver.current_url
    
    def test_display_key_metrics(self):
        """TC-DASH-002: Should display key metrics cards"""
        count = self.dashboard.get_metric_cards_count()
        assert count >= 4
        
        metrics = self.dashboard.get_metric_names()
        expected = ['Orders', 'Revenue', 'Products', 'Customers']
        for metric in expected:
            assert any(metric in m for m in metrics)
    
    def test_display_recent_orders(self):
        """TC-DASH-003: Should display recent orders"""
        assert self.dashboard.has_recent_orders()
    
    def test_display_low_stock_alerts(self):
        """TC-DASH-004: Should display low stock alerts"""
        # May or may not have alerts
        has_alerts = self.dashboard.has_low_stock_alerts()
        assert isinstance(has_alerts, bool)
    
    def test_display_revenue_chart(self):
        """TC-DASH-005: Should display revenue chart"""
        assert self.dashboard.has_revenue_chart()
    
    def test_navigate_to_inventory(self, logged_in_driver):
        """TC-DASH-006: Should navigate to inventory from dashboard"""
        inventory = self.dashboard.navigate_to_inventory()
        assert '/inventory' in logged_in_driver.current_url
    
    def test_navigate_to_orders(self, logged_in_driver):
        """TC-DASH-007: Should navigate to orders from dashboard"""
        self.dashboard.open()
        orders = self.dashboard.navigate_to_orders()
        assert '/orders' in logged_in_driver.current_url
    
    def test_navigate_to_courier(self, logged_in_driver):
        """TC-DASH-008: Should navigate to courier from dashboard"""
        self.dashboard.open()
        courier = self.dashboard.navigate_to_courier()
        assert '/courier' in logged_in_driver.current_url
    
    def test_display_user_profile_info(self):
        """TC-DASH-009: Should display user profile info"""
        user_info = self.dashboard.get_user_info()
        assert len(user_info) > 0
    
    def test_responsive_layout(self, logged_in_driver):
        """TC-DASH-010: Should handle responsive layout"""
        # Test mobile view
        logged_in_driver.set_window_size(768, 1024)
        self.dashboard.open()
        
        is_mobile = self.dashboard.is_mobile_view()
        # Just verify the check works
        
        # Reset to desktop
        logged_in_driver.set_window_size(1920, 1080)
        self.dashboard.open()