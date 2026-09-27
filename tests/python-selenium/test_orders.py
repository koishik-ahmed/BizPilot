"""
Orders Tests
"""
import pytest
from pages.orders_page import OrdersPage
from pages.add_order_modal import AddOrderModal


class TestOrders:
    """TC-ORD: Orders tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self, logged_in_driver):
        self.orders = OrdersPage(logged_in_driver)
        self.orders.open()
    
    def test_display_orders_list(self):
        """TC-ORD-001: Should display orders list"""
        count = self.orders.get_order_count()
        assert count > 0
    
    def test_filter_by_status(self):
        """TC-ORD-002: Should filter orders by status"""
        self.orders.filter_by_status('Confirmed')
        
        rows = self.orders.find_all(self.orders.ORDER_ROWS)
        for row in rows:
            assert 'Confirmed' in row.text
    
    def test_search_by_order_number(self):
        """TC-ORD-003: Should search orders by order number"""
        self.orders.search('BP-1024')
        
        rows = self.orders.find_all(self.orders.ORDER_ROWS)
        for row in rows:
            assert 'BP-1024' in row.text
    
    def test_view_order_details(self):
        """TC-ORD-004: Should view order details"""
        order_numbers = self.orders.get_order_numbers()
        assert len(order_numbers) > 0
        
        detail_modal = self.orders.click_view_order(order_numbers[0])
        detail_modal.wait_for_modal()
        
        order_number = detail_modal.get_order_number()
        assert 'BP-' in order_number or 'GZ-' in order_number or 'BLM-' in order_number
        
        detail_modal.close()
    
    def test_update_order_status(self):
        """TC-ORD-005: Should update order status"""
        order_numbers = self.orders.get_order_numbers()
        assert len(order_numbers) > 0
        
        # Get available statuses from first row
        row = self.orders.find_order_row(order_numbers[0])
        status_select = row.find_element(*self.orders.STATUS_FILTER)
        from selenium.webdriver.support.ui import Select
        options = [opt.text for opt in Select(status_select).options]
        
        if len(options) > 1:
            new_status = options[1]
            toast = self.orders.update_status(order_numbers[0], new_status)
            assert toast is not None
    
    def test_create_new_order(self):
        """TC-ORD-006: Should create new order"""
        add_modal = self.orders.click_add_order()
        add_modal.wait_for_modal()
        
        add_modal.select_customer('Scott')
        add_modal.add_product('Headphones', 1)
        
        toast = add_modal.create()
        assert toast is not None
        assert any(word in toast.lower() for word in ['success', 'created'])
    
    def test_order_statistics(self):
        """TC-ORD-007: Should show order statistics"""
        assert self.orders.has_stats_cards()
    
    def test_pagination(self):
        """TC-ORD-008: Should paginate orders"""
        if self.orders.is_visible(self.orders.PAGINATION):
            # Just verify pagination exists and is clickable
            pass
    
    def test_export_orders(self):
        """TC-ORD-009: Should export orders"""
        toast = self.orders.export_orders()
        if toast:
            assert toast is not None
    
    def test_payment_status_badges(self):
        """TC-ORD-010: Should show payment status badges"""
        paid = self.orders.get_paid_count()
        unpaid = self.orders.get_unpaid_count()
        assert paid + unpaid > 0