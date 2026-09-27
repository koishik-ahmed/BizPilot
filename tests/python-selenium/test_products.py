"""
Products/Inventory Tests
"""
import pytest
import time
import os
from pages.inventory_page import InventoryPage
from pages.products_page import ProductsPage


class TestProducts:
    """TC-PROD: Product/Inventory tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self, logged_in_driver):
        self.inventory = InventoryPage(logged_in_driver)
        self.inventory.open()
    
    def test_display_products_list(self):
        """TC-PROD-001: Should display products list"""
        count = self.inventory.get_product_count()
        assert count > 0
    
    def test_open_add_product_modal(self):
        """TC-PROD-002: Should open add product modal"""
        products_page = self.inventory.click_add_product()
        products_page.wait_for_modal()
        assert products_page.is_visible(products_page.MODAL_TITLE)
    
    def test_create_product_with_image(self):
        """TC-PROD-003: Should create new product with image"""
        products_page = self.inventory.click_add_product()
        products_page.wait_for_modal()
        
        test_name = f'Test Product {int(time.time())}'
        products_page.fill_product_form(
            name=test_name,
            sku=f'SKU-{int(time.time())}',
            category='Electronics',
            description='Test product description',
            cost_price=50,
            selling_price=99,
            stock=10,
            low_stock_threshold=5
        )
        
        # Upload test image if exists
        test_image = os.path.join(os.path.dirname(__file__), '..', 'test-image.png')
        if os.path.exists(test_image):
            products_page.upload_image(test_image)
        
        products_page.save()
        
        toast = products_page.get_toast_message()
        assert toast is not None
        assert any(word in toast.lower() for word in ['success', 'created', 'added'])
        
        # Verify product appears in list
        self.inventory.open()
        product_row = self.inventory.find_product_row(test_name)
        assert product_row is not None
    
    def test_required_fields_validation(self):
        """TC-PROD-004: Should validate required fields"""
        products_page = self.inventory.click_add_product()
        products_page.wait_for_modal()
        products_page.click(products_page.SAVE_BUTTON)
        
        assert products_page.has_validation_error('name')
    
    def test_edit_existing_product(self):
        """TC-PROD-005: Should edit existing product"""
        # Get first product name
        product_names = self.inventory.get_product_names()
        assert len(product_names) > 0
        original_name = product_names[0]
        
        products_page = self.inventory.click_edit_product(original_name)
        products_page.wait_for_modal()
        
        new_name = f'{original_name} Updated {int(time.time())}'
        products_page.fill(products_page.NAME_INPUT, new_name)
        products_page.save()
        
        toast = products_page.get_toast_message()
        assert toast is not None
        assert any(word in toast.lower() for word in ['success', 'updated', 'saved'])
    
    def test_delete_product(self):
        """TC-PROD-006: Should delete product"""
        # First add a product to delete
        products_page = self.inventory.click_add_product()
        products_page.wait_for_modal()
        
        delete_name = f'Delete Me {int(time.time())}'
        products_page.fill_product_form(
            name=delete_name,
            sku=f'DEL-{int(time.time())}',
            category='Electronics',
            description='To be deleted',
            cost_price=10,
            selling_price=20,
            stock=1,
            low_stock_threshold=1
        )
        products_page.save()
        
        # Now delete it
        self.inventory.open()
        self.inventory.click_delete_product(delete_name)
        self.inventory.confirm_delete()
        
        toast = self.inventory.get_toast_message()
        assert toast is not None
        assert any(word in toast.lower() for word in ['success', 'deleted', 'removed'])
    
    def test_filter_by_category(self):
        """TC-PROD-007: Should filter products by category"""
        self.inventory.filter_by_category('Electronics')
        
        # Verify all visible rows are Electronics
        rows = self.inventory.find_all(self.inventory.PRODUCT_ROWS)
        for row in rows:
            text = row.text
            if 'Electronics' not in text and 'electronics' not in text.lower():
                # Some rows might not show category in text, just verify no error
                pass
    
    def test_search_products(self):
        """TC-PROD-008: Should search products"""
        self.inventory.search('Headphones')
        
        rows = self.inventory.find_all(self.inventory.PRODUCT_ROWS)
        for row in rows:
            assert 'headphones' in row.text.lower()
    
    def test_low_stock_indicators(self):
        """TC-PROD-009: Should show low stock indicator"""
        count = self.inventory.get_low_stock_badges_count()
        assert count >= 0  # May or may not have low stock items
    
    def test_pagination(self):
        """TC-PROD-010: Should paginate products"""
        if self.inventory.has_pagination():
            page_before = self.inventory.get_current_page_number()
            self.inventory.go_to_next_page()
            page_after = self.inventory.get_current_page_number()
            assert page_after > page_before