# Contributing to Replaysafe

First off, thank you for considering contributing to Replaysafe! We are building the safety layer for the sovereign future, and we couldn't do it without the community.

Replaysafe is a **Privacy-First, Local-First** project. Every line of code we write should respect the user's sovereignty and data ownership.

## ⚖️ Our Ethos

- **Privacy by Design**: No telemetry. No hidden tracking.
- **Local Sovereignty**: Every feature must work 100% offline or in air-gapped environments.
- **AGPL-3.0**: We believe in keeping the code open and free forever.

## 🚀 Getting Started

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/your-username/Replaysafe.git
    cd Replaysafe
    ```
3.  **Install dependencies**:
    ```bash
    pnpm install
    ```
4.  **Setup your environment**:
    ```bash
    cp .env.example .env
    # Adjust DATABASE_URL as needed
    ```
5.  **Run migrations**:
    ```bash
    pnpm db:push
    ```
6.  **Start the development server**:
    ```bash
    pnpm run dev
    ```

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router), TailwindCSS, Lucide Icons.
- **Backend**: Express (API), Prisma (ORM), PostgreSQL.
- **CLI**: Commander.js.
- **Security**: AES-256-GCM for secret encryption.

## 📜 Development Guidelines

### 1. Privacy First

Never add features that require external API calls unless they are strictly necessary and explicitly opt-in. Avoid any analytics or tracking libraries.

### 2. Code Quality

- Use functional components and hooks for React.
- Ensure all new API endpoints are protected by `projectAccessMiddleware`.
- Write meaningful commit messages using [Conventional Commits](https://www.conventionalcommits.org/).

### 3. Documentation

If you add a new feature, please update the corresponding guide in `/docs` and the `Self-Hosted Guide` if applicable.

## 📬 Submitting Changes

1.  Create a new branch: `git checkout -b feature/my-new-feature`.
2.  Commit your changes: `git commit -m 'feat: add amazing feature'`.
3.  Push to your branch: `git push origin feature/my-new-feature`.
4.  Open a **Pull Request** against the `main` branch.

## 💬 Community

Join our [GitHub Discussions](https://github.com/Replaysafe/Replaysafe/discussions) to talk about roadmap items or ask for help.

---

_Built with 🖤 for the Sovereign Future._
