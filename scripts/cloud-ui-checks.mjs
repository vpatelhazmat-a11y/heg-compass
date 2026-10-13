import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "../.cloud-browser/node_modules/playwright/index.mjs";
import { checkLauncherDrag } from "./cloud-launcher-checks.mjs";
const browser = await chromium.launch();
let currentPage;
await fs.mkdir("cloud-ui-results", { recursive: true });
try {
  for (const [device, viewport] of Object.entries({
    desktop: { width: 1440, height: 1000 },
    mobile: { width: 390, height: 844 },
  })) {
    const context = await browser.newContext({
      viewport,
      reducedMotion: "reduce",
      isMobile: device === "mobile",
      hasTouch: device === "mobile",
    });
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
      sites: "/sites",
      assessments: "/records/site_assessments",
      equipment: "/equipment",
      bids: "/bids",
      refused: "/lost-loads/records",
      safety: "/safety",
      documents: "/records/documents",
      knowledge: "/knowledge",
      tasks: "/tasks",
      reports: "/reports",
      settings: "/settings",
    })) {
      await page.goto(`http://127.0.0.1:4177${pathname}`);
      await page.getByRole("main").waitFor();
      if (screen === "launcher") await page.getByRole("region", { name: "Applications" }).waitFor();
      else
        await page
          .getByRole("heading", {
            name: {
              customers: "Customers",
              record: "Sample Freight",
              sites: "Sites",
              assessments: "Site Assessments",
              equipment: "Equipment",
              bids: "Bids / RFPs",
              refused: "Refused Loads",
              safety: "Incidents",
              documents: "Documents",
              knowledge: "Knowledge",
              tasks: "Tasks",
              reports: "Reports",
              settings: "Settings",
            }[screen],
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
      if (screen === "launcher") {
        await checkLauncherDrag(page, context, device);
        await page.getByRole("button", { name: "Account menu", exact: true }).click();
        await page.getByRole("menu").waitFor();
        await page.keyboard.press("p");
        await page.waitForFunction(
          () => document.activeElement?.textContent?.trim() === "Personal settings",
        );
        assert.equal(
          await page
            .getByRole("combobox", { name: "Search apps and records", exact: true })
            .isVisible(),
          false,
          "Menu typeahead must not open global search",
        );
        await page.keyboard.press("Escape");
        await page.getByRole("menu").waitFor({ state: "hidden" });
        await page.evaluate(() => {
          document.body.tabIndex = -1;
          document.body.focus();
          window.__navigationMarker = "cloud-route-check";
        });
        await page.keyboard.press("c");
        const commandSearch = page.getByRole("combobox", {
          name: "Search apps and records",
          exact: true,
        });
        await commandSearch.waitFor();
        assert.equal(await commandSearch.inputValue(), "c", "Typing on the launcher starts search");
        await page.getByRole("option", { name: "Customers", exact: true }).click();
        await page.waitForURL((url) => url.pathname.replace(/\/$/, "") === "/customers");
        assert.equal(
          await page.evaluate(() => window.__navigationMarker),
          "cloud-route-check",
          "Command navigation must preserve the application document",
        );
      }
      if (screen === "documents") {
        const allDocuments = page.getByRole("button", { name: "All documents", exact: true });
        if (device === "mobile") {
          const toggle = page.getByRole("button", { name: "Folders: All documents", exact: true });
          assert.equal(await toggle.getAttribute("aria-expanded"), "false");
          assert.equal(await allDocuments.isVisible(), false);
          const searchBounds = await page.getByPlaceholder("Search documents…").boundingBox();
          assert.ok(
            searchBounds && searchBounds.y + searchBounds.height < viewport.height,
            "Mobile document search must be visible before opening folders",
          );
          await toggle.click();
          await allDocuments.waitFor();
          await page.getByRole("button", { name: "Customers", exact: true }).click();
          await page.getByRole("button", { name: "Sample Freight", exact: true }).waitFor();
          await page.screenshot({
            path: "cloud-ui-results/mobile-folders.png",
            fullPage: true,
            animations: "disabled",
          });
          await page.getByRole("button", { name: "Sample Freight", exact: true }).click();
          await page.waitForURL(/parentId=11111111-1111-4111-8111-111111111111/);
          assert.equal(await allDocuments.isVisible(), false);
          assert.equal(
            await page
              .getByRole("button", { name: "Folders: Customers", exact: true })
              .getAttribute("aria-expanded"),
            "false",
          );
        } else {
          await allDocuments.waitFor();
          assert.equal(
            await page
              .getByRole("button", { name: "Folders: All documents", exact: true })
              .isVisible(),
            false,
          );
        }
      }
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

    const readOnlyContext = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const readOnlyPage = await readOnlyContext.newPage();
    currentPage = readOnlyPage;
    readOnlyPage.on("pageerror", (error) => errors.push(error.message));
    await readOnlyPage.route("**/*", (route) => {
      const host = new URL(route.request().url()).hostname;
      if (host === "127.0.0.1") return route.continue();
      external.push(host);
      return route.abort();
    });
    await readOnlyPage.goto("http://127.0.0.1:4177/command-center?__reviewRole=read_only");
    await readOnlyPage.locator('.app-grid [data-app-id="customers"]').waitFor();
    for (const id of ["bids", "safety", "site-assessments"])
      assert.equal(
        await readOnlyPage.locator(`.app-grid [data-app-id="${id}"]`).count(),
        0,
        `Read-only launcher must not offer ${id}`,
      );
    await readOnlyPage.locator('.app-grid [data-app-id="equipment"] a').press("Alt+ArrowLeft");
    await readOnlyPage.waitForFunction(
      () => document.querySelectorAll(".app-grid [data-app-id]")[1]?.dataset.appId === "equipment",
    );
    const savedOrder = await readOnlyPage.evaluate(() =>
      JSON.parse(localStorage.getItem("heg-app-order:22222222-2222-4222-8222-222222222222")),
    );
    assert.equal(
      savedOrder.length,
      12,
      "Reordering visible apps must retain hidden apps in saved preferences",
    );
    assert.ok(savedOrder.includes("site-assessments"));
    await readOnlyPage.getByRole("button", { name: "Search everything", exact: true }).click();
    await readOnlyPage
      .getByRole("combobox", { name: "Search apps and records", exact: true })
      .waitFor();
    for (const label of ["Bids / RFPs", "Safety", "Site Assessments"])
      assert.equal(
        await readOnlyPage.getByRole("option", { name: label, exact: true }).count(),
        0,
        `Read-only command search must not offer ${label}`,
      );
    await readOnlyPage.keyboard.press("Escape");
    await readOnlyPage.goto("http://127.0.0.1:4177/customers?__reviewRole=read_only");
    await readOnlyPage
      .getByRole("checkbox", { name: "Select Sample Freight", exact: true })
      .waitFor();
    assert.equal(
      await readOnlyPage.getByRole("button", { name: "New", exact: true }).isVisible(),
      false,
      "Read-only lists must not offer record creation",
    );
    await readOnlyPage.screenshot({
      path: `cloud-ui-results/${device}-read-only-list.png`,
      fullPage: true,
      animations: "disabled",
    });
    await readOnlyPage.goto(
      "http://127.0.0.1:4177/customers/11111111-1111-4111-8111-111111111111?__reviewRole=read_only",
    );
    await readOnlyPage.getByRole("heading", { name: "Sample Freight", exact: true }).waitFor();
    for (const action of ["Edit Legal name", "Edit Commercial notes", "Archive"])
      assert.equal(
        await readOnlyPage.getByRole("button", { name: action, exact: true }).isVisible(),
        false,
        `Read-only records must not offer ${action}`,
      );
    const readOnlyChatter = readOnlyPage.getByRole("region", { name: "Chatter", exact: true });
    await readOnlyChatter.waitFor();
    for (const action of ["Send message", "Log note", "Activity"])
      assert.equal(
        await readOnlyChatter.getByRole("button", { name: action, exact: true }).isVisible(),
        false,
        `Read-only chatter must not offer ${action}`,
      );
    await readOnlyPage.screenshot({
      path: `cloud-ui-results/${device}-read-only-record.png`,
      fullPage: true,
      animations: "disabled",
    });
    assert.deepEqual(errors, [], `${device}: uncaught browser errors during role checks`);
    assert.deepEqual(external, [], `${device}: unexpected external requests during role checks`);
    await readOnlyContext.close();
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
