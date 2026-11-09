import { test, expect } from '@taqwright/taqwright';
import './hooks/capture-failure-screen';
import { PermissionDialog } from './pages/PermissionDialog';
import { EndUserAgreementPage } from './pages/EndUserAgreementPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';

test('Open the app as a guest and try to log in with an invalid login ID and password', {
  annotation: [{ type: 'taqwright-scenario', description: 'manual:open-teh-app-as-a-guest' }],
}, async ({ mobile }) => {
  const permissionDialog = new PermissionDialog(mobile);
  const endUserAgreement = new EndUserAgreementPage(mobile);
  const onboarding = new OnboardingPage(mobile);
  const home = new HomePage(mobile);
  const login = new LoginPage(mobile);

  // Step 0: wait for the first screen (a fresh install's first launch can take over 30 s on a
  // cold device), tapping "While using the app" if the system permission prompt comes up on the way.
  await permissionDialog.allowWhileUsingTheAppUntil(endUserAgreement.agreeAndContinueButton);
  // Step 1: tap Agree and continue
  await endUserAgreement.agreeAndContinueButton.click();
  // Step 2: tap Explore as a guest
  await onboarding.exploreAsGuestButton.click();
  // Step 3: tap Log in/sign up
  await home.loginSignupButton.click();
  // The sign-in form is a web page inside the app: wait for it to load, then work inside it.
  await login.webContentLoaded.waitFor();
  await mobile.switchToWebView();
  // Step 4: type an invalid login ID
  await login.signInNameField.fill('invaliduser');
  // Step 5: type an invalid password
  await login.passwordField.fill('invalidpass');
  // Step 6: tap Log in
  await login.loginButton.click();

  // The invalid login is rejected: the error is shown and the guest is still on the login screen.
  await expect(login.wrongLoginMessage).toContainText('Wrong login ID or password');
  await expect(login.loginButton).toBeVisible();
  await mobile.switchToNative();
});
