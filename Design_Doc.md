☕

**BrewBoard**

UI/UX Design Document

*Smart Café Ordering Platform · Version 1.0 · June 2026*

  ------------------- ------------------------------------------
  **Document Type**   UI/UX Design Document
  **Product**         BrewBoard --- B2C Café Ordering Platform
  **Version**         1.0 --- Draft
  **Date**            June 2026
  **Based On**        BrewBoard PRD v1.0
  **Status**          Pending Design & Tech Review
  **Prepared For**    Design + Engineering Teams
  ------------------- ------------------------------------------

1\. Introduction & Document Purpose

This document defines the visual design language, component
specifications, layout rules, interaction patterns, and responsive
behaviour for BrewBoard --- a B2C café ordering web application. It is
derived from the BrewBoard PRD v1.0 and serves as the single source of
truth for design decisions during development.

BrewBoard ships two distinct interfaces:

-   Customer App --- a mobile-first, doodle-aesthetic web app for
    dine-in café guests to browse the menu, manage a shared table
    session, place orders, and receive live updates from staff.

-   Café Admin Dashboard --- a tablet- and desktop-optimised interface
    for café staff to manage incoming orders, send table notifications,
    and build the digital menu using AI photo extraction.

  ------------------------------------------------------------------------------------
  **Scope of this document**
  · Visual design language (colours, typography, spacing, iconography)
  · Component library (buttons, cards, forms, navigation, modals, toasts)
  · Screen-by-screen layout specifications for both Customer App and Admin Dashboard
  · Responsive breakpoints and behaviour
  · Interaction & animation guidelines
  · Accessibility requirements
  · Design tokens
  ------------------------------------------------------------------------------------

2\. Design Principles

All design decisions for BrewBoard should be measured against five core
principles derived from the product\'s positioning as a warm, joyful,
and delightful café companion.

  ---------------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------ -----------------------------------------------------------------------------------------------------------------------------
  **Principle**          **Description**                                                                                                                                                    **How it shows up in the UI**
  Doodle-first           Every screen feels like a hand-crafted sketchbook page. Borders are thick and slightly imperfect; shadows are hard offsets, not blurs.                             Kalam/Caveat typography, 3--5 px offset box-shadows, hand-drawn SVG illustrations on empty states and onboarding.
  Warm & inviting        Colours and copy should feel like a cosy café, not a cold SaaS dashboard.                                                                                          Coffee/Cream/Caramel palette; whimsical microcopy (\'sunshine on my mind\', \'good vibes only\'); emoji used intentionally.
  Real-time clarity      Live order status must be immediately legible; customers should never have to wonder what is happening with their order.                                           Bold status badges, colour-coded states (Received / Preparing / Ready), animated pulse on active items.
  Mobile-first           The Customer App is designed for a 375--430 px viewport first; layouts are then adapted upward. Admin Dashboard is designed tablet-first (768 px), then desktop.   Single-column card layout on mobile; category filter as horizontal scroll chips; sticky bottom nav bar on Customer App.
  Accessible & legible   Text contrast ratios \>= 4.5:1 (WCAG AA) at all times. Touch targets \>= 44 x 44 px.                                                                               Dark ink (\#2C2416) on cream/white backgrounds; minimum font size 14 px body; all interactive elements labelled.
  ---------------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------ -----------------------------------------------------------------------------------------------------------------------------

3\. Visual Design Language

3.1 Colour Palette

The palette is built around warm, coffee-inspired tones with a set of
pastel accent colours used for categories, statuses, and emphasis. All
colours have been tested for WCAG AA contrast compliance against their
expected backgrounds.

Primary palette --- used on all screens:

+----------------+---------------+----------------+---------------------+------------+
|                |               |                |                     |            |
+----------------+---------------+----------------+---------------------+------------+
| **Coffee**     | **Espresso**  | **Latte**      | **Caramel**         | **Cream**  |
|                |               |                |                     |            |
| \#6B3A2A       | \#3B1C0F      | \#C8956C       | \#E8A855            | \#FFF8F0   |
|                |               |                |                     |            |
| Primary / CTAs | Text on light | Secondary text | Accent / Highlights | Background |
+----------------+---------------+----------------+---------------------+------------+

Accent palette --- used for category badges, status states, and feature
highlights:

+-------------+-------------+-------------+-------------+-------------+
|             |             |             |             |             |
+-------------+-------------+-------------+-------------+-------------+
| **Mint**    | **Sky**     | **Blush**   | *           | **Coral**   |
|             |             |             | *Lavender** |             |
| \#7EC8A4    | \#A8D8EA    | \#F4A7B9    |             | \#F4896B    |
|             |             |             | \#C9B8E8    |             |
| Success /   | Info /      | Seasonal /  |             | Error /     |
| Brew Points | Joined      | Specials    | AI / Nano   | Alerts      |
|             |             |             | feature     |             |
+-------------+-------------+-------------+-------------+-------------+

  --------------------------------------------------------------------------------------------------------------------------
  **Colour usage rules**
  · White (\#FFFFFF) is the card surface; Cream (\#FFF8F0) is the page background.
  · Never place Caramel text on a Cream background --- insufficient contrast. Use Espresso (\#3B1C0F) for text on Caramel.
  · Status colours: Received = Sky, Preparing = Caramel, Ready / Complete = Mint, Error = Coral.
  · The Lavender accent is reserved exclusively for AI-powered features (Nano image generation, Gemini menu builder).
  · Dark mode is out of scope for v1.0. All colour decisions are light-mode only.
  --------------------------------------------------------------------------------------------------------------------------

3.2 Typography

BrewBoard uses a three-font system: a display face for brand identity, a
handwritten face for whimsical accents, and a clean humanist face for
readable body copy and UI labels.

  ------------------- ----------------- --------------- ---------------- -----------------------------------------------------------------------------------
  **Role**            **Font Family**   **Weight(s)**   **Sizes Used**   **Usage**
  Display / Brand     Kalam             700             48--96 px        App name, hero headings, large price labels, quantity counters
  Whimsical Accent    Caveat            400, 600, 700   14--24 px        Sub-headings, category labels, microcopy (\'good vibes\'), timestamps, badge text
  Body / UI           Patrick Hand      400, 600        14--18 px        Body copy, form fields, nav labels, descriptions, item names on admin
  Monospace (Admin)   JetBrains Mono    400             12--14 px        Table Codes (e.g. BREW42), Gemini confidence scores, technical meta
  ------------------- ----------------- --------------- ---------------- -----------------------------------------------------------------------------------

Type scale --- minimum sizes enforced across breakpoints:

  ------------ -------------- --------------- ------------ ----------------- -------------------
  **Token**    **Font**       **Size (px)**   **Weight**   **Line-height**   **Colour**
  display-xl   Kalam          72              700          0.9               Coffee or Caramel
  heading-lg   Kalam          36              700          1.1               Coffee
  heading-md   Kalam          24              700          1.2               Espresso
  heading-sm   Kalam          20              700          1.3               Espresso
  subhead      Caveat         18              600          1.4               Latte
  body-lg      Patrick Hand   16              400          1.6               Ink (\#2C2416)
  body-md      Patrick Hand   14              400          1.6               Ink (\#2C2416)
  caption      Caveat         13              400          1.5               Latte
  label        Caveat         12              700          1.4               Coffee
  mono         JetBrains      13              400          1.5               Espresso
  ------------ -------------- --------------- ------------ ----------------- -------------------

3.3 Spacing System

BrewBoard uses a consistent 8 px base spacing grid. All margins,
paddings, and gaps should be multiples of 8 px. The following named
tokens map to specific pixel values and must be used uniformly across
all components.

  ----------- ----------- ---------------------------------------------------------
  **Token**   **Value**   **Usage**
  space-1     4 px        Icon padding, tight inline spacing
  space-2     8 px        Component internal padding (dense), gap between chips
  space-3     12 px       Gap between icon and label, tag padding
  space-4     16 px       Standard component padding, list item gap
  space-5     20 px       Card internal padding (horizontal)
  space-6     24 px       Card internal padding (vertical), section gap on mobile
  space-8     32 px       Section gap, modal padding
  space-10    40 px       Large section gap on desktop
  space-12    48 px       Hero padding top/bottom on mobile
  space-16    64 px       Page section separation on desktop
  ----------- ----------- ---------------------------------------------------------

  ------------------------------------------------------------------------------------------------------------------------
  **Spacing rules**
  · All components must use space tokens --- no arbitrary pixel values.
  · Horizontal page padding: 16 px on mobile (\< 640 px), 24 px on tablet (640--1024 px), 40 px on desktop (\> 1024 px).
  · Card-to-card gap: 16 px on mobile, 20 px on tablet and desktop.
  · Section-to-section gap: 40 px on mobile, 64 px on desktop.
  · Touch targets must be at minimum 44 x 44 px regardless of visual size.
  ------------------------------------------------------------------------------------------------------------------------

3.4 Iconography & Illustrations

BrewBoard uses hand-drawn SVG illustrations as a primary visual
differentiator. Icons use the Phosphor icon set (duotone style) as a
base, with custom doodle-style modifications applied to match the brand
aesthetic.

-   Stroke weight: 2--2.5 px on all icons, 2.5--3 px on illustrations.

-   Icon size: 20 px inline, 24 px in navigation, 32 px for feature
    icons, 64+ px for empty states.

-   Each menu category and status state has a dedicated hand-drawn
    emoji-style illustration.

-   Empty states must include a hand-drawn illustration + Caveat
    caption + optional CTA.

-   Order status icons: clock (Received), steam/flame (Preparing), tick
    circle (Ready), checkmark (Complete).

3.5 Borders, Shadows & Radius

The doodle aesthetic relies heavily on hard offset box-shadows and thick
visible borders. All shadows are flat/offset (no blur), and borders use
slightly-above-standard weights to reinforce the hand-crafted feel.

  --------------- ------------------------------------ ----------------------------------------------
  **Token**       **CSS Value**                        **Usage**
  border-ink      2.5 px solid \#2C2416                Primary cards, buttons, inputs
  border-soft     2 px solid \#D4B896                  Secondary cards, dividers, table cells
  border-dashed   1.5 px dashed rgba(107,58,42,0.25)   Order item separators, subtotal lines
  shadow-sm       3px 3px 0 \#2C2416                   Buttons, chips, small cards
  shadow-md       5px 5px 0 \#2C2416                   Standard cards, panels
  shadow-lg       8px 8px 0 \#2C2416                   Featured cards, modals, reward card
  radius-sm       8 px                                 Chips, badges, small elements
  radius-md       16 px                                Buttons, toasts, input fields
  radius-lg       20 px                                Menu cards, order cards
  radius-xl       24 px                                Panels, large cards, reward card
  radius-pill     50 px / 9999 px                      Category pills, nav links, quantity controls
  --------------- ------------------------------------ ----------------------------------------------

  ----------------------------------------------------------------------------------------------------------
  **Hover interaction rule**
  · On hover, cards and buttons translate -2 px X and -2 px Y, and the shadow increases by 2 px.
  · Transition: transform 0.15 s ease, box-shadow 0.15 s ease.
  · On click/active: scale(0.98) with shadow reduced to shadow-sm.
  · These interactions give the physical \'pressing a sticker\' feel consistent with the doodle aesthetic.
  ----------------------------------------------------------------------------------------------------------

4\. Responsive Design & Breakpoints

BrewBoard is a fully responsive web application. The Customer App is
designed mobile-first; the Admin Dashboard is designed tablet-first. All
layouts must be tested at every defined breakpoint before shipping.

  ---------------- ----------- --------------- --------------- ------------------------------ ---------------------------
  **Breakpoint**   **Token**   **Min Width**   **Max Width**   **Target Device**              **Primary Interface**
  Mobile S         xs          320 px          479 px          Small smartphones              Customer App
  Mobile           sm          480 px          639 px          Standard smartphones           Customer App
  Tablet P         md          640 px          767 px          Large phones / small tablets   Customer App + Admin
  Tablet           lg          768 px          1023 px         Tablets (portrait+landscape)   Admin Dashboard (primary)
  Desktop          xl          1024 px         1279 px         Laptops                        Admin Dashboard
  Wide             2xl         1280 px+        ---             Large monitors                 Admin Dashboard
  ---------------- ----------- --------------- --------------- ------------------------------ ---------------------------

4.1 Customer App --- Responsive Behaviour

  -------------------- ------------------------------------------- -----------------------------------------
  **Component**        **Mobile (\< 640 px)**                      **Tablet / Desktop (\>= 640 px)**
  Navigation           Bottom sticky nav bar, 5 icons              Top horizontal nav bar with text labels
  Menu categories      Horizontally scrollable pill row            Wrap to 2 rows or full pill row
  Menu grid            2-column card grid (164 px min)             3--4 column grid
  Cart sidebar         Full-screen drawer (slide up from bottom)   Right sidebar (320 px fixed)
  Order confirmation   Full-screen modal with slide-up animation   Centred modal overlay
  Live feed cards      Full width, stacked vertically              Max 640 px centred, stacked
  Table Code display   Full-width hero card, large mono text       Centred card with QR hint
  Page padding         16 px horizontal                            24--40 px horizontal
  -------------------- ------------------------------------------- -----------------------------------------

4.2 Admin Dashboard --- Responsive Behaviour

  --------------------- ---------------------------------------- ---------------------------------------------
  **Component**         **Tablet Portrait (768--1023 px)**       **Desktop (\>= 1024 px)**
  Layout                Single column with collapsible sidebar   Two-column: sidebar (260 px) + main content
  Table cards grid      2-column grid                            3--4 column grid, larger cards
  Order details panel   Full-width below the table card          Right drawer (400 px)
  Menu builder          Stacked: upload top, preview below       Side-by-side: upload left, preview right
  Love messages panel   Bottom sheet                             Inline sidebar section
  Nav                   Top bar + hamburger for sidebar          Persistent left sidebar with icons + labels
  --------------------- ---------------------------------------- ---------------------------------------------

  ----------------------------------------------------------------------------------------------------------------------------------
  **Responsive design rules**
  · Use CSS Grid with auto-fit and minmax() for all card grids --- never hardcode column counts.
  · All font sizes must remain above their minimum values (see token table) at any viewport.
  · Touch-only interactions (swipe to dismiss toast, swipe to adjust cart qty) are enabled on xs/sm only.
  · No horizontal scroll on any page except explicitly scrollable rows (category pills, stamp grid).
  · Admin Dashboard must support both portrait and landscape orientation on tablets.
  · Test at 375 px (iPhone SE), 390 px (iPhone 14), 430 px (iPhone 14 Plus), 768 px (iPad), 1024 px (iPad Pro landscape / laptop).
  ----------------------------------------------------------------------------------------------------------------------------------

5\. Component Library

All components follow the design token system defined in Section 3. Each
component is described with its anatomy, states, sizing rules, and
responsive notes.

5.1 Buttons

  ------------- ---------------- ------------------ ----------------- ------------ ---------------- ------------------------------------
  **Variant**   **Background**   **Border**         **Text colour**   **Shadow**   **Min height**   **Usage**
  Primary       Coffee           2.5 px, Espresso   Cream             shadow-sm    48 px            Place Order, Publish Menu, Sign In
  Secondary     White            2.5 px, Ink        Coffee            shadow-sm    44 px            View Menu, Cancel, Back
  Accent        Caramel          2 px, Espresso     Espresso          shadow-sm    44 px            Cart, Add to Cart, Quick actions
  Ghost         Transparent      2 px, Latte        Coffee            none         40 px            Tertiary actions, inline links
  Destructive   Coral (light)    2 px, Coral        Coral (dark)      shadow-sm    44 px            Delete item, Clear cart
  Icon only     Caramel          2 px, Espresso     Espresso          shadow-sm    40 x 40 px       Add (+), remove (-), close (x)
  ------------- ---------------- ------------------ ----------------- ------------ ---------------- ------------------------------------

All buttons: border-radius: radius-pill. Hover: translateY(-2px) +
shadow increase. Active: scale(0.98). Disabled: 40% opacity, no shadow,
no hover state. Full-width on mobile (\< 640 px) for primary and
secondary. Min 44 x 44 px touch target on all devices.

5.2 Cards

-   Menu Card --- white background, border-ink, radius-lg, shadow-md.
    Contains: 160 px illustration area, category badge, item name
    (heading-sm), description (caption), price (heading-md), add button.
    Two-column grid on mobile; 3--4 cols on desktop.

-   Order Card (Live Feed) --- cream background, border-soft, radius-xl,
    shadow-sm. Contains: customer avatar, order items list, timestamp,
    status badge. Full-width stacked layout.

-   Table Card (Admin) --- white background, border-ink, radius-xl,
    shadow-md. Contains: table number (display), guest count, condensed
    order list, love message button. Expandable to full order detail
    view.

-   Reward Card --- Coffee-gradient background, cream text, radius-xl,
    shadow-lg. Contains: points display, stamp grid, progress bar.

5.3 Status Badges

  ------------- ----------------- ------------- --------------- --------------
  **Status**    **Background**    **Border**    **Text**        **Icon**
  Received      Sky (\#E8F4FA)    Sky           Sky dark        clock
  Preparing     Caramel light     Caramel       Espresso        flame
  Ready         Mint (\#E8F8F1)   Mint          Mint dark       checkmark
  Complete      Light gray        Gray          Dark gray       check-double
  New (badge)   Blush             Blush dark    Blush dark      star
  AI feature    Lavender          Lavender dk   Lavender dark   sparkle
  ------------- ----------------- ------------- --------------- --------------

Badges: Caveat bold 13 px, radius-pill, 3 px top/bottom padding, 12 px
left/right padding, 1.5 px border, rotate(-1deg). Status badges animate
with a 1.5 s pulse when status changes.

5.4 Form Elements & Inputs

-   Text Input --- white bg, border-ink, radius-md, 14 px vertical
    padding, 20 px horizontal padding, 16 px Patrick Hand text. Focus:
    border-color changes to Coffee, shadow 3px 3px 0 Coffee.
    Placeholder: Latte colour.

-   Search Bar --- full-width text input with radius-pill, search icon
    button on right (Caramel bg, Espresso border, shadow-sm).

-   Category Chip (filter pill) --- white bg, border-ink, radius-pill,
    shadow-sm. Active: Coffee bg, cream text. Hover: Caramel bg.

-   Size Selector --- visual cup size row (S/M/L/XL) with height-coded
    cup icons. Active cup: Caramel fill. Each option includes size label
    and price in Caveat.

-   Quantity Control --- horizontal pill group (-, number, +). White bg,
    border-ink, radius-pill, shadow-sm. Buttons are inline, no separate
    styling.

-   Table Code Input --- 6-cell individual character input, monospace
    font (JetBrains Mono), large (32 px), border-ink, each cell
    radius-md with 8 px gap.

5.5 Navigation

Customer App --- mobile bottom nav bar: white bg, 2 px top border-ink, 5
icon+label columns. Active: icon filled + Coffee colour + Caramel dot
indicator. Height: 64 px (safe area adjusted on iOS).

Customer App --- desktop top nav bar: white bg, border-ink, radius-pill
(if floating) or full-width strip. Logo left, links centre, cart CTA
right. Active link: Cream bg + Latte border.

Admin Dashboard --- desktop: left sidebar 260 px, white bg, 1 px
border-right (BORDER_C). Logo + app name at top, nav sections labelled
in Caveat caps, active item: Coffee bg strip. Tablet: collapses to
icon-only 64 px sidebar + hamburger toggle.

5.6 Toast Notifications

Toast notifications appear from the top-right on desktop and top-centre
on mobile. They auto-dismiss after 4 seconds. Manual dismiss via x
button.

-   Layout: white card, border-ink, radius-lg, shadow-md, 16 px padding.
    Left section: 32 px emoji icon. Right section: title (Kalam bold 16
    px) + subtitle (Caveat 14 px, Latte).

-   Variants: Success (Mint bg tint), Info (Sky bg tint), Error (Coral
    bg tint), Love Message (Caramel bg tint + heart icon).

-   Animation: slide-down + fade-in on appear; slide-up + fade-out on
    dismiss.

5.7 Modals & Drawers

-   Modal --- centred overlay (rgba(0,0,0,0.45) backdrop). Max width 480
    px. White bg, border-ink, radius-xl, shadow-lg. Header: title +
    close button. Footer: CTA buttons.

-   Bottom drawer (mobile) --- slides up from bottom. Full viewport
    width. Radius-xl top-left and top-right only. Drag handle indicator
    bar. Same padding as modal.

-   Right drawer (admin) --- 400 px width, slides in from right. Full
    height. White bg, 2 px border-left. Used for order detail expansion.

6\. Customer App --- Screen Specifications

All screens are mobile-first. Layout measurements are given for the 390
px (iPhone 14) baseline unless stated otherwise.

6.1 Landing Screen --- Google Sign-In

-   Full-screen white background with doodle paper texture (repeating
    grid lines at 15% opacity).

-   Centred layout: large BrewBoard logo (Kalam 72 px) with hand-drawn
    coffee cup illustration below.

-   Tagline in Caveat italic 20 px: \'your daily cup, beautifully
    ordered\'.

-   \'Sign in with Google\' button: full-width primary button with
    Google logo + \'Continue with Google\' text.

-   Floating doodle stickers around the hero (hearts, stars, sparkles)
    --- CSS animated float.

-   Background: scattered hand-drawn doodles (arrows, hearts, stars) at
    7% opacity as decorative layer.

-   Responsive: identical on all breakpoints; max content width 420 px,
    centred.

6.2 Create Table & Join Table Screens

-   After sign-in: two-option screen. Top half: \'Create a Table\' card
    (Caramel tint). Bottom half: \'Join a Table\' card (Sky tint). Each
    card: large emoji icon, heading-md, 1-line description.

-   Create Table flow: tap card -\> number input screen -\> enter
    physical table number -\> \'Create Session\' CTA -\> Table Code
    reveal screen.

-   Table Code reveal: full-screen celebration moment. Large monospace
    Table Code (e.g. BREW42) in 48 px JetBrains Mono, Caramel bg card
    with Espresso border shadow-lg. \'Share with friends\' secondary
    button. \'Start Ordering\' primary button below.

-   Join Table flow: tap card -\> 6-cell code input -\> \'Join Table\'
    CTA -\> on success, brief toast (\'Joined! Say hi\') -\> navigate to
    live feed / menu.

-   Error state on wrong code: inline red text below the input field in
    Caveat italic + shake animation on the cells.

6.3 Menu Browse Screen

-   Top section: greeting (\'Good morning, \[Name\]!\') in Kalam 22 px +
    Caveat subtext in Latte.

-   Search bar (radius-pill, full width) below greeting.

-   Category filter row: horizontally scrollable pill row. Pills show
    emoji + category name (e.g. \'Espresso\'). Active pill: Coffee bg.
    No scroll indicator arrows --- momentum scroll only.

-   Menu grid: 2-column on mobile (card min-width 160 px), 3--4 columns
    on tablet/desktop.

-   Menu card anatomy: 160 px illustration area (coloured bg by
    category) -\> badge row -\> item name (Kalam 18 px) -\> description
    (Caveat 15 px, Latte) -\> price + add button row.

-   \'See how this looks\' button (AI): appears on menu card as a
    Lavender ghost button when no item photo is provided. Triggers
    Google Nano image generation. Loading: skeleton shimmer replaces
    illustration area. Result: image fades in with a doodle border.

-   Responsive: on desktop, right sidebar shows cart summary (see 6.4).

6.4 Cart --- Personal Order

-   Mobile: cart icon in bottom nav shows badge count. Tapping opens
    full-screen bottom drawer.

-   Desktop: persistent right sidebar (320 px) visible alongside menu.

-   Cart header: \'Your Order\' in Kalam + whimsy subtext in Caveat.

-   Line items: emoji icon / thumbnail, item name (Kalam 16 px bold),
    customisation sub-line (Caveat 14 px), qty control pill, price.

-   Separator: 1.5 px dashed Latte line between items.

-   Subtotal -\> Tax -\> Total section: right-aligned, Kalam pricing,
    dashed rule above total.

-   \'Place Order\' CTA (primary, full-width). \'Brew Points\' earned
    note below in Caveat Mint colour.

6.5 Live Order Feed Screen

-   Top: sticky status header showing table number and session code in a
    Caramel pill.

-   Love Message banner: appears at top of feed when received. Caramel
    bg, Coffee border, heart icon, message text (Kalam 16 px),
    timestamp. Auto-dismiss after 8 s or manual dismiss. Slide-down
    animation.

-   Order cards: grouped by order submission. Each card shows: customer
    avatar + name, \'Order \#N\', item list, timestamp, status badge.
    Status badge updates in real time with pulse animation.

-   Empty state: hand-drawn illustration of a coffee cup with steam,
    Caveat caption \'Nothing here yet --- start ordering!\', primary CTA
    \'Browse Menu\'.

-   Real-time updates: new orders fade in from the top. Status changes
    animate the badge (pulse + colour transition, 0.3 s). No page
    refresh required (WebSocket / SSE connection).

7\. Café Admin Dashboard --- Screen Specifications

The Admin Dashboard is optimised for tablet portrait (768 px) as the
primary target, with full desktop support. It uses a calmer variant of
the BrewBoard palette --- still warm and doodle-inspired, but with
higher information density.

7.1 Admin Login

-   Shared login screen (single email + password for all staff --- no
    individual accounts in v1.0).

-   Simple centred card layout. BrewBoard logo + \'Staff Login\' label.
    Email + password inputs (standard Patrick Hand style). \'Sign In\'
    primary CTA.

-   Error state: Coral-tinted input borders + inline error text. No
    password reset flow in v1.0.

-   Session persists until explicit logout. On tablet, the app should be
    treated as a persistent kiosk --- no auto-lock.

7.2 Active Order Dashboard

-   Main content area: grid of Table Cards (2 cols on tablet, 3--4 cols
    on desktop). Sorted by most-recently-active first.

-   Table Card anatomy: large table number (Kalam 48 px, Caramel), guest
    count badge (\'3 guests\'), condensed order list (max 3 items
    shown + \'+ N more\'), \'View Details\' ghost button, \'Send Love\'
    accent button.

-   Active orders badge: Coral dot in top-right of card when
    unacknowledged new orders exist. Pulsing animation.

-   New order visual/audio alert: card briefly highlights with Caramel
    border glow + optional soft chime (admin-configurable).

-   Order detail panel: clicking \'View Details\' opens right drawer
    (desktop) or full-screen (tablet). Shows all orders for the table
    with individual item lines, customer names, quantities, timestamps,
    and status.

-   \'Mark as Complete\' button per order: accent button. Completed
    orders move to an archived state and are removed from the active
    card view. Archive accessible from left sidebar.

-   Responsive: on tablet, the sidebar is hidden by default; activated
    via hamburger. Order detail opens full-screen.

7.3 Love Messages --- Table Notifications

-   Accessible from within the order detail panel (or Table Card \'Send
    Love\' shortcut).

-   Pre-set templates: displayed as chip buttons (Caveat 14 px, Coffee
    border, shadow-sm). Tapping a chip immediately sends it --- no extra
    confirm step.

-   Custom message input: multi-line textarea, Patrick Hand 16 px,
    200-char limit, live character counter in Caveat 12 px Latte.
    \'Send\' primary CTA.

-   Confirmation: brief toast \'Message sent to Table 7!\' (Mint tint).

-   Sent messages log: timestamped list below the input panel, Caveat 13
    px, Latte colour. Not visible to customers.

7.4 AI-Powered Menu Builder

This is one of BrewBoard\'s flagship features. The design must convey
intelligence and trustworthiness while remaining visually consistent
with the doodle aesthetic. The AI components use the Lavender accent
exclusively.

7.4.1 Upload Step

-   Upload zone: large dashed-border drop area (Lavender dashes, white
    bg). Hand-drawn upload illustration. \'Upload your menu photo(s)\'
    heading (Kalam 22 px). \'JPG, PNG, HEIC · Max 10 MB per image\'
    caption (Caveat 13 px, Latte).

-   Multi-photo support: uploaded photos shown as thumbnail grid below
    the drop zone. Remove (x) button on each.

-   \'Extract Menu with AI\' primary CTA below thumbnails. Lavender
    border + Coffee bg for this specific button to signal AI action.

7.4.2 Dual-Pass Processing Screen

-   Full-screen loading state while Gemini runs both passes.

-   Animated progress: two parallel \'passes\' shown as horizontal
    progress bars (Lavender fill). \'Pass 1: Reading menu\...\' and
    \'Pass 2: Verifying\...\' labels in Caveat.

-   On completion: brief success animation (checkmark in Lavender
    circle) + \'Menu extracted! Let us review.\' transition.

7.4.3 Menu Editor / Review

-   Layout: scrollable editable table. Columns: Category, Item Name,
    Description, Price, Photo (optional), Actions (edit / delete).

-   Flagged items (found in only one Gemini pass): highlighted with
    Caramel left-border accent + \'Review\' badge. Tooltip on hover:
    \'Only one AI pass detected this item --- verify manually\'.

-   All cells are inline-editable: click to activate Patrick Hand input.
    Price validates to currency format on blur.

-   Category section headers are draggable to reorder. Editable in-place
    (Kalam 18 px, Coffee).

-   \'Add Item\' ghost button at bottom of each category section.

-   \'Publish Menu\' primary CTA (Coffee bg, full-width) at bottom.
    Confirmation modal: \'This will replace the current live menu ---
    are you sure?\' with Cancel (ghost) and Confirm (primary).

8\. Interaction & Animation Guidelines

  --------------------- --------------------------------------------------------- -------------- -------------
  **Interaction**       **Animation**                                             **Duration**   **Easing**
  Card hover            translateY(-2px), shadow increase                         150 ms         ease
  Button hover          translate(-2px, -2px), shadow increase                    150 ms         ease
  Button active         scale(0.98), shadow decrease                              80 ms          ease
  Toast appear          slide-down + fade-in from top                             250 ms         ease-out
  Toast dismiss         slide-up + fade-out                                       200 ms         ease-in
  Bottom drawer open    slide-up from bottom (translateY 100% to 0)               300 ms         ease-out
  Right drawer open     slide-in from right (translateX 100% to 0)                300 ms         ease-out
  Modal appear          scale(0.95 to 1) + fade-in, backdrop fade-in              200 ms         ease-out
  Status badge update   colour transition + 1.5 s pulse ring animation            300 ms         ease
  New order card        fade-in + slide-down, Caramel flash on Table Card         400 ms         ease-out
  Add to cart (+)       button -\> check for 800 ms, badge count increment        150 ms         ease
  Phone float (hero)    translateY 0 to -8px to 0, rotate -1 to 1 deg, infinite   3 s loop       ease-in-out
  Page transition       fade-in of new page content (opacity 0 to 1)              200 ms         ease
  AI progress bar       Lavender fill width animation left to right               variable       ease-in-out
  --------------------- --------------------------------------------------------- -------------- -------------

  -----------------------------------------------------------------------------------------------------------------------------------------
  **Animation rules**
  · All animations must respect prefers-reduced-motion: reduce them to opacity-only transitions.
  · Never animate layout properties (width, height, top, left) --- use transform and opacity only for performance.
  · Do not stack more than 2 simultaneous animations on any element.
  · The doodle hover effect (translate + shadow) is the primary brand interaction --- it must be consistent on every interactive element.
  -----------------------------------------------------------------------------------------------------------------------------------------

9\. Accessibility

-   Colour contrast: all text/background combinations must meet WCAG AA
    (4.5:1 for body, 3:1 for large text). Use the defined palette only
    --- do not introduce arbitrary colours.

-   Touch targets: all interactive elements \>= 44 x 44 px. The + (add)
    button on menu cards is 40 px visual but must have a 44 px invisible
    tap target.

-   Focus management: visible focus ring on all interactive elements (3
    px Coffee-coloured outline, 2 px offset). Do not remove outline:
    none without a custom replacement.

-   Screen readers: all SVG illustrations have aria-label or aria-hidden
    (decorative). Status badges have role=\'status\' and
    aria-live=\'polite\'. Live Feed uses aria-live=\'polite\' for new
    order announcements.

-   Semantic HTML: use native button, input, nav, main, section, h1--h3
    elements. Do not use div for interactive elements.

-   Keyboard navigation: all flows completable without a mouse. Tab
    order follows visual reading order.

-   Forms: all inputs have associated visible labels (or aria-label for
    icon-only). Error messages programmatically linked via
    aria-describedby.

10\. Design Token Reference

The following CSS custom properties should be defined in a global :root
block and referenced throughout the stylesheet. Component-level
overrides are not permitted without design review.

  --------------------- -------------------- -----------------------------------------
  **Token Name**        **Value**            **Usage**
  \--color-coffee       \#6B3A2A             Primary brand, CTAs, headings
  \--color-espresso     \#3B1C0F             Dark text, borders
  \--color-latte        \#C8956C             Secondary text, captions, Latte accents
  \--color-caramel      \#E8A855             Highlights, badges, hover states
  \--color-cream        \#FFF8F0             Page background
  \--color-warm-white   \#FFFFFF             Card surfaces
  \--color-mint         \#7EC8A4             Success, Brew Points
  \--color-sky          \#A8D8EA             Info, Received status
  \--color-blush        \#F4A7B9             Seasonal, specials badge
  \--color-lavender     \#C9B8E8             AI features exclusively
  \--color-coral        \#F4896B             Errors, alerts
  \--color-ink          \#2C2416             Default text, borders
  \--font-display       Kalam, cursive       Hero, headings, prices
  \--font-accent        Caveat, cursive      Labels, captions, microcopy
  \--font-body          Patrick Hand         Body text, UI labels
  \--font-mono          JetBrains Mono       Table codes, technical values
  \--shadow-sm          3px 3px 0 \#2C2416   Small cards, buttons
  \--shadow-md          5px 5px 0 \#2C2416   Standard cards
  \--shadow-lg          8px 8px 0 \#2C2416   Featured cards, modals
  \--radius-pill        9999px               Pills, buttons, inputs
  \--radius-xl          24px                 Large cards, panels
  \--radius-lg          20px                 Menu cards, order cards
  \--radius-md          16px                 Buttons, toasts, inputs
  \--radius-sm          8px                  Chips, badges
  \--space-1            4px                  Tight spacing
  \--space-2            8px                  Dense component padding
  \--space-4            16px                 Standard padding
  \--space-6            24px                 Card padding, section gaps (mobile)
  \--space-8            32px                 Section padding, modal padding
  \--space-16           64px                 Section separation (desktop)
  --------------------- -------------------- -----------------------------------------

11\. Out of Scope for v1.0

The following features are explicitly excluded from this design
document, as they are out of scope per the BrewBoard PRD v1.0:

-   Payment UI, bill splitting screen, and payment confirmation flows.

-   Customer loyalty / rewards programme (Brew Points are shown in the
    UI as a teaser, but the backend is not functional in v1.0).

-   Native iOS / Android app design (web app only for v1.0).

-   Dark mode.

-   Multiple menus per café (breakfast vs lunch).

-   Individual staff accounts or role-based access in the Admin
    Dashboard.

-   Allergen / dietary filter overlays on the menu.

-   Push notification permission flow (real-time is in-app WebSocket
    only).

12\. Open Design Questions

  -------- -------------------------------------------------------------------------------------------------- -----------------------------------------------------------------------------------------------------
  **\#**   **Question**                                                                                       **Design Impact**
  DQ-01    What happens to the Love Message banner if the customer is on the Menu screen, not the Feed?       Need a universal notification layer (toast or top banner) that appears regardless of active screen.
  DQ-02    Should the Table Code be shown persistently after creation (e.g. in the header) or only once?      Affects header layout design --- persistent code display vs retrieval flow.
  DQ-03    What is the Google Nano fallback design if image generation times out (PRD OQ-07)?                 Need a designed error state: retry button, or fallback to a category illustration.
  DQ-04    Should completed orders remain visible to the customer in a \'past orders\' section of the Feed?   Determines whether the Feed needs a \'completed\' section / tab design.
  DQ-05    Is there a maximum order count per table session shown in the Feed before pagination is needed?    May require a \'load earlier orders\' design pattern.
  -------- -------------------------------------------------------------------------------------------------- -----------------------------------------------------------------------------------------------------

*End of Document · BrewBoard UI/UX Design Document v1.0 · June 2026*

*Confidential --- Internal Use Only*
