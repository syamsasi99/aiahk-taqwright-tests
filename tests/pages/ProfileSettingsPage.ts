import { Mobile, Locator } from '@taqwright/taqwright';

/** The profile and settings screen, as a guest sees it. */
export class ProfileSettingsPage {
  /** Shown only while nobody is signed in. */
  readonly loginButton: Locator;
  readonly backButton: Locator;
  /** Opens the language sheet below. */
  readonly languageMenuItem: Locator;
  /** Options in the language sheet, which only this screen opens. */
  readonly englishOption: Locator;
  readonly traditionalChineseOption: Locator;

  constructor(private mobile: Mobile) {
    this.loginButton = mobile.getByLabel('android-profileSettingScreen-loginButton');
    this.backButton = mobile.getByLabel('android-profileSettingScreen-header-backIcon');
    this.languageMenuItem = mobile.getByLabel('android-profileSettingScreen-settingPreferenceMenu-language');
    this.englishOption = mobile.getByUiSelector(
      'new UiSelector().resourceId("profileSettingScreen-language-setting-modal-languageSettingModal-0-item-en")',
    );
    this.traditionalChineseOption = mobile.getByUiSelector(
      'new UiSelector().resourceId("profileSettingScreen-language-setting-modal-languageSettingModal-1-item-zh-hk")',
    );
  }
}
