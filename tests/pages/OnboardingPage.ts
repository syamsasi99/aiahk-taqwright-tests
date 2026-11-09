import { Mobile, Locator } from '@taqwright/taqwright';

/** The onboarding screen, where a user signs in or carries on as a guest. */
export class OnboardingPage {
  readonly exploreAsGuestButton: Locator;

  constructor(private mobile: Mobile) {
    // getByLabel is the accessibility id (content-desc on Android).
    this.exploreAsGuestButton = mobile.getByLabel('android-onBoardingScreen-explore-button-actionBtn');
  }
}
