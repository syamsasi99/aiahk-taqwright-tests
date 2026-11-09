import { Mobile, Locator } from '@taqwright/taqwright';

/**
 * The Android system runtime-permission prompt. It is drawn by
 * com.android.permissioncontroller rather than the app, so it belongs to no one screen.
 */
export class PermissionDialog {
  readonly whileUsingTheAppButton: Locator;

  constructor(private mobile: Mobile) {
    this.whileUsingTheAppButton = mobile.getByUiSelector(
      'new UiSelector().resourceId("com.android.permissioncontroller:id/permission_allow_foreground_only_button")',
    );
  }

  /**
   * Taps "While using the app" if the prompt comes up. A device grid that grants
   * permissions at install (LambdaTest does) never shows it, so its absence is not a failure.
   */
  async allowWhileUsingTheAppIfShown(): Promise<void> {
    if (await this.whileUsingTheAppButton.isVisible({ timeout: 5_000 })) {
      await this.whileUsingTheAppButton.click();
    }
  }

  /**
   * Waits for `target` (the app's first screen), tapping "While using the app" whenever the prompt
   * covers it. The prompt can arrive seconds AFTER launch, so a one-off check at the start misses it
   * and the target then never becomes visible. A grid that grants permissions at install simply
   * never shows it. Throws, like `waitFor`, if `target` is not visible by `timeout`.
   */
  async allowWhileUsingTheAppUntil(target: Locator, timeout = 90_000): Promise<void> {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (await target.isVisible({ timeout: 2_000 })) return;
      if (await this.whileUsingTheAppButton.isVisible({ timeout: 1_000 })) {
        await this.whileUsingTheAppButton.click();
      }
    }
    await target.waitFor({ timeout: 1_000 });
  }
}
