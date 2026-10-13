import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "../.cloud-browser/node_modules/playwright/index.mjs";
const browser = await chromium.launch();
let currentPage;
await fs.mkdir("cloud-ui-results", { recursive: true });
try {
  for (const [device, viewport] of Object.entries({
    desktop: { width: 1440, height: 1000 },
    mobile: { width: 390, height: 844 },
  })) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    currentPage = page;
    const errors = [];
    const external = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/*", (route) => {
      const host = new URL(route.request().url()).hostname;
      if (host === "127.0.0.1") return route.continue();
      external.push(host);
      return route.abort();
    });
    for (const [screen, pathname] of Object.entries({
      launcher: "/command-center",
      customers: "/customers",
      record: "/customers/11111111-1111-4111-8111-111111111111",
    })) {
      await page.goto(`http://127.0.0.1:4177${pathname}`);
      await page.getByRole("main").waitFor();
      if (screen === "launcher") await page.getByRole("region", { name: "Applications" }).waitFor();
      else
        await page
          .getByRole("heading", {
            name: screen === "customers" ? "Customers" : "Sample Freight",
            exact: true,
          })
          .waitFor();
      if (screen === "customers")
        await page.getByRole("checkbox", { name: "Select Sample Freight", exact: true }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: `cloud-ui-results/${device}-${screen}.png`,
        fullPage: true,
        animations: "disabled",
      });
      if (screen === "customers") {
        await page.getByRole("button", { name: "Search options", exact: true }).click();
        await page.getByRole("combobox", { name: "Record visibility", exact: true }).waitFor();
        await page.screenshot({
          path: `cloud-ui-results/${device}-filters.png`,
          fullPage: true,
          animations: "disabled",
        });
        await page.keyboard.press("Escape");
      }
      if (screen === "record") {
        await page.getByRole("button", { name: "Edit Commercial notes", exact: true }).click();
        await page.getByRole("textbox", { name: "Commercial notes", exact: true }).waitFor();
        await page.getByRole("button", { name: "More formatting", exact: true }).click();
        await page.getByRole("menuitem", { name: "Quote", exact: true }).click();
        await page.getByRole("textbox", { name: "Commercial notes", exact: true }).waitFor();
        await page.screenshot({
          path: `cloud-ui-results/${device}-notes.png`,
          fullPage: true,
          animations: "disabled",
        });
      }
    }
    assert.deepEqual(errors, [], `${device}: uncaught browser errors`);
    assert.deepEqual(external, [], `${device}: unexpected external requests`);
    await context.close();
  }
} catch (error) {
  if (currentPage && !currentPage.isClosed())
    await currentPage.screenshot({
      path: "cloud-ui-results/failure.png",
      fullPage: true,
      animations: "disabled",
    });
  throw error;
} finally {
  await browser.close();
}
