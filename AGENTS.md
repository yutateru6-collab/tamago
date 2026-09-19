# Mobile Prototype Agent Guide

## Prototype Instructions

In ChatGPT Work Mode, run `sites-preview start "$PWD"`, open `http://terminal.local:4173/` in the cloud browser, and verify the rendered app and its primary interactions. Keep that preview open and tell the user to inspect it in the cloud browser; do not present the local URL as a user-facing chat link. In Codex Desktop, run the local server yourself, open the preview in the in-app browser, and provide the clickable local URL. Do not deploy to Sites unless the user explicitly asks to share, publish, or deploy. Do not give the user server-start instructions when you can run it.

Before planning or implementing any mobile-app change, read this `AGENTS.md` in full. It is the source of truth for the template's runtime and component guidance.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Tamago Non-Negotiable Working Rules

These rules exist to prevent accidental redesigns, regressions, low-quality visual substitutions, and unverified handoffs. Follow them on every task in this repository.

### Instruction precedence

When instructions conflict, use this order:

1. The user's latest explicit instruction for the current task.
2. The newest dated, explicitly approved Tamago product/design decision in this file.
3. The task-specific document referenced by that decision (for example `docs/living-home.md`, `docs/rest-events.md`, or `docs/improvement-backlog.md`).
4. The generic runtime/component rules in this file.
5. Older notes, screenshots, prototypes, or assumptions.

A newer instruction supersedes only the conflicting part of an older one. Preserve everything else.

### Preserve-by-default rule

- Do not redesign, restyle, reorganize, rename, replace, or "improve" anything the user did not ask to change.
- Treat existing UI/UX, navigation, copy, saved-state behavior, progression rules, artwork, character identity, and interaction patterns as locked by default.
- Make the smallest coherent change that satisfies the request. Do not bundle unrelated refactors, dependency upgrades, cleanup, architecture changes, or speculative features.
- If a requested change can be made locally, do not rewrite a whole screen or subsystem.
- Do not remove working behavior merely because a simpler implementation is possible.
- Do not infer permission for a broad redesign from words such as "improve", "fix", "clean up", or "make it better". Improve the named problem first.

### Inspect before editing

Before changing code:

- Read the target file(s), the immediately related components/styles/tests, and any referenced Tamago doc.
- For improvement work, read `docs/improvement-backlog.md` and identify the applicable TAM ID before editing.
- Confirm the current implementation rather than relying on an old screenshot, previous chat description, or memory.
- Identify the smallest likely file set and the behaviors that must remain unchanged.
- Check whether the requested behavior already exists before adding a second implementation.

If the repository and the user's description disagree, treat the current repository plus the latest explicit user instruction as authoritative and call out the discrepancy in the handoff.

### UI and interaction guardrails

- Preserve the current information architecture and visual hierarchy unless the user explicitly asks to change them.
- Do not move buttons, tabs, cards, labels, timers, or navigation merely for aesthetic preference.
- Do not change typography, spacing scale, color system, icon style, border radius, illustration style, or animation language outside the requested area.
- Keep mobile-first behavior as the primary target. Verify iPhone-sized layouts and do not accept desktop-only correctness.
- Maintain touch target usability, safe areas, scrolling, keyboard behavior, reduced-motion behavior, and saved-state semantics.
- Any developer/debug controls must remain visually distinct from the normal user experience and must not write normal progress unless explicitly designed to do so.

### Image and motion quality guardrails

- Never replace a higher-resolution source with a lower-resolution derivative for convenience.
- Do not rasterize the whole home scene to add a tiny animation if the result lowers apparent sharpness.
- Do not fake eye/ear/tail motion with a visibly mismatched low-resolution overlay, hard mask edge, color mismatch, or seam. If compositing quality is not convincing at real phone size, stop and use a higher-quality asset/motion pipeline instead of shipping the artifact.
- Reuse approved original artwork at its best available source resolution. Preserve aspect ratio and avoid unnecessary transcoding generations.
- When introducing a crop, mask, overlay, video, or canvas layer, verify edge continuity, texture continuity, sharpness, alpha handling, and scaling on the production-size viewport.
- Motion must be calm, continuous, and intentional. Avoid twitchy loops, abrupt restarts, unnatural easing, or movement that makes the character look detached from the painted scene.
- Verify animation by watching normal playback. Do not claim motion is good based only on a single frame or by seeking to a timestamp.
- Keep a still/reduced-motion path whenever the feature already supports or requires it.

### State and product-integrity guardrails

- Never grant progress from animation playback, visual-only state, page reloads, developer previews, or elapsed wall-clock time that has not passed through the existing confirmed transaction rules.
- Do not silently change crafting costs, rest rates, wear caps, invitation thresholds, repair semantics, or persistence keys while doing UI work.
- Existing achievements/acquisitions must survive presentation changes.
- Developer mode remains isolated from normal progress unless the user explicitly changes that contract.
- Outcome text must describe committed state, not a predicted state or a cosmetic animation.

### Verification before handoff

Use the repository's real scripts; do not invent substitute checks.

For every code change, run the checks relevant to the touched surface. Before a normal handoff, the expected baseline is:

```bash
npm run check:runtime
npm test
npm run check:worker
npm run test:sites
```

For app/UI changes, also run:

```bash
npm run build
npm run test:app
```

For runtime/mobile-frame changes, also run the runtime Playwright suite when applicable:

```bash
npm run test:runtime
```

When a check cannot be run because of the environment, say exactly which check was not run and why. Never report a check as passed without its actual successful result.

For visible changes:

- Inspect real rendered screenshots at phone widths, not just source code.
- Check both Chromium and WebKit when the existing test setup covers them.
- Inspect the requested changed state and at least one important neighboring/unchanged state.
- For motion, inspect normal playback/video when available.
- For image-quality work, compare apparent sharpness and seams at the actual rendered phone size.

### Deployment truthfulness

- A commit to `main`, a successful local build, and a successful GitHub Actions run are not the same as a verified production deployment.
- Never say "deployed", "live", "production is fixed", or equivalent unless the public URL was actually checked after the change.
- Always distinguish: code changed / local checks passed / CI passed / production verified.
- The production URL is `https://tamago.itisnowornever271.workers.dev/`.
- Every Tamago handoff must include that URL and explicitly state whether the changed behavior was verified there.

### Handoff format

Keep the final report compact but concrete. Include:

- what changed,
- which files changed,
- what was deliberately left unchanged,
- exact checks run and their result,
- visual/motion evidence inspected when relevant,
- CI/deployment status,
- the production URL.

Do not hide known limitations behind generic phrases such as "looks good" or "should work".


## Editing Boundary

- Build app-specific UI in `src/Prototype.tsx` and `src/prototype.css`.
- Treat `src/App.tsx`, `src/main.tsx`, `src/styles.css`, `src/mobile/`, `public/assets/iphone/`, `public/assets/android/`, `public/assets/status/`, `vite.config.ts`, `worker/index.js`, and `scripts/prepare-sites-build.mjs` as protected runtime files. Do not edit, replace, remove, or recreate them unless the user explicitly asks to change the mobile runtime itself. For an explicit runtime change, update the affected lock hashes only after verifying the new runtime behavior.
- Run `npm run check:runtime` before preview or handoff. If it fails, restore the protected runtime instead of weakening or bypassing the check.
- `npm run build` preserves the mobile runtime and prepares the static Cloudflare Worker output required by Sites. Before a Sites handoff, confirm `dist/client/index.html`, `dist/server/index.js`, `dist/.openai/hosting.json`, and source `.openai/hosting.json` exist, then run `npm run test:sites`. Do not replace this project with a Vinext starter.

## Runtime Contract

- Preserve the mobile device runtime unless the user's task explicitly asks otherwise. Do not replace it with a standalone page. Visual fidelity applies to app-owned content inside the device screen, not to template-owned device chrome.
- Keep `App` composed around `PhoneFrame` -> `KeyboardProvider`, with `StatusBar`, app content, `HomeIndicator`, and `KeyboardDock` mounted inside the phone frame. `StatusBar` and the iOS home indicator are overlaid device chrome. When the Android keyboard is closed, the app viewport reserves the protected navigation-bar region instead of painting behind it. When the Android keyboard is open, preserve the current full-screen keyboard layout: its asset includes the IME navigation strip and the separate black navigation bar is hidden. iOS screens continue to paint behind the home-indicator area and own their safe-area content padding.
- Preserve the `iPhone` / `Pixel 10` device picker and both calibrated device presets. The Pixel screen is `427 x 952`; its `32 x 32` camera circle and `public/assets/android/navigation-bar.svg` bottom navigation bar are protected device chrome, not app content.
- Preserve the device picker's intentionally lightweight Codex styling in the top-right corner: its trigger wrapper is borderless and transparent, its trigger sizes to content, and its right-aligned menu uses the compact 3px inset plus the specified hairline and elevation shadow layers. Keep the prototype root and default app screen white.
- Preserve `StatusBar` as live device chrome, including its platform-specific typography, source status-icon assets, and spacing. Pixel 10 uses Roboto, Android indicators, and 32px top, left, and right padding. iPhone uses its iOS indicators, system typography, and calibrated spacing. Do not hardcode screenshot times like `9:41` into the status bar, replace its real-time clock, or move status bar content into app markup unless the user explicitly asks for a fixed/mock device time.
- `PhoneFrame` owns the calibrated device frame, screen portal, device picker, camera cutout, and custom cursor. Keep device assets in `public/assets/iphone/` and `public/assets/android/`; if an asset fails to load, repair the asset path or restore the asset instead of removing the frame, keyboard, or image render.
- Use `MobileScroll` directly for simple single-screen prototypes. Use `FlowStack` for conventional multi-screen flows whose routes can own their fixed header and footer; when using it, define each route as a `FlowScreen`: `{ id, header?, headerHeight?, footer?, footerHeight?, render }`, and use `flow.push(screen)`, `flow.pop()`, and `flow.replace(screen)` from `FlowStack` render callbacks or `useFlow()` instead of introducing another router.
- Use `Carousel` for a carousel, horizontal rail, swipeable cards, image or media strip, horizontally scrollable cards, chip rail, or other horizontal collection.
- For a layered app shell—such as a persistent composer, independently presented sheet, pushed/peek sidebar, or app-wide transition—compose directly in `Prototype.tsx` rather than forcing it through `FlowStack`. Keep app-owned fixed chrome as sibling layers outside `MobileScroll`.
- When using `FlowScreen`, put route-owned fixed headers or footers in `FlowScreen.header` or `FlowScreen.footer`. Set `headerHeight` to the visible app-toolbar height; `FlowStack` adds the device's top safe-area/status-bar inset automatically. Do not include `StatusBar` or its height in the header. Set `footerHeight` to the full app-footer height. `FlowStack` adds the device's top safe-area/status-bar inset automatically. `FlowScreen.footer` is an overlay, not reserved layout space; screens using it must add their own bottom content padding such as `padding-bottom: calc(var(--flow-footer-height) + var(--mobile-safe-area-height) + 24px)` so final content can scroll above the footer while still painting behind it.
- Render only scrollable content inside `MobileScroll`; it is for content that should move with scroll and rubber-band overscroll. Keep app-owned headers, nav bars, tabs, composers, and overlays outside it. This keeps scroll physics, safe areas, keyboard insets, scrollbars, and drag click suppression active without letting content paint under fixed chrome.
- Buttons, links, cards, and images inside `MobileScroll` should still allow drag scrolling when the pointer moves beyond tap slop. Use `data-scroll-drag="ignore"` only for rare controls that must own the drag gesture themselves.
- Do not add `var(--keyboard-height)` to ordinary screen/content padding inside `MobileScroll`; the scroll viewport already shrinks above the simulated keyboard. For custom fixed composers, search bars, or toast chrome, use `useKeyboardInsets().bottomInset`. It is relative to the app viewport: Android returns `0` while the closed-keyboard viewport already reserves navigation, then returns the keyboard height while open; iOS continues to clear the home indicator while closed and ride directly above the keyboard while open. Do not pin custom bottom chrome to `bottom: 0` or only `keyboardHeight`.
- Use `KeyboardInput`, `KeyboardTextarea`, or `MobileTextField` for every text-entry control. A raw `input` or `textarea` disconnects focus, keyboard animation, safe-area insets, and attached surfaces.
- Use `BottomSheet` for phone-scoped sheets. Its props are `open`, `onOpenChange`, `title`, optional `description`, optional `snap`, and `children`; it renders through the phone screen portal and dismisses the keyboard before opening.

## Horizontal Carousels

- Use `Carousel` for horizontally draggable cards, images, media, chips, or other horizontal collections. Do not recreate these with `overflow-x`, custom pointer handlers, or a generic div.
- `Carousel` can be nested directly inside `MobileScroll`. It owns horizontal gestures and automatically yields vertical gestures to the parent.
- Never put `data-scroll-drag="ignore"` on or around a `Carousel`; doing so prevents vertical parent scrolling when a gesture begins inside it.
- Do not add CSS scroll snapping to `Carousel`; its runtime owns momentum and release motion.
- Use `data-scroll-drag="ignore"` only when a control must prevent parent scrolling in every drag direction.

See `src/mobile/COMPONENTS.md` for the full component and gesture contract.

## Keyboard Rule

The simulated keyboard is a separate top-layer component. Before presenting anything that behaves like iOS navigation or modal UI, dismiss it first.

Call `keyboard.hide()` before:

- pushing, popping, or replacing FlowStack routes
- opening bottom sheets, action sheets, dialogs, menus, or navigation sheets
- starting transitions where the destination should not inherit text-input focus

`FlowStack` already hides the keyboard for `push`, `pop`, and `replace`. `BottomSheet` already hides it before opening. If you add new modal/sheet/navigation primitives, follow the same rule.

When a composer, search surface, or other keyboard-attached component closes, call `keyboard.hide()` in the same event before changing that component's open state. Position attached surfaces from `useKeyboardInsets()` rather than a separate timer or visibility flag so both dismiss together.

When any text-entry control loses focus, dismiss the simulated keyboard. If the control is custom or does not use the runtime's keyboard-aware fields, handle its blur event and call `keyboard.hide()` explicitly. Keep the keyboard open only when focus is moving directly to another text-entry control that should share the same keyboard session.

## Interaction Rules

- Do not trigger buttons or inputs after a pointer has become a drag. Preserve the drag suppression behavior in `MobileScroll`.
- Do not allow native browser image/file dragging inside the phone frame. Preserve the phone-level `dragstart` suppression and non-draggable image styles so scroll drags that begin on images still scroll the prototype.
- Use `KeyboardInput`, `KeyboardTextarea`, or `MobileTextField` for text entry so the simulated keyboard and safe-area insets stay connected.
- Fixed phone chrome should not animate with pushed screens. Screen content can animate; the status bar, camera cutout, and preview chrome should stay put.
- Keep the keyboard below the home indicator/safe area layer in z-index, and above ordinary app UI while visible.
- Keep the home indicator as the topmost safe-area layer in the z-index above everything else in the prototype.

## Approved product direction — 2026-09-18

The user explicitly requests full-screen iPhone-friendly rendering instead of a simulated device. App defaults to fullscreen; `?preview=1` retains the original calibrated runtime for development. This authorizes the related App/MobileRuntime/PhoneFrame changes and lock updates after verification. The original frame invariants above apply to preview mode only.

The visual direction is an immersive woodland dwelling with warm lanterns, translucent moss-green navigation, parchment requests, and small creature animations. Explain immediately: putting the phone down helps the creature recover and build. 30-minute requests are voluntary, persist across reloads, and require an explicit self-report after elapsed time; never claim to detect device-wide use. No automatic punishment on return, unknown time, or cancellation. Preserve existing progress and keep demo controls separate from self-reported sessions.

## Approved visual refinement — 2026-09-17
- Use self-hosted Zen Maru Gothic for Japanese typography across headings, body, controls and sheets; avoid system Mincho and Georgia timer fallback.
- Quiet time should show the illustrated dwelling and companion, a compact timer, and visual suggestions for time away.
- Home character motion must be visibly localized to ears/tail, with a still illustration for reduced-motion users.
- Verify iPhone widths in GitHub Actions (Chromium and WebKit), retain screenshots, and visually inspect both layouts and motion before delivery.

## Motion regression — 2026-09-18
The user reports no visible motion. Verify natural uninterrupted playback and blinks in recorded Chromium/WebKit video, not by seeking animation time. Keep a visible play/pause control, honor reduced motion by default, and permit explicit user opt-in. Keep the choice across reloads.

## Original painting integration — 2026-09-18
Preserve the approved illustrations' painterly appearance. Integrate the woodland workshop companion first, keeping the existing exploration, crafting, recovery and self-report rules. Additional character actions should follow the existing world state; animation playback must never award progress. See docs/character-motion.md for the first-stage asset mapping and remaining work.

## Recoverable home deterioration — 2026-09-18
The app encourages time away from the smartphone. Excess-use reports gradually reduce plants, treasures and furnishings in the scene. Preserve built achievements and allow repair without charging the original crafting cost again. Cap daily home deterioration, never punish unknown time or cancellation, and preserve the approved painterly character motion. Home furnishings must be state-driven layers rather than permanently painted into the background. See docs/home-care.md for the provisional tuning and self-report boundary.

## Approved continuation — 2026-09-19
The user explicitly says to keep the character currently installed and start with other parts of the app. Do not replace the workshop companion, its artwork or its idle video, add character selection, or begin 3D/new-motion work based on the attached character reference sheets. Prioritize the rest / crafting / exploration / repair journey instead.

Every user-facing progress update and handoff for tamago must include the production URL: https://tamago.itisnowornever271.workers.dev/ . The user checks on a smartphone; local previews and build artifacts are review tools, not a substitute for the public URL. Distinguish verified deployment from code-only changes.

Keep progression rates, crafting costs, daily wear caps, self-report boundaries and saved achievements unchanged during journey UI work. Outcome text must describe the actual committed state transition, not predicted or animation-driven rewards. Persist the report with the existing rest transaction so reloading cannot rewrite or duplicate the outcome. See docs/journey.md.


## Approved home growth artwork — 2026-09-19
The current animated workshop/waterfall scene is the untouched default home (growth stage 0). The user approved three specific richer home illustrations using the same teal long-eared companion: `/art/home-growth-1.avif`, `home-growth-2.avif`, and `home-growth-3.avif`. When the home is warm, show stage 1 after one completed furnishing, stage 2 after two, and stage 3 after all three existing furnishings. Do not substitute a different creature or regenerate these approved images.

Home deterioration takes visual precedence over positive growth art: at faded/damaged/empty wear stages, return to the existing state-driven deterioration layers. Completed furnishing IDs remain saved, so repairing the home reveals the appropriate positive growth stage again. This is presentation logic only; do not change crafting costs, rest/usage rates, daily wear caps, or reward rules.

## Living home continuation — 2026-09-19
The user now explicitly requests a simpler starting home and an extensible scene where earned objects remain in the same place. This supersedes the earlier three-full-image switching direction. Keep the approved three rich paintings as reference assets; do not display them as game-state replacements. The original workshop companion image and video remain unchanged; display their character region over the simplified matching background.

Use the shared item catalog and fixed, percentage-based placement slots. Crafting reveals the specific furniture; discoveries add shelf keepsakes. Growth and wear are separate: even substantial wear does not visually erase all completed furniture. Store optional arrangement preferences without deleting acquisitions. Keep existing costs, rates, daily wear caps and self-report behavior.

The home emphasizes the scene, current activity and rest button; details are expandable. Developer mode must use a separate tab-scoped sessionStorage repository, never write normal progress, provide explicit presets plus real progression events, and visibly label the sandbox. The two-hour demo controls live only there. See docs/living-home.md for implementation and acceptance requirements.

## Rest events and two companion previews — 2026-09-19
The user requests time-based activities (food after 30 minutes), consistency between backgrounds/screens, and two more characters to try. Add repeatable optional snack / tea / picnic invitations at each 30 / 60 / 120 confirmed cumulative rest minutes. Split sessions count. Invitations persist without expiry; cancellation, unknown time and usage never subtract or grant invitations. Existing progression rates and the 30-minute self-report contract stay unchanged.

The earlier pause on new characters is superseded for two developer previews. Keep the original blue companion and untouched video as the normal default. Two new painterly cutouts may be selected in developer mode and used on every screen, with tab-only selection and gently swaying prototype motion, not claimed as new action videos. Background, possessions and wear share the same rendering across home, exploration, habitat, journal, quiet time and event sheets. See docs/rest-events.md.

## Improvement tracking — 2026-09-19

The user requests a candid, GitHub-visible improvement memo and visible completion tracking. Read `docs/improvement-backlog.md` before improvement work. Reference applicable stable TAM IDs in each improvement PR and update the memo in the same PR. Preserve the original problem and acceptance criteria. Use 未対応 / 対応中 / 修正済み (or 検証済み for research, 見送り with a reason); partially finished work stays 対応中. Mark completed titles with strikethrough and `[x]`, and record date, PR/commit, verification evidence, and whether the public deployment was actually verified. Do not call an item complete because it was merely documented, or imply deployment from a local test. Add newly discovered problems with new IDs. Keep screenshot evidence for visible changes. The backlog is a prioritized proposal, not authorization to change protected runtime files, existing reward rules, character artwork, or external-service scope.
