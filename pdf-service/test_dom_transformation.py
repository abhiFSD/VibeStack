import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException

def test_dom_transformation_effect(url, wait_time=30):
    """
    Test specifically what happens during DOM transformation
    """
    print(f"DOM TRANSFORMATION TEST: Testing URL: {url}")
    
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,2000")
    
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        print("DOM TEST: Navigating and loading...")
        driver.get(url)
        
        WebDriverWait(driver, wait_time).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )
        
        # Wait for layout elements
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".landscape, .portrait"))
            )
            print("DOM TEST: Layout elements found")
        except TimeoutException:
            print("DOM TEST: No layout elements found")
            return
        
        time.sleep(5)  # Basic wait
        
        # STEP 1: Check original DOM structure
        print("DOM TEST: Analyzing original DOM structure...")
        original_analysis = driver.execute_script("""
            const layoutElements = document.querySelectorAll('.landscape, .portrait');
            const images = document.querySelectorAll('img');
            
            console.log('=== ORIGINAL DOM ANALYSIS ===');
            console.log('Layout elements found: ' + layoutElements.length);
            console.log('Images found: ' + images.length);
            
            const analysis = {
                layoutElements: layoutElements.length,
                totalImages: images.length,
                imageDetails: []
            };
            
            images.forEach((img, i) => {
                const parentLayout = img.closest('.landscape, .portrait');
                analysis.imageDetails.push({
                    index: i,
                    src: img.src,
                    withinLayout: !!parentLayout,
                    layoutClass: parentLayout ? parentLayout.className : null,
                    loaded: img.complete && img.naturalWidth > 0,
                    parentElement: img.parentElement.tagName
                });
                console.log(`Image ${i}: within layout=${!!parentLayout}, loaded=${img.complete && img.naturalWidth > 0}`);
            });
            
            return analysis;
        """)
        
        print("DOM TEST: Original DOM Analysis:")
        print(f"  Layout elements: {original_analysis['layoutElements']}")
        print(f"  Total images: {original_analysis['totalImages']}")
        for img in original_analysis['imageDetails']:
            layout_info = f"in {img['layoutClass']}" if img['withinLayout'] else "OUTSIDE layout"
            status = "LOADED" if img['loaded'] else "NOT LOADED"
            print(f"  Image {img['index']}: {status}, {layout_info}, parent: {img['parentElement']}")
        
        driver.save_screenshot("dom_test_01_original.png")
        
        # STEP 2: Test cloning before transformation
        print("DOM TEST: Testing cloning behavior...")
        clone_test = driver.execute_script("""
            const layoutElements = document.querySelectorAll('.landscape, .portrait');
            const testResults = [];
            
            console.log('=== CLONE TEST ===');
            
            layoutElements.forEach((el, i) => {
                console.log(`Testing clone of layout element ${i}`);
                
                const originalImages = el.querySelectorAll('img');
                console.log(`Original element has ${originalImages.length} images`);
                
                const clone = el.cloneNode(true);
                const clonedImages = clone.querySelectorAll('img');
                console.log(`Clone has ${clonedImages.length} images`);
                
                const result = {
                    elementIndex: i,
                    originalImageCount: originalImages.length,
                    clonedImageCount: clonedImages.length,
                    imageComparison: []
                };
                
                for (let j = 0; j < Math.max(originalImages.length, clonedImages.length); j++) {
                    const orig = originalImages[j];
                    const cloned = clonedImages[j];
                    
                    if (orig && cloned) {
                        result.imageComparison.push({
                            index: j,
                            originalSrc: orig.src,
                            clonedSrc: cloned.src,
                            originalLoaded: orig.complete && orig.naturalWidth > 0,
                            clonedLoaded: cloned.complete && cloned.naturalWidth > 0,
                            srcsMatch: orig.src === cloned.src
                        });
                        console.log(`Image ${j}: orig loaded=${orig.complete && orig.naturalWidth > 0}, clone loaded=${cloned.complete && cloned.naturalWidth > 0}`);
                    }
                }
                
                testResults.push(result);
            });
            
            return testResults;
        """)
        
        print("DOM TEST: Clone test results:")
        for result in clone_test:
            print(f"  Layout element {result['elementIndex']}: {result['originalImageCount']} -> {result['clonedImageCount']} images")
            for img in result['imageComparison']:
                status = "✅ OK" if img['srcsMatch'] and img['originalLoaded'] else "❌ ISSUE"
                print(f"    {status} Image {img['index']}: orig_loaded={img['originalLoaded']}, clone_loaded={img['clonedLoaded']}")
        
        # STEP 3: Perform the transformation and check results
        print("DOM TEST: Performing DOM transformation...")
        transformation_result = driver.execute_script("""
            console.log('=== DOM TRANSFORMATION ===');
            const layoutElements = document.querySelectorAll('.landscape, .portrait');
            
            if (layoutElements.length > 0) {
                const printWrapper = document.createElement('div');
                printWrapper.id = 'print-content-wrapper';
                
                layoutElements.forEach((el, i) => {
                    console.log(`Cloning layout element ${i}`);
                    const clone = el.cloneNode(true);
                    printWrapper.appendChild(clone);
                });
                
                console.log('Replacing body content...');
                document.body.innerHTML = '';
                document.body.appendChild(printWrapper);
                
                console.log('Transformation complete. Analyzing results...');
                
                // Check what we have now
                const newImages = document.querySelectorAll('img');
                const results = {
                    success: true,
                    newImageCount: newImages.length,
                    imageAnalysis: []
                };
                
                newImages.forEach((img, i) => {
                    results.imageAnalysis.push({
                        index: i,
                        src: img.src,
                        complete: img.complete,
                        naturalWidth: img.naturalWidth,
                        naturalHeight: img.naturalHeight,
                        loaded: img.complete && img.naturalWidth > 0
                    });
                    console.log(`New image ${i}: src=${img.src}, loaded=${img.complete && img.naturalWidth > 0}`);
                });
                
                return results;
            } else {
                return {success: false, error: 'No layout elements found'};
            }
        """)
        
        print("DOM TEST: Transformation results:")
        if transformation_result['success']:
            print(f"  New image count: {transformation_result['newImageCount']}")
            for img in transformation_result['imageAnalysis']:
                status = "✅ LOADED" if img['loaded'] else "❌ NOT LOADED"
                print(f"  {status} Image {img['index']}: {img['naturalWidth']}x{img['naturalHeight']}")
                print(f"    src: {img['src']}")
        else:
            print(f"  ERROR: {transformation_result['error']}")
        
        # Take screenshot after transformation
        time.sleep(2)  # Wait for any re-rendering
        driver.save_screenshot("dom_test_02_after_transform.png")
        
        # STEP 4: Try to force image reload after transformation
        print("DOM TEST: Attempting to reload images after transformation...")
        reload_result = driver.execute_script("""
            return new Promise(resolve => {
                const images = document.querySelectorAll('img');
                console.log('=== POST-TRANSFORM RELOAD ===');
                console.log('Attempting to reload ' + images.length + ' images');
                
                if (images.length === 0) {
                    resolve({message: 'No images to reload'});
                    return;
                }
                
                let processed = 0;
                const results = [];
                
                images.forEach((img, i) => {
                    const originalSrc = img.src;
                    
                    // Force reload by clearing and resetting src
                    img.onload = () => {
                        console.log(`Reloaded image ${i}: ${originalSrc}`);
                        results[i] = {index: i, success: true, width: img.naturalWidth, height: img.naturalHeight};
                        processed++;
                        if (processed >= images.length) {
                            setTimeout(() => resolve(results), 1000);
                        }
                    };
                    
                    img.onerror = () => {
                        console.error(`Failed to reload image ${i}: ${originalSrc}`);
                        results[i] = {index: i, success: false, error: true};
                        processed++;
                        if (processed >= images.length) {
                            setTimeout(() => resolve(results), 1000);
                        }
                    };
                    
                    // Force reload
                    img.src = '';
                    setTimeout(() => {
                        img.src = originalSrc;
                    }, 10);
                });
                
                // Timeout
                setTimeout(() => {
                    console.log('Reload timeout');
                    resolve(results);
                }, 5000);
            });
        """)
        
        print("DOM TEST: Post-transformation reload results:")
        if isinstance(reload_result, list):
            for result in reload_result:
                if result and 'success' in result:
                    status = "✅ SUCCESS" if result['success'] else "❌ FAILED"
                    dimensions = f"{result.get('width', 'N/A')}x{result.get('height', 'N/A')}"
                    print(f"  {status} Image {result['index']}: {dimensions}")
        else:
            print(f"  {reload_result}")
        
        # Final screenshot
        time.sleep(2)
        driver.save_screenshot("dom_test_03_after_reload.png")
        
        print("DOM TEST: Complete! Generated:")
        print("  - dom_test_01_original.png")
        print("  - dom_test_02_after_transform.png") 
        print("  - dom_test_03_after_reload.png")
        
    except Exception as e:
        print(f"DOM TEST: Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        driver.quit()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_dom_transformation.py <url> [wait_time]")
        sys.exit(1)
    
    url = sys.argv[1]
    wait_time = int(sys.argv[2]) if len(sys.argv) > 2 else 30
    
    test_dom_transformation_effect(url, wait_time)