# SpendWise - Expense Tracker App

## Overview

SpendWise is a personal spending tracker mobile application built with Expo (React Native). It includes user authentication (email sign-up + Google OAuth placeholder), a 30-day free trial, subscription plans (₹11/month or ₹99/year), date-aware expense/income entry with a native date picker, SMS parsing that extracts amount/merchant/date/payment method from bank messages, a spending dashboard with monthly balance (income − expenses), category breakdowns, and a searchable transaction history. All data is stored locally on-device using AsyncStorage.

The project has a dual architecture: a React Native frontend (Expo) and an Express.js backend server. Currently, data is stored locally on-device using AsyncStorage, with a PostgreSQL database schema defined but not yet fully integrated into the app's data flow.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)

- **Framework**: Expo SDK 54 with React Native 0.81, using the new architecture
- **Routing**: expo-router with file-based routing and tab navigation (`app/(tabs)/`)
- **State Management**: React Context (`ExpenseProvider` in `lib/expense-context.tsx`) wraps the app and provides all expense/income data and computed totals
- **Data Fetching**: @tanstack/react-query is set up with an API client (`lib/query-client.ts`) but the app currently relies on local AsyncStorage for data persistence
- **Local Storage**: AsyncStorage (`lib/storage.ts`) stores expenses and income as JSON arrays under dedicated keys
- **Fonts**: DM Sans (Google Fonts) loaded via expo-font
- **UI Libraries**: react-native-reanimated, react-native-gesture-handler, expo-haptics, expo-linear-gradient, expo-blur, expo-glass-effect
- **Icons**: @expo/vector-icons (Ionicons, Feather, MaterialIcons, MaterialCommunityIcons)

### Tab Structure

- **Dashboard** (`app/(tabs)/index.tsx`): Shows today/week/month spending summaries, category breakdowns, recent expenses
- **Add** (`app/(tabs)/add.tsx`): Form to add expenses or income, with SMS parsing capability
- **History** (`app/(tabs)/history.tsx`): Searchable, filterable list of all transactions grouped by date

### SMS Parsing

- `lib/sms-parser.ts` contains logic to extract amount, merchant, payment method, and card info from SMS text
- Maps known merchants (Swiggy, Amazon, Uber, etc.) to expense categories
- Users paste SMS text manually; no automatic SMS reading is implemented

### Backend (Express.js)

- **Server**: Express 5 running on the same Replit instance (`server/index.ts`)
- **Routes**: Defined in `server/routes.ts` - currently minimal with no application-specific API endpoints
- **Storage Layer**: `server/storage.ts` has an in-memory storage implementation (`MemStorage`) with user CRUD operations
- **CORS**: Configured to allow Replit domains and localhost origins
- **Static Serving**: In production, serves a static build of the Expo web app; in development, proxies to Metro bundler

### Database Schema

- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema** (`shared/schema.ts`): Currently defines only a `users` table with id, username, and password fields
- **Migrations**: Drizzle Kit configured to output to `./migrations` directory
- **Status**: The schema exists but the app doesn't use the database for expense/income data yet - that's all in AsyncStorage. The database connection requires a `DATABASE_URL` environment variable.

### Key Design Decisions

1. **Local-first storage**: Expenses and income are stored in AsyncStorage rather than the server database. This makes the app work offline but means data doesn't sync across devices. Future work could move this to the PostgreSQL backend.

2. **Context-based state**: All expense/income state lives in a single React Context rather than using react-query for server state. This is because data is local, not fetched from an API.

3. **Category system**: Predefined categories with icons, colors, and background colors defined in `lib/categories.ts`. Both expense and income categories are supported with type-safe string literal unions.

4. **Currency formatting**: Uses Indian locale formatting (₹, lakhs notation) in `lib/format.ts`.

### Build & Run

- `npm run expo:dev` - Start Expo dev server (configured for Replit)
- `npm run server:dev` - Start Express backend in development
- `npm run db:push` - Push Drizzle schema to PostgreSQL
- `npm run expo:static:build` - Build static web bundle
- `npm run server:prod` - Run production server

## External Dependencies

- **PostgreSQL**: Required for the Drizzle ORM schema (needs `DATABASE_URL` env var). Currently only used for user schema, not expense data.
- **AsyncStorage**: On-device key-value storage for expense and income data persistence
- **Expo Services**: Expo SDK for native capabilities (haptics, image picker, location, clipboard, etc.)
- **Google Fonts**: DM Sans font family loaded from @expo-google-fonts
- **No external APIs**: The app doesn't currently integrate with any third-party payment or banking APIs. SMS parsing is done client-side from manually pasted text.