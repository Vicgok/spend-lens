# Audit

## Task

Audit app responsiveness across different resolutions, screen sizes, notched devices, and punch-hole devices.

## Audit Status

Approved with follow-up recommendations.

## Evidence Reviewed

- `package.json`: Expo SDK 54, React Native 0.81.5, `react-native-safe-area-context` dependency.
- `app.json`: portrait orientation, iOS tablet support, Android navigation bar configured with absolute positioning.
- `app/_layout.tsx`: root status bar and navigation shell.
- `app/(tabs)/_layout.tsx`: custom floating tab bar implementation.
- `app/(tabs)/index.tsx`, `transactions.tsx`, `insights.tsx`, `settings.tsx`, `accounts.tsx`: primary tab screen layout patterns.
- `app/onboarding/*`, `app/add-transaction.tsx`, `app/transaction/[id].tsx`, `app/categories.tsx`: onboarding, modal-stack, and secondary screen safe-area usage.
- `src/components/ui/BaseModal.tsx`, `BaseBottomSheet.tsx`, `AddFinancialSourceSheet.tsx`: modal and sheet cutout/navigation behavior.
- `src/components/ui/AreaTrendChart.tsx`, `StackedWeeklyBarChart.tsx`, `CurrentAccountsList.tsx`: adaptive chart and card components.
- Static inspection only. No simulator/device screenshots or type checks were run to avoid interfering with the user-reported build in progress.

## Findings

- Medium: Bottom cutout and Android gesture/navigation overlap risk. The custom tab bar in `app/(tabs)/_layout.tsx` is absolutely positioned with fixed `bottom: 24` and fixed `height: 70`, while `app.json` configures `expo-navigation-bar` with `"position": "absolute"`. The tab screens add large static bottom padding such as `120`, `140`, or `spacing['6xl'] * 2`, but the bar itself does not read `insets.bottom`. This likely works on many phones, but can sit too low or too high on devices with larger bottom safe areas, gesture nav, or unusual navigation bar heights.
- Medium: There is no explicit `SafeAreaProvider` in the inspected root layout. Most screens call `useSafeAreaInsets()`, which is the right API, but the root `app/_layout.tsx` does not visibly wrap the app in `SafeAreaProvider`. If Expo Router or another wrapper does not provide it implicitly in this runtime, inset values may be unreliable. This should be verified on device or fixed by adding the provider at the root.
- Low: Top cutout behavior is generally strong. Main tab screens, onboarding layout, categories, add/edit transaction, accounts, and developer tools all use `useSafeAreaInsets()` and apply `paddingTop: insets.top` or `insets.top + offset`, so notches and punch-hole cameras at the top should not cover primary headers.
- Low: Main content usually scrolls and has bottom breathing room. Dashboard, settings, insights, accounts, onboarding, and detail forms use `ScrollView`, `SectionList`, or `FlatList`; this reduces clipping on small devices. Several screens intentionally add bottom padding to clear the floating tab bar.
- Low: Some responsiveness is adaptive, but not fully tablet-aware. Charts measure container width at layout time and use minimum widths, and many rows rely on flex layout. However, iOS `supportsTablet` is true and most screens remain single-column with fixed phone-style spacing and fixed illustration/card sizes. On tablets, the app should be usable but may look stretched rather than intentionally optimized.
- Low: Static `Dimensions.get('window')` values are captured at module load in several places, including the tab bar width, onboarding artwork width, and sheet heights. Because app orientation is locked to portrait, this is lower risk for phones, but it can be stale on tablet split-view/window resize and can affect web if used there.
- Low: Modal/sheet overlays intentionally use translucent status/navigation bars. `BaseModal`, `BaseBottomSheet`, and several screen modals set `statusBarTranslucent` and `navigationBarTranslucent`. Dialogs are centered with padding and generally safe; bottom sheets use height ratios and a native `SafeAreaView` CTA, but fixed iOS/Android bottom padding in `AddFinancialSourceSheet` may not reflect every device inset.

## Traceability Checks

| Check | Result | Notes |
| --- | --- | --- |
| Requirements traced to implementation | Pass | Safe areas, cutouts, screen sizes, fixed dimensions, scrolling, and tablet behavior were inspected. |
| Implementation traced to tests | Partial | This was a static audit only; no screenshots or simulator matrix were run because a build was already in progress. |
| Risks or gaps recorded | Pass | Bottom inset/tab bar, missing explicit root provider, tablet layout, and static dimensions are recorded. |
| Unsupported claims removed | Pass | Findings are framed as code-backed behavior or runtime risks that need device verification. |

## Decision

Approve the audit record. Recommended remediation before broad device QA: make the floating tab bar and bottom content padding depend on `useSafeAreaInsets().bottom`, add or verify an explicit root `SafeAreaProvider`, and test a small phone, large notched iPhone, Android punch-hole/gesture-nav phone, and tablet/split-view viewport.
