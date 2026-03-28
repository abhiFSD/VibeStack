#!/usr/bin/env python3
"""Debug script to check image loading in Chrome"""

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import time
import json

def test_image_loading(url):
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,2000")
    
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        print(f"\nTesting URL: {url}")
        driver.get(url)
        time.sleep(5)  # Wait for page to load
        
        # Check for images
        image_info = driver.execute_script("""
            const images = document.querySelectorAll('img');
            const imageData = [];
            
            images.forEach((img, index) => {
                imageData.push({
                    index: index,
                    src: img.src,
                    currentSrc: img.currentSrc,
                    complete: img.complete,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                    width: img.width,
                    height: img.height,
                    alt: img.alt || 'no alt',
                    display: window.getComputedStyle(img).display,
                    visibility: window.getComputedStyle(img).visibility,
                    opacity: window.getComputedStyle(img).opacity
                });
            });
            
            return imageData;
        """)
        
        print(f"Found {len(image_info)} images")
        
        # Check for background images
        bg_images = driver.execute_script("""
            const elements = document.querySelectorAll('*');
            const bgImages = [];
            
            elements.forEach(el => {
                const style = window.getComputedStyle(el);
                if (style.backgroundImage && style.backgroundImage !== 'none') {
                    bgImages.push({
                        tagName: el.tagName,
                        className: el.className,
                        backgroundImage: style.backgroundImage
                    });
                }
            });
            
            return bgImages;
        """)
        
        print(f"Found {len(bg_images)} elements with background images")
        
        # Print image details
        for i, img in enumerate(image_info[:5]):  # First 5 images
            print(f"\nImage {i}:")
            print(f"  Source: {img['src'][:100]}...")
            print(f"  Complete: {img['complete']}")
            print(f"  Natural size: {img['naturalWidth']}x{img['naturalHeight']}")
            print(f"  Display size: {img['width']}x{img['height']}")
            print(f"  Visibility: display={img['display']}, visibility={img['visibility']}, opacity={img['opacity']}")
        
        # Check console errors
        logs = driver.get_log('browser')
        errors = [log for log in logs if log['level'] == 'SEVERE']
        if errors:
            print("\nConsole errors found:")
            for error in errors[:5]:
                print(f"  {error['message']}")
        
        return image_info
        
    finally:
        driver.quit()

# Test both URLs
print("="*60)
test_image_loading("http://localhost:3000/report_pdf/2ccfe57e-0b3a-4271-8807-ec56b2b14a91")
print("="*60)
test_image_loading("https://www.abhishekpaul.dev/")
print("="*60)