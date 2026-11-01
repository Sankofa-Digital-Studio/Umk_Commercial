# Survivor onboarding and face routing

## Outcome

The first Safe Haven visit now uses a three-step flow backed by live, user-scoped Supabase data:

1. Create the survivor profile and choose a camouflage face.
2. Add at least one ICE contact, with up to five supported.
3. Review location and notification permissions before entering Safe Haven.

No survivor, ICE, or evidence example records are created for a new user. Profile and ICE data are not written to `localStorage`; obsolete local profile keys are removed when the profile service starts.

## Four same-origin faces

| Face | Route | Numeric switch |
| --- | --- | --- |
| PowerCalc SA | `https://ishekomberera.vercel.app/?face=1` | `8421` |
| Coco Bongo Beats | `https://ishekomberera.vercel.app/?face=2` | `8422` |
| Daily Verse SA | `https://ishekomberera.vercel.app/?face=3` | `8423` |
| Ipkiss Launcher | `https://ishekomberera.vercel.app/?face=4` | `8424` |

The existing `8426` Safe Haven sequence and `9999` duress sequence remain reserved. Face switches update both the active disguise and the same-origin URL, so reloads and shared entry points resolve consistently.

## Persistence and access control

- The browser creates an anonymous Supabase Auth session for the device.
- `profiles.id` and `guardians.user_id` reference `auth.users.id`.
- Row-level security restricts every profile and guardian operation to `auth.uid()`.
- Table access is granted to `authenticated`, not the public `anon` database role.
- Profile saves use an upsert; ICE contacts are reconciled by stable UUID and ordered position.
- The production environment requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (legacy `VITE_SUPABASE_ANON_KEY` remains supported during migration).

Deployment prerequisite: enable **Allow anonymous sign-ins** in Supabase Authentication before promoting this flow. Database tables, RLS policies, and application environment variables are already prepared, but profile and ICE writes intentionally fail closed without a valid authenticated session.

## Landing and Safe Haven interaction contract

- The landing page requests live device location and maps the resolved metro/province to the appropriate municipal tariff, outage contact, and water-system context. If permission is unavailable, the UI says so and does not claim Johannesburg as the user's location.
- The municipal information rail starts closed and exposes an accessible chevron control. The Full Meter Diagnostics Directory opens the STS/TID workspace and moves it into view.
- The floating boundary control scrolls to the bottom while the viewport is at the top, and changes to a scroll-to-top control after the user moves down the page.
- Consumer Portal & Downloads supports click/tap, double-tap/knock, horizontal swipe/slide, and the `2468` numeric shortcut. Modal close actions return `true` to the parent visibility handler.
- Safe Haven does not select a default care centre without live or cached coordinates. Nearest-centre claims are withheld until location is available.
- Toll-free and Please Call Me entries first open an in-app contact panel. The user can copy the number and deliberately open the phone dialler without losing Safe Haven context.

## Acceptance checks

- `?face=1` through `?face=4` render the expected facade.
- Entering `8421` through `8424` switches to the matching facade without leaving the production origin.
- Edit profile and ICE contact CTAs open their matching setup section.
- A first-time user cannot finish setup without a name or alias and at least one ICE contact.
- A new database user begins with zero profile, guardian, and evidence rows.
- Reloading after completion returns the authenticated device to its stored profile, contacts, preferred face, and completed state.
- With no GPS permission, Safe Haven shows a neutral national scope and no false nearest-centre result.
- National lifelines remain visible in-app until the user explicitly selects the dialler action.
