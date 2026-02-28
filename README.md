# Senior Voice - Your Compassionate Companion

Senior Voice is an AI-powered voice assistant and companion designed specifically for seniors. Built with a warm, premium interface inspired by Home Instead, it provides a safe and easy-to-use digital space for tracking medications, managing contacts, and general daily support.

DEMO VIDEO:https://youtu.be/epowFwIr8jg
APP LINK: sama-seniorvoice.vercel.app
## 🌟 Key Features

- **Voice Interaction**: Natural communication through speech synthesis and recognition.
- **Personalized Onboarding**: A gentle, guided introduction to the application.
- **Medication Management**: Track daily medications, dosages, and receive timely reminders.
- **Contact Management**: Quick access to simplified contact lists for family, friends, and support.
- **Personal Dashboard**: A simplified overview of the day, including weather, medications, and messages.
- **PWA Support**: Installable on mobile devices for a seamless, app-like experience.
- **Data Privacy**: Local-first storage approach for security and privacy.

## 🛠️ Tech Stack

- **Frontend Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment**: [Vercel](https://vercel.com/)
- **PWA**: Service Workers for offline support and background sync.
- **Storage**: Browser-based persistent storage via `localStorage` and `IndexedDB`.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0 or higher)
- npm (Node Package Manager)

### Installation

1.  **Clone the Repository**:
    ```bash
    git clone [repository-url]
    cd seniorvoice
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Set Up Local Env Variables**:
    Create a `.env` file in the root based on `.env.example` (if applicable).

### Development

Run the development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Building for Production

Create a production build in the `dist/` directory:
```bash
npm run build
```

## 📂 Project Structure

- `src/pages/`: Main application screens (Dashboard, Onboarding, Medications, etc.)
- `src/services/`: Core logic for API, Speech, Storage, and utility tools.
- `src/components/`: Reusable UI components.
- `src/lib/`: Shared helper functions and libraries.
- `public/`: Assets like logos, icons, and PWA service worker.

## 🎨 Design Philosophy

Senior Voice prioritizes:
- **Clarity**: Large fonts, high contrast, and simple layouts.
- **Warmth**: A soft, comforting color palette.
- **Accessibility**: Optimized for touch and voice-first interaction.
- **Privacy**: Ensuring user data stays under their control.

---
Built with ❤️ for seniors.
