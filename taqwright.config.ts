import { defineConfig, Platform } from '@taqwright/taqwright';

// Where these tests run.
//
// ── THE THREE THINGS TO EDIT ──────────────────────────────────────────────────────────
// Search this file for EDIT ME. Everything else is a default worth keeping, and the
// comments explain why — they are the scars of getting each one wrong.
//
// ANDROID ONLY. An App Store IPA is FairPlay-encrypted and cannot be uploaded to the
// grid, so iOS waits for a build from the app team.
//
// The project targets TestMu AI (LambdaTest) real devices. The device and OS are
// repository VARIABLES rather than literals so the grid can be repointed without a
// commit, and they are variables rather than secrets deliberately: a device name is
// not a credential, and masking it would hide the one fact you need in the log when
// a session fails to allocate.
//
// EVERY fallback below is `||`, never `??`. A workflow_dispatch input nobody filled in
// arrives as an EMPTY STRING, and `??` falls back only on null/undefined — so on a
// pull_request run buildPath resolved to '' and taqwright died in the provider's
// globalSetup with "Build path not found", a message that points at this file, where the
// value is in fact present.
//
// `buildPath` is the app under test. A value starting `lt://` is already on the grid
// and is passed straight through — taqwright uploads nothing. The env var is the seam
// for later: when your app repository starts dispatching its own builds it supplies
// LT_APP_ID_ANDROID / LT_APP_ID_IOS and nothing here changes.
//
// THE LITERALS BELOW ARE THE LOCAL DEFAULTS, not the CI ones. In CI the workflow supplies
// LT_APP_ID_ANDROID (regression.yml's DEFAULT_APP_ID_ANDROID), because the workflow must
// also tell LIME which build it ran and it cannot read this file. The two have to name the
// same build or a report describes something the suite did not install, so regression.yml
// greps this file for its own default and fails the run if they have drifted.
// Change one, change the other.
//
// Credentials are never named here. The provider reads LAMBDATEST_USERNAME and
// LAMBDATEST_ACCESS_KEY from the environment itself.
export default defineConfig({
  // The default 30s is a LOCAL-device number. On a cloud grid the same clock also
  // has to cover queueing for a real handset and installing the build onto it, and
  // a first run here will spend its whole 30s inside session creation — timing out
  // before the app is on screen, with no locator ever attempted. Nothing about the
  // test is slow; the budget is measuring something else.
  timeout: 180_000,
  // The per-assertion budget, which is the one that should stay tight: once the
  // app IS up, an element that takes 30s to appear is a real problem.
  expectTimeout: 30_000,
  // WITHIN a file as well as across files. Playwright parallelises whole FILES by
  // default, so five workers over five spec files happens to fill all five — and the
  // day two of your tests live in one file, that file goes back to running serially
  // and the grid sits idle for half the run. This makes the unit a TEST, not a file.
  fullyParallel: true,
  projects: [
    {
      name: 'android',
      // HOW MANY SESSIONS ON THE GRID AT ONCE. taqwright defaults to one worker, not to
      // Playwright's CPU count, because a device is a single physical thing — but a cloud
      // grid supplies as many devices as the plan allows, so the limit here is your TestMu AI
      // parallel-session allowance and not this machine.
      //
      // Set on the PROJECT rather than at the top level on purpose. A top-level `workers`
      // would also apply to `ios`, and both projects would then draw this many sessions
      // each from one shared allowance.
      //
      // If your plan allows fewer, the surplus sessions QUEUE at allocation rather than
      // failing fast, and `timeout` above has to cover that queueing as well as the
      // install — so an over-subscribed run reads as test timeouts rather than as a
      // capacity limit. Lower this number before raising that clock.
      workers: 5,
      use: {
        platform: Platform.ANDROID,
        // EDIT ME (1/3) — the app's Android package name. With the app installed:
        //   adb shell pm list packages | grep -i aia
        //
        // The failure-screen hook reads this to say which app a captured screen belongs
        // to, and a screen stored without one is unattached to every memory LIME keeps
        // about this app.
        appBundleId: 'com.aiahk.idirect',
        // EDIT ME (2/3) — the Android build on the grid.
        //
        // Pull the APK off a device that installed it from the Play Store
        // (`adb shell pm path <package>`, then `adb pull`). If that lists several paths it
        // is a split install and the pieces must be merged into one APK before upload.
        // Upload it to TestMu AI yourself and paste the `lt://…` id it returns.
        // Binaries never pass through LIME: it takes the provider's id, not the file.
        //
        // `||`, NOT `??`. A workflow_dispatch input that nobody filled in arrives as
        // an EMPTY STRING, and `??` only falls back on null/undefined — so every
        // pull_request run resolves buildPath to '' and dies in the provider's
        // globalSetup with "Build path not found".
        buildPath:
          process.env.LT_APP_ID_ANDROID || 'lt://APP1016034431791954062358902',
        device: {
          provider: 'lambdatest',
          // EDIT ME (3/3) — or leave these and set LT_ANDROID_DEVICE / LT_ANDROID_OS as
          // repository variables, which is how you repoint the grid without a commit.
          name: process.env.LT_ANDROID_DEVICE || 'Galaxy S24',
          osVersion: process.env.LT_ANDROID_OS || '16',
        },
      },
    },
    {
      // A local Android emulator, for running on this machine without the grid:
      //   LOCAL_APK_PATH=/path/to/app.apk npx taqwright test --project android-local
      // The path comes from the environment because an APK lives outside the repository.
      // One emulator is one device, so one worker.
      name: 'android-local',
      workers: 1,
      use: {
        platform: Platform.ANDROID,
        appBundleId: 'com.aiahk.idirect',
        buildPath: process.env.LOCAL_APK_PATH || '',
        // A fresh install before every test, as the grid gives each test a fresh session. Without
        // it a test inherits the last one's state (the agreement already accepted) and fails.
        resetBetweenTests: true,
        // The login form is a WebView: Appium fetches the chromedriver that matches the device's.
        capabilities: { 'appium:chromedriverAutodownload': true },
        // Start Appium and boot the emulator if they are not already up.
        appium: { autoStart: true, autoStartDevice: true },
        device: {
          provider: 'emulator',
          name: process.env.LOCAL_AVD || 'lime_dev_a35',
        },
      },
    },
  ],
});
