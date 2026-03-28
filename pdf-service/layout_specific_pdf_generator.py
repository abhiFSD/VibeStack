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
import shutil
from PyPDF2 import PdfReader, PdfWriter
import io

def generate_pdf_from_url(url, output_path, wait_time=30):
    """
    Generates a PDF from a URL using headless Chrome, focusing on
    .landscape and .portrait sections.
    
    Args:
        url: The URL to generate the PDF from
        output_path: Path where the PDF will be saved
        wait_time: Maximum time to wait for page load in seconds
    """
    print(f"Generating layout-specific PDF from: {url}")
    print(f"Output will be saved to: {output_path}")
    print(f"Wait time set to: {wait_time} seconds")
    
    # Configure Chrome options
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,2000") 
    
    # Set up print settings for PDF
    appState = {
        "recentDestinations": [{
            "id": "Save as PDF",
            "origin": "local",
            "account": ""
        }],
        "selectedDestinationId": "Save as PDF",
        "version": 2,
        "isLandscapeEnabled": False, # Let CSS @page handle orientation
        "pageSize": "A4",
        "scalingType": 1,  # Use custom scaling
        "scaling": 100,
        "shouldPrintBackgrounds": True,
        "marginsType": 0,  # Minimum margins
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

    # Initialize driver
    print("Starting Chrome browser...")
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        # Open URL
        print(f"Navigating to URL: {url}")
        driver.get(url)
        
        # --- Wait for page load --- (Same as before)
        print("Waiting for document ready state...")
        WebDriverWait(driver, wait_time).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )
        print("Document ready state is complete")
        
        print("Checking for common loading indicators...")
        common_loading_selectors = [
            ".loading", ".loader", ".spinner", 
            "[class*='loading']", "[class*='loader']", "[class*='spinner']",
            ".MuiCircularProgress-root", ".progress-bar", ".progress"
        ]
        for selector in common_loading_selectors:
            try:
                loading_elements = driver.find_elements(By.CSS_SELECTOR, selector)
                if loading_elements:
                    print(f"Found loading indicator with selector: {selector}, waiting for it to disappear...")
                    WebDriverWait(driver, wait_time).until_not(
                        lambda d: d.find_elements(By.CSS_SELECTOR, selector)
                    )
            except:
                continue
        
        print("Waiting for page content to appear...")
        content_selectors = [".landscape", ".portrait"]
        content_found = False
        for selector in content_selectors:
            try:
                WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                )
                content_found = True
                print(f"Found layout content with selector: {selector}")
                break
            except TimeoutException:
                continue

        if not content_found:
            print("Warning: Could not detect specific .landscape or .portrait elements")
            # We might still proceed if the wait times were sufficient

        print(f"Additional waiting period: 10 seconds")
        time.sleep(10)
            
        print("Waiting for all images to load...")
        # Enhanced image loading wait with better detection and retry logic
        driver.execute_script("""
            return new Promise(resolve => {
                // Get all img elements and elements with background images
                const images = Array.from(document.getElementsByTagName('img'));
                const elementsWithBg = Array.from(document.querySelectorAll('*')).filter(el => {
                    const style = window.getComputedStyle(el);
                    return style.backgroundImage && style.backgroundImage !== 'none' && style.backgroundImage !== 'initial';
                });
                
                console.log('Found ' + images.length + ' img tags');
                console.log('Found ' + elementsWithBg.length + ' elements with background images');
                
                // For each image, ensure it's loaded
                let totalImages = 0;
                let loadedImages = 0;
                
                images.forEach(img => {
                    // Skip images without src
                    if (!img.src || img.src === '') return;
                    
                    totalImages++;
                    
                    // Check if already loaded
                    if (img.complete && img.naturalHeight !== 0) {
                        loadedImages++;
                        console.log('Image already loaded: ' + img.src);
                    } else {
                        console.log('Waiting for image: ' + img.src);
                        
                        // Create new image to force load
                        const newImg = new Image();
                        newImg.onload = () => {
                            loadedImages++;
                            console.log('Image loaded: ' + img.src);
                            if (loadedImages >= totalImages) resolve();
                        };
                        newImg.onerror = () => {
                            loadedImages++;
                            console.log('Image failed: ' + img.src);
                            if (loadedImages >= totalImages) resolve();
                        };
                        // Trigger load
                        newImg.src = img.src;
                    }
                });
                
                // If all images are already loaded or no images
                if (loadedImages >= totalImages) {
                    console.log('All images ready or no images to load');
                    setTimeout(resolve, 2000); // Small delay to ensure rendering
                }
                
                // Fallback timeout after 15 seconds
                setTimeout(() => {
                    console.log('Image loading timeout reached');
                    resolve();
                }, 15000);
            });
        """)
        print("All images loaded or accounted for")
        
        print("Scrolling through page to trigger lazy-loading...")
        # Scrolling (Same as before)
        total_height = driver.execute_script("return document.body.scrollHeight")
        for i in range(0, total_height, 300):
            driver.execute_script(f"window.scrollTo(0, {i});")
            time.sleep(0.2)
        driver.execute_script("window.scrollTo(0, 0);")
        
        print("Final wait period: 5 seconds")
        time.sleep(5)

        # --- New Layout Processing Logic --- 
        print("Isolating .landscape and .portrait content...")
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

        print("Grouping consecutive .capture-card elements within .portrait sections...")
        driver.execute_script("""
            document.querySelectorAll('.portrait').forEach(portraitSection => {
                const captureCards = portraitSection.querySelectorAll('.capture-card');
                let groupWrapper = null;
                let lastCard = null;

                for (let i = 0; i < captureCards.length; i++) {
                    const currentCard = captureCards[i];
                    // Check if this card immediately follows the last one in the DOM
                    const followsLast = lastCard && currentCard.previousElementSibling === lastCard;

                    if (followsLast) {
                        // If it follows and we have a group, add it
                        if (!groupWrapper) {
                            // Start a new group if we don't have one
                            groupWrapper = document.createElement('div');
                            groupWrapper.className = 'capture-group';
                            lastCard.parentNode.insertBefore(groupWrapper, lastCard);
                            groupWrapper.appendChild(lastCard);
                        }
                        groupWrapper.appendChild(currentCard);
                    } else {
                        // If it doesn't follow, end the previous group
                        groupWrapper = null; 
                    }
                    lastCard = currentCard;
                }
            });
            console.log('Finished grouping capture cards.');
        """)
        
        print("Applying layout-specific CSS and page break logic...")
        # Define card selector for landscape sections (adjust if needed)
        landscape_card_selector = ".card"
        
        # Inject CSS
        css_injection_script = f"""
            const style = document.createElement('style');
            style.textContent = `
                /* Page Definitions */
                @page landscape_page {{ size: A4 landscape; margin: 8mm; }}
                @page portrait_page {{ size: A4 portrait; margin: 8mm; }}
                @page :last {{ margin-bottom: 0; }} /* Prevent blank last page */

                /* Section Page Association */
                .landscape {{ page: landscape_page; }}
                .portrait {{ page: portrait_page; }}

                /* General Body/HTML Styling */
                html, body {{ margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; }}
                body * {{ max-width: 100% !important; box-sizing: border-box !important; }}
                
                /* Generic Container Styling within Sections */
                .landscape > *, .portrait > * {{ width: 98% !important; margin-left: auto !important; margin-right: auto !important; }}

                /* Landscape Card Break Avoidance */
                .landscape {landscape_card_selector} {{
                    page-break-inside: avoid !important; 
                    break-inside: avoid !important;
                    display: block; 
                    margin-bottom: 15px;
                }}

                /* Portrait Capture Card & Group Break Avoidance */
                .portrait .capture-card,
                .portrait .capture-group {{
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                    page-break-before: auto !important; 
                    page-break-after: auto !important;
                    display: block !important;
                    margin-bottom: 15px !important;
                    orphans: 4 !important;
                    widows: 4 !important;
                }}
                
                /* Ensure groups look cohesive */
                .capture-group > .capture-card {{ margin-bottom: 0 !important; }}
                .capture-group > .capture-card:not(:last-child) {{ border-bottom: none; }} /* Optional: remove border between grouped cards */

                /* Avoid breaks in common elements */
                img, table, canvas, figure, pre, blockquote {{
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                }}
            `;
            document.head.appendChild(style);
            console.log('Layout-specific CSS injected.');
        """
        driver.execute_script(css_injection_script)

        # Add JavaScript logic for dynamic page breaks for capture cards/groups
        page_break_logic_script = """
            document.querySelectorAll('.portrait .capture-card, .portrait .capture-group').forEach(el => {
                try {
                    const elementHeight = el.offsetHeight;
                    const viewportHeight = window.innerHeight; // Approximate page height
                    const elementPosition = el.getBoundingClientRect().top;
                    const spaceAvailable = viewportHeight - elementPosition;
                    
                    // If element is taller than available space (add buffer), force break before
                    if (elementHeight > 0 && elementHeight + 30 > spaceAvailable) {
                         // Check if it's already the first element after a break potential
                         const previousElement = el.previousElementSibling;
                         let alreadyBroken = false;
                         if (previousElement && window.getComputedStyle(previousElement).pageBreakAfter === 'always') {
                            alreadyBroken = true;
                         }
                         if (!alreadyBroken) {
                            console.log('Forcing page break before element:', el.className);
                            el.style.pageBreakBefore = 'always';
                         }
                    }
                } catch (e) {
                    console.error('Error calculating page break for:', el, e);
                }
            });
            console.log('Dynamic page break logic applied.');
        """
        driver.execute_script(page_break_logic_script)

        # Use Chrome's built-in PDF printing functionality
        print("Generating PDF...")
        print_options = {
            # 'landscape' is False - CSS @page handles orientation
            'displayHeaderFooter': False,
            'printBackground': True,
            'preferCSSPageSize': True, # IMPORTANT: Use CSS @page rules
            'scale': 1.0,  # Use full scale to avoid cutting off images
            'marginTop': 0.3,
            'marginBottom': 0.3,
            'marginLeft': 0.3,
            'marginRight': 0.3,
            'transferMode': 'ReturnAsBase64',  # Ensure proper data transfer
            # paperWidth/Height are typically handled by preferCSSPageSize + @page
        }
        
        # Generate PDF
        pdf_data = driver.execute_cdp_cmd("Page.printToPDF", print_options)["data"]
        
        # Save the PDF
        with open(output_path, "wb") as f:
            f.write(base64.b64decode(pdf_data))
        
        print(f"Layout-specific PDF generated successfully: {output_path}")
        
        # --- Process PDF to remove blank pages --- (Same as before)
        try:
            print("Checking PDF for blank pages...")
            reader = PdfReader(output_path)
            writer = PdfWriter()
            page_count = len(reader.pages)
            has_blank_pages = False
            for i in range(page_count):
                page = reader.pages[i]
                # Check if last page is effectively blank
                if i == page_count - 1 and not page.extract_text().strip():
                    print("Removing blank last page")
                    has_blank_pages = True
                writer.add_page(page)
            
            if has_blank_pages:
                with open(output_path, 'wb') as f:
                    writer.write(f)
                print("Saved PDF with blank page removed")
        except Exception as e:
            print(f"Error cleaning PDF: {str(e)}")
        
    except Exception as e:
        print(f"Error generating PDF: {str(e)}")
    finally:
        if driver:
            driver.quit()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python layout_specific_pdf_generator.py <url> [output_path] [wait_time]")
        print("Example: python layout_specific_pdf_generator.py http://example.com report.pdf 30")
        sys.exit(1)
    
    url = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else "layout_output.pdf"
    wait_time = int(sys.argv[3]) if len(sys.argv) > 3 else 30
    
    generate_pdf_from_url(url, output_path, wait_time) 