import { test, expect } from '@taqwright/taqwright';
import './hooks/capture-failure-screen';
import { PermissionDialog } from './pages/PermissionDialog';
import { EndUserAgreementPage } from './pages/EndUserAgreementPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';

test('Switch the language to 繁體中文 and back to English as a guest', {
  annotation: [{ type: 'taqwright-scenario', description: 'manual:1-login-as-guest-2-go' }],
}, async ({ mobile }) => {
  const permissionDialog = new PermissionDialog(mobile);
  const endUserAgreement = new EndUserAgreementPage(mobile);
  const onboarding = new OnboardingPage(mobile);
  const home = new HomePage(mobile);
  const menu = new MenuPage(mobile);
  const profileSettings = new ProfileSettingsPage(mobile);

  // Step 0: wait for the first screen (a fresh install's first launch can take over 30 s on a
  // cold device), tapping "While using the app" if the system permission prompt comes up on the way.
  await permissionDialog.allowWhileUsingTheAppUntil(endUserAgreement.agreeAndContinueButton);
  // Step 1: tap Agree and continue
  await endUserAgreement.agreeAndContinueButton.click();
  // Step 2: tap Explore as a guest
  await onboarding.exploreAsGuestButton.click();

  // Step 3: tap Menu
  await home.menuTab.click();
  // Step 4: tap Profile & settings
  await menu.profileSettingsHeader.click();
  // Step 5: tap Language
  await profileSettings.languageMenuItem.click();
  // Step 6: tap 繁體中文
  await profileSettings.traditionalChineseOption.click();
  // Step 7: back to the menu
  await profileSettings.backButton.click();
  // Step 8: tap 主頁 (Home)
  await menu.homeTab.click();

  // Step 9: check "登入/登記" is visible
  await expect(home.loginSignupButton).toBeVisible();
  await expect(home.loginSignupLabel).toHaveText('登入/登記');
  // Step 10: check "主頁" is visible
  await expect(home.homeTabLabel).toBeVisible();
  await expect(home.homeTabLabel).toHaveText('主頁');

  // Step 11: tap 全部 (Menu)
  await home.menuTab.click();
  // Step 12: tap 個人檔案及設定 (Profile & settings)
  await menu.profileSettingsHeader.click();
  // Step 13: tap 語言 (Language)
  await profileSettings.languageMenuItem.click();
  // Step 14: tap English
  await profileSettings.englishOption.click();
  // Step 15: back to the menu
  await profileSettings.backButton.click();
  // Step 16: tap Home
  await menu.homeTab.click();

  // Step 17: check "Log in/sign up" is back in English
  await expect(home.loginSignupButton).toBeVisible();
  await expect(home.loginSignupLabel).toHaveText('Log in/sign up');
});
