import { test } from '@taqwright/taqwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * WHEN A TEST FAILS, KEEP THE SCREEN IT DIED ON.
 *
 * `lime-cli report --screens <dir>` posts one of these per failure. LIME parses the page
 * source at the door, keeps a screen signature, the screen's labels and the elements a
 * locator could name, and DISCARDS THE SOURCE — it never holds raw page source at rest.
 *
 * What that buys is the sentence after "an element was not found": LIME compares the screen
 * with what it remembers of this app and, when a control was simply renamed between two
 * builds, says what it was renamed TO.
 *
 * A HOOK FILE, IMPORTED FOR ITS SIDE EFFECT, rather than a fixture. A fixture would have to
 * wrap `mobile`, and a capture that can break the fixture it hangs off is a capture that can
 * fail a passing test. Playwright applies `afterEach` from any file a spec imports, so the
 * cost of the seam is one import line per spec and nothing else.
 */

// ABSOLUTE, resolved against the process that started the run. A bare 'lime-screens' is
// resolved against each Playwright WORKER's cwd, and the reporter resolves its own against
// the shell step's -- two answers to one question, and the failure mode is a file written
// somewhere nothing looks for it, reported as "no screens to send".
const DIR = resolve(process.env.LIME_SCREENS_DIR || 'lime-screens');

/** The board's key for this journey — the spec already declares it for the reporter. */
function scenarioKeyOf(annotations: readonly { type: string; description?: string }[]): string {
  const hit = annotations.find((a) => a.type === 'taqwright-scenario');
  return hit?.description ?? '';
}

/**
 * A FILENAME, NOT AN IDENTITY. The scenario key holds `/` and `:` and cannot be one, so the
 * key travels inside the file and this only has to be unique — which the test's own title
 * and project make it.
 */
function safeName(title: string, project: string): string {
  return `${project}-${title}`.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80).toLowerCase();
}

/** The bundle id the project under test declares — `use.appBundleId` in taqwright.config.ts. */
function appBundleIdOf(testInfo: { project: { use: unknown } }): string {
  const use = testInfo.project.use as { appBundleId?: string } | undefined;
  return typeof use?.appBundleId === 'string' ? use.appBundleId : '';
}

test.afterEach(async ({ mobile }, testInfo) => {
  // A pass has no screen worth keeping.
  if (testInfo.status === testInfo.expectedStatus) return;

  const scenario = scenarioKeyOf(testInfo.annotations);
  // Without the key LIME cannot attach this to a journey, and an unattached capture is a
  // few kilobytes nobody can reach. Said in the report rather than thrown.
  if (!scenario) {
    await testInfo.attach('lime-screen', {
      body: 'no taqwright-scenario annotation on this test; nothing captured',
    });
    return;
  }

  // An unattached capture reaches LIME and explains nothing, so it is worth one line in
  // the report rather than a silent orphan in the database.
  if (!process.env.LIME_APP_ID && !appBundleIdOf(testInfo)) {
    await testInfo.attach('lime-screen', {
      body: 'no appBundleId on this project and no LIME_APP_ID; the screen will be stored unattached',
    });
  }

  try {
    const pageSource = await mobile.viewTree();
    // NEVER SILENT. This was a bare `return`, and it is the one path that produces no file
    // AND no explanation -- so "no screens to send" was indistinguishable from a hook that
    // never ran, a session already torn down, and a file written to the wrong directory.
    if (!pageSource) {
      await testInfo.attach('lime-screen', {
        body: `viewTree() returned nothing (${typeof pageSource}); no screen captured for ${scenario}`,
      });
      return;
    }
    mkdirSync(DIR, { recursive: true });
    const file = join(DIR, `${safeName(testInfo.title, testInfo.project.name)}.json`);
    writeFileSync(
      file,
      JSON.stringify({
        scenario,
        platform: testInfo.project.name,
        // WHICH APP THIS SCREEN BELONGS TO, and it is not optional. LIME keys everything it
        // remembers on the app id -- the App Map above all -- and `appScreenLabels` returns
        // an empty list on its FIRST line when this is blank. That is the memory a rename
        // proposal is compared against, so an unattached screen can be stored, read back,
        // and still explain nothing.
        //
        // Taken from the taqwright project rather than an environment variable: the config
        // already declares it per platform, and a second place to state it is a second
        // place for iOS to be forgotten.
        app_id: process.env.LIME_APP_ID || appBundleIdOf(testInfo) || '',
        page_source: pageSource,
      }),
    );
    // WHERE IT WENT, in the log. The reporter reads a directory it resolves separately;
    // when the two disagree this line and its "no screens to send" sit side by side.
    await testInfo.attach('lime-screen', { body: `captured ${pageSource.length} bytes to ${file}` });
  } catch (err) {
    // NOTHING HERE MAY REDDEN A RUN. A capture is context for a result that is already
    // recorded; the result is the thing that matters, and a screenshot of the wreckage
    // failing to save must not become a second failure.
    await testInfo.attach('lime-screen', {
      body: `could not capture the screen: ${(err as Error).message}`,
    });
  }
});
