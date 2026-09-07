import { test, expect, chromium, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import type { PequesBackup } from "../src/modules/backup/domain/backup";

async function createChild(page: Page, name: string, sex: "female" | "male") {
  await page.getByLabel("Nombre", { exact: true }).fill(name);
  await page.getByLabel("Fecha de nacimiento", { exact: true }).fill("2024-01-01");
  await page.getByLabel("Sexo · opcional").selectOption(sex);
  await page.getByRole("button", { name: "Añadir hijo", exact: true }).last().click();
  await expect(
    page.getByRole("button", { name: `Cambiar hijo: ${name}`, exact: true }),
  ).toBeVisible();
}

async function addWeight(page: Page, grams: string) {
  await page.getByRole("button", { name: "Añadir peso", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Fecha", { exact: true }).fill("2024-04-01");
  await dialog.getByLabel("Gramos").fill(grams);
  await dialog.getByRole("button", { name: "Guardar peso" }).click();
  await expect(dialog).toHaveCount(0);
}

async function skipTutorial(page: Page) {
  await expect(page.getByRole("button", { name: "Saltar tutorial", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Saltar tutorial", exact: true }).click();
}

async function dismissTutorialIfPresent(page: Page) {
  const skipButton = page.getByRole("button", { name: "Saltar tutorial", exact: true });
  if (await skipButton.isVisible().catch(() => false)) {
    await skipButton.click();
  }
}

async function expectNoVisibleHorizontalOverflow(page: Page) {
  const result = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const offenders = [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0 &&
          rect.height > 0 &&
          !element.closest(".chartRangeToggle") &&
          (rect.left < -1 || rect.right > viewportWidth + 1)
        );
      })
      .slice(0, 8)
      .map((element) => ({
        className: element.className,
        left: Math.round(element.getBoundingClientRect().left),
        right: Math.round(element.getBoundingClientRect().right),
        text: element.textContent?.trim().slice(0, 80),
      }));
    return {
      bodyScrollWidth: document.body.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      offenders,
      viewportWidth,
    };
  });
  expect(result, JSON.stringify(result, null, 2)).toMatchObject({
    bodyScrollWidth: result.viewportWidth,
    documentScrollWidth: result.viewportWidth,
    offenders: [],
  });
}

async function expectVisibleDateTimeControlsFit(page: Page) {
  const offenders = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    return [
      ...document.querySelectorAll<HTMLInputElement>('input[type="date"], input[type="time"]'),
    ]
      .filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0 &&
          rect.height > 0
        );
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const container = element.closest("label") ?? element.parentElement;
        const containerRect = container?.getBoundingClientRect();
        return {
          name: element.getAttribute("name"),
          type: element.type,
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          containerLeft: containerRect ? Math.round(containerRect.left) : null,
          containerRight: containerRect ? Math.round(containerRect.right) : null,
          viewportWidth,
        };
      })
      .filter(
        ({ left, right, containerLeft, containerRight }) =>
          left < -1 ||
          right > viewportWidth + 1 ||
          (containerLeft !== null && left < containerLeft - 1) ||
          (containerRight !== null && right > containerRight + 1),
      );
  });
  expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([]);
}

test("mobile flows persist through browser restart and entirely offline CRUD", async ({}, testInfo) => {
  const profile = testInfo.outputPath("synthetic-browser-profile");
  let context = await chromium.launchPersistentContext(profile, {
    headless: true,
    viewport: { width: 390, height: 844 },
  });
  let page = context.pages()[0];
  const errors: string[] = [];
  const requests: { url: string; method: string; body: string | null }[] = [];
  const observe = () => {
    context.on("request", (request) =>
      requests.push({ url: request.url(), method: request.method(), body: request.postData() }),
    );
    context.on("page", (newPage) => newPage.on("pageerror", (error) => errors.push(error.message)));
    page.on("pageerror", (error) => errors.push(error.message));
  };
  observe();
  const visit = (route: string) => page.goto(`http://127.0.0.1:4178${route}`);
  await visit("/");
  await expect(page.getByRole("heading", { name: "Añade tu primer hijo" })).toBeVisible();
  await createChild(page, "Peque ficticio A", "female");
  const tutorial = page.getByRole("dialog");
  await expect(tutorial).toContainText("Empieza por el peque seleccionado");
  await tutorial.getByRole("button", { name: "Siguiente", exact: true }).click();
  await expect(tutorial).toContainText("Tu resumen, de un vistazo");
  await tutorial.getByRole("button", { name: "Atrás", exact: true }).click();
  await skipTutorial(page);
  await expect(page.getByRole("link", { name: "Conquense.dev", exact: true })).toHaveAttribute(
    "href",
    "https://conquense.dev",
  );
  await expect(
    page.getByRole("complementary", { name: "Recordatorio de copia de seguridad" }),
  ).toHaveCount(0);
  await expect(page.getByText("Lista para abrir sin conexión", { exact: true })).toBeVisible();
  await page.getByRole("navigation").getByRole("link", { name: "Peso", exact: true }).click();
  await addWeight(page, "6100");
  await expect(
    page.getByText("Referencia OMS para niñas: P3 P15 P50 P85 P97", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ver gráfica de peso a pantalla completa" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Añadir medida", exact: true }).click();
  const measurementDialog = page.getByRole("dialog");
  await measurementDialog.getByLabel("Fecha", { exact: true }).fill("2024-04-01");
  await measurementDialog.getByLabel("Centímetros", { exact: true }).fill("65");
  await measurementDialog.getByRole("button", { name: "Guardar medida" }).click();
  await expect(measurementDialog).toHaveCount(0);
  await expect(page.getByText("65 cm", { exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Gráfica", exact: true }).selectOption("bmiForAge");
  await expect(page.getByLabel("IMC para la edad", { exact: true })).toBeVisible();
  await visit("/sueno/");
  await page.getByRole("button", { name: "Iniciar siesta", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Iniciar", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Durmiendo desde/ })).toBeVisible();
  await visit("/viaje/");
  await page.getByRole("button", { name: "Añadir a la lista", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Elemento", { exact: true }).fill("Elemento ficticio");
  await page.getByRole("dialog").getByRole("button", { name: "Añadir elemento" }).click();
  await expect(
    page.getByRole("button", { name: "Marcar preparado: Elemento ficticio", exact: true }),
  ).toBeVisible();
  await visit("/ajustes/");
  await page.getByRole("button", { name: "Añadir hijo", exact: true }).click();
  await createChild(page, "Peque ficticio B", "male");
  await visit("/peso/");
  await expect(page.getByText("No hay pesos para mostrar aquí.")).toBeVisible();
  await addWeight(page, "7200");
  await expect(
    page.getByText("Referencia OMS para niños: P3 P15 P50 P85 P97", { exact: true }),
  ).toHaveCount(1);
  await context.close();

  context = await chromium.launchPersistentContext(profile, {
    headless: true,
    viewport: { width: 390, height: 844 },
  });
  await context.setOffline(true);
  page = context.pages()[0];
  observe();
  await visit("/peso/");
  await expect(
    page.getByRole("button", { name: "Cambiar hijo: Peque ficticio B", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("7200 g", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Editar peso del 2024-04-01" }).click();
  await page.getByRole("dialog").getByLabel("Gramos").fill("7300");
  await page.getByRole("dialog").getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("7300 g", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Borrar peso del 2024-04-01" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Borrar peso", exact: true }).click();
  await expect(page.getByText("No hay pesos para mostrar aquí.")).toBeVisible();
  await addWeight(page, "7400");
  for (const route of ["/", "/vacunas/", "/sueno/", "/viaje/", "/calendario/", "/ajustes/"]) {
    await visit(route);
    await expect(
      page.getByRole("button", { name: "Cambiar hijo: Peque ficticio B", exact: true }),
    ).toBeVisible();
    await expect(page.locator("main h1")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.getByRole("button", { name: "Cambiar hijo: Peque ficticio B", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("combobox", { name: "Hijo", exact: true })
    .selectOption({ label: "Peque ficticio A" });
  await page.getByRole("dialog").getByRole("button", { name: "Seleccionar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Cambiar hijo: Peque ficticio A", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await visit("/sueno/");
  await expect(page.getByRole("heading", { name: /Durmiendo desde/ })).toBeVisible();
  await visit("/peso/");
  await expect(page.getByText("6100 g", { exact: true }).first()).toBeVisible();
  await context.close();
  context = await chromium.launchPersistentContext(profile, {
    headless: true,
    viewport: { width: 390, height: 844 },
  });
  await context.setOffline(true);
  page = context.pages()[0];
  observe();
  await visit("/");
  await expect(page.getByRole("heading", { name: "Peque ficticio A", exact: true })).toBeVisible();
  await visit("/ajustes/");
  await page.getByRole("button", { name: "Ver tutorial de nuevo", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("dialog")).toContainText("Empieza por el peque seleccionado");
  await skipTutorial(page);
  await visit("/");
  await expect(page.getByRole("heading", { name: "Peque ficticio A", exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("home-mobile-offline.png"), fullPage: true });
  const cached = await page.evaluate(async () => {
    const result: string[] = [];
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        const response = await cache.match(request);
        if (/text|json|javascript/.test(response?.headers.get("content-type") ?? ""))
          result.push(await response!.text());
      }
    }
    return result;
  });
  expect(cached.length).toBeGreaterThan(10);
  expect(cached.join("")).not.toContain("Peque ficticio");
  expect(
    requests.filter(
      (request) =>
        !["GET", "HEAD"].includes(request.method) ||
        Boolean(request.body) ||
        new URL(request.url).origin !== "http://127.0.0.1:4178",
    ),
  ).toEqual([]);
  expect(JSON.stringify(requests)).not.toContain("Peque");
  expect(errors).toEqual([]);
  await context.close();
});

test("long text stays inside narrow responsive layouts", async ({ page }) => {
  const longName = "Peque con un nombre familiar extraordinariamente largo para probar el diseño";
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await createChild(page, longName, "female");
  await skipTutorial(page);

  await page.goto("/viaje/");
  await dismissTutorialIfPresent(page);
  const longItem =
    "Elemento de viaje con una descripción suficientemente larga para probar el contenedor";
  await page.getByRole("button", { name: "Añadir a la lista", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Elemento", { exact: true }).fill(longItem);
  await page.getByRole("dialog").getByRole("button", { name: "Añadir elemento" }).click();

  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of [
      "/",
      "/peso/",
      "/vacunas/",
      "/sueno/",
      "/viaje/",
      "/calendario/",
      "/ajustes/",
    ]) {
      await page.goto(route);
      await dismissTutorialIfPresent(page);
      if (route === "/peso/") {
        await page.getByRole("button", { name: "Añadir peso", exact: true }).click();
        await expectVisibleDateTimeControlsFit(page);
        await page.keyboard.press("Escape");
        await page.getByRole("button", { name: "Añadir medida", exact: true }).click();
        await expectVisibleDateTimeControlsFit(page);
        await page.keyboard.press("Escape");
      }
      if (route === "/vacunas/") {
        await page.getByRole("button", { name: "Marcar aplicada", exact: true }).first().click();
        await expectVisibleDateTimeControlsFit(page);
        await page.keyboard.press("Escape");
      }
      if (route === "/sueno/") {
        await page
          .getByRole("button", { name: "Añadir descanso manualmente", exact: true })
          .click();
        await expectVisibleDateTimeControlsFit(page);
        await page.keyboard.press("Escape");
      }
      if (route === "/ajustes/") {
        await page.getByRole("button", { name: `Editar ${longName}`, exact: true }).click();
        await expectVisibleDateTimeControlsFit(page);
        await page.keyboard.press("Escape");
      }
      await expectNoVisibleHorizontalOverflow(page);
    }
  }
});

test("vaccines, travel, strong child deletion and local backup restoration", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await createChild(page, "Peque ficticio copia", "female");
  await skipTutorial(page);
  await expect(page.getByText("Lista para abrir sin conexión", { exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.goto("/vacunas/");
  await page.getByRole("button", { name: "Marcar aplicada", exact: true }).first().click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Fecha de aplicación").fill("2024-03-05");
  await dialog.getByLabel("Lugar", { exact: true }).fill("Centro ficticio");
  await dialog.getByLabel("Lote · opcional").fill("LOTE-FICTICIO");
  await dialog.getByLabel("Notas", { exact: true }).fill("Nota ficticia de prueba");
  await dialog.getByRole("button", { name: "Guardar vacuna" }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole("button", { name: "Editar aplicación", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Lugar", { exact: true })
    .fill("Centro ficticio editado");
  await page.getByRole("dialog").getByRole("button", { name: "Guardar vacuna" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText(/Centro ficticio editado/)).toBeVisible();
  await page.goto("/peso/");
  await addWeight(page, "6300");
  await page.goto("/viaje/");
  await page.getByRole("button", { name: "Añadir a la lista", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Elemento", { exact: true }).fill("Bolsa ficticia");
  await page.getByRole("dialog").getByRole("button", { name: "Añadir elemento" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Marcar preparado: Bolsa ficticia", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Marcar pendiente: Bolsa ficticia", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Reiniciar lista", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Reiniciar lista", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Marcar preparado: Bolsa ficticia", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.goto("/ajustes/");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar copia", exact: true }).click();
  const download = await downloadPromise;
  const contents = await readFile((await download.path())!, "utf8");
  const backup = JSON.parse(contents) as PequesBackup;
  expect(backup).toMatchObject({ format: "peques-backup", schemaVersion: 3 });
  expect(backup.data.children).toHaveLength(1);
  expect(backup.data.weightEntries).toHaveLength(1);
  expect(backup.data.plannedVaccineDoses).toHaveLength(22);
  expect(backup.data.appliedVaccineDoses).toHaveLength(1);
  expect(backup.data.travelChecklistItems).toHaveLength(1);
  await expect(
    page.getByRole("complementary", { name: "Recordatorio de copia de seguridad" }),
  ).toHaveCount(0);
  const invalid = structuredClone(backup);
  invalid.data.weightEntries[0].childId = "00000000-0000-4000-8000-000000000001";
  await page.getByLabel("Importar copia").setInputFiles({
    name: "invalid-fictitious.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(invalid)),
  });
  await expect(
    page.getByRole("region", { name: "Copias de seguridad" }).getByRole("alert"),
  ).toContainText("registros sin hijo");
  await page.getByRole("button", { name: "Eliminar Peque ficticio copia", exact: true }).click();
  dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Pesos");
  await expect(dialog).toContainText("Vacunas aplicadas");
  await dialog.getByLabel("Escribe Peque ficticio copia para confirmar").fill("Nombre incorrecto");
  await dialog.getByRole("button", { name: "Eliminar hijo y sus datos" }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await dialog
    .getByLabel("Escribe Peque ficticio copia para confirmar")
    .fill("Peque ficticio copia");
  await dialog.getByRole("button", { name: "Eliminar hijo y sus datos" }).click();
  await expect(page.getByRole("heading", { name: "Añade tu primer hijo" })).toBeVisible();
  await page.getByLabel("Importar copia").setInputFiles({
    name: "fictitious-copy.json",
    mimeType: "application/json",
    buffer: Buffer.from(contents),
  });
  await expect(
    page.getByRole("heading", { name: "Revisar copia antes de restaurar" }),
  ).toBeVisible();
  await page.getByLabel("Escribe RESTAURAR para confirmar").fill("RESTAURAR");
  await page.getByRole("button", { name: "Restaurar copia" }).click();
  await expect(
    page.getByRole("button", { name: "Cambiar hijo: Peque ficticio copia", exact: true }),
  ).toBeVisible();
  await page.goto("/peso/");
  await expect(page.getByText("6300 g", { exact: true }).first()).toBeVisible();
  await page.goto("/vacunas/");
  await expect(page.getByText(/Centro ficticio editado/)).toBeVisible();
  await page.getByRole("button", { name: "Volver a pendiente", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Volver a pendiente", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Editar aplicación", exact: true })).toHaveCount(0);
  await page.goto("/viaje/");
  await expect(
    page.getByRole("button", { name: "Editar Bolsa ficticia", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Borrar Bolsa ficticia", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Borrar elemento", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("Bolsa ficticia", { exact: true })).toHaveCount(0);
});

test("installable manifest, standalone vaccine and offline sleep shortcut", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await createChild(page, "Peque ficticio atajo", "male");
  await skipTutorial(page);
  await expect(page.getByText("Lista para abrir sin conexión", { exact: true })).toBeVisible();
  const cdp = await context.newCDPSession(page);
  const manifest = await cdp.send("Page.getAppManifest");
  expect(manifest.errors).toEqual([]);
  expect(JSON.parse(manifest.data!)).toMatchObject({
    name: "Peques",
    display: "standalone",
    start_url: "/",
  });
  expect((await cdp.send("Page.getInstallabilityErrors")).installabilityErrors).toEqual([]);
  await context.setOffline(true);
  await page.goto("/sueno/atajo/?type=noche");
  await expect(page).toHaveURL(/\/sueno\/$/);
  await expect(page.getByRole("heading", { name: /Durmiendo desde/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: /Durmiendo desde/ })).toBeVisible();
  await page.goto("/sueno/atajo/");
  await expect(page).toHaveURL(/\/sueno\/$/);
  await expect(page.getByRole("heading", { name: /Durmiendo desde/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Editar noche de/ })).toBeVisible();
  await page.goto("/vacunas/");
  await page.getByRole("button", { name: "Añadir vacuna aplicada", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Vacuna", { exact: true }).fill("Vacuna ficticia independiente");
  await dialog.getByLabel("Dosis", { exact: true }).fill("Dosis ficticia");
  await dialog.getByLabel("Lugar", { exact: true }).fill("Centro ficticio");
  await dialog.getByRole("button", { name: "Guardar vacuna" }).click();
  await expect(dialog).toHaveCount(0);
  await page
    .getByRole("button", {
      name: "Editar aplicación de Vacuna ficticia independiente",
      exact: true,
    })
    .click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Notas", { exact: true }).fill("Nota ficticia independiente");
  await dialog.getByRole("button", { name: "Guardar vacuna" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText("Nota ficticia independiente", { exact: true })).toBeVisible();
  await page
    .getByRole("button", {
      name: "Borrar aplicación de Vacuna ficticia independiente",
      exact: true,
    })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Borrar aplicación", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("Nota ficticia independiente", { exact: true })).toHaveCount(0);
});

test("child editing, identified family calendar and keyboard checklist ordering", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await createChild(page, "Peque ficticio calendario A", "female");
  await skipTutorial(page);
  await expect(page.getByText("Lista para abrir sin conexión", { exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.goto("/ajustes/");
  await page
    .getByRole("button", { name: "Editar Peque ficticio calendario A", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Nombre", { exact: true })
    .fill("Peque ficticio editado");
  await page
    .getByRole("dialog")
    .getByLabel("Identificador sanitario · opcional")
    .fill("ID-FICTICIO");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Guardar cambios", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Cambiar hijo: Peque ficticio editado", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Añadir hijo", exact: true }).click();
  await createChild(page, "Peque ficticio calendario B", "male");
  await page.goto("/calendario/");
  await expect(
    page
      .locator("main")
      .getByRole("button", { name: /Peque ficticio calendario B ·/ })
      .first(),
  ).toBeVisible();
  await expect(
    page.locator("main").getByRole("button", { name: /Peque ficticio editado ·/ }),
  ).toHaveCount(0);
  await page.getByLabel("Todos los hijos").click();
  await expect(page.getByLabel("Todos los hijos")).toBeChecked();
  const aEvent = page
    .locator("main")
    .getByRole("button", { name: /Peque ficticio editado ·/ })
    .first();
  await expect(aEvent).toBeVisible();
  await aEvent.click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Ir al registro", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Cambiar hijo: Peque ficticio editado", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/vacunas\/$/);
  await page.goto("/viaje/");
  for (const label of ["Elemento ficticio A", "Elemento ficticio B"]) {
    await page.getByRole("button", { name: "Añadir a la lista", exact: true }).click();
    await page.getByRole("dialog").getByLabel("Elemento", { exact: true }).fill(label);
    await page.getByRole("dialog").getByRole("button", { name: "Añadir elemento" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  const rows = page.locator("li[data-travel-item-id] strong");
  await expect(rows).toHaveText(["Elemento ficticio A", "Elemento ficticio B"]);
  await page.getByRole("button", { name: "Mover Elemento ficticio B", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(page.locator('li[data-dragging="true"]').first()).toBeVisible();
  await page.keyboard.press("ArrowUp");
  await expect(rows.first()).toHaveText("Elemento ficticio B");
  await page.keyboard.press("Space");
  await expect(page.getByText("Orden guardado.", { exact: true })).toBeAttached();
  await expect(rows).toHaveText(["Elemento ficticio B", "Elemento ficticio A"]);
  await page.reload();
  await expect(rows).toHaveText(["Elemento ficticio B", "Elemento ficticio A"]);
  await page.getByRole("button", { name: "Dónde está", exact: true }).click();
  await expect(rows).toHaveText(["Elemento ficticio A", "Elemento ficticio B"]);
  await page.getByRole("button", { name: "Preparar", exact: true }).click();
  await expect(rows).toHaveText(["Elemento ficticio B", "Elemento ficticio A"]);
});
