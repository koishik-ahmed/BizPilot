"""
Test runner script for Python Selenium tests.
"""
import subprocess
import sys
import os


def run_tests(test_file=None, markers=None, parallel=False, html_report=False):
    """Run pytest with specified options."""
    cmd = ['python', '-m', 'pytest']
    
    if test_file:
        cmd.append(test_file)
    else:
        cmd.append('tests/')
    
    if markers:
        cmd.extend(['-m', markers])
    
    if parallel:
        cmd.extend(['-n', 'auto'])
    
    if html_report:
        cmd.extend(['--html=report.html', '--self-contained-html'])
    
    cmd.extend(['-v', '--tb=short'])
    
    print(f"Running: {' '.join(cmd)}")
    return subprocess.run(cmd, cwd=os.path.dirname(__file__))


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Run BizPilot Selenium Tests')
    parser.add_argument('--test', choices=['login', 'products', 'courier', 'orders', 'dashboard', 'all'],
                       default='all', help='Test suite to run')
    parser.add_argument('--parallel', action='store_true', help='Run in parallel')
    parser.add_argument('--html', action='store_true', help='Generate HTML report')
    parser.add_argument('--headless', action='store_true', help='Run in headless mode')
    
    args = parser.parse_args()
    
    if args.headless:
        os.environ['HEADLESS'] = 'true'
    
    test_map = {
        'login': 'test_login.py',
        'products': 'test_products.py',
        'courier': 'test_courier.py',
        'orders': 'test_orders.py',
        'dashboard': 'test_dashboard.py',
        'all': None
    }
    
    test_file = test_map[args.test]
    
    result = run_tests(
        test_file=test_file,
        parallel=args.parallel,
        html_report=args.html
    )
    
    sys.exit(result.returncode)