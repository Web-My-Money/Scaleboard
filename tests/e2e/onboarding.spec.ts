import { test, expect } from "@playwright/test";

/**
 * Smoke E2E. Mocks the AI structurer streaming endpoint so the test doesn't
 * need a real ANTHROPIC_API_KEY.
 */
test("first-run admin → create client → paste → approve → brief persists", async ({ page, request }) => {
  // Mock the AI structurer stream — return a single valid JSON chunk.
  await page.route("**/api/clients/*/brief/structure", async (route) => {
    const body = JSON.stringify({
      type: "delta",
      text: JSON.stringify({
        offer: "Test offer",
        icp: "Test ICP",
        usp: "Test USP",
        competitors: [{ name: "Acme", slug: "acme" }],
        kpi: "MRR",
        budget: "$10k/mo",
        language: "en",
      }),
    });
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: `data: ${body}\n\ndata: ${JSON.stringify({ type: "done" })}\n\n`,
    });
  });

  await page.goto("/");

  if (await page.getByText(/Create the initial admin|Crea el administrador inicial/i).isVisible()) {
    await page.getByLabel(/Name|Nombre/i).fill("Test Admin");
    await page.getByLabel(/Email|Correo electrónico/i).fill("admin@wmm.test");
    await page.getByRole("button", { name: /Create admin|Crear administrador/i }).click();
    await page.waitForLoadState("networkidle");
  }

  await page.getByRole("link", { name: /New client|Nuevo cliente/i }).first().click();
  await page.getByLabel(/Client name|Nombre del cliente/i).fill("Smoke Co");
  await page.getByLabel(/Vertical/i).fill("SaaS");
  await page.getByRole("button", { name: /Create client|Crear cliente/i }).click();

  await page.getByPlaceholder(/Paste the full brief|Pega aquí el brief completo/i).fill(
    "Smoke test brief: we sell test widgets to test PMs.",
  );
  await page.getByRole("button", { name: /Structure with AI|Estructurar con IA/i }).click();

  await page.getByRole("button", { name: /Approve brief|Aprobar brief/i }).click();
  await expect(page).toHaveURL(/\/clients\/smoke-co\/brief/);
  await expect(page.getByText("Test offer")).toBeVisible();
});
