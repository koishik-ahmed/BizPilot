"""
Courier Booking Tests - Pathao Integration
"""
import pytest
import time
from pages.courier_page import CourierPage
from pages.courier_booking_modal import CourierBookingModal


class TestCourier:
    """TC-COUR: Courier booking tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self, logged_in_driver):
        self.courier = CourierPage(logged_in_driver)
        self.courier.open()
    
    def test_display_providers_including_pathao(self):
        """TC-COUR-001: Should display providers including Pathao"""
        providers = self.courier.get_providers()
        assert len(providers) > 0
        assert self.courier.has_pathao_provider()
    
    def test_open_booking_modal(self):
        """TC-COUR-002: Should open booking modal"""
        booking_modal = self.courier.click_book_courier()
        booking_modal.wait_for_modal()
        assert booking_modal.is_visible(booking_modal.MODAL)
    
    def test_pathao_authentication(self):
        """TC-COUR-003: Should test Pathao authentication"""
        toast = self.courier.test_pathao_auth()
        assert toast is not None
    
    def test_fetch_pathao_stores(self):
        """TC-COUR-004: Should fetch Pathao stores"""
        toast = self.courier.fetch_stores()
        assert toast is not None
    
    def test_create_test_order_mock(self):
        """TC-COUR-005: Should create test Pathao order (mock mode)"""
        toast = self.courier.create_test_order()
        assert toast is not None
        assert any(word in toast.lower() for word in ['success', 'created', 'order'])
    
    def test_book_courier_with_pathao(self):
        """TC-COUR-006: Should book courier with Pathao provider"""
        booking_modal = self.courier.click_book_courier()
        booking_modal.wait_for_modal()
        
        booking_modal.select_provider('Pathao')
        booking_modal.fill_recipient_details(
            name='Test Recipient',
            phone='01712345678',
            address='House 10, Road 5, Dhanmondi, Dhaka',
            city='Dhaka',
            zone='Dhanmondi',
            area='Dhanmondi'
        )
        booking_modal.fill_parcel_details(
            weight=0.5,
            description='Test parcel item',
            collection_amount=0
        )
        booking_modal.select_store('Main')
        
        toast = booking_modal.book()
        assert toast is not None
        assert any(word in toast.lower() for word in ['success', 'booked', 'created'])
        
        # Verify booking appears in list
        self.courier.open()
        # Check if recipient name appears in bookings
        rows = self.courier.find_all(self.courier.BOOKINGS_TABLE)
        found = any('Test Recipient' in row.text for row in rows)
        assert found
    
    def test_prevent_duplicate_booking(self):
        """TC-COUR-007: Should prevent duplicate booking for same order"""
        # This test requires an existing order that can be booked
        # We'll attempt to book and then try again
        
        booking_modal = self.courier.click_book_courier()
        booking_modal.wait_for_modal()
        
        # Check if order_id field exists
        if booking_modal.is_visible(booking_modal.ORDER_SELECT, timeout=2):
            booking_modal.select_provider('Pathao')
            booking_modal.select_order('1')  # First order
            
            toast1 = booking_modal.book()
            assert toast1 is not None
            
            # Try to book again
            self.courier.open()
            booking_modal2 = self.courier.click_book_courier()
            booking_modal2.wait_for_modal()
            
            booking_modal2.select_provider('Pathao')
            booking_modal2.select_order('1')
            
            toast2 = booking_modal2.book_expecting_failure()
            assert toast2 is not None
            assert any(word in toast2.lower() for word in ['exist', 'duplicate', 'already'])
    
    def test_required_fields_validation(self):
        """TC-COUR-008: Should validate required booking fields"""
        booking_modal = self.courier.click_book_courier()
        booking_modal.wait_for_modal()
        
        booking_modal.click(booking_modal.BOOK_BUTTON)
        
        assert booking_modal.has_validation_error('recipient_name')
    
    def test_bangladesh_phone_formatting(self):
        """TC-COUR-009: Should format Bangladesh phone numbers correctly"""
        booking_modal = self.courier.click_book_courier()
        booking_modal.wait_for_modal()
        
        booking_modal.fill(booking_modal.RECIPIENT_PHONE, '01712345678')
        
        phone_value = booking_modal.get_phone_value()
        # Should match BD mobile format
        import re
        assert re.match(r'^(\+?88)?0?1[3-9]\d{8}$', phone_value)
    
    def test_booking_history_display(self):
        """TC-COUR-010: Should display booking history"""
        count = self.courier.get_booking_count()
        assert count >= 0
        
        headers = self.courier.get_table_headers()
        expected = ['Tracking', 'Provider', 'Recipient', 'Status', 'Date']
        for exp in expected:
            found = any(exp.lower() in h.lower() for h in headers)
            assert found, f"Missing header: {exp}"
    
    def test_track_shipment(self):
        """TC-COUR-011: Should track courier shipment"""
        tracking_ids = self.courier.get_booking_tracking_ids()
        if tracking_ids:
            tracking_modal = self.courier.click_track_first()
            if tracking_modal:
                tracking_modal.wait_for_modal()
                timeline_count = tracking_modal.get_timeline_count()
                assert timeline_count > 0
    
    def test_switch_providers(self):
        """TC-COUR-012: Should switch between providers (Steadfast, Pathao, RedX, DHL)"""
        booking_modal = self.courier.click_book_courier()
        booking_modal.wait_for_modal()
        
        providers = ['Steadfast', 'Pathao', 'RedX', 'DHL Express']
        
        for provider in providers:
            options = booking_modal.find_all((By.XPATH, f'//option[contains(text(), "{provider}")]'))
            assert len(options) > 0, f"Provider {provider} not found"
            
            booking_modal.select_provider(provider)
            # Verify no error
            assert not booking_modal.is_visible((By.CSS_SELECTOR, '.error'))


# Import needed for the test
from selenium.webdriver.common.by import By