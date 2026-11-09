import { test, expect } from '@taqwright/taqwright';
import './hooks/capture-failure-screen';
import { PermissionDialog } from './pages/PermissionDialog';
import { EndUserAgreementPage } from './pages/EndUserAgreementPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { HomePage } from './pages/HomePage';

test('Login as a guest user and verify home page is loaded', {
  annotation: [{ type: 'taqwright-scenario', description: 'manual:login-as-a-guest-user-and-verify-home-page-is-loaded' }],
}, async ({ mobile }) => {
  const permissionDialog = new PermissionDialog(mobile);
  const endUserAgreement = new EndUserAgreementPage(mobile);
  const onboarding = new OnboardingPage(mobile);
  const home = new HomePage(mobile);

  // Step 0: wait for the first screen (a fresh install's first launch can take over 30 s on a
  // cold device), tapping "While using the app" if the system permission prompt comes up on the way.
  await permissionDialog.allowWhileUsingTheAppUntil(endUserAgreement.agreeAndContinueButton);
  // Step 1: tap Agree and continue
  await endUserAgreement.agreeAndContinueButton.click();
  // Step 2: tap Explore as a guest
  await onboarding.exploreAsGuestButton.click();
  // Step 3: the home screen is up, still as a guest
  await expect(home.loginSignupButton).toBeVisible();
  await expect(home.loginSignupLabel).toHaveText('Log in/sign up');
});
