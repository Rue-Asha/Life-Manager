import { expect, test, type Page } from "@playwright/test";
import { reset, seed, setClock } from "./helpers";

test.beforeEach(async ({ request }) => {
  await reset(request);
  await setClock(request, null);
});

const UNI = { name: "Uni", color: "lavender", icon: "book" } as const;
const HEALTH = { name: "Health", color: "sage", icon: "heart" } as const;

async function semesterAction(page: Page, semester: string, action: string) {
  const section = page
    .getByTestId("semester-section")
    .filter({
      has: page.getByRole("heading", { name: semester, exact: true }),
    });
  await section.getByRole("button", { name: "Semester actions" }).click();
  await page.getByRole("menuitem", { name: action }).click();
}

test("Scenario: First run prompts for the Uni aspect", async ({
  page,
  request,
}) => {
  await seed(request, { aspects: [HEALTH, UNI] });
  await page.goto("/uni");

  const prompt = page.getByTestId("uni-aspect-prompt");
  await expect(prompt).toBeVisible();
  await expect(page.getByTestId("semester-section")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "New semester" })).toHaveCount(
    0,
  );
  await expect(prompt.getByRole("radio", { name: "Uni" })).toBeChecked();
  await prompt.getByRole("button", { name: "Use Uni for classes" }).click();

  await expect(prompt).toHaveCount(0);
  await expect(page.getByTestId("uni-aspect")).toHaveText("Uni");
  await expect(
    page.getByRole("button", { name: "New semester" }).first(),
  ).toBeVisible();
});

test("Scenario: Changing the Uni aspect removes links after confirmation", async ({
  page,
  request,
}) => {
  await seed(request, {
    aspects: [UNI, HEALTH],
    uniAspect: 0,
    semesters: [{ name: "WS 26/27" }],
    classes: [{ semester: 0, name: "Analysis II" }],
    todos: [
      { title: "Sheet 1", aspect: 0, class: 0, type: "EXC" },
      {
        title: "Sheet 2",
        aspect: 0,
        class: 0,
        type: "EXC",
        revisedAt: "2026-10-01",
      },
    ],
    rules: [
      {
        title: "Lecture notes",
        aspect: 0,
        weekdays: [1],
        class: 0,
        type: "LEC",
      },
    ],
  });
  await page.goto("/uni");
  await expect(page.getByTestId("class-card")).toContainText("2 open");

  await page.getByRole("button", { name: "Change Uni aspect" }).click();
  const prompt = page.getByTestId("uni-aspect-prompt");
  await prompt.getByRole("radio", { name: "Health" }).check();
  await prompt.getByRole("button", { name: "Use Health for classes" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("3 todos and rules");
  await dialog
    .getByRole("button", { name: "Remove 3 links and change" })
    .click();

  await expect(page.getByTestId("uni-aspect")).toHaveText("Health");
  await expect(page.getByTestId("class-card")).toContainText("0 open");

  // No link is left anywhere: switching back needs no confirmation.
  await page.getByRole("button", { name: "Change Uni aspect" }).click();
  await prompt.getByRole("radio", { name: "Uni" }).check();
  await prompt.getByRole("button", { name: "Use Uni for classes" }).click();
  await expect(page.getByTestId("uni-aspect")).toHaveText("Uni");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("Scenario: Changing the Uni aspect without links needs no confirmation", async ({
  page,
  request,
}) => {
  await seed(request, {
    aspects: [UNI, HEALTH],
    uniAspect: 0,
    semesters: [{ name: "WS 26/27" }],
    classes: [{ semester: 0, name: "Analysis II" }],
  });
  await page.goto("/uni");

  await page.getByRole("button", { name: "Change Uni aspect" }).click();
  const prompt = page.getByTestId("uni-aspect-prompt");
  await prompt.getByRole("radio", { name: "Health" }).check();
  await prompt.getByRole("button", { name: "Use Health for classes" }).click();

  await expect(page.getByTestId("uni-aspect")).toHaveText("Health");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("Scenario: Without aspects Uni leads to creating one", async ({
  page,
}) => {
  await page.goto("/uni");
  await expect(page).toHaveURL(/\/welcome$/);
});
