import assert from "node:assert/strict";

/** Native Chromium input in an isolated cloud context; never desktop automation. */
export async function checkLauncherDrag(page, context, device) {
  await page.waitForFunction(
    () => !document.querySelector('[aria-label="Reset app order"]')?.disabled,
  );
  const tiles = page.locator(".app-grid [data-app-id]");
  const original = await tiles.evaluateAll((elements) =>
    elements.map((element) => element.dataset.appId),
  );
  const source = await tiles.nth(0).boundingBox();
  const target = await tiles.nth(1).boundingBox();
  assert.ok(source && target);
  const start = { x: source.x + source.width / 2, y: source.y + source.height / 2 };
  const end = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
  const touch = device === "mobile" ? await context.newCDPSession(page) : null;
  if (touch) {
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ ...start, id: 1 }],
    });
  } else {
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
  }
  await page.locator(".launcher-drag-preview").waitFor();
  if (touch) {
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ ...end, id: 1 }],
    });
    await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await touch.detach();
  } else {
    await page.mouse.move(end.x, end.y, { steps: 8 });
    await page.mouse.up();
  }
  await page.waitForFunction(
    (first) => document.querySelector(".app-grid [data-app-id]")?.dataset.appId === first,
    original[1],
  );
  assert.equal(new URL(page.url()).pathname, "/command-center", "Drag must not open an app");
  const expected = [original[1], original[0], ...original.slice(2)];
  assert.deepEqual(
    await tiles.evaluateAll((elements) => elements.map((element) => element.dataset.appId)),
    expected,
  );
  await page.reload();
  await page.waitForFunction(
    (first) => document.querySelector(".app-grid [data-app-id]")?.dataset.appId === first,
    original[1],
  );
  assert.deepEqual(
    await tiles.evaluateAll((elements) => elements.map((element) => element.dataset.appId)),
    expected,
    "Launcher order must survive reload on this device",
  );
}
