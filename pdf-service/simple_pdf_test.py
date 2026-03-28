import sys
import time
import base64
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException

def simple_pdf_test(url, output_path, wait_time=30):
    """
    Simple PDF generation with minimal flags to test image rendering
    """
    print(f"SIMPLE TEST: Generating PDF from: {url}")
    print(f"SIMPLE TEST: Output: {output_path}")
    
    # Minimal Chrome options
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--window-size=1920,1080")
    
    # Only essential flags
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    # Initialize driver
    print("SIMPLE TEST: Starting Chrome browser...")
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        # Navigate to URL
        print(f"SIMPLE TEST: Navigating to: {url}")
        driver.get(url)
        
        # Wait for document ready
        WebDriverWait(driver, wait_time).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )
        print("SIMPLE TEST: Document ready")
        
        # Wait for React app to load
        try:
            WebDriverWait(driver, 15).until(
                lambda d: d.execute_script("return document.getElementById('root').children.length > 0")
            )
            print("SIMPLE TEST: React app loaded")
        except TimeoutException:
            print("SIMPLE TEST: WARNING - React app may not have loaded")
        
        # Additional wait for images
        print("SIMPLE TEST: Waiting 10 seconds for content...")
        time.sleep(10)
        
        # Check image status
        images_info = driver.execute_script("""
            const imgs = document.querySelectorAll('img');
            console.log('Images found: ' + imgs.length);
            
            const info = [];
            imgs.forEach((img, i) => {
                console.log(`Image ${i}: src=${img.src}, complete=${img.complete}, naturalWidth=${img.naturalWidth}`);
                info.push({
                    index: i,
                    src: img.src,
                    complete: img.complete,
                    naturalWidth: img.naturalWidth,
                    loaded: img.complete && img.naturalWidth > 0
                });
            });
            return info;
        """)
        
        print("SIMPLE TEST: Image status:")
        for img in images_info:
            status = "LOADED" if img['loaded'] else "NOT LOADED"
            print(f"  Image {img['index']}: {status} - {img['src']}")
        
        # Generate PDF with basic settings
        print("SIMPLE TEST: Generating PDF...")
        pdf_data = driver.execute_cdp_cmd("Page.printToPDF", {
            'displayHeaderFooter': False,
            'printBackground': True,
            'preferCSSPageSize': False,
            'landscape': False,
            'paperWidth': 8.27,  # A4 width in inches
            'paperHeight': 11.7,  # A4 height in inches
            'marginTop': 0.4,
            'marginBottom': 0.4,
            'marginLeft': 0.4,
            'marginRight': 0.4,
        })["data"]
        
        # Save PDF
        with open(output_path, "wb") as f:
            f.write(base64.b64decode(pdf_data))
        
        print(f"SIMPLE TEST: PDF saved to: {output_path}")
        
        # Take a screenshot for comparison
        screenshot_path = output_path.replace('.pdf', '_screenshot.png')
        driver.save_screenshot(screenshot_path)
        print(f"SIMPLE TEST: Screenshot saved to: {screenshot_path}")
        
    except Exception as e:
        print(f"SIMPLE TEST: Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        driver.quit()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python simple_pdf_test.py <url> <output_path> [wait_time]")
        sys.exit(1)
    
    url = sys.argv[1]
    output_path = sys.argv[2]
    wait_time = int(sys.argv[3]) if len(sys.argv) > 3 else 30
    
    simple_pdf_test(url, output_path, wait_time)