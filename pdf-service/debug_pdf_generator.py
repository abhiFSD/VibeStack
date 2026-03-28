import sys
import time
import base64
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException
import tempfile
import os

def debug_pdf_generation(url, wait_time=30):
    """
    Debug version that captures console logs and detailed image loading info
    """
    print(f"DEBUG: Generating PDF from: {url}")
    print(f"DEBUG: Wait time set to: {wait_time} seconds")
    
    # Configure Chrome options with logging
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,2000")
    
    # Add flags to ensure images are loaded properly
    chrome_options.add_argument("--disable-web-security")
    chrome_options.add_argument("--allow-running-insecure-content")
    chrome_options.add_argument("--disable-features=IsolateOrigins,site-per-process")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    
    # Enable logging
    chrome_options.add_argument("--enable-logging")
    chrome_options.add_argument("--log-level=0")
    chrome_options.add_argument("--v=1")
    
    # Enable console logging in Chrome options
    chrome_options.add_experimental_option("useAutomationExtension", False)
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    
    # Initialize driver
    print("DEBUG: Starting Chrome browser with console logging...")
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        # Open URL
        print(f"DEBUG: Navigating to URL: {url}")
        driver.get(url)
        
        # Wait for document ready state
        print("DEBUG: Waiting for document ready state...")
        WebDriverWait(driver, wait_time).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )
        print("DEBUG: Document ready state is complete")
        
        # Wait for layout elements
        print("DEBUG: Waiting for layout elements...")
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".landscape, .portrait"))
            )
            print("DEBUG: Layout elements found")
        except TimeoutException:
            print("DEBUG: WARNING - No layout elements found after 10 seconds")
        
        # Additional wait
        print("DEBUG: Additional waiting period: 10 seconds")
        time.sleep(10)
        
        # Enhanced image debugging
        print("DEBUG: Checking image loading status...")
        image_info = driver.execute_script("""
            const images = Array.from(document.getElementsByTagName('img'));
            const imageInfo = [];
            
            console.log('=== IMAGE DEBUG INFO ===');
            console.log('Total img elements found: ' + images.length);
            
            images.forEach((img, index) => {
                const info = {
                    index: index,
                    src: img.src,
                    complete: img.complete,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                    width: img.width,
                    height: img.height,
                    loaded: img.complete && img.naturalHeight !== 0
                };
                
                imageInfo.push(info);
                console.log(`Image ${index}: src=${img.src}, complete=${img.complete}, naturalWidth=${img.naturalWidth}, naturalHeight=${img.naturalHeight}, loaded=${info.loaded}`);
                
                // Check for loading errors
                if (!info.loaded && img.src) {
                    console.warn(`Image ${index} not loaded properly: ${img.src}`);
                }
            });
            
            // Check for background images
            const elementsWithBg = Array.from(document.querySelectorAll('*')).filter(el => {
                const style = window.getComputedStyle(el);
                return style.backgroundImage && style.backgroundImage !== 'none' && style.backgroundImage !== 'initial';
            });
            
            console.log('Elements with background images: ' + elementsWithBg.length);
            elementsWithBg.forEach((el, index) => {
                const bgImage = window.getComputedStyle(el).backgroundImage;
                console.log(`Background image ${index}: ${bgImage}`);
            });
            
            return {
                totalImages: images.length,
                imageDetails: imageInfo,
                backgroundImageElements: elementsWithBg.length
            };
        """)
        
        print(f"DEBUG: Total img elements: {image_info['totalImages']}")
        print(f"DEBUG: Background image elements: {image_info['backgroundImageElements']}")
        
        # Print detailed image info
        if image_info['imageDetails']:
            print("DEBUG: Detailed image information:")
            for img in image_info['imageDetails']:
                status = "✓ LOADED" if img['loaded'] else "✗ NOT LOADED"
                print(f"  Image {img['index']}: {status}")
                print(f"    src: {img['src']}")
                print(f"    dimensions: {img['naturalWidth']}x{img['naturalHeight']}")
                if not img['loaded']:
                    print(f"    ⚠️  ISSUE: Image not properly loaded")
        
        # Check page source for any obvious issues
        print("DEBUG: Checking page source characteristics...")
        page_source_length = len(driver.page_source)
        print(f"DEBUG: Page source length: {page_source_length} characters")
        
        # Check if React app has loaded
        react_loaded = driver.execute_script("return !!window.React || !!document.querySelector('[data-reactroot]') || document.getElementById('root').children.length > 0")
        print(f"DEBUG: React app loaded: {react_loaded}")
        
        # Check network status
        network_state = driver.execute_script("return navigator.onLine")
        print(f"DEBUG: Network state online: {network_state}")
        
        # Test a simple image load
        print("DEBUG: Testing direct image access...")
        test_result = driver.execute_script("""
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve({success: true, message: 'Test image loaded successfully'});
                img.onerror = () => resolve({success: false, message: 'Test image failed to load'});
                img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // 1x1 transparent gif
            });
        """)
        print(f"DEBUG: Test image result: {test_result}")
        
    except Exception as e:
        print(f"DEBUG: Error during debugging: {str(e)}")
    finally:
        if driver:
            driver.quit()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python debug_pdf_generator.py <url> [wait_time]")
        sys.exit(1)
    
    url = sys.argv[1]
    wait_time = int(sys.argv[2]) if len(sys.argv) > 2 else 30
    
    debug_pdf_generation(url, wait_time)