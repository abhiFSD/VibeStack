import sys
import time
import base64
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException

def comprehensive_image_test(url, output_prefix, wait_time=30):
    """
    Comprehensive test to understand image loading vs PDF rendering discrepancies
    """
    print(f"COMPREHENSIVE TEST: Testing URL: {url}")
    
    # Configure Chrome options exactly like the original
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,2000")
    
    # Add flags to ensure images are loaded properly (same as original)
    chrome_options.add_argument("--disable-web-security")
    chrome_options.add_argument("--allow-running-insecure-content")
    chrome_options.add_argument("--disable-features=IsolateOrigins,site-per-process")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    
    # Memory and stability options
    chrome_options.add_argument("--memory-pressure-off")
    chrome_options.add_argument("--max_old_space_size=4096")
    
    # Set up print settings for PDF (same as original)
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
        print("COMPREHENSIVE: Navigating to URL...")
        driver.get(url)
        
        # Wait for document ready
        WebDriverWait(driver, wait_time).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )
        print("COMPREHENSIVE: Document ready")
        
        # Wait for layout elements (same as original logic)
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".landscape, .portrait"))
            )
            print("COMPREHENSIVE: Layout elements found")
        except TimeoutException:
            print("COMPREHENSIVE: WARNING - No layout elements found")
        
        # Additional wait
        print("COMPREHENSIVE: Waiting 10 seconds...")
        time.sleep(10)
        
        # STEP 1: Take screenshot before any processing
        print("COMPREHENSIVE: Taking pre-processing screenshot...")
        driver.save_screenshot(f"{output_prefix}_01_initial.png")
        
        # STEP 2: Check initial image status
        print("COMPREHENSIVE: Checking initial image status...")
        initial_images = driver.execute_script("""
            const imgs = document.querySelectorAll('img');
            const results = [];
            console.log('=== INITIAL IMAGE CHECK ===');
            console.log('Found ' + imgs.length + ' img elements');
            
            imgs.forEach((img, i) => {
                const result = {
                    index: i,
                    src: img.src,
                    complete: img.complete,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                    clientWidth: img.clientWidth,
                    clientHeight: img.clientHeight,
                    loaded: img.complete && img.naturalWidth > 0,
                    visible: img.offsetWidth > 0 && img.offsetHeight > 0
                };
                results.push(result);
                console.log(`Image ${i}: loaded=${result.loaded}, visible=${result.visible}, src=${img.src}`);
            });
            
            return results;
        """)
        
        print("COMPREHENSIVE: Initial image analysis:")
        for img in initial_images:
            status = "✅ LOADED & VISIBLE" if img['loaded'] and img['visible'] else "❌ ISSUE"
            print(f"  {status} Image {img['index']}: {img['naturalWidth']}x{img['naturalHeight']} -> {img['clientWidth']}x{img['clientHeight']}")
            print(f"    src: {img['src']}")
        
        # STEP 3: Force reload all images with new promises
        print("COMPREHENSIVE: Force-reloading all images...")
        reload_result = driver.execute_script("""
            return new Promise(resolve => {
                const imgs = Array.from(document.querySelectorAll('img'));
                let loaded = 0;
                let total = imgs.length;
                
                console.log('=== FORCE RELOAD IMAGES ===');
                
                if (total === 0) {
                    resolve([]);
                    return;
                }
                
                const results = [];
                
                imgs.forEach((img, i) => {
                    // Create a new image element to force fresh load
                    const newImg = new Image();
                    
                    newImg.onload = () => {
                        console.log(`Force-loaded image ${i}: ${img.src}`);
                        // Replace the src to trigger re-render
                        const originalSrc = img.src;
                        img.src = '';
                        setTimeout(() => {
                            img.src = originalSrc;
                        }, 10);
                        
                        results[i] = {
                            index: i,
                            src: img.src,
                            success: true,
                            width: newImg.width,
                            height: newImg.height
                        };
                        
                        loaded++;
                        if (loaded >= total) {
                            setTimeout(() => resolve(results), 1000); // Give time for re-render
                        }
                    };
                    
                    newImg.onerror = () => {
                        console.error(`Failed to force-load image ${i}: ${img.src}`);
                        results[i] = {
                            index: i,
                            src: img.src,
                            success: false,
                            error: true
                        };
                        
                        loaded++;
                        if (loaded >= total) {
                            setTimeout(() => resolve(results), 1000);
                        }
                    };
                    
                    // Start loading
                    newImg.src = img.src;
                });
                
                // Timeout fallback
                setTimeout(() => {
                    console.log('Force reload timeout reached');
                    resolve(results);
                }, 10000);
            });
        """)
        
        print("COMPREHENSIVE: Force reload results:")
        for result in reload_result:
            if result and 'success' in result:
                status = "✅ SUCCESS" if result['success'] else "❌ FAILED"
                print(f"  {status} Image {result['index']}: {result.get('width', 'N/A')}x{result.get('height', 'N/A')}")
        
        # STEP 4: Wait a bit more and take another screenshot
        print("COMPREHENSIVE: Waiting 5 more seconds after reload...")
        time.sleep(5)
        driver.save_screenshot(f"{output_prefix}_02_after_reload.png")
        
        # STEP 5: Apply the exact same transformations as the original script
        print("COMPREHENSIVE: Applying original transformations...")
        
        # Isolate .landscape and .portrait content (exact same logic)
        driver.execute_script("""
            const layoutElements = document.querySelectorAll('.landscape, .portrait');
            if (layoutElements.length > 0) {
                const printWrapper = document.createElement('div');
                printWrapper.id = 'print-content-wrapper';
                layoutElements.forEach(el => {
                    printWrapper.appendChild(el.cloneNode(true));
                });
                // Replace body content ONLY if we found specific elements
                document.body.innerHTML = ''; 
                document.body.appendChild(printWrapper);
                console.log('Replaced body content with isolated layout elements.');
            } else {
                console.log('No .landscape or .portrait elements found, printing existing body.');
            }
        """)
        
        # Take screenshot after transformation
        driver.save_screenshot(f"{output_prefix}_03_after_transform.png")
        
        # STEP 6: Check image status after transformation
        print("COMPREHENSIVE: Checking images after transformation...")
        post_transform_images = driver.execute_script("""
            const imgs = document.querySelectorAll('img');
            const results = [];
            console.log('=== POST TRANSFORMATION IMAGE CHECK ===');
            console.log('Found ' + imgs.length + ' img elements after transformation');
            
            imgs.forEach((img, i) => {
                const result = {
                    index: i,
                    src: img.src,
                    complete: img.complete,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                    loaded: img.complete && img.naturalWidth > 0,
                    visible: img.offsetWidth > 0 && img.offsetHeight > 0
                };
                results.push(result);
                console.log(`Post-transform Image ${i}: loaded=${result.loaded}, visible=${result.visible}`);
            });
            
            return results;
        """)
        
        print("COMPREHENSIVE: Post-transformation image status:")
        for img in post_transform_images:
            status = "✅ OK" if img['loaded'] and img['visible'] else "❌ ISSUE"
            print(f"  {status} Image {img['index']}: {img['naturalWidth']}x{img['naturalHeight']}")
        
        # STEP 7: Apply CSS (same as original)
        css_injection_script = """
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
            console.log('Layout-specific CSS injected.');
        """
        driver.execute_script(css_injection_script)
        
        # Wait a moment after CSS
        time.sleep(2)
        driver.save_screenshot(f"{output_prefix}_04_after_css.png")
        
        # STEP 8: Generate PDF with different settings to test
        print("COMPREHENSIVE: Generating PDF with original settings...")
        
        # Original settings
        pdf_data1 = driver.execute_cdp_cmd("Page.printToPDF", {
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
        
        with open(f"{output_prefix}_original_settings.pdf", "wb") as f:
            f.write(base64.b64decode(pdf_data1))
        
        # Alternative settings with different transfer mode
        print("COMPREHENSIVE: Generating PDF with alternative settings...")
        pdf_data2 = driver.execute_cdp_cmd("Page.printToPDF", {
            'displayHeaderFooter': False,
            'printBackground': True,
            'preferCSSPageSize': False,
            'paperWidth': 8.27,
            'paperHeight': 11.7,
            'scale': 1.0,
            'marginTop': 0.3,
            'marginBottom': 0.3,
            'marginLeft': 0.3,
            'marginRight': 0.3,
            'transferMode': 'ReturnAsStream',  # Different transfer mode
        })["data"]
        
        with open(f"{output_prefix}_alt_settings.pdf", "wb") as f:
            f.write(base64.b64decode(pdf_data2))
        
        print("COMPREHENSIVE: Test complete!")
        print(f"Generated files:")
        print(f"  - {output_prefix}_01_initial.png (initial state)")
        print(f"  - {output_prefix}_02_after_reload.png (after force reload)")  
        print(f"  - {output_prefix}_03_after_transform.png (after DOM transformation)")
        print(f"  - {output_prefix}_04_after_css.png (after CSS injection)")
        print(f"  - {output_prefix}_original_settings.pdf (original PDF settings)")
        print(f"  - {output_prefix}_alt_settings.pdf (alternative PDF settings)")
        
    except Exception as e:
        print(f"COMPREHENSIVE: Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        driver.quit()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python comprehensive_image_test.py <url> <output_prefix> [wait_time]")
        print("Example: python comprehensive_image_test.py http://localhost:3000/... test")
        sys.exit(1)
    
    url = sys.argv[1]
    output_prefix = sys.argv[2]
    wait_time = int(sys.argv[3]) if len(sys.argv) > 3 else 30
    
    comprehensive_image_test(url, output_prefix, wait_time)