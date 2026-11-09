import { Mobile, Locator } from '@taqwright/taqwright';

/** The end-user agreement shown on first launch. */
export class EndUserAgreementPage {
  readonly agreeAndContinueButton: Locator;

  constructor(private mobile: Mobile) {
    this.agreeAndContinueButton = mobile.getByUiSelector(
      'new UiSelector().resourceId("endUserAgreementScreen-endUserAgreementModal-actionButton-actionBtn")',
    );
  }
}
