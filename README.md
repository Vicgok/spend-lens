# SpendLens 💳

**SpendLens** is a modern, privacy-first personal finance and automated expense tracking application built using Expo and React Native. By reading and parsing transaction SMS notifications locally on your device, SpendLens automatically categorizes and tracks your expenses without requiring direct bank connections.

---

## ✨ Features

- **Automated Expense Tracking**: Parses transactional/banking SMS messages automatically in the background (Android).
- **Intelligent Categorization**: Auto-categorizes transactions based on merchant names and descriptions.
- **Interactive Analytics**: Visualizes spending patterns over time with beautiful charts and category-wise breakdowns.
- **Privacy-First & Secure**: 
  - All data is stored locally in an encrypted/private SQLite database on the device.
  - Secure configurations are kept safe via `expo-secure-store`.
  - No external servers or API calls are used to process your transactions.
- **Full-Text Search (FTS)**: Instantly search through all transactions using SQLite's native FTS module.
- **Clean & Fast UI**: Responsive, fluid layout featuring custom typography (`Inter` & `JetBrains Mono`), glassmorphic elements, linear gradients, and smooth native micro-animations.

---

## 🛠️ Tech Stack

- **Framework**: [Expo SDK 54](https://expo.dev/) & React Native (New Architecture enabled)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Database**: [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (with FTS enabled)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Data Querying**: [TanStack React Query v5](https://tanstack.com/query/latest)
- **Animations**: [React Native Reanimated v4](https://docs.swmansion.com/react-native-reanimated/)

---

## 📂 Project Structure

```text
├── app/                  # Expo Router entry & file-based routing structure
│   ├── (tabs)/           # Core tab screens (Dashboard, Analytics, Transactions, Settings)
│   ├── onboarding/       # Setup & permission request flows
│   ├── transaction/      # Single transaction view & edit screens
│   ├── _layout.tsx       # Root layout defining themes and providers
│   ├── index.tsx         # Route controller (onboarding vs tabs)
│   └── categories.tsx    # Category manager screen
├── src/                  # Application source code
│   ├── features/         # Feature-specific modules
│   │   ├── sms-parser/   # SMS background receivers, regex matchers & parser logic
│   │   └── categorizer/  # Machine-like rule base for merchant categorizations
│   ├── stores/           # Zustand stores for settings & transaction states
│   ├── providers/        # React Context providers (DB, Theme, React Query)
│   ├── theme/            # Harmonious color palettes and visual system tokens
│   ├── lib/              # Core modules (e.g. database client, global constants)
│   └── utils/            # Shared utility helper functions
└── assets/               # Branding, icons, fonts, and splash screen graphics
```

---

## 🚀 Getting Started

### 📋 Prerequisites

Make sure you have the following installed on your machine:
- **Node.js** (LTS version recommended)
- **npm** or **yarn**
- **Android / iOS Emulator** or physical device running **Expo Go**

### 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Vicgok/spend-lense.git
   cd expense-tracker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

### 🏃‍♂️ Running the App

Start the Expo bundler:
```bash
npm start
```
or clear the Metro bundler cache and start:
```bash
npx expo start --clear
```

- Press `a` for Android Emulator.
- Press `i` for iOS Simulator.
- Scan the QR code with your Expo Go app (on Android or iOS) to run it on a physical device.

> [!NOTE]
> Due to system level security, the **SMS Reading & Parsing feature** is only supported on Android. For iOS devices, transactions can be logged manually.

---

## 🔐 Android SMS Permissions

To automate transaction tracking, SpendLens requests the following permissions on Android:
- `android.permission.READ_SMS`: Allows the app to read past bank/transaction messages during sync.
- `android.permission.RECEIVE_SMS`: Allows the app to capture new transaction messages in real-time.

All processing is done **on-device** using regular expression templates configured inside `src/features/sms-parser/parser.ts`. Your SMS text never leaves your device.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](file:///d:/Documents/StartUp/MicroSaaS/expense-tracker/LICENSE) file for details.
