# SpendLens

Financial Safety Intelligence for everyday spending.

SpendLens helps users understand where their money goes, detect money leaks, identify subscriptions, and receive proactive financial insights using SMS transaction data — without requiring bank credentials or account aggregation.

---

## Vision

Most finance apps tell users what already happened.

SpendLens focuses on helping users understand:

* Where money is leaking
* Which subscriptions are recurring
* How spending habits are changing
* Whether their salary is likely to last the month

The goal is financial awareness before financial problems.

---

## Core Principles

* Privacy First
* Local First
* Insights Before Charts
* Financial Safety Over Budgeting
* Android Native Performance
* Fabric-Safe Architecture

---

## Features

### Current

* SMS transaction detection
* Historical SMS scanning
* Transaction categorization
* Daily spending insights
* Multi-account support
* Transaction history
* Local SQLite storage

### Planned

* Money Leak Detection
* Subscription Detection
* Salary Survival Score
* Month-End Forecast
* Financial Safety Alerts
* Savings Intelligence

---

## Tech Stack

### Frontend

* React Native
* Expo Router
* TypeScript
* Zustand
* React Native Animated
* React Native SVG

### Storage

* SQLite

### Platform

* Android First

### Architecture

* React Native New Architecture
* Fabric Enabled

---

## Project Structure

```text
app/
├── onboarding/
├── (tabs)/
├── add-transaction/
└── _layout.tsx

src/
├── components/
├── features/
├── services/
├── stores/
├── database/
├── hooks/
└── utils/

modules/
└── spendlens-sms-module/
```

---

## Getting Started

### Install Dependencies

```bash
npm install
```

### Start Development

```bash
npx expo start
```

### Run Android

```bash
npx expo run:android
```

### Type Check

```bash
npm run check
```

---

## Development Rules

Before implementing features:

* Reuse existing components
* Remove dead code
* Keep Fabric compatibility
* Prioritize performance
* Avoid unnecessary animations
* Use SVG instead of emojis

---

## Logging

Key flows are logged:

* Onboarding
* SMS Processing
* Transaction Creation
* Notifications
* Account Detection

Format:

```text
[FEATURE]
[ACTION]
[RESULT]
```

Example:

```text
[SMS_PARSE]
[TRANSACTION_CREATED]
[SUCCESS]
```

---

## License

Private project.

---

## Build In Public

SpendLens is being built publicly as a Financial Safety Intelligence platform focused on helping users understand and improve their financial habits without sharing banking credentials or financial data with third parties.
