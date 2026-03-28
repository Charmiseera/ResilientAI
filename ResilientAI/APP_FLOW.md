# Application Flow Documentation: ResilientAI

## 1. Entry Points
### Primary Entry Points
- **Direct URL**: User navigates to `http://localhost:8501`. They land on the main dashboard with a neutral "Ready" state showing available disruption scenarios to simulate.

### Secondary Entry Points
- **N/A**: As an MVP dashboard, there are no deep links, SEO pages, or OAuth logins. The application is a single-page Streamlit application.

---

## 2. Core User Flows

### Flow 1: MSME Profile Configuration
**Goal**: User sets up their business context (type, city, phone number) so the AI can provide tailored recommendations and send alerts.
**Entry Point**: Main Navigation (Sidebar / "My Profile" tab)
**Frequency**: Once per session / Onboarding

#### Happy Path
1. **Page: Main Dashboard (Sidebar & Profile Tab)**
   - Elements: [Business Type Dropdown, Risk Level Dropdown, City Dropdown, Phone Number Input, Save Button]
   - User Action: Selects business type (e.g., "kirana"), city, and enters phone number.
   - Trigger: Clicks "Save Profile" button.
2. **System Action**: Saves profile data to local `user_store.json`.
3. **Success State**: Displays inline success message ("Profile saved successfully").

#### Error States
- **Invalid Phone Number**
  - Display: Streamlit error message if validation fails (handled natively or by Meta API on sending).
  - Action: User corrects number.

#### Edge Cases
- User does not set a profile before running a scenario → System uses default fallback values (kirana, medium risk, no phone number).

---

### Flow 2: Core Disruption to Decision Flow
**Goal**: User views a global disruption, understands local impact, and accepts the AI's optimized action.
**Entry Point**: Main Dashboard (Scenario Buttons)
**Frequency**: High (Whenever a disruption occurs)

#### Happy Path
1. **Page: Main Dashboard (Neutral State)**
   - Elements: [Scenario buttons: "Hormuz Disruption", "Ukraine Grain Crisis", "Taiwan Blockade"]
   - User Action: Clicks a scenario button.
   - Trigger: System sets `active_event_id` and navigates focus to "Intelligence" tab.
2. **Page: Intelligence Tab**
   - Elements: [Risk Banner (Red/Amber), Impact Metrics (LPG, Transport, Margin), Holographic Recommendation Card, Action Buttons]
   - User Actions: Reads impact.
   - Trigger: Clicks "Accept Recommendation".
3. **System Action**: Logs decision to JSON store.
4. **Success State**: Shows success toast/inline message ("Decision logged").

#### Alternate Action 1: WhatsApp Alert
1. **Trigger**: User clicks "📱 WhatsApp Alert" on the Recommendation Card.
2. **System Action**: Calls Meta Cloud API.
3. **Success State**: Displays green success message with Meta `wamid` ID.

#### Error States
- **Meta API 131030 Error (Unverified Number)**
  - Display: Inline error: "Number not verified. Add this phone number to 'To' list in Meta Developer Console."
  - Action: User must verify number in Meta dashboard.

#### Edge Cases
- User clicks "Simulate Alternate Strategy" → Redirects to Profit Simulator tab.

---

### Flow 3: Strategy Simulation
**Goal**: User wants to manually test pricing and inventory changes before committing to the AI's recommendation.
**Entry Point**: Profit Simulator Tab
**Frequency**: Medium

#### Happy Path
1. **Page: Profit Simulator Tab**
   - Elements: [Weekly Revenue input, Margin sliders, Price Increase input, Stock Units input, "Run Simulation" button]
   - User Action: Adjusts inputs and clicks "Run Simulation".
2. **System Action**: Calculates projected revenue and profit based on inputs.
3. **Success State**: Displays gauge charts and metrics showing the projected vs. baseline profit.

---

## 3. Navigation Map

### Primary Navigation (Tabs + Sidebar)
Dashboard (Root)
├── Sidebar (Global Controls)
│   ├── Business Type
│   ├── Min Risk Level
│   ├── City
│   └── Data Source Toggle
├── 🌐 Intelligence (Core Scenario View)
│   ├── Accept Decision
│   └── Send WhatsApp Alert
├── 🧮 Profit Simulator
│   └── Run Simulation
├── 🏪 My Profile
│   └── Save Settings
├── 📜 Decision History
│   └── View Past Actions
├── 📊 Analytics
│   └── P&L Charts
├── 📍 City Comparison
│   └── Multi-city impact view
└── 💬 AI Assistant
    └── Supply chain Q&A chat

### Navigation Rules
- **Authentication Required**: None (MVP is single-tenant local deploy).
- **State Preservation**: Scenario selection persists across tab switches using Streamlit `st.session_state`.

---

## 4. Screen Inventory

### Screen: Main Dashboard (Single Page App)
- **Route**: `/` (Root)
- **Access**: Public (Local)
- **Purpose**: Central command center for MSME supply intelligence.
- **Key Elements**:
  - Sidebar configuration
  - Scenario triggers
  - 8-Tab navigation menu
- **State Variants**: 
  - *Empty/Ready*: Shows globe icon and "Global Supply Intelligence Ready" with scenario buttons.
  - *Active Scenario*: Intelligence tab populates with specific event data.

---

## 5. Interaction Patterns

### Pattern: Scenario Activation
- Validation: Check if event ID exists in seed data/cache.
- Loading State: Streamlit `st.spinner` ("Analyzing global data...").
- Success: Intelligence tab renders Risk, Impact, and Optimizer components.

### Pattern: Quick Actions
- Trigger: Button click (e.g., "Accept Recommendation").
- Success: Instant inline UI feedback (`st.success`).

---

## 6. Decision Points

### Decision: Scenario Active State
IF `session_state.active_event_id` is None 
THEN show: "Welcome/Ready" screen with scenario triggers
ELSE show: Full Intelligence metrics for the selected event

### Decision: WhatsApp Alert Routing
IF Meta API returns success (200) 
THEN show: Success message with ID
ELSE IF Meta API returns Error 131030 
THEN show: Custom sandbox verification instruction
ELSE show: Generic API failure reason

### Decision: Optimizer Generation
IF Qiskit QAOA returns result in < 10 seconds
THEN display: Recommended action (generated by: quantum)
ELSE display: Recommended action (generated by: classical fallback)

---

## 7. Error Handling Flows

### WhatsApp API Failure
- Display: Red error callout under the alert button.
- Actions: Verify credentials, check sandbox restrictions.

### Missing Data/Event Not Found
- Display: Streamlit warning ("Event data not available").
- Fallback: Allow user to go back or select a different scenario.

---

## 8. Responsive Behavior

### Mobile-Specific Flows
- Navigation: Sidebar automatically collapses into a hamburger menu.
- Layout: Columns stack vertically (Impact metrics flow top-to-bottom instead of side-by-side).

### Desktop-Specific Flows
- Navigation: Sidebar is expanded by default.
- Layout: Side-by-side metric columns and wide charts.

---

## 9. Animation & Transitions

### Micro-interactions
- **Tabs**: Hover effects with gradient background and slight Y-axis translation (`transform: translateY(-2px)`).
- **Premium Banners**: "HIGH RISK" alert banners feature a subtle CSS pulse animation (`@keyframes pulseBorder`) to draw urgent attention.
- **Loading State**: Native Streamlit spinner during quantum optimization and API calls.
