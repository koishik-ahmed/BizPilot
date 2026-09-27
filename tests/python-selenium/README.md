# BizPilot Python Selenium Test Suite

Python-based end-to-end tests using **pytest** + **selenium-webdriver** with **Page Object Model**.

## Structure
```
tests/python-selenium/
├── conftest.py              # Pytest fixtures (driver, login, API)
├── pytest.ini              # Pytest configuration
├── requirements.txt         # Python dependencies
├── run_tests.py            # Test runner script
├── pages/                   # Page Object Model classes
│   ├── base_page.py        # Base page with common methods
│   ├── login_page.py       # Login page
│   ├── register_page.py    # Registration page
│   ├── dashboard_page.py   # Dashboard page
│   ├── inventory_page.py   # Inventory/Products list page
│   ├── products_page.py    # Add/Edit product modal
│   ├── orders_page.py      # Orders list page
│   ├── add_order_modal.py  # Add order modal
│   ├── order_detail_modal.py # Order detail modal
│   ├── courier_page.py     # Courier page
│   ├── courier_booking_modal.py # Booking modal
│   └── tracking_modal.py   # Tracking modal
├── test_login.py           # Authentication tests (8 tests)
├── test_products.py        # Product tests (10 tests)
├── test_courier.py         # Courier tests (12 tests)
├── test_orders.py          # Orders tests (10 tests)
└── test_dashboard.py       # Dashboard tests (10 tests)
```

## Test Cases (52 total)

| File | Tests | Coverage |
|------|-------|----------|
| `test_login.py` | 8 | Login, Registration, Validation, Redirect, Logout |
| `test_products.py` | 10 | CRUD, Search, Filter, Image Upload, Pagination |
| `test_courier.py` | 12 | Pathao Auth, Stores, Booking, Duplicate Protection, Phone Format, Tracking |
| `test_orders.py` | 10 | CRUD, Status, Search, Export, Payment Badges |
| `test_dashboard.py` | 10 | Metrics, Navigation, Responsive, Charts |

## Prerequisites

1. **Backend running**: `http://localhost:5000`
2. **Frontend running**: `http://localhost:3002`
3. **Python 3.8+** installed
4. **Chrome browser** installed

## Installation

```bash
cd tests/python-selenium

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
```

## Running Tests

### Using the runner script (recommended)
```bash
# Run all tests
python run_tests.py

# Run specific suite
python run_tests.py --test login
python run_tests.py --test products
python run_tests.py --test courier
python run_tests.py --test orders
python run_tests.py --test dashboard

# Run in parallel (faster)
python run_tests.py --parallel

# Generate HTML report
python run_tests.py --html

# Headless mode (CI/CD)
python run_tests.py --headless
```

### Using pytest directly
```bash
# All tests
pytest

# Specific file
pytest test_login.py -v

# With markers
pytest -m smoke
pytest -m courier

# Parallel execution
pytest -n auto

# HTML report
pytest --html=report.html --self-contained-html

# Headless (set env var)
HEADLESS=true pytest
```

## Configuration

Edit `conftest.py` or set environment variables:
```bash
export FRONTEND_URL=http://localhost:3002
export API_URL=http://localhost:5000/api
```

## Page Object Model

Each page has a dedicated class with:
- **Locators** as class constants
- **Actions** as methods (click, fill, select, etc.)
- **Assertions** as verification methods
- **Navigation** returning next page objects

Example:
```python
def test_create_product(logged_in_driver):
    inventory = InventoryPage(logged_in_driver)
    inventory.open()
    
    products_page = inventory.click_add_product()
    products_page.wait_for_modal()
    products_page.fill_product_form(...)
    products_page.save()
    
    assert 'success' in products_page.get_toast_message().lower()
```

## Fixtures (conftest.py)

| Fixture | Scope | Description |
|---------|-------|-------------|
| `driver` | session | Chrome WebDriver |
| `logged_in_driver` | function | Pre-authenticated driver |
| `api_headers` | function | JWT headers for API calls |

## Mock Mode

Courier tests run with `PATHAO_MOCK_MODE=true` (set in backend/.env) so they work without Pathao sandbox credits.

## CI/CD Integration

```yaml
# .github/workflows/selenium-tests.yml
- name: Run Selenium Tests
  run: |
    cd tests/python-selenium
    pip install -r requirements.txt
    python run_tests.py --headless --html
  env:
    FRONTEND_URL: http://localhost:3002
    API_URL: http://localhost:5000/api
```

## Troubleshooting

### ChromeDriver Issues
```bash
# Auto-managed by webdriver-manager, but can update manually
pip install --upgrade webdriver-manager
```

### Element Not Found
- Tests use flexible locators with multiple fallbacks
- Update locators in `pages/*.py` if UI changes

### Timeout Errors
- Increase wait times in `BasePage` (default 10s)
- Check if frontend/backend are running

### Port Conflicts
- Frontend: 3002 (proxies /api to backend:5000)
- Backend: 5000
- Ensure both running before tests

## Differences from JS Version

| Feature | JS (Jest) | Python (pytest) |
|---------|-----------|-----------------|
| Runner | Jest | pytest |
| Parallel | `--runInBand` | `-n auto` (xdist) |
| Reports | Built-in | `--html` |
| Fixtures | `beforeAll` | `@pytest.fixture` |
| Page Objects | Functions | Classes |
| Async | `async/await` | Synchronous |