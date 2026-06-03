☕

**BrewBoard**

Smart Café Ordering Platform

**Product Requirements Document**

Version 1.0 \| June 2026

**Status: Draft --- Pending Design & Tech Stack**

**1. Product Overview**

BrewBoard is a B2C café ordering platform with two distinct interfaces:
a Customer App and a Café Admin Dashboard. The platform enables dine-in
customers to browse a digital menu, form or join a shared table session,
and place orders in real time --- while café staff manage incoming
orders, update statuses, and communicate with guests through live
notifications.

  ---------------------- ---------------------------------------------------------------------------------
  **Product Name**       BrewBoard
  **Product Type**       B2C SaaS --- Web Application (Mobile-first Customer App + Tablet/Desktop Admin)
  **Target Users**       Dine-in café customers (B2C) & café staff (internal ops)
  **Document Version**   1.0 --- Draft
  **Last Updated**       June 2026
  **Payment Scope**      Out of scope for v1.0 (payment flow TBD in future PRD)
  ---------------------- ---------------------------------------------------------------------------------

**2. Goals & Success Metrics**

**2.1 Primary Goals**

-   Digitise the café ordering experience --- eliminate verbal
    order-taking for dine-in customers.

-   Enable multi-customer table sharing so friends can order
    independently and split the bill evenly.

-   Give café staff a single real-time dashboard to manage tables,
    orders and customer communication.

-   Leverage AI (Gemini API + Google Nano) to auto-generate and visually
    enrich the digital menu from a photo.

**2.2 Success Metrics (v1.0)**

  -------------------------------------------- -------------------------------------
  **Metric**                                   **Target**
  Customer Google sign-in completion rate      ≥ 85%
  Table session creation-to-first-order time   \< 3 minutes
  Menu photo → published digital menu time     \< 5 minutes (including admin edit)
  Real-time update delivery latency            \< 2 seconds end-to-end
  Café admin order acknowledgement time        \< 60 seconds of order placement
  -------------------------------------------- -------------------------------------

**3. User Personas**

**3.1 The Dine-In Customer**

-   Arrives at a café, scans a QR code or opens the app.

-   Signs in with Google (first-time or returning).

-   Either creates a new table session (enters the physical table
    number) or joins an existing one via a 6-character unique table
    code.

-   Browses the menu by category, adds items to their personal cart, and
    places orders.

-   Sees live order statuses and receives \'love messages\' from the
    café in real time.

-   At the end, chooses to pay as a whole table or split evenly across
    all joined members.

**3.2 The Café Staff Member**

-   Uses a shared staff login on a tablet or desktop browser.

-   Monitors all active tables and the orders placed at each.

-   Marks orders as complete and removes them from the queue.

-   Sends broadcast messages to a table --- using pre-set templates or
    custom free-text.

-   Manages the digital menu: uploads a photo, reviews the AI-generated
    menu, edits items, and publishes.

**4. Feature Specifications --- Customer App**

**4.1 Authentication --- Google Sign-In**

All customer access is gated behind Google OAuth 2.0. No email/password
option is provided in v1.0.

-   Google OAuth sign-in button on the landing screen.

-   On first login, user profile (name, email, profile photo) is stored.

-   Returning users are auto-signed-in if the session is still valid.

-   After sign-in, the user is presented with two options: Create Table
    or Join Table.

**4.2 Table Management**

**4.2.1 Create Table**

-   User enters the physical table number (printed on the café table).

-   System generates a unique 6-character alphanumeric Table Code (e.g.
    \"BREW42\").

-   The Table Code is displayed prominently so the user can share it
    with friends.

-   The table creator is logged as the table owner; ownership has no
    special permissions in v1.0 except initiating the payment flow (out
    of scope).

**4.2.2 Join Table**

-   User enters the 6-character Table Code shared by a friend.

-   On valid entry, the user is added to the existing table session.

-   User can immediately see all previously placed orders and their
    statuses on that table.

**4.2.3 Table Session Lifecycle**

-   A table session is active from creation until payment is completed
    (payment out of scope for v1.0 --- session remains open indefinitely
    in v1.0).

-   All members of a table can see: the live order feed, order statuses,
    and café messages.

-   Any member can place new orders independently.

**4.3 Menu Browsing**

-   Menu is displayed in a scrollable, category-tabbed layout (e.g.
    Coffees, Teas, Food, Desserts).

-   Each menu item shows: name, description, price, and category badge.

-   If the café has uploaded a photo for an item, it is displayed;
    otherwise a placeholder is shown.

-   \"See how this looks\" button (powered by Google Nano) --- on tap,
    generates an AI image of the dish.

-   AI image generation is on-demand and per item; not pre-rendered for
    all items.

**4.4 Cart & Ordering**

-   Each customer has their own personal cart within the table session.

-   Items can be added/removed; quantity can be adjusted.

-   On \"Place Order\", the cart contents are submitted as a single
    order against the customer\'s identity and the table.

-   Customers can place multiple orders sequentially within the same
    session.

-   Once placed, the order appears in the table\'s shared order feed
    with status \"Received\".

**4.5 Live Order Feed**

-   All orders placed by any member of the table are visible in a shared
    feed.

-   Each order card shows: items ordered, who ordered, timestamp, and
    current status.

-   Order statuses update in real time without page refresh (WebSocket /
    SSE).

-   Café \'love messages\' appear as a notification banner at the top of
    the feed, also in real time.

**5. Feature Specifications --- Café Admin Dashboard**

**5.1 Admin Authentication**

-   Single shared login (email + password) for all café staff --- no
    individual staff accounts in v1.0.

-   Session persists until explicit logout.

-   Responsive layout optimised for both tablet (portrait & landscape)
    and desktop/laptop screens.

**5.2 Order Management**

-   Dashboard shows all active tables as cards, sorted by most recently
    active.

-   Each table card displays: table number, number of guests, and a
    condensed order list.

-   Expanding a table card shows all individual orders with item
    details, quantity, customer name, and status.

-   Staff can mark individual orders as Complete --- completed orders
    are removed from the active queue.

-   A log of completed orders is accessible but not surfaced prominently
    (archive view).

-   New orders trigger a visual and/or audio alert on the dashboard.

**5.3 Love Messages (Table Notifications)**

Staff can send a broadcast message to all customers at a specific table.
Messages appear in real time in the customer\'s live order feed.

**Pre-set Message Templates**

-   \"Your order is being prepared! ☕\"

-   \"Your order is arriving in 5 minutes! 🚀\"

-   \"Your order is on its way to the table! 🙌\"

-   \"Thank you for your patience --- almost there! ❤️\"

-   \"Is there anything else we can help you with?\"

**Custom Message**

-   A free-text field allows staff to type and send any message to the
    selected table.

-   Character limit: 200 characters.

-   Message is attributed with a timestamp visible to the customer.

**5.4 AI-Powered Menu Builder**

**5.4.1 Menu Photo Upload**

-   Staff uploads one or more photos of the physical menu (JPG, PNG,
    HEIC supported; max 10MB per image).

-   Photos are sent to the Gemini API for text extraction and menu
    parsing.

**5.4.2 Dual Gemini Verification**

-   The uploaded menu photo is processed by Gemini API twice --- two
    independent calls with the same prompt.

-   The two outputs are compared: items present in both results are
    accepted automatically.

-   Items found in only one result are flagged for manual admin review
    before being added.

-   This dual-pass approach reduces hallucinations and ensures accuracy
    of the digital menu.

**5.4.3 Menu Editor**

-   Before publishing, admin sees a full preview of the parsed menu in
    an editable table view.

-   Admin can: edit item names, descriptions, prices and categories;
    delete erroneous items; add missing items manually.

-   Category names are editable and can be reordered.

-   Once satisfied, admin clicks \"Publish Menu\" --- this replaces the
    live menu seen by customers.

-   Only one menu is active at a time; publishing overwrites the
    previous menu.

**5.4.4 Menu Photo Attachment (Optional)**

-   For each menu item, admin can optionally upload a photo of the dish.

-   If no photo is provided, the \"See how this looks\" (Google Nano AI
    generation) option is available to customers.

**6. AI Features Detail**

  ---------------------------- ----------------- -------------------------------------- ----------------------------------------------
  **Feature**                  **Model / API**   **Trigger**                            **Output**
  Menu extraction --- Pass 1   Gemini API        Admin uploads menu photo               Structured JSON: categories, items, prices
  Menu extraction --- Pass 2   Gemini API        Immediately after Pass 1               Second structured JSON for cross-validation
  Dual-pass reconciliation     App logic         Both Gemini outputs received           Merged, flagged menu ready for admin edit
  Dish visualisation           Google Nano       Customer taps \'See how this looks\'   Generated image of the dish displayed inline
  ---------------------------- ----------------- -------------------------------------- ----------------------------------------------

**7. Key User Flows**

**7.1 Customer --- Create Table & Order**

1.  Open app → Google Sign-In

2.  Select \"Create Table\" → Enter physical table number

3.  Receive & share unique Table Code with friends

4.  Browse menu by category → Add items to cart

5.  Place Order → See order appear in live feed with status \"Received\"

6.  Receive café love messages in real time

**7.2 Customer --- Join Table & Order**

7.  Open app → Google Sign-In

8.  Select \"Join Table\" → Enter 6-character Table Code

9.  See existing orders and statuses on the table

10. Browse menu → Place own orders independently

**7.3 Café Admin --- Publish a Menu**

11. Log in to Admin Dashboard → Navigate to \"Menu Builder\"

12. Upload photo(s) of physical menu

13. System runs dual Gemini passes → reconciles results → presents draft
    menu

14. Admin reviews flagged items, edits names/prices/categories as needed

15. Click \"Publish Menu\" → Menu goes live for all customers

**7.4 Café Admin --- Manage Orders & Send Message**

16. View live order dashboard --- new orders appear automatically

17. Expand a table card to see full order details

18. Mark individual order as \"Complete\" → removed from active queue

19. Select a table → choose pre-set template or type custom message →
    Send

20. Message appears in real time on all customers\' screens at that
    table

**8. Real-Time System Requirements**

The following events must be delivered in real time (target latency \< 2
seconds) without requiring a page refresh:

  --------------------------------- ------------------ ----------------------------
  **Event**                         **Direction**      **Recipient**
  New order placed                  Customer → Admin   Café Admin Dashboard
  Order status updated (Complete)   Admin → Customer   All customers at the table
  Love message sent                 Admin → Customer   All customers at the table
  New customer joins table          System → Admin     Café Admin Dashboard
  --------------------------------- ------------------ ----------------------------

**9. Payment --- Out of Scope (v1.0)**

Payment processing is excluded from v1.0. The following behaviour is
defined to ensure the data model supports it in a future version:

-   A table session tracks all orders and the customers who placed them.

-   At session end (payment), two options will be offered: single payer
    (one person pays the full bill) or even split (total divided equally
    among all customers who joined the table).

-   No payment UI, payment gateway integration, or bill calculation
    logic is in scope for v1.0.

**10. Functional Requirements Summary**

  -------- ---------------------------------------------------------------------------------- --------------
  **ID**   **Requirement**                                                                    **Priority**
  FR-01    Customer must authenticate via Google OAuth before accessing any feature.          P0
  FR-02    Customer can create a table by entering the physical table number.                 P0
  FR-03    System generates a unique 6-char Table Code on table creation.                     P0
  FR-04    Customer can join a table by entering a valid Table Code.                          P0
  FR-05    Menu is displayed in categories with name, description, and price.                 P0
  FR-06    Customer can add items to a personal cart and place an order.                      P0
  FR-07    Multiple customers on the same table can place orders independently.               P0
  FR-08    Order status updates appear in real time on the customer\'s live feed.             P0
  FR-09    Café \'love messages\' are broadcast to all customers at a table in real time.     P0
  FR-10    Admin dashboard shows all active tables and their orders in real time.             P0
  FR-11    Admin can mark an order as complete, removing it from the active queue.            P0
  FR-12    Admin can send pre-set or custom messages to any table.                            P0
  FR-13    Admin can upload a menu photo; system calls Gemini API twice for extraction.       P0
  FR-14    Dual Gemini results are reconciled; discrepancies flagged for admin review.        P0
  FR-15    Admin can edit the parsed menu before publishing.                                  P0
  FR-16    Published menu overwrites the previous live menu.                                  P0
  FR-17    Customer can tap \'See how this looks\' to generate an AI image via Google Nano.   P1
  FR-18    Admin dashboard is responsive for tablet and desktop viewports.                    P0
  FR-19    Table session data model supports future even-split payment flow.                  P1
  -------- ---------------------------------------------------------------------------------- --------------

**11. Non-Functional Requirements**

**11.1 Performance**

-   App initial load time: \< 3 seconds on a 4G connection.

-   Real-time event delivery latency: \< 2 seconds.

-   Gemini dual-pass menu extraction: \< 30 seconds total.

-   Google Nano image generation: \< 10 seconds per item.

**11.2 Reliability**

-   If one Gemini pass fails, the system retries once before surfacing
    an error to the admin.

-   Real-time connection drops should auto-reconnect silently within 5
    seconds.

**11.3 Security**

-   All API keys (Gemini, Google Nano, Google OAuth) are server-side
    only --- never exposed to the client.

-   Table codes expire when the session ends; reuse of an expired code
    returns an error.

-   Admin login uses HTTPS; session tokens are httpOnly cookies.

**11.4 Scalability**

-   System should support up to 50 concurrent table sessions per café in
    v1.0.

-   Architecture should allow multi-café support (separate data
    namespaces per café) in a future version.

**12. Out of Scope --- v1.0**

-   Payment processing & gateway integration.

-   Bill splitting calculation UI.

-   Multi-café / SaaS onboarding (single café deployment for v1.0).

-   Multiple staff roles or individual staff accounts.

-   Multiple menus (e.g. breakfast vs lunch).

-   Customer loyalty / rewards programme.

-   Push notifications (real-time is in-app only).

-   Native iOS / Android apps (web app only).

-   Order modification after placement.

-   Allergen / dietary filter on the menu.

**13. Open Questions**

  -------- --------------------------------------------------------------------------------------------------------- -------------
  **\#**   **Question**                                                                                              **Owner**
  OQ-01    Should the Table Code be regenerated if all customers leave and a new customer scans the same table QR?   Product
  OQ-02    What happens if a customer\'s Google session expires mid-visit --- do they lose their cart?               Engineering
  OQ-03    Should the admin be notified when the real-time connection to a customer drops?                           Product
  OQ-04    Is there a maximum number of items a customer can order in a single cart submission?                      Product
  OQ-05    Will the café want to mark a table as \'closed\' manually, or only on payment completion?                 Product
  OQ-06    Should \'love messages\' be stored and visible to customers who join the table after they were sent?      Product
  OQ-07    What is the fallback if Google Nano image generation fails or times out?                                  Engineering
  -------- --------------------------------------------------------------------------------------------------------- -------------

**14. Appendix --- Glossary**

  --------------- -------------------------------------------------------------------------------------------------
  **Term**        **Definition**
  Table Session   A shared ordering context tied to a physical café table. Active from creation until payment.
  Table Code      A unique 6-character alphanumeric code generated when a customer creates a table session.
  Love Message    A real-time broadcast notification sent by café staff to all customers at a specific table.
  Dual-pass       The practice of calling Gemini API twice with the same menu photo and cross-validating results.
  Live Feed       The real-time order and message stream visible to all customers at a table.
  Google Nano     Google\'s on-device / API AI model used to generate visual images of menu items on demand.
  --------------- -------------------------------------------------------------------------------------------------

*End of Document --- Design details and tech stack to follow in a
separate document.*
