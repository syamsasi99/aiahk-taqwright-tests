# Notes for coding agents

Facts about **this** repository. The universal rules — never invent a locator, no locator in
a spec body, assertions in the test not the page object — come from LIME's own brief
(written to `.lime/ADAPT.md` by `lime-cli` when it records; that folder is not committed) and are enforced by `lime-cli check-locators` and `lime-cli check-pom`.
They are deliberately **not** repeated here: two copies of one rule are two things that drift,
and the brief is the copy that every repository gets.

What follows is what the brief cannot know. **Fill these three sections in as you learn them** —
an empty section is honest, a stale one is worse than nothing.

## The app under test

The AIA Hong Kong Android app, installed from the Play Store build and tested in **guest
mode only** — nothing here signs in, and no test needs a credential.

**Hard rule: no test may submit anything.** A callback request, an enquiry, a quote sent
by email, a registration or an OTP request reaches real people at AIA (or sends a real SMS).
A journey that ends in one of those stops on the screen *before* the submit button and
asserts that the button is there.

Journeys, as they get recorded (tick them off here):

| Journey | Status |
| --- | --- |
| First launch → agree → explore as a guest → home | `tests/GuestUserViewsHome.spec.ts` ✅ |
| Login screen: invalid login ID and password → error message | `tests/LoginWithInvalidCredentials.spec.ts` ✅ — home → Log in/sign up → type → Log in; the form is driven inside the WebView |
| Switch language English ↔ 繁體中文 | `tests/SwitchLanguageAsGuest.spec.ts` ✅ — home → Menu → Profile & settings → Language |
| Browse products → open a product → its detail page | not recorded |
| Find an agent / branch → search a district → results | not recorded |
| FAQ / Help → find an answer | not recorded |
| Login screen: empty / malformed input → validation message | not recorded |

All three ✅ verified on 9 Nov 2026, local Android 15 emulator, AIA+ HK 5.21.2.

## Screens and their page objects

| Screen | Page object | Covers |
| --- | --- | --- |
| Android permission prompt (system) | `tests/pages/PermissionDialog.ts` | the "While using the app" button, `allowWhileUsingTheAppIfShown()` |
| End-user agreement | `tests/pages/EndUserAgreementPage.ts` | the "Agree and continue" button |
| Onboarding | `tests/pages/OnboardingPage.ts` | the "Explore as a guest" button |
| Home | `tests/pages/HomePage.ts` | the "Log in/sign up" button and its text label `loginSignupLabel` (proves a guest is on home), the bottom-nav Menu tab and Home label |
| Menu | `tests/pages/MenuPage.ts` | the "Profile & settings" header, the bottom-nav Home tab |
| Login (from home's "Log in/sign up") | `tests/pages/LoginPage.ts` | a native "web content loaded" marker, then — inside the WebView — the Login ID and password fields, the "Log in" button, the "Wrong login ID or password" message |
| Profile and settings | `tests/pages/ProfileSettingsPage.ts` | the "Log in / sign up" button, the back icon, Language, and the language sheet's English / 繁體中文 options |

**Where a shared overlay belongs is a decision, not a rule.** A sort sheet opened from one
screen, changing that screen and reachable from nowhere else, belongs on that screen's page
object rather than in a class of its own. Write the decision down here when you make it —
rule 2 of the brief's page-object procedure is what it follows, and the next agent cannot
infer which way you went.

- The **Android runtime-permission prompt** has its own `PermissionDialog`. The system draws it
  (`com.android.permissioncontroller`), not the app, and any screen that asks for a permission
  can bring it up, so it follows rule 4.
- The **bottom navigation** looks shared, but there is no shared component object yet, so each
  tab sits on the screen it is tapped from (rule 3): the Menu tab and Home label on `HomePage`,
  the Home tab on `MenuPage`. The accessibility ids carry the focus state
  (`…-menu-unFocused`), so a tab is only findable from screens where it is *not* selected.
  If a third screen needs the nav, move it into a `BottomNavigation` component instead.
- The **language sheet** is opened only from Profile and settings, so its options live on
  `ProfileSettingsPage` (rule 2).

## Known app problems that shape the tests

- **The home greeting changes with the time of day.** Each greeting has its own accessibility
  id (`android-homeScreen-greetingMessage-afternoon`, …), so a check on one passes only at that
  hour in the device's timezone. Never assert on it; to prove home loaded, use
  `HomePage.loginSignupButton`, which is there for a guest at any hour.
- **First launch shows a system permission prompt** ("While using the app", for location), and
  it can arrive SECONDS after the app opens, covering the end-user agreement. A one-off check
  at the start missed it once and the test then timed out on the agreement. Every spec starts
  with `PermissionDialog.allowWhileUsingTheAppUntil(endUserAgreement.agreeAndContinueButton)`,
  which waits for the agreement and taps the prompt whenever it shows. LambdaTest grants
  permissions at install, so there the prompt never appears. Never call
  `whileUsingTheAppButton.click()` directly.

- **The login form is a web page (AIA's sign-in service) inside the app.** Android passes that
  page's ids and text to the native tree only some of the time: the same native locator for the
  Login ID field or the error message passed on one run and timed out on the next while the
  screen plainly showed it. So `LoginPage` finds the form INSIDE the WebView by its HTML
  (`#signInName`, `#password`, `button.fakeButton`, `.claimError .claimText`, read from the live
  page), and the spec waits for `webContentLoaded`, calls `mobile.switchToWebView()` before the
  form and `mobile.switchToNative()` after. The page's real submit button (`#continue`) is
  hidden; the visible "Log in" is `button.fakeButton`. The page also carries a hidden
  "Invalid username or password." element (`#claimVerificationServerError`): it is NOT what the
  user sees, so never assert on it.
- **Buttons are containers with no text.** `android-homeScreen-loginSignupButton-actionBtn` has
  an empty `text`; "Log in/sign up" / "登入/登記" is on its child,
  `android-homeScreen-loginSignupButton`. Click the button, assert text on the label
  (`HomePage.loginSignupLabel`). Expect the same `…-actionBtn` / label pair on other buttons.
- **A fresh install's first launch is slow on a cold device** (over 30 s measured on an
  emulator), so `allowWhileUsingTheAppUntil` gives the first screen up to 90 s.
- **Locally, the app must be reinstalled between tests** (`resetBetweenTests` on the
  `android-local` project). Without it the second test inherits the first one's state — the
  agreement already accepted — and fails on step 1. The cloud grid gives each test a fresh
  session, so the `android` project does not need it.

Two things to expect, and to write down here when they show up:

- **Product and campaign pages are often WebViews** (the login form already is). A locator inside one is `getByCss`
  wrapped in `switchToWebView()` / `switchToNative()`, never a native finder.
- **Promotional banners rotate.** Never assert on one, and never tap one as a step.

## Values

**Guest mode needs none of these yet** — no test signs in. The `APP_USER` / `APP_PASS`
lines below are the template's, kept so the workflows need no edit the day a signed-in
journey is allowed. Credentials come from the environment and are never inline:

```ts
await login.signInNameField.fill(process.env.APP_USER ?? '');
```

A recording made against `${APP_USER}` emits `process.env.APP_USER ?? ''`, never the text
that was typed — that is the contract that keeps what you type into the app out of this
repository. Every name below has to exist in **both** workflows or the suite passes on one
trigger and fails on the other.

| Variable | Set in |
| --- | --- |
| `APP_USER` / `APP_PASS` | repository secrets, passed by both workflows — **rename to match your recordings** |
| `LIME_CI_TOKEN` | repository secret, for reporting results back to LIME |
| `LAMBDATEST_USERNAME` / `LAMBDATEST_ACCESS_KEY` | repository secrets, for the device cloud |

## The taqwright API — use these and nothing else

Every method below is taken from `@taqwright/taqwright`'s own type definitions (v1.0.1).
**Use only these names. Do not invent a method, and do not guess at one that sounds right.**
Every wrong name here has been written by an agent at least once: `getId` for `getById`,
`getByAccessibilityId` for `getByLabel`, `swipe({start, end})` for `swipe('down', …)`.

### `mobile` — finding elements

```
getByLabel  getById  getByText  getByPlaceholder  getByXpath  getByUiSelector
getByClassChain  getByPredicate  getByRole  getByTestId  getByType  getByCss
```

Which one to use is decided by the recording, not by preference — see `.lime/ADAPT.md`.
`getByCss` resolves only inside a WebView and needs `switchToWebView()` around it.

### `mobile` — driving the device

```
click  clickByPercent  tap  press  pressButton  swipe  scroll  scrollIntoView  gesture
dragAndDrop  goBack  hideKeyboard  isKeyboardShown  pause  waitForTimeout  screenshot
launchApp  activateApp  terminateApp  backgroundApp  installApp  uninstallApp
isAppInstalled  queryAppState  getCurrentApp  openDeepLink
acceptAlert  dismissAlert  getAlertText
getClipboard  setClipboard  getLocation  setLocation  setLocale  setPermission
getOrientation  setOrientation  getNetworkConnection  setNetworkConnection
getContext  getContexts  switchContext  switchToNative  switchToWebView
getDeviceLogs  getDeviceTime  getLogTypes  getPlatform  getScreenSize  viewTree
pullFile  pushFile  startScreenRecording  stopScreenRecording  close
```

`pressButton` takes exactly one of `'HOME' | 'BACK' | 'POWER' | 'VOLUME_UP' | 'VOLUME_DOWN' | 'ENTER'`.
`swipe` and `scroll` take a DIRECTION first — `'up' | 'down' | 'left' | 'right'` — never coordinates.

### A `Locator` — acting on an element

```
click  doubleClick  tap  doubleTap  longPress  press  pressSequentially  sendKeyStrokes
fill  clear  check  uncheck  selectOption  focus  blur
swipeUp  swipeDown  swipeLeft  swipeRight  pinchIn  pinchOut  dragTo  dragToPoint
scrollIntoView  waitFor  screenshot  boundingBox
getText  getValue  getAttribute  allInnerTexts  allTextContents
count  first  last  nth  all  filter  locator  and  or
isVisible  isChecked  isEditable  isEmpty  isEnabled  isFocused  isInViewport
```

### Asserting

Assertions live in the spec, never in a page object.

```
await expect(locator).toBeVisible()
```

Matchers: `toBeVisible  toBeHidden  toBeAttached  toBeEnabled  toBeDisabled  toBeChecked
toBeEditable  toBeEmpty  toBeFocused  toBeInViewport  toHaveText  toContainText
toHaveValue  toHaveAttribute  toHaveCount`. Each negates with `.not`.

A `Locator` also carries `assertVisible` / `assertText` / `assertCount` and friends. They
exist; prefer `expect(...)` in specs so a failure reads like the rest of the suite.

### If a name is not on this list

It does not exist. Say in your summary what you needed and could not find, rather than
writing something plausible — an invented method is a compile error at best and a test that
passes while checking nothing at worst.

**This list is a snapshot of v1.0.1 and the package can move under it.** `npx tsc --noEmit`
is the authority, not this file. If the two disagree, the compiler is right and this section
is stale — fix it.

## Running

```bash
npx taqwright test --project android      # the suite, on the TestMu AI cloud device
LOCAL_APK_PATH=/path/to/app.apk npx taqwright test --project android-local   # on a local emulator
npx tsc --noEmit                          # type-check only: no device, seconds
```

**Run `npx tsc --noEmit` before you say you are done.** This project is TypeScript and
taqwright ships types, so a method that does not exist is a compile error you can see in
seconds rather than a failure someone reads in CI. CI runs exactly
this first, so skipping it spends a whole workflow run to learn something you could have
checked yourself.

CI runs the same command; `taqwright-tests.yml` then posts results to LIME with `lime-cli
report`. The suite runs on real cloud devices, so a locator that only works on one handset's
system UI will pass locally and fail there.
