import { Mobile, Locator } from '@taqwright/taqwright';

/**
 * The login screen opened from home's "Log in/sign up" button.
 *
 * The form is a web page (AIA's sign-in service) inside the app. Android passes that page's ids
 * and text through to the native tree only some of the time, so a native locator for a field or
 * for the error message passes on one run and times out on the next. Everything on the form is
 * therefore found INSIDE the WebView, by the page's own HTML: use those locators between
 * `mobile.switchToWebView()` and `mobile.switchToNative()`. Every selector below was read from
 * the live page (5.21.2), not guessed.
 */
export class LoginPage {
  /** Native: the app adds this marker once the web page has loaded. Wait for it before switching. */
  readonly webContentLoaded: Locator;
  /** WebView: the Login ID field. */
  readonly signInNameField: Locator;
  /** WebView: the Password field. */
  readonly passwordField: Locator;
  /** WebView: the visible "Log in" button (the page's real submit button is hidden). */
  readonly loginButton: Locator;
  /** WebView: the message under the password after a rejected login ("Wrong login ID or password, try again"). */
  readonly wrongLoginMessage: Locator;

  constructor(private mobile: Mobile) {
    this.webContentLoaded = mobile.getByLabel('android-undefined-webView-content-loaded');
    this.signInNameField = mobile.getByCss('#signInName');
    this.passwordField = mobile.getByCss('#password');
    this.loginButton = mobile.getByCss('button.fakeButton');
    this.wrongLoginMessage = mobile.getByCss('.claimError .claimText');
  }
}
