# realX onboarding and first-run revamp

Status: v2 client flow implemented; staged backend and device QA required before release
Prepared: 2026-08-01
Platforms: iOS and Android
Primary outcome: a verified account is created

Implementation note (2026-08-15): The v2 welcome, unified account entry, logical OTP field, deferred creator choice, student-ID primer and resumable review, account-created moment, optional interests and alerts, first-run Home checklist, and startup recovery are implemented in the mobile working tree. Firebase Analytics and its client event instrumentation have been removed. Existing callable contracts remain authoritative. Minimum-age/parental-consent policy and production rollout configuration remain product/legal decisions and are not inferred by the client.

## Executive summary

realX already has the right functional foundations: passwordless email authentication, a fast school-email path, a fallback student-ID path, guest browsing, bilingual English/Arabic support, reduced-motion handling, connectivity awareness, and a post-signup notification prompt. The main issue is not a missing feature; it is that the journey exposes the underlying branches too early and does not create a clear, continuous story from value to account creation to the first useful action.

The recommended experience is:

1. Show one concise value-led welcome screen.
2. Lead directly to account creation; keep sign-in and guest access visible but secondary.
3. Ask for one email, explain why a school email is faster, and let backend validation determine the verification path.
4. Use the same OTP experience for signup and sign-in.
5. Ask only for the minimum profile data needed to create the account.
6. Treat student-ID review as a resumable asynchronous state, not a dead end.
7. Celebrate account creation, then optionally collect interests and notification consent.
8. Land the user on a useful, personalized home state with a clear first action.

No paywall should appear during onboarding. realX is currently a free student super app, and a paywall would interrupt the stated account-creation outcome without a defined premium proposition.

## Research and audit scope

This document is based on static inspection of the current working tree, including its uncommitted onboarding changes. It does not represent a device-run usability test, production API verification, or analytics-data analysis. The Mobbin research used iOS multi-screen flows because Mobbin's flow search currently exposes iOS and web platforms; Android recommendations translate the patterns into platform-appropriate behavior rather than copying iOS controls.

Named Mobbin searches for UNiDAYS and Student Beans did not return those products. The direct-pattern set therefore uses the closest student-benefit and student-verification flows Mobbin returned, supplemented by relevant rewards, learning, discovery, and best-in-class onboarding examples.

## 1. Current flow map

### Framework and architecture

- Expo SDK 56, React Native 0.85, React 19, TypeScript, and Expo Router.
- File-based navigation under `app/`, with onboarding in `app/(onboarding)/` and the main product in `app/(tabs)/`.
- Firebase Authentication uses custom tokens issued by callable Cloud Functions after OTP verification.
- Firestore supplies the student profile through a real-time `students/{uid}` listener in `StudentContext`.
- Firebase callable functions run in `me-central1` with App Check enforced.
- The client currently has no analytics SDK or event instrumentation.
- AsyncStorage holds the guest-session flag and a non-authenticated manual-verification resume token.
- NetInfo provides global online/offline state and feeds React Query's online manager.
- English and Arabic localization is handled by i18next, with locale-specific fonts and RTL state.
- Theme tokens live in `constants/Colors.ts`; typography families and variants live in `constants/Typography.ts`.
- Reanimated powers a shared onboarding motion layer with system reduced-motion support.

### Launch and routing

```text
Native splash
  -> custom animated splash
  -> wait for fonts, localization, App Check, Firebase Auth,
     guest session, profile state, and pending-verification storage
  -> route guard
       signed out + no guest + no pending request -> onboarding welcome
       signed out + guest                     -> main tabs
       signed out + pending request           -> verification pending
       signed in + profile exists             -> main tabs
       signed in + profile missing            -> profile details
       profile listener failure               -> full-screen error/offline state
```

The app records `app_opened` once readiness is reached. A profile listener remains active until the provider unmounts or authentication changes.

### Current school-email signup path

```text
Welcome
  -> Discover realX
  -> choose Student or Creator
  -> enter university email
  -> checkStudentExists
  -> sendOtp(purpose: signup)
  -> enter six-digit OTP
  -> verifyOtp(purpose: signup)
  -> sign in with returned custom token
  -> enter first and last name
  -> completeSignup
  -> account-created success
  -> optional notification request
  -> Start Exploring
  -> home
```

`checkStudentExists` and `sendOtp(signup)` only accept approved school domains. OTPs expire after five minutes, have a 60-second resend cooldown, and allow three verification attempts. `completeSignup` requires an authenticated user and creates the Firestore student profile with a `student` or `creator` role.

### Current personal-email and student-ID path

```text
Welcome
  -> Discover realX
  -> choose Student or Creator
  -> university email screen
  -> Verify with Student ID
  -> enter contact email
  -> sendOtp(purpose: verification)
  -> enter six-digit OTP
  -> verifyOtp(purpose: verification)
  -> choose one ID image
  -> submitVerificationRequest
  -> persist email, role, status token, and submitted time locally
  -> pending review
       automatic check on mount
       automatic check on foreground
       polling every 60 seconds
       manual Check for Updates
       optional guest exploration while waiting
  -> approved
  -> sign in with email OTP
  -> enter first and last name
  -> completeSignup
  -> success
  -> home
```

The ID request is stored for up to 30 days. A pending request can be cancelled; cancellation deletes the uploaded image. Approval creates or associates an auth identity, but the user still has to request and enter a login OTP before completing the profile.

### Current sign-in path

```text
Welcome or role screen
  -> Sign In
  -> enter email
  -> sendOtp(purpose: login)
  -> enter OTP
  -> sign in with custom token
  -> existing profile -> home
  -> approved manual verification without profile -> profile details -> success
```

If no account exists, a modal redirects the user into the signup email screen with the entered email prefilled.

### Current guest path

```text
Welcome or role screen
  -> Explore as Guest
  -> store guest-session flag
  -> home
  -> browse allowed routes
  -> protected action
       native alert: cancel, sign in, or sign up
```

A guest awaiting ID review sees a verification-status banner on home and can return to the pending screen.

### Current first meaningful success

The first confirmed business success is `completeSignup` returning successfully and the student profile being created. The UI celebrates this on the success screen. The first product-value success is not deliberately orchestrated: the user lands on a content-heavy home feed and must independently search, open an offer, save something, view an opportunity, or begin another action.

This distinction matters. Account creation is the primary onboarding KPI, but the first-run experience should also guide the user to one lightweight value action so a completed account does not immediately become an inactive account.

### Existing components and design tokens

Reusable foundations:

- `AppText` for localized display/body variants.
- `OnboardingMotion` primitives for screen, card, item, button, glow, pulse, state, and error motion.
- `StaggeredHeadingText` with reduced-motion fallback and a single screen-reader label.
- `StateSurface` for loading, empty, filtered-empty, error, offline, and not-found states.
- `VerificationStatusBanner` for resumable manual verification while browsing as a guest.
- Theme colors for background, surface, card, muted text, borders, brand, danger, warning, and action states.
- Localized Hanson/Poppins and Arabic Jali/Tajawal typography families.

The onboarding screens do not yet share a single layout/form component. Most repeat the same 250-point green header, overlapping white card, 72-point icon, 28-point horizontal padding, 16-point field radius, and 62-point pill button as local styles.

### Telemetry status

The client does not currently collect onboarding analytics. Any future telemetry should be introduced only with an explicit product, privacy, consent, and provider decision.

### Existing validation and error handling

- Email is trimmed, lowercased, and regex-validated locally.
- Callable errors are mapped to localized account-exists, not-found, expired-code, invalid-code, used-code, invalid-email, offline, rate-limit, and school-email-required messages.
- Fields and primary buttons disable while requests are running.
- OTP accepts numeric input, supports pasted codes, advances focus, clears after invalid input, and exposes resend cooldown.
- The ID image is compressed, base64 encoded, and limited to an estimated 3 MB.
- Network-dependent actions check global connectivity before calling Firebase.
- Errors are generally inline and announced through live regions; unexpected OTP errors still use a native alert.
- Authentication/profile inconsistencies trigger session cleanup or a recoverable root error state.

### Existing loading, empty, offline, permission, and failure states

| State | Current behavior | Assessment |
|---|---|---|
| App startup | Branded animated splash until all readiness gates resolve | Branded, but no timeout or recovery path if a gate hangs |
| Network request | Button spinner or loading copy | Clear locally; no long-wait escalation or cancellation |
| Offline during form submit | Inline localized network error | Good baseline; no persistent offline banner or automatic retry |
| Profile fetch failure | Full-screen error/offline `StateSurface` with retry | Strong recovery pattern |
| Home content loading | Component-specific skeletons/placeholders | Useful, but first-run hierarchy is not coordinated |
| Home empty/error | Compact shared state surfaces in several modules | Technically covered; generic empty copy is weak for a new user |
| OTP failure | Inline alert, shake motion, focus reset, or native alert | Functional but behavior varies by error class |
| ID picker failure | Inline instruction to enable access in Settings | No direct Settings action and no explicit pre-permission explanation |
| ID too large | Inline error | Good; missing unsupported-format/corrupt-image handling |
| Pending review | Polling, manual refresh, guest browse, cancel/start over | Strong resumability; polling is excessive for a 24–48-hour process |
| Rejected/expired ID | Reason plus restart | Covered, but restart returns to the beginning instead of the failed step |
| Notification permission | Value card on success; system prompt only after a tap | Correct timing; needs an explicit Not now affordance and denied-state recovery |
| Location permission | Requested later in map/vendor context, not onboarding | Correctly postponed |
| Paywall | None | Correct for the current free proposition |

## 2. Main usability problems

### High priority

1. **The app asks users to choose Student or Creator before it knows whether they can create an account.** This is internal segmentation presented as an early commitment. Most users are students, and the creator value proposition can be introduced after account creation or as an optional profile mode.

2. **The fallback path begins with a screen that still looks like a university-email requirement.** A user with no supported school email must recognize and choose “Verify with Student ID,” then enter another email on a visually near-identical screen. This creates the impression of a duplicated question even though the two fields serve different backend purposes.

3. **Signup and sign-in are separate journeys before email entry.** Existing users can recover via the not-found modal, but the UI makes them choose the correct mode before the system knows their account state. A single account-entry shell with clear Create account and Sign in intent would reduce mode errors while keeping the backend purposes explicit.

4. **The manual verification path has a second authentication ceremony after approval.** Email OTP is completed before upload, then another login OTP is required after approval before the profile can be created. This may be necessary for security, but it should be explained and streamlined; ideally approval deep-links into a short secure resume flow.

5. **Account creation does not lead into a designed first core action.** The success screen lists benefits, then drops the user into a dense home feed. There is no guided first save, first offer discovery, interest choice, or contextual home orientation.

6. **The app shell owns complex routing state without a visible recovery model.** Startup waits on many independent gates. A slow App Check, localization migration, auth state, profile listener, or local storage read can keep the branded splash visible indefinitely.

### Medium priority

7. **Progress is invisible or inconsistent.** The role screen and account screens do not show how many steps remain. Manual verification adds several screens without setting expectations until the pending state.

8. **The visual hierarchy is repetitive rather than informative.** Almost every screen has the same tall green header, large icon, two-part all-caps heading, and bottom pill button. The pattern consumes vertical space and makes distinct tasks feel interchangeable.

9. **Spacing and typography are locally duplicated.** Similar screens vary between 12, 16, 20, 24, 32, and 40-point gaps; headings range from 28 to 32 points; input heights vary between 56 and 58; button and error colors are sometimes hard-coded. This increases visual drift and makes Android/compact-screen behavior harder to tune.

10. **Copy emphasizes labels over outcomes.** “YOUR STUDENT ACCOUNT,” “STAY IN THE LOOP,” and “MAKE IT YOURS” are expressive but do not always answer what will happen next, how long it takes, or why the data is needed.

11. **The pending screen checks too often for the stated review time.** A 60-second poll is disproportionate to “usually within 24–48 hours,” consumes requests, and can create false urgency. Foreground refresh, push/email notification, and manual refresh are sufficient for most cases.

12. **The login account-not-found modal interrupts rather than preserves flow.** It works, but a full-screen inline transition would retain context, avoid modal focus complexity, and show the exact next step.

### Accessibility and inclusivity

13. **Dynamic Type behavior is not specified.** Large fixed headers, fixed-height inputs/buttons, side-by-side name fields, and negative card offsets can clip or crowd at larger font sizes.

14. **The six separate OTP inputs increase screen-reader and paste complexity.** Labels exist, but a single logical code field with a visual six-cell treatment is more robust for VoiceOver, TalkBack, autofill, paste, and error focus.

15. **Several important texts lack semantic headers or selectable behavior.** Accessibility roles are present on many controls, but screen titles and changing status content are not consistently exposed as headings or announced.

16. **Hard-coded error colors and legacy shadows can fail theme consistency.** Some onboarding styles use fixed reds, whites, and legacy shadow properties rather than shared semantic tokens.

17. **Role choices are not inclusive of evolving student identity.** “Creator” is treated as an account type rather than an optional capability, which can make the choice feel permanent and mutually exclusive.

18. **The 12–25 audience creates an unresolved age/privacy issue.** The current working tree removed date of birth and gender from required signup fields, which reduces unnecessary data collection. However, supporting users as young as 12 requires a legal and policy decision about minimum age, parental consent, and age-appropriate analytics—not simply re-adding date of birth.

### Missing edge states

- Startup timeout with Retry and Continue offline where safe.
- Email delivery delay guidance and “open email app” affordance.
- OTP maximum-attempt lockout with a clear next available action.
- Deep-link resume from approval/rejection email or notification.
- Pending request stored on one device but resumed on another.
- Personal email that is also an approved school email on the manual path.
- ID upload interrupted by app backgrounding or process death.
- ID file with missing base64, unsupported format, corrupt content, or upload timeout.
- Permission denied permanently, with a direct Open Settings action.
- Review status unknown/failed-precondition rather than pending/approved/rejected/expired.
- Profile creation succeeds server-side but the client times out before receiving the response.
- Success screen revisited after the profile route guard sends the user to tabs.
- First home feed fully empty for a new geography, school, or audience segment.
- Arabic truncation and mixed-direction email/code behavior at large text sizes.

## 3. Mobbin reference matrix

The references below are pattern research, not visual templates. No text, illustration, layout, or brand treatment should be copied directly.

| Reference | Strategy and observed pattern | Why it works | Fit for realX | Learning to adopt, not copy |
|---|---|---|---|---|
| [Grill’d — Student sign up](https://mobbin.com/flows/1c41d82b-cc38-4589-a7f6-37b9eb16150a) | Student benefit is an optional profile module; institution type precedes student-email verification. | Connects verification to a concrete reward and explains email use. | Closest direct student-benefit pattern. The long legal block and buried CTA would not fit realX. | State the unlocked benefit next to verification and explain data handling in one concise line with linked details. |
| [GCOO — Verify a student](https://mobbin.com/flows/fac59d50-9f26-4185-87ab-74262cd71e5b) | Benefits are shown first, then a compact name and school-email verification form. | Users understand the exchange before providing proof. | Strong fit for the student-ID/email decision. | Put “what verification unlocks” before method selection; keep proof requirements concrete. |
| [Saturn Calendar — Onboarding](https://mobbin.com/flows/a118e2a9-80bd-4966-93a1-0d3f6d0a1669) | Youth-oriented account setup combines OTP, school context, optional profile photo, and a first schedule action. | Uses a playful tone, skippable enrichment, and a highly relevant first action. | Very relevant audience and school context; its 23-screen length is too high. | Keep school/profile enrichment optional and end with one context-specific action, not a generic home dump. |
| [Quizlet — Onboarding](https://mobbin.com/flows/2327db2e-02f8-41d5-9ce3-4d19bf2a8816) | Account creation includes role and age, then optional premium, then a personalized learning home. | Clear validation and explicit role state; home immediately suggests what to do. | Relevant user type. Required age/paywall placement should not be copied without policy and proposition support. | Make validation inline, show selected state clearly, and make the first home task actionable. |
| [Brilliant — Onboarding](https://mobbin.com/flows/20ad012b-2683-4c0c-beb8-8ff62c6f509e) | Personalization happens before account creation; progress is persistent; signup saves the configured path. | Demonstrates value before asking for commitment and gives each question a reason. | Useful inspiration, but realX should not delay account creation with many questions. | Use at most one pre-account question; frame account creation as saving access, not as an arbitrary gate. |
| [Nibble — Onboarding](https://mobbin.com/flows/5df9112e-cba3-41a0-bad1-cf6ea08161e6) | Long preference survey with a progress bar, social proof, and notification benefit framing. | One question per screen keeps cognitive load low. | The long survey and demographic questions are a poor fit for account-first realX. | If personalization is added, keep it skippable, bounded, and visibly progressive. |
| [Skillshare — Onboarding](https://mobbin.com/flows/74cad4ce-4680-4706-a02e-4f49fad5db0b) | Immersive value welcome, early trial offer, account creation, topic selection, then recommendations. | Strong emotional promise and visually tailored destination. | Value-led welcome and topic selection fit; early paywall does not. | Show real student-life value, then use optional interests to shape the first feed. |
| [7-Eleven — Onboarding](https://mobbin.com/flows/ee0ed015-dee4-45b1-838f-b1161a2e3727) | Long linear account creation with visible progress, phone verification, email, name, and immediate rewards home. | Users always know where they are; the reward balance reinforces completion. | Rewards model is relevant, but the number of required fields is excessive for realX. | Keep visible progress and show an immediate XPoints/deals state after account creation. |
| [Everyday Rewards — Onboarding](https://mobbin.com/flows/413bce02-cc34-424f-aa82-9590d99924fc) | Four-step account setup with explicit labels, legal consent, then points-oriented home education. | Sets expectations and explains why sensitive fields are requested. | Strong rewards reference; the dense forms are not youth-friendly. | Use plain reasons for required data and teach points through the destination, not a long tutorial. |
| [ZIGZAG — Onboarding](https://mobbin.com/flows/f3ad0de9-6607-4372-9c32-adfcf34a57ee) | Separates required and optional consent, uses a dedicated completion moment, then opens a content-rich commerce home. | Consent is unbundled and success is unmistakable. | Good legal and success pattern; visual language is brand-specific. | Separate required terms from optional marketing and provide a clean account-created transition. |
| [Pinterest — Onboarding](https://mobbin.com/flows/f4ca27a5-92e5-4e3b-a1e3-9ce83608d6e2) | Progressive account fields, reasons for age/location, then a personalized feed with a dismissible privacy notice. | Explains data use at the moment of collection and lets the feed demonstrate value. | Relevant to offers/opportunities discovery. Location should remain deferred until map intent. | Add just-in-time reasons and use a contextual first-home coach mark rather than more onboarding slides. |
| [Reddit — Onboarding](https://mobbin.com/flows/3148f829-5cc5-44ed-b5cf-b11c69b826a1) | OTP, skippable profile attributes, interest/community selection, avatar, then feed. | Optionality is explicit and personalization has an immediate payoff. | Good model for optional interests; avatar and demographic steps are unnecessary. | Mark enrichment as optional and show exactly how choices change the home experience. |
| [Edits — Onboarding](https://mobbin.com/flows/7b850273-2801-4bf5-aff8-ae6021ba360e) | Minimal login-to-empty-project flow with one prominent creation action. | The empty state is the product tutorial. | Relevant to the first meaningful action, not to student verification. | Make the first empty state instructional and action-led rather than generic. |
| [Evernote — Onboarding](https://mobbin.com/flows/4f4d734f-364e-4506-917e-6a5a17fbadff) | Personalization preview, generated-experience loading state, optional upgrade, and setup checklist on home. | Loading communicates progress and the home checklist sustains onboarding after entry. | The plan upsell does not fit; the setup checklist does. | Use honest progress copy during longer work and continue onboarding with a small home checklist. |
| [Opal — Completing account setup](https://mobbin.com/flows/79ce4841-55da-4728-9ea4-29b3b162ba02) | Benefit proof, contextual notification priming, a playful reveal, then account creation to save progress. | Permission has a concrete purpose and the success moment is memorable. | Excellent permission/success reference; dramatic visuals should remain realX-specific. | Ask for notifications only for a chosen benefit and celebrate with the existing realX mascot/motion language. |
| [Roku — Onboarding](https://mobbin.com/flows/f559500e-a354-42d6-936b-882a1cdc63fd) | Value tutorial, notification prompt, sign-in or guest decision, then content home. | Guest access is explicit and permission purpose is visible before the system prompt. | Guest strategy is relevant; notifications appear too early for realX. | Preserve guest access, but request notifications only after account creation or a relevant follow action. |

### Cross-reference conclusions

- Strong flows explain the benefit before asking for data.
- Progress is useful when the journey exceeds two screens, but a long survey is not inherently premium.
- Personalization works best when optional and immediately reflected in the destination.
- Permission prompts work when tied to a specific promise, not a generic “stay updated.”
- Success should bridge into the first useful action, not act as a decorative dead end.
- Paywalls are effective only when a priced value proposition already exists. That condition is not present in this brief.

## 4. Recommended new flow

### Design principles

1. **Account first, enrichment later.** Every required pre-account step must be necessary for authentication, verification, legal compliance, or profile creation.
2. **One email entry, one visible decision.** Explain that a school email is fastest, but accept a personal email and route it to student-ID verification without making users discover a separate path first.
3. **Progressive disclosure.** Ask for proof only when the selected email requires it. Ask for interests and alerts only after the account exists.
4. **Preserve progress.** The manual-review branch must survive app restarts, guest browsing, and device return; avoid sending users back to welcome after a correctable failure.
5. **Show value twice.** Once before signup as a concise promise, and once after signup as a personalized first action.
6. **Do not collect data without a clear use.** Name is required for the profile. Role, school, age, location, interests, and notifications need explicit product or policy justification.

### Recommended happy path: supported school email

```text
Welcome
  -> Create my account
  -> Email
       school email detected/accepted by backend
  -> Code
  -> About you: first name, last name
       optional “I want a creator profile” disclosure if retained
  -> create account
  -> Success: “You’re in”
  -> optional interests (skip available)
  -> optional notification primer (Not now available)
  -> personalized home
  -> first action: open or save a recommended offer/opportunity
```

Required screens before account creation: four including welcome, compared with the current welcome + role + email + OTP + details sequence.

### Recommended fallback: personal or unsupported email

```text
Welcome
  -> Create my account
  -> Email
       backend indicates school email is unsupported
  -> inline branch explanation:
       “You can still join. Verify your email, then upload one student ID photo.”
  -> Code
  -> Student verification primer
  -> ID upload
  -> submission success / pending review
       browse as guest
       resume banner on home
       foreground/manual refresh or deep-link update
  -> approval
  -> secure resume OTP if backend still requires it
  -> About you
  -> create account
  -> Success
  -> optional interests and alerts
  -> personalized home
```

The fallback is necessarily longer, but the user sees why, how long it will take, what access they retain, and how to resume.

### Recommended sign-in path

```text
Welcome
  -> Sign in
  -> Email
  -> Code
  -> Home
```

If the email has no account, transition inline to “No account yet” with `Create account` and preserve the entered email. Do not open a modal over the form.

### Recommended guest path

```text
Welcome
  -> Explore first
  -> home in guest mode
  -> contextual account prompt only on protected/high-intent action
       preserve the intended destination/action
       authenticate
       return to the original action
```

Guest browsing should not count as onboarding completion, but it should have its own activation metrics.

## 5. Steps to remove, combine, or postpone

| Current step | Recommendation | Reason |
|---|---|---|
| Separate intro and role step inside one route | Remove role step from pre-auth happy path | It is premature segmentation and adds no immediate verification value. |
| Student vs Creator choice | Postpone until profile completion or settings; default to student if product permits | Most users are students; creator is an optional capability, not a different authentication method. |
| University email screen plus contact email screen | Combine into one email-entry component and branch after backend response | Removes a duplicated-feeling question and makes fallback discoverable. |
| Account-not-found modal on login | Replace with inline mode transition | Preserves context, improves focus accessibility, and reduces interruption. |
| Date of birth and gender | Keep removed unless legal/product requirements are documented | They are not required by the current account outcome and increase privacy burden. |
| Full interest survey before account | Postpone until after account creation and limit to one skippable screen | Protects conversion while enabling a better first feed. |
| Notification request before value | Keep postponed; ask after success or after first save/follow | Contextual requests produce a clearer consent decision. |
| Location permission | Keep postponed until map or nearby intent | It is unrelated to account creation. |
| Manual status polling every 60 seconds | Remove; use mount/foreground/manual refresh and push/email/deep link | Aligns system behavior with a 24–48-hour review and reduces calls. |
| Paywall/upgrade | Do not add to onboarding | No premium offer is defined and the product direction is free. |

## 6. Proposed information architecture

The IA should separate authentication, student verification, profile setup, and post-account activation even if routes remain in one Expo group.

```text
(onboarding)
  welcome
  auth/
    email            create-account or sign-in mode
    code             shared OTP state and resend
  verification/
    intro            why proof is needed, requirements, privacy
    upload-id        select, preview, replace, submit
    pending          pending, approved, rejected, expired, cancelled
  profile/
    basics           first and last name; optional creator disclosure
  activation/
    success          confirmed account-created moment
    interests        optional categories/goals
    alerts           optional permission primer

(tabs)
  home
    first-run module recommended from interests/default popularity
    resumable verification banner for guests
    dismissible setup checklist until first core action
```

Recommended state ownership:

- `AuthSession`: Firebase user and current auth intent.
- `OnboardingDraft`: normalized email, auth mode, verification method, role intent, names, and optional interests; persisted without sensitive OTP or ID data.
- `VerificationResume`: email, role, status token, submitted time, and request state; retain the existing 30-day expiry behavior.
- `OnboardingProgress`: server/profile-derived completion plus local activation flags. Do not rely solely on a local `onboardingComplete` boolean.
- Route guard: derive the next valid destination from auth, profile, verification, and guest state through one pure decision function with tests.

Backend contracts should remain the source of truth. The initial implementation can keep `checkStudentExists`, `sendOtp`, `verifyOtp`, `submitVerificationRequest`, `checkVerificationStatus`, `cancelVerificationRequest`, and `completeSignup`, while presenting a unified client flow. A later backend phase can add a single `beginEmailAuth` callable if product and security owners want the server to resolve account state and verification method in one call without leaking account existence.

## 7. Screen-by-screen specification

### S0. Startup and route resolution

**Goal:** get the user to the correct resumable state without showing navigation churn.

- Show native splash, then one branded realX loading surface.
- Resolve localization, App Check, auth, profile, guest, and pending state concurrently where safe.
- At 8 seconds, show “Taking longer than usual” with Retry. If offline and the user has a valid guest session, offer Explore offline with cached content.
- Never briefly render welcome before redirecting to pending or home.
- Analytics: `onboarding_route_resolved` with destination, duration bucket, online state, and flow version; never include email or UID.

### S1. Welcome

**Goal:** establish value and make account creation the obvious next step.

- One hero, not a carousel.
- Use the existing realX mascot/illustration language, but reduce continuous motion and visual competition around the CTA.
- Primary CTA: `Create my account`.
- Secondary text action: `Sign in`.
- Tertiary text action: `Explore first`.
- Language switch remains directly available.
- Show three compact benefit cues: student deals, XPoints, and opportunities.
- No permissions, role selection, legal checkbox, or paywall.

### S2. Email

**Goal:** begin account creation or sign-in with one clear identifier.

- Title and explanation change by mode, but component and layout stay shared.
- Account mode title: `What’s your student email?`
- Helper: `A school email is the fastest way to verify. No school email? You can still join with a student ID.`
- Sign-in mode title: `Welcome back`
- Sign-in helper: `Enter the email linked to your realX account.`
- Email field uses native email autofill, LTR text direction even in Arabic, clear button, and inline validation.
- Primary CTA in account mode: `Continue`.
- Primary CTA in sign-in mode: `Send sign-in code`.
- Show terms/privacy disclosure as concise footer copy for account mode, not a required marketing-consent checkbox.
- Backend result transitions inline:
  - existing account during signup: `You already have an account` + `Send sign-in code`.
  - no account during sign-in: `No account found` + `Create an account`.
  - unsupported school email: show fallback explanation + `Verify with student ID`.
- Preserve the entered email through every transition.

### S3. Code verification

**Goal:** confirm access to the email with minimal friction.

- Use one logical six-digit input with a six-cell visual presentation.
- Support OS one-time-code autofill, paste, and automatic submission when all six digits are present; keep a visible Continue fallback.
- Display the email and an `Edit email` action.
- Resend copy: `Send a new code in 0:42`; after cooldown: `Send a new code`.
- On invalid code, keep the code visible long enough for comprehension or select it for replacement; do not repeatedly shake for reduced-motion users.
- On maximum attempts: `Too many tries. Send a new code to continue.`
- On email delivery delay: `Codes can take a minute. Check spam or send a new one.`
- Use one consistent inline error region; reserve alerts for destructive/system-level problems.

### S4. Student verification intro (fallback only)

**Goal:** establish trust before asking for an ID image.

- Title: `Let’s verify you’re a student`
- Explain the sequence in three short steps: choose one ID photo, secure review, email update in usually 24–48 hours.
- Explicit privacy line: `Only authorized reviewers can see your ID. The image is deleted after review or expiry.`
- State accepted content: name, school, and current validity must be readable; unrelated numbers may be covered if policy allows.
- Primary CTA: `Choose student ID photo`.
- Secondary: `Not now` returns to welcome or guest home without losing verified email progress.
- Link to privacy details.
- Do not open the photo picker until the user taps the CTA.

### S5. Student ID upload and review

**Goal:** help the user submit a reviewable image on the first attempt.

- Use one large preview area with `Choose photo`, then `Replace photo`.
- Offer camera and photo library only if both are supported and policy-approved; otherwise label the library action accurately rather than showing a camera icon.
- After selection, run local checks for file availability, supported MIME type, size, and dimensions.
- Show a small quality checklist beside the preview: all corners visible, text readable, no glare.
- Primary CTA: `Submit for review`.
- Loading states progress through honest labels: `Preparing photo`, `Uploading securely`, `Submitting review`.
- If upload fails, keep the chosen image locally and offer Retry; do not force reselection.
- If permission is blocked, show `Open Settings` and `Choose another way` when possible.

### S6. Review pending

**Goal:** make a long asynchronous wait feel safe and resumable.

- Title: `We’re reviewing your ID`
- Copy: `We’ll email you when it’s ready—usually within 24–48 hours.`
- Show submitted email, submitted date, and current status.
- Primary CTA: `Explore realX while you wait`.
- Secondary action: `Check for update`; update `Last checked` on success.
- Tertiary destructive action: `Cancel request` with clear consequence.
- Check on screen entry and app foreground. Do not poll every 60 seconds.
- Approval notification/email should deep-link to this route.
- Guest home retains a visible, non-blocking status banner.

### S7. Review approved, rejected, or expired

**Approved**

- Title: `You’re verified`
- Copy: `Secure your account to finish setting up realX.`
- CTA: `Send sign-in code` or deep-link directly to the code screen after explicit confirmation.

**Rejected**

- Title: `We need a clearer photo`
- Show a user-safe review reason and the exact correction.
- CTA: `Upload another photo` returns to S5 with verified email retained.
- Secondary: `Get help` if repeated rejection support exists.

**Expired**

- Title: `Your verification expired`
- Copy: `For your privacy, the uploaded image was deleted.`
- CTA: `Start a new review` returns to S4, not welcome.

### S8. Basic profile

**Goal:** collect only what is required to create a useful account.

- Title: `What should we call you?`
- First and last name fields stack vertically at large text sizes; side-by-side is allowed only when both remain at least 44 points tall and labels do not truncate.
- Explain: `We use this to personalize your realX account.`
- Creator option, if retained: a non-blocking toggle/link labeled `I also create content` with a short explanation. The default remains student.
- Do not ask for gender, date of birth, photo, location, school, or graduation year without an approved requirement.
- Primary CTA: `Create my account`.
- While `completeSignup` runs: `Creating your account…` and prevent duplicate submission.
- If the response is lost, re-read the profile before showing failure to avoid duplicate-account confusion.

### S9. Account-created success

**Goal:** confirm the primary outcome and set up the next value action.

- Title: `You’re in, {firstName}.`
- Copy: `Your student deals, XPoints, and opportunities are ready.`
- Use a short, reduced-motion-safe mascot/check animation and optional haptic feedback.
- Show one primary CTA: `Personalize my feed`.
- Secondary: `Start exploring` skips S10 and S11.
- Do not show three generic checklist rows that compete equally with the primary next step.
- Fire `account_created` only after the server profile exists, not merely when this screen mounts.

### S10. Optional interests

**Goal:** improve the first feed without threatening account conversion.

- Title: `What are you into?`
- Subtitle: `Pick up to 3. You can change these anytime.`
- Suggested realX categories: Food & drink, Shopping, Experiences, Careers, Events, Learning.
- Use multi-select chips/cards with clear selected state and no default selection.
- CTA: `Show my picks`; secondary: `Skip`.
- Store preferences only after account creation. Failure should not block entry; show default popular content and retry later.

### S11. Optional alerts

**Goal:** request notification permission with a specific benefit.

- Prefer triggering after the user selects interests or saves/follows an offer.
- Title: `Want alerts for your picks?`
- Copy: `Get notified when new student offers and opportunities match what you chose.`
- Primary: `Turn on alerts` triggers the OS prompt.
- Secondary: `Not now` proceeds without penalty.
- If previously denied: replace the OS request with `Open Settings` and explain that alerts remain optional.
- Track primer choice separately from OS authorization result.

### S12. Personalized home and first core action

**Goal:** convert account completion into real product value.

- Place a first-run module above the general feed: `Picked for you` or, without interests, `Popular with students now`.
- Highlight one recommended offer and one opportunity, not every home module at once.
- Add a dismissible two-step setup checklist:
  - `Save your first offer`
  - `Explore an opportunity`
- When the first item is saved/opened, celebrate subtly and remove the corresponding checklist item.
- Empty personalized state: `Nothing matches those picks yet. Explore what’s popular or update your interests.`
- Offline state should show cached recommendations if available, with a small offline banner rather than replacing the entire home screen.

## 8. Copy direction for every screen

### Voice principles

- Premium means calm confidence, not formal language or excessive animation.
- Friendly means direct, supportive, and transparent about verification.
- Playful means small moments of wit and mascot personality, not jokes in errors, privacy, or rejection states.
- Use sentence case for body and task titles. Reserve the existing display all-caps style for short brand moments, not form instructions.
- State outcome and time before technical detail.
- Avoid “invalid,” “failed,” and “not allowed” when a corrective instruction is possible.
- Avoid implying guaranteed savings or rewards where eligibility applies.
- Translate intent into Arabic; do not mirror English word order mechanically. Keep emails, codes, and technical identifiers LTR inside RTL layouts.

### Copy inventory

| Screen/state | Primary title | Supporting direction | Primary CTA | Secondary/escape |
|---|---|---|---|---|
| Startup | `Getting realX ready` | Only shown after native splash | — | `Retry` after timeout |
| Welcome | `Spend less. Do more.` | Deals, XPoints, and opportunities for student life | `Create my account` | `Sign in`, `Explore first` |
| Signup email | `What’s your student email?` | School email is fastest; personal email can use ID | `Continue` | `Sign in` |
| Login email | `Welcome back` | Email linked to the account | `Send sign-in code` | `Create an account` |
| Existing account | `You already have an account` | Preserve email and offer correct path | `Send sign-in code` | `Use another email` |
| Unsupported school email | `You can still join` | Verify email, then upload one student ID photo | `Verify with student ID` | `Use another email` |
| OTP | `Check your email` | Six-digit code sent to displayed email | `Continue` | `Edit email`, resend |
| Verification intro | `Let’s verify you’re a student` | Requirements, privacy, 24–48 hours | `Choose student ID photo` | `Not now` |
| Upload | `Add one clear ID photo` | All corners, readable, no glare | `Submit for review` | `Replace photo` |
| Pending | `We’re reviewing your ID` | Email update, usually 24–48 hours | `Explore while you wait` | `Check for update`, cancel |
| Approved | `You’re verified` | Secure account to finish | `Send sign-in code` | — |
| Rejected | `We need a clearer photo` | Specific safe reason and correction | `Upload another photo` | `Get help` |
| Expired | `Your verification expired` | Image deleted for privacy | `Start a new review` | — |
| Profile | `What should we call you?` | Used to personalize the account | `Create my account` | Exit with confirmation |
| Success | `You’re in, {firstName}.` | Deals, XPoints, opportunities ready | `Personalize my feed` | `Start exploring` |
| Interests | `What are you into?` | Pick up to three; editable later | `Show my picks` | `Skip` |
| Alerts | `Want alerts for your picks?` | Match new offers/opportunities | `Turn on alerts` | `Not now` |
| First home | `Picked for you` | Based on selected interests | Item-specific action | Update interests |
| First empty | `Your picks are just getting started` | Offer popular content and editing | `Explore what’s popular` | `Update interests` |
| Offline | `You’re offline` | Progress is safe; reconnect to continue | `Try again` | Cached browse if available |

## 9. Required components

### New shared components

- `OnboardingScaffold`: safe areas, responsive scroll behavior, keyboard avoidance, header, progress, footer CTA, and compact-height handling.
- `OnboardingProgress`: semantic `Step n of m` plus a visual bar; branch-aware and hidden for one-step screens.
- `OnboardingHeader`: back/close behavior, title semantics, and language action.
- `OnboardingField`: label, helper, error, success, clear action, autofill, RTL/LTR direction, and disabled/loading states.
- `OnboardingPrimaryButton`: minimum target, loading label, semantic busy state, theme tokens, and haptic behavior.
- `InlineNotice`: info, warning, error, and success variants using semantic colors and icons.
- `OtpCodeField`: one accessible logical input with six visual cells and native autofill/paste.
- `VerificationMethodCard`: school-email and student-ID explanation without exposing internal backend terminology.
- `IdUploadCard`: picker, preview, local checks, quality guidance, progress, retry, and Settings recovery.
- `ReviewStatusCard`: pending/approved/rejected/expired status, timestamps, and actions.
- `InterestPicker`: maximum-three selection, selected semantics, skip, and persistence failure fallback.
- `PermissionPrimer`: value statement, primary permission action, Not now, current OS status, and Settings recovery.
- `FirstRunChecklist`: server/user-scoped completion state and dismiss behavior.

### Components to retain and evolve

- Keep `AppText`, locale-aware typography, theme contexts, connectivity context, `StateSurface`, and reduced-motion-aware onboarding motion.
- Evolve `StateSurface` with onboarding-specific messages and an optional secondary action.
- Evolve `VerificationStatusBanner` to announce status changes and preserve directional icons in RTL.
- Consolidate local onboarding styles into semantic spacing, radius, field, button, icon, and type tokens.

## 10. Visual design direction

### Concept: “Student life, unlocked”

The experience should feel like gaining access to a premium student membership, but without looking like a bank or a childish game. The visual system should combine calm white/dark surfaces, realX green as a confident action/accent color, compact playful mascot moments, and content previews drawn from actual realX categories.

### Visual rules

- Use one dominant idea per screen: value, email, code, proof, status, or success.
- Reduce the 250-point decorative header on form screens. Use a compact brand band or native header so the task appears above the fold on smaller devices and at large text sizes.
- Keep the full-bleed green/mascot composition for welcome and success only.
- Use 8-point spacing increments with limited exceptions: 4, 8, 12, 16, 24, 32, 40.
- Use consistent radii: 16 for fields/cards, 24 for feature cards, capsule only for actions/chips.
- Define responsive type roles rather than local sizes: display, screen title, section title, body, label, caption, action.
- Use semantic theme colors for error/warning/success in light and dark mode; remove hard-coded reds and whites.
- Use subtle motion for transition and feedback. Avoid looping headline/mascot motion while a user is reading or entering data.
- Preserve existing brand assets, but do not create Mobbin-like illustrations or copy another product’s composition.
- On Android, use native back behavior, system font scaling, appropriate ripple/pressed states, and platform permission conventions. Do not imitate iOS sheets or controls literally.
- Arabic layouts should be designed, not mirrored: reverse navigation and row direction where meaningful, keep numerals/emails LTR, and allow taller text blocks.

## 11. Accessibility requirements

Target WCAG 2.2 AA and native iOS/Android accessibility conventions.

- Minimum 4.5:1 contrast for normal text and 3:1 for large text, icons conveying state, controls, and focus indicators.
- Minimum interactive target: 44 × 44 points on iOS and 48 × 48 dp on Android, including text links.
- Support at least 200% text scaling without clipped titles, hidden actions, overlapping fields, or horizontal scrolling.
- Do not rely on fixed heights for text-bearing buttons/fields; use minimum heights and vertical padding.
- Every screen has one accessible heading and a logical focus start.
- Announce route titles, inline errors, request completion, upload progress, and review status changes.
- Move screen-reader focus to the first invalid field or error summary after submit.
- OTP is one logical field with clear label, value, error, and resend action.
- Every icon-only action has a localized label and, where useful, a hint.
- Selected role/interest/language states expose `selected`; async actions expose `busy`; disabled actions expose `disabled`.
- Decorative icons and duplicate animated text are hidden from the accessibility tree.
- Reduced Motion removes looping, shake, parallax, and nonessential stagger, but never removes content or status feedback.
- Do not depend on color alone for selection, progress, success, rejection, or errors.
- Keyboard order follows the visual order; Return/Next actions do not submit incomplete forms unexpectedly.
- Terms/privacy links form coherent spoken sentences in English and Arabic.
- Image upload includes a text alternative describing selection state, not the sensitive ID contents.
- Test with VoiceOver, TalkBack, Switch Control/Voice Access, bold text, increased contrast, dark mode, and Arabic at large text sizes.

## 12. Loading, error, empty, permission, and offline states

| Context | Loading | Error/failure | Offline | Recovery/empty behavior |
|---|---|---|---|---|
| Startup | Branded determinate-looking but honest readiness state | Timeout after 8s; log failing gate | Allow cached guest route where safe | Retry individual readiness work; never loop silently |
| Email check/send | Spinner plus `Checking email…` or `Sending code…` | Inline mapped error; preserve email | Disable call and show persistent notice | Retry; offer correct auth/verification branch |
| OTP | Busy CTA; inputs locked briefly | Invalid, expired, used, rate-limited, max attempts | Preserve entered digits locally in memory | Resend, edit email, or retry after reconnect |
| Profile creation | `Creating your account…` | Re-read server profile before declaring failure | Preserve names locally | Retry idempotently; if profile exists, proceed to success |
| Photo picker | Native picker transition | Permission blocked, no asset, no base64, corrupt/unsupported | Picker can still open; submit cannot | Open Settings, reselect, or cancel without losing email verification |
| ID upload | Phase labels and optional progress | Timeout, storage failure, already pending, too large | Keep selected photo and draft | Retry upload; if server has pending request, restore status |
| Review pending | Small refresh indicator only | Status unavailable, invalid token, cancelled | Show cached last status and last-checked time | Retry, restore by secure email flow, or contact support |
| Review rejected | No spinner | Show safe reason | Cached reason remains readable | Return directly to upload with requirements |
| Interests | Save indicator | Non-blocking save failure | Store draft and show defaults | Enter home; retry in background or settings |
| Notifications | Spinner only while requesting/registering | Denied, unavailable device, token failure | Permission can resolve; token sync waits | Not now, Open Settings, later retry |
| First home | Skeletons prioritize first-run module | Section-level retry; do not blank entire page | Cached feed plus offline banner | Empty copy suggests popular content and interest changes |

Error copy format:

1. What happened in plain language.
2. Whether progress is safe.
3. The next available action.

Never expose raw Firebase codes, status tokens, storage paths, or whether an arbitrary email exists outside the authenticated/intentional flow.

## 13. Future analytics and success metrics

### Event design

If analytics is reintroduced, keep it free of email, name, ID metadata, OTP, status token, UID, and unbounded error text. Add `flow_version: onboarding_v2`, `platform`, `locale`, `auth_mode`, `verification_method`, and `role_intent` only where relevant and policy-approved.

Prefer distinct stable events for funnel construction:

| Event | Trigger | Key parameters |
|---|---|---|
| `onboarding_started` | Welcome primary CTA | source, flow_version |
| `onboarding_guest_started` | Explore first | source |
| `auth_email_submitted` | Valid email submit | auth_mode |
| `auth_route_resolved` | Server determines next route | auth_mode, next_route, verification_method |
| `auth_code_sent` | Callable succeeds | auth_mode, verification_method |
| `auth_code_verified` | OTP verification succeeds | auth_mode, verification_method, attempt_bucket |
| `auth_error_shown` | Actionable auth error appears | step, error_code, recoverable |
| `verification_started` | Fallback primer CTA | method |
| `verification_upload_started` | ID submit starts | source |
| `verification_submitted` | Server returns status token | method |
| `verification_status_viewed` | Pending/status screen view | status, request_age_bucket |
| `verification_resumed` | Banner/deep link opens status | source |
| `verification_cancelled` | Cancellation succeeds | request_age_bucket |
| `profile_submitted` | Create-account CTA | role_intent |
| `account_created` | Server profile is confirmed | verification_method, role |
| `activation_interests_saved` | Optional choices saved | selection_count |
| `activation_interests_skipped` | Skip | — |
| `notification_primer_choice` | Primer action | choice |
| `notification_permission_result` | OS result known | status |
| `onboarding_finished` | User enters home after account creation | personalized, duration_bucket |
| `first_core_action` | First save/open/redeem/opportunity action | action_type, content_type, time_since_account_bucket |

The current `onboarding_funnel` event can be emitted in parallel for one release to preserve historical continuity, then deprecated after dashboards migrate.

### Funnel definitions

Primary funnel:

```text
welcome viewed
  -> onboarding started
  -> email submitted
  -> code sent
  -> code verified
  -> profile submitted
  -> account created
  -> onboarding finished
```

Manual-verification funnel:

```text
fallback offered
  -> verification started
  -> code verified
  -> upload started
  -> verification submitted
  -> approved
  -> resumed
  -> account created
```

Guest funnel:

```text
guest started
  -> content viewed
  -> protected intent
  -> auth started
  -> account created
  -> intended action completed
```

### Success metrics

Primary:

- Welcome-to-account-created conversion.
- Email-submitted-to-code-sent conversion.
- Code-sent-to-code-verified conversion.
- Verified-to-profile-created conversion.
- Median time to account creation for school-email users.

Manual verification:

- Fallback-offered-to-submission conversion.
- First-attempt usable-ID rate.
- Median review time and 90th percentile review time.
- Approval, rejection, expiry, and cancellation rates.
- Approved-to-account-created conversion.

Activation:

- Account-created-to-first-core-action conversion within 10 minutes, 24 hours, and 7 days.
- Interest selection completion and effect on first-core-action rate.
- First offer saved/opened and first opportunity opened.
- Day-1 and day-7 retained account users, segmented by verification method.

Quality and guardrails:

- Error rate by step/error code.
- OTP resend and rate-limit rates.
- Offline interruption and recovery rate.
- Crash-free onboarding sessions.
- Accessibility defect count from manual QA.
- Notification primer acceptance, OS grant, and 7-day opt-out rates.
- Guest-to-account conversion without loss of intended action.

Do not optimize account conversion by hiding verification, privacy, cancellation, or permission choices. Review metrics by locale, platform, text-size cohort where available without fingerprinting, and verification method.

## 14. Implementation phases

### Phase 0 — Decisions and measurement baseline

- Confirm minimum-age and parental-consent policy for ages 12–13.
- Decide whether creator is a permanent account role, an additive capability, or post-signup profile setting.
- Confirm whether school email can be inferred client-side only for presentation while the backend remains authoritative.
- Define `account_created` and first-core-action semantics.
- Capture the current funnel baseline before changing event names.

### Phase 1 — Shared foundation

- Add the branch-aware onboarding state model and pure route-decision tests.
- Build shared scaffold, form, progress, OTP, notices, and CTA components.
- Consolidate spacing, radius, typography, and semantic status tokens.
- Add startup timeout/recovery and event flow versioning.
- No backend contract changes required.

### Phase 2 — Account happy path

- Replace early role selection with direct email entry.
- Unify signup/sign-in shells and inline account-state transitions.
- Replace six independent OTP semantics with one logical field.
- Simplify profile creation and implement idempotent success recovery.
- Ship behind a remote/configurable rollout flag if available.

### Phase 3 — Student-ID fallback

- Add verification primer, robust image validation/progress, and direct failure recovery.
- Reduce pending checks to entry/foreground/manual refresh.
- Add approval/rejection deep links and status notification handling.
- Preserve guest browsing and status banner.
- Coordinate any callable changes with the canonical backend owner before deployment.

### Phase 4 — Post-account activation

- Add account-created success, optional interests, optional contextual alerts, first-run home module, and checklist.
- Keep personalization failures non-blocking.

### Phase 5 — QA and rollout

- Test iOS and Android on compact and large devices, light/dark mode, English/Arabic, LTR/RTL, large text, VoiceOver/TalkBack, reduced motion, slow network, offline transitions, app background/restore, and denied permissions.
- Test every callable error and manual-review status with controlled fixtures/emulators.
- Roll out progressively and compare errors, review completion, and support volume against baseline. Add conversion analysis only if approved telemetry is introduced.

## 15. Risks and open decisions

### Product and policy

1. **Minimum age:** What rules apply to 12-year-old users in Qatar and target markets? Is parental consent required before any future telemetry can run?
2. **Creator model:** Is Creator mutually exclusive with Student, or should it be an additive capability? This determines whether role can safely move after account creation.
3. **Student definition:** Are secondary-school students eligible, or only university students? Current copy says university email while the target age begins at 12.
4. **School metadata:** Is school name needed for eligibility, personalization, reporting, or support? If not, do not collect it.
5. **Manual review SLA:** Can the team reliably meet 24–48 hours? Copy and notification expectations must match operations.
6. **ID privacy:** Confirm deletion timing for approved, rejected, cancelled, and expired requests and make UI copy match server behavior exactly.
7. **Guest limits:** Which actions are safe and useful before verification, and should intended actions resume after authentication?

### Backend and security

8. **Account enumeration:** A unified email flow must not weaken current protections or disclose arbitrary account existence. Server-owned routing or carefully scoped messages may be required.
9. **Manual approval resume:** Can an approval deep link securely establish the next step without requiring the user to repeat unnecessary email entry?
10. **Idempotency:** `completeSignup` is mostly idempotent, but the client needs an explicit recovery contract for timeout-after-success.
11. **Cross-device pending state:** The local status token enables same-device resume. Define a secure recovery path when the user returns on a different device.
12. **Polling and notifications:** Removing 60-second polling assumes reliable email/push or user-initiated refresh. Confirm operational notification delivery.
13. **Canonical ownership:** The mobile `functions/` directory contains relevant callable code, but production ownership/deployment must be confirmed before implementation.

### UX and technical

14. **Personal email branching:** The UI can optimistically describe both methods, but the backend must remain authoritative for supported domains and account state.
15. **Interest data model:** Categories need stable IDs, localization, defaults, and a failure-tolerant persistence endpoint.
16. **Home personalization:** The first-run module must have enough real offer/opportunity inventory to avoid an empty personalized promise.
17. **Notification timing:** Success-screen prompting is acceptable, but a first-save/follow prompt may be more contextual. This should be A/B tested only after event quality is verified.
18. **Dark mode and Arabic:** The current local onboarding styles contain fixed colors, offsets, and English-shaped headings; component consolidation is required before visual polish.
19. **Existing uncommitted work:** The current working tree already contains onboarding, backend, and localization changes. Implementation must preserve and reconcile that work rather than replacing it wholesale.

## Acceptance criteria for specification sign-off

The implementation phase should not begin until product, design, backend, analytics, legal/privacy, and operations agree on:

- the minimum required pre-account fields;
- the creator-role model;
- eligibility for ages 12–17 and school types;
- the unified email branch behavior and enumeration protections;
- manual review SLA and ID deletion promises;
- the `account_created` and first-core-action definitions;
- the no-paywall decision for this release;
- the screen list, English copy direction, Arabic localization approach, and accessibility requirements;
- the event schema and baseline dashboard;
- the canonical backend repository and deployment owner.

Only after those decisions are closed should the team convert this document into implementation tickets, design files, API changes, and QA cases.
