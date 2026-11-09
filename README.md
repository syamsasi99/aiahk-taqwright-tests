# aiahk-taqwright-tests: AIA+ HK mobile UI tests

Automated UI tests for the **AIA+ HK Android app**, written with
[Taqwright](https://taqwright.dev), the open-source mobile test framework (Appium underneath,
Playwright's test runner on top). They run on a local Android emulator or on real devices in
the **TestMu AI** (formerly LambdaTest) cloud.

The tests were recorded by driving the real app with Taqwright LIME and then turned into
Taqwright specs with page objects. Every locator was read from the app itself: none are
guessed, and none are screen coordinates, so the same test runs on any Android handset.

## What is covered

Guest mode only. No test signs in, and **no test ever submits anything** (an enquiry, a
callback request, a registration or an OTP request would reach real people at AIA).

| Test | Journey | Status |
|---|---|---|
| [`GuestUserViewsHome.spec.ts`](tests/GuestUserViewsHome.spec.ts) | First launch → agree → *Explore as a guest* → home shows *Log in/sign up* | ✅ passing |
| [`LoginWithInvalidCredentials.spec.ts`](tests/LoginWithInvalidCredentials.spec.ts) | Home → *Log in/sign up* → wrong login ID and password → *"Wrong login ID or password"*, still on the login screen | ✅ passing |
| [`SwitchLanguageAsGuest.spec.ts`](tests/SwitchLanguageAsGuest.spec.ts) | Menu → *Profile & settings* → *Language* → 繁體中文, check home is in Chinese, then back to English | ✅ passing |

Last verified: 9 Nov 2026, on a local Android 15 emulator with **AIA+ HK 5.21.2**
(the Oct 2026 build).

## Requirements

- **Node.js 24 or newer**, then `npm install`.
- **For local runs:** the Android SDK with an emulator (AVD), and Appium 3. Taqwright starts
  Appium and boots the emulator itself. To install the whole toolchain in one go:
  `npx taqwright install --with-avd`.
- **For cloud runs:** a TestMu AI account, with the app build uploaded to it.

## Running the tests

### On a local emulator

```bash
LOCAL_APK_PATH="/path/to/AIA+ HK.apk" npx taqwright test --project android-local
```

The APK is not in this repository (it is ~147 MB, over GitHub's file limit). The default
emulator is `lime_dev_a35`; pick another with `LOCAL_AVD=<avd name>`. The app is reinstalled
before every test, so each test starts from a fresh first launch.

### On TestMu AI (real devices)

1. Upload the APK to TestMu AI and copy the `lt://APP…` id it returns.
2. Put that id in [`taqwright.config.ts`](taqwright.config.ts) (`buildPath` in the `android`
   project) **and** in `DEFAULT_APP_ID_ANDROID` in
   [`.github/workflows/regression.yml`](.github/workflows/regression.yml); CI fails if the two
   disagree. Or set `LT_APP_ID_ANDROID` for a single run.
3. Set your credentials (TestMu AI → Account Settings → Password & Security). Copy
   `.env.example` to `.env` (git-ignored), fill it in, then:

```bash
set -a; source .env; set +a
npx taqwright test --project android
```

The default handset is a Galaxy S24 on Android 16. To use another for one run, without
editing anything:

```bash
LT_ANDROID_DEVICE="Pixel 8" LT_ANDROID_OS=14 npx taqwright test --project android
```

> **Note:** the build id currently in the config is the **Sep 2026** upload. Upload the
> Oct 2026 build (5.21.2) and update the id before relying on cloud results.

### Checking without a device

```bash
npx tsc --noEmit        # type-checks every test and page object in seconds
```

## In CI (GitHub Actions)

| Workflow | When | What it runs |
|---|---|---|
| [`taqwright-tests.yml`](.github/workflows/taqwright-tests.yml) | every pull request, or by hand | the tests the pull request changed (by hand: all of them) |
| [`regression.yml`](.github/workflows/regression.yml) | by hand (a nightly schedule is included, commented out) | the whole suite, on any build and device you choose |

Repository secrets: `LAMBDATEST_USERNAME`, `LAMBDATEST_ACCESS_KEY`, and optionally
`LIME_CI_TOKEN` (reports results to the Taqwright LIME dashboard; reporting never fails a build).

## How the tests are organised

| Path | What it holds |
|---|---|
| `tests/*.spec.ts` | one file per journey: the steps and the assertions |
| `tests/pages/` | one **page object** per screen; every locator lives here and only here |
| `tests/hooks/capture-failure-screen.ts` | keeps the screen a failing test stopped on, to diagnose it. Do not delete |
| `taqwright.config.ts` | devices, the app build, timeouts |
| `AGENTS.md` | notes for whoever adds the next test, a person or an AI coding agent |

A test reads like the journey it checks:

```ts
await home.loginSignupButton.click();
await login.webContentLoaded.waitFor();
await mobile.switchToWebView();
await login.signInNameField.fill('invaliduser');
await login.passwordField.fill('invalidpass');
await login.loginButton.click();
await expect(login.wrongLoginMessage).toContainText('Wrong login ID or password');
```

## Things about the app that shape these tests

- **The login form is a web page inside the app.** Android passes that page's text and ids to
  the native screen only some of the time, so the login steps work **inside the WebView**
  (`mobile.switchToWebView()`) and find the fields by their HTML ids. This is what makes the
  login test reliable.
- **Some buttons carry no text of their own.** *Log in/sign up* is a container; its text is on
  a child label, so text checks use `HomePage.loginSignupLabel`.
- **The home greeting changes with the time of day**, so no test checks it.
- **A fresh install's first launch can be slow** on a cold device, and Android may ask for the
  location permission a few seconds in. Each test waits up to 90 seconds for the first screen and
  answers the prompt ("While using the app") whenever it appears.

More detail, and the rules for adding tests, are in [AGENTS.md](AGENTS.md).

## iOS

Not yet. An App Store IPA is encrypted and cannot be uploaded to a device cloud, so iOS needs a
simulator or TestFlight build from the app team. Adding it is one more project in
`taqwright.config.ts`; the specs carry over.
