import sys
import time
import base64
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException

def compare_pdf_with_without_transform(url, wait_time=30):
    """
    Generate PDFs both with and without DOM transformation to isolate the issue
    """
    print(f"COMPARE TEST: Testing URL: {url}")
    
    # Configure Chrome exactly like the original
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,2000")
    
    # Original flags
    chrome_options.add_argument("--disable-web-security")
    chrome_options.add_argument("--allow-running-insecure-content")
    chrome_options.add_argument("--disable-features=IsolateOrigins,site-per-process")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_argument("--memory-pressure-off")
    chrome_options.add_argument("--max_old_space_size=4096")
    
    # Original print settings
    appState = {
        "recentDestinations": [{
            "id": "Save as PDF",
            "origin": "local",
            "account": ""
        }],
        "selectedDestinationId": "Save as PDF",
        "version": 2,
        "isLandscapeEnabled": False,
        "pageSize": "A4",
        "scalingType": 1,
        "scaling": 100,
        "shouldPrintBackgrounds": True,
        "marginsType": 0,
        "isCssBackgroundEnabled": True,
    }
    
    chrome_options.add_experimental_option("prefs", {
        "printing.print_preview_sticky_settings.appState": appState,
        "download.default_directory": ".",
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "safebrowsing.enabled": False,
        "plugins.always_open_pdf_externally": True,
    })
    
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        print("COMPARE: Loading page...")
        driver.get(url)
        
        # Standard wait
        WebDriverWait(driver, wait_time).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )
        
        # Wait for layout elements
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".landscape, .portrait"))
            )
            print("COMPARE: Layout elements found")
        except TimeoutException:
            print("COMPARE: No layout elements found")
            return
        
        time.sleep(10)  # Standard wait like original
        
        # Wait for images (same as original)
        driver.execute_script("""
            return new Promise(resolve => {
                const images = Array.from(document.getElementsByTagName('img'));
                let totalImages = 0;
                let loadedImages = 0;
                
                images.forEach(img => {
                    if (!img.src || img.src === '') return;
                    totalImages++;
                    
                    if (img.complete && img.naturalHeight !== 0) {
                        loadedImages++;
                    } else {
                        const newImg = new Image();
                        newImg.onload = () => {
                            loadedImages++;
                            if (loadedImages >= totalImages) resolve();
                        };
                        newImg.onerror = () => {
                            loadedImages++;
                            if (loadedImages >= totalImages) resolve();
                        };
                        newImg.src = img.src;
                    }
                });
                
                if (loadedImages >= totalImages) {
                    setTimeout(resolve, 2000);
                }
                
                setTimeout(() => {
                    resolve();
                }, 15000);
            });
        """)
        
        time.sleep(5)  # Final wait
        
        print("COMPARE: Generating PDF WITHOUT transformation...")
        
        # PDF 1: Without DOM transformation
        pdf_data_without = driver.execute_cdp_cmd("Page.printToPDF", {
            'displayHeaderFooter': False,
            'printBackground': True,
            'preferCSSPageSize': True,
            'scale': 1.0,
            'marginTop': 0.3,
            'marginBottom': 0.3,
            'marginLeft': 0.3,
            'marginRight': 0.3,
            'transferMode': 'ReturnAsBase64',
        })["data"]
        
        with open("compare_WITHOUT_transform.pdf", "wb") as f:
            f.write(base64.b64decode(pdf_data_without))
        
        # Take screenshot before transformation
        driver.save_screenshot("compare_before_transform.png")
        
        # Check image status before transformation
        before_images = driver.execute_script("""
            const imgs = document.querySelectorAll('img');
            const results = [];
            imgs.forEach((img, i) => {
                results.push({
                    index: i,
                    src: img.src,
                    loaded: img.complete && img.naturalWidth > 0,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                    clientWidth: img.clientWidth,
                    clientHeight: img.clientHeight
                });
            });
            return results;
        """)
        
        print("COMPARE: Images BEFORE transformation:")
        for img in before_images:
            print(f"  Image {img['index']}: {img['naturalWidth']}x{img['naturalHeight']} -> {img['clientWidth']}x{img['clientHeight']} ({'LOADED' if img['loaded'] else 'NOT LOADED'})")
        
        print("COMPARE: Applying DOM transformation...")
        
        # Apply the exact same transformation as the original
        driver.execute_script("""
            const layoutElements = document.querySelectorAll('.landscape, .portrait');
            if (layoutElements.length > 0) {
                const printWrapper = document.createElement('div');
                printWrapper.id = 'print-content-wrapper';
                layoutElements.forEach(el => {
                    printWrapper.appendChild(el.cloneNode(true));
                });
                document.body.innerHTML = ''; 
                document.body.appendChild(printWrapper);
            }
        """)
        
        # Wait after transformation
        time.sleep(2)
        
        # Take screenshot after transformation
        driver.save_screenshot("compare_after_transform.png")
        
        # Check image status after transformation
        after_images = driver.execute_script("""
            const imgs = document.querySelectorAll('img');
            const results = [];
            imgs.forEach((img, i) => {
                results.push({
                    index: i,
                    src: img.src,
                    loaded: img.complete && img.naturalWidth > 0,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                    clientWidth: img.clientWidth,
                    clientHeight: img.clientHeight
                });
            });
            return results;
        """)
        
        print("COMPARE: Images AFTER transformation:")
        for img in after_images:
            print(f"  Image {img['index']}: {img['naturalWidth']}x{img['naturalHeight']} -> {img['clientWidth']}x{img['clientHeight']} ({'LOADED' if img['loaded'] else 'NOT LOADED'})")
        
        # Apply CSS (same as original)
        driver.execute_script("""
            const style = document.createElement('style');
            style.textContent = `
                @page landscape_page { size: A4 landscape; margin: 8mm; }
                @page portrait_page { size: A4 portrait; margin: 8mm; }
                .landscape { page: landscape_page; }
                .portrait { page: portrait_page; }
                html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; }
                body * { max-width: 100% !important; box-sizing: border-box !important; }
                img, table, canvas, figure, pre, blockquote {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                }
            `;
            document.head.appendChild(style);
        """)
        
        time.sleep(1)  # Wait for CSS
        
        print("COMPARE: Generating PDF WITH transformation...")
        
        # PDF 2: With DOM transformation (original method)
        pdf_data_with = driver.execute_cdp_cmd("Page.printToPDF", {
            'displayHeaderFooter': False,
            'printBackground': True,
            'preferCSSPageSize': True,
            'scale': 1.0,
            'marginTop': 0.3,
            'marginBottom': 0.3,
            'marginLeft': 0.3,
            'marginRight': 0.3,
            'transferMode': 'ReturnAsBase64',
        })["data"]
        
        with open("compare_WITH_transform.pdf", "wb") as f:
            f.write(base64.b64decode(pdf_data_with))
        
        print("COMPARE: Complete! Generated files:")
        print("  - compare_WITHOUT_transform.pdf (no DOM changes)")
        print("  - compare_WITH_transform.pdf (with DOM isolation)")
        print("  - compare_before_transform.png (screenshot before)")
        print("  - compare_after_transform.png (screenshot after)")
        
        # Show file sizes for comparison
        import os
        size_without = os.path.getsize("compare_WITHOUT_transform.pdf")
        size_with = os.path.getsize("compare_WITH_transform.pdf")
        print(f"  PDF without transformation: {size_without:,} bytes")
        print(f"  PDF with transformation: {size_with:,} bytes")
        
        if size_without > size_with:
            print("  ⚠️  PDF without transformation is LARGER - suggests transformation removes image data")
        elif size_with > size_without:
            print("  ✅ PDF with transformation is larger - transformation preserves images")
        else:
            print("  📊 PDFs are same size")
        
    except Exception as e:
        print(f"COMPARE: Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        driver.quit()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python compare_with_without_transform.py <url> [wait_time]")
        sys.exit(1)
    
    url = sys.argv[1]
    wait_time = int(sys.argv[2]) if len(sys.argv) > 2 else 30
    
    compare_pdf_with_without_transform(url, wait_time)