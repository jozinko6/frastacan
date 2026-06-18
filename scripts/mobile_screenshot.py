"""Take screenshots of mobile viewport to verify mobile fixes."""
import asyncio
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:3456"
OUT_DIR = "/home/z/my-project/scripts/mobile_shots"

import os
os.makedirs(OUT_DIR, exist_ok=True)


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # iPhone 14 dimensions: 390x844
        iphone_ctx = await browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        )
        page = await iphone_ctx.new_page()
        errors = []
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)

        # Home page
        await page.goto(BASE_URL, wait_until="networkidle", timeout=15000)
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{OUT_DIR}/01-home-iphone.png", full_page=False)
        print("[OK] Home page (iPhone 14)")

        # Scroll to restaurants section
        await page.evaluate("window.scrollBy(0, 800)")
        await page.wait_for_timeout(500)
        await page.screenshot(path=f"{OUT_DIR}/02-home-restaurants.png", full_page=False)
        print("[OK] Restaurants section")

        # Scroll back to top
        await page.evaluate("window.scrollTo(0, 0)")
        await page.wait_for_timeout(500)

        # Try to click first restaurant
        try:
            await page.wait_for_selector("text=Prevádzky v tvojom okolí", timeout=3000)
            restaurant_cards = await page.query_selector_all("div[class*='cursor-pointer']")
            if restaurant_cards and len(restaurant_cards) > 0:
                await restaurant_cards[0].click()
                await page.wait_for_timeout(2000)
                await page.screenshot(path=f"{OUT_DIR}/03-restaurant-detail.png", full_page=False)
                print("[OK] Restaurant detail")
        except Exception as e:
            print(f"[WARN] Restaurant nav: {e}")

        # Go back home
        await page.goto(BASE_URL)
        await page.wait_for_timeout(1000)

        # Open mobile menu
        try:
            menu_btn = await page.query_selector('button[aria-label="Menu"]')
            if menu_btn:
                await menu_btn.click()
                await page.wait_for_timeout(800)
                await page.screenshot(path=f"{OUT_DIR}/04-mobile-menu.png", full_page=False)
                print("[OK] Mobile menu")
        except Exception as e:
            print(f"[WARN] Mobile menu: {e}")

        # Test on Android viewport (360x800 - smaller)
        android_ctx = await browser.new_context(
            viewport={"width": 360, "height": 800},
            device_scale_factor=2,
            user_agent="Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        )
        android_page = await android_ctx.new_page()
        await android_page.goto(BASE_URL, wait_until="networkidle", timeout=15000)
        await android_page.wait_for_timeout(1500)
        await android_page.screenshot(path=f"{OUT_DIR}/08-home-android-small.png", full_page=False)
        print("[OK] Home page (small Android 360px)")

        # Scroll down on Android to see categories and footer
        await android_page.evaluate("window.scrollBy(0, 1500)")
        await android_page.wait_for_timeout(500)
        await android_page.screenshot(path=f"{OUT_DIR}/09-android-categories.png", full_page=False)
        print("[OK] Categories scroll")

        # Scroll to footer
        await android_page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await android_page.wait_for_timeout(500)
        await android_page.screenshot(path=f"{OUT_DIR}/10-android-footer.png", full_page=False)
        print("[OK] Footer")

        if errors:
            print(f"\nConsole errors detected: {len(errors)}")
            for e in errors[:5]:
                print(f"  - {e}")

        await browser.close()


asyncio.run(main())
