"""Re-verify restaurant detail after popular items fix."""
import asyncio
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:3456"
OUT_DIR = "/home/z/my-project/scripts/mobile_shots"


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Small Android (360px)
        ctx = await browser.new_context(
            viewport={"width": 360, "height": 800},
            device_scale_factor=2,
            user_agent="Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        )
        page = await ctx.new_page()
        await page.goto(BASE_URL, wait_until="networkidle", timeout=15000)
        await page.wait_for_timeout(1500)

        # Click first restaurant
        try:
            await page.wait_for_selector("text=Prevádzky v tvojom okolí", timeout=3000)
            restaurant_cards = await page.query_selector_all("div[class*='cursor-pointer']")
            if restaurant_cards and len(restaurant_cards) > 0:
                await restaurant_cards[0].click()
                await page.wait_for_timeout(2500)
                await page.screenshot(path=f"{OUT_DIR}/11-restaurant-small-android.png", full_page=False)
                print("[OK] Restaurant detail (small Android)")

                # Scroll to popular items
                await page.evaluate("window.scrollBy(0, 350)")
                await page.wait_for_timeout(500)
                await page.screenshot(path=f"{OUT_DIR}/12-popular-items.png", full_page=False)
                print("[OK] Popular items section")
        except Exception as e:
            print(f"[WARN] {e}")

        await browser.close()


asyncio.run(main())
