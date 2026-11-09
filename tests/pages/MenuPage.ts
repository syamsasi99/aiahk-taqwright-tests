import { Mobile, Locator } from '@taqwright/taqwright';

/** The screen behind the bottom-nav "Menu" tab. */
export class MenuPage {
  readonly profileSettingsHeader: Locator;
  /** The bottom-nav "Home" tab, unfocused while the menu is showing. */
  readonly homeTab: Locator;

  constructor(private mobile: Mobile) {
    this.profileSettingsHeader = mobile.getByLabel('android-menuScreen-profileSettingSection-header');
    this.homeTab = mobile.getByLabel('android-bottomNavigation-home-unFocused');
  }
}
