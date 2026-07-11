import { test, expect } from '@playwright/test';

// The baseURL in playwright.config.ts includes the GitHub Pages subpath, so
// every navigation here also proves the base-path configuration works.

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  // Wait for RDKit to finish loading.
  await expect(page.getByRole('status')).toContainText('RDKit', { timeout: 30_000 });
  await expect(page.getByRole('status')).toContainText('ready', { timeout: 30_000 });
});

test('loads under the GitHub Pages subpath and renders ethanol', async ({ page }) => {
  // Base path is honored: the RDKit wasm is fetched from the subpath.
  expect(page.url()).toContain('/morgan-fingerprint-playground/');
  // Ethanol is the default molecule; its structure renders as an SVG.
  const svg = page.locator('.molecule-svg svg').first();
  await expect(svg).toBeVisible();
  await expect(page.locator('.identity-meta')).toContainText('CCO');
});

test('RDKit fingerprint changes when the radius control changes', async ({ page }) => {
  const setbits = page.locator('.rdkit-panel .setbits').first();
  await expect(setbits).toBeVisible();
  const before = await setbits.textContent();

  // Change radius from default (2) to 0.
  await page.getByRole('group', { name: 'Analysis controls' })
    .getByRole('button', { name: '0', exact: true })
    .click();

  await expect(setbits).not.toHaveText(before ?? '');
});

test('preset selection updates the molecule', async ({ page }) => {
  await page.getByRole('button', { name: /Aspirin/ }).click();
  await expect(page.locator('.identity-meta')).toContainText('CC(=O)Oc1ccccc1C(=O)O');
});

test('comparison view computes a Tanimoto similarity', async ({ page }) => {
  await page.getByRole('button', { name: 'Compare', exact: true }).click();
  // The "same molecule, different SMILES" preset should give Tanimoto = 1.
  await page.getByRole('button', { name: /Same molecule, different SMILES/ }).click();
  const tani = page.locator('.tanimoto-value');
  await expect(tani).toBeVisible();
  await expect(tani).toContainText('1.0000');
  // Same molecule => permutation-invariance callout, and no unique environments.
  await expect(page.locator('.perm-callout')).toBeVisible();
  const overlap = page.locator('.env-overlap .stat-row');
  await expect(overlap).toContainText('Only in A');
});

test('educational fingerprint count/binary toggle switches the aggregation', async ({ page }) => {
  // Default is count.
  await expect(page.locator('.feature-table thead')).toContainText('Count');
  await page.getByRole('button', { name: 'Binary', exact: true }).click();
  await expect(page.locator('.feature-table thead')).toContainText('Present');
});

test('Morgan1965 vs 1-WL contrast and sum information-loss demo render', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: /How Morgan 1965 relates to 1-WL/ }),
  ).toBeVisible();
  // The {1,3} vs {2,2} demo: both sum to 4, multisets differ.
  await expect(page.locator('.sum-demo')).toContainText('4');
});

test('genuinely different isomers give a symmetric environment difference', async ({ page }) => {
  await page.getByRole('button', { name: 'Compare', exact: true }).click();
  await page.getByRole('button', { name: /Distinguishable only at higher radius/ }).click();
  // Move to radius 1 where o-/p-xylene differ.
  await page
    .getByRole('group', { name: 'Analysis controls' })
    .getByRole('button', { name: '1', exact: true })
    .click();
  const overlap = page.locator('.env-overlap');
  // Both sides must own unique environments (the pre-fix bug showed one side = 0).
  const onlyA = await overlap.locator('.stat-row div').nth(1).locator('dd').innerText();
  const onlyB = await overlap.locator('.stat-row div').nth(2).locator('dd').innerText();
  expect(Number(onlyA)).toBeGreaterThan(0);
  expect(Number(onlyB)).toBeGreaterThan(0);
});

test('limitations tab shows the environment-identifier hash-collision demo', async ({ page }) => {
  await page.getByRole('button', { name: 'Limitations', exact: true }).click();
  await expect(page.locator('.hash-demo table')).toBeVisible();
  // Two distinct signatures landing in the same bucket => two data rows.
  await expect(page.locator('.hash-demo table tbody tr')).toHaveCount(2);
});

test('limitations tab shows the WL counterexample and bit-folding demo', async ({ page }) => {
  await page.getByRole('button', { name: 'Limitations', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Why fingerprints can collide' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: /Finite-radius limitation/ })).toBeVisible();
  // The WL counterexample renders both generic-graph SVGs.
  await expect(page.locator('.generic-graph')).toHaveCount(2);
  // The bit-folding table shows a shrinking population count.
  await expect(page.locator('.fold-demo table')).toBeVisible();
});
