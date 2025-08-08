# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/b6b6f598-5ec8-4ec8-4b79-9c09-9a0afc7454e2

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/b6b6f598-5ec8-4ec8-4b79-9c09-9a0afc7454e2) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/b6b6f598-5ec8-4ec8-4b79-9c09-9a0afc7454e2) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

---

## Optimization plan – What’s implemented

- Security & RLS: Single, strict SELECT policy on groups (auth users, waiting|confirmed); removed redundant policies.
- DB triggers: Enabled set_completed_at, add_to_outings_history, validate_message_before_insert.
- Indexes: Added targeted indexes on groups, group_participants, group_messages, user_outings_history.
- Client performance: React Query defaults (refetchOnWindowFocus: false); chat message RateLimiter; unified logging via clean logger.
- Observability: GTM event for scheduled group activation (scheduled_group_activated).

### Data flow diagram

<lov-mermaid>
sequenceDiagram
  participant UI
  participant DB as Postgres (RLS + Triggers)
  participant GTM as Analytics (GTM)

  UI->>DB: Update group status to completed
  Note over DB: BEFORE UPDATE trigger
  DB-->>DB: set_completed_at()
  Note over DB: AFTER UPDATE trigger
  DB-->>DB: add_to_outings_history()

  UI->>DB: Insert chat message
  DB-->>DB: validate_message_before_insert()

  DB-->>UI: Realtime UPDATE (is_scheduled true→false)
  UI-->>GTM: track('scheduled_group_activated')
</lov-mermaid>

### Best practices adopted
- Minimal RLS surface: one clear SELECT policy for groups.
- Deterministic triggers with explicit ordering (BEFORE/AFTER).
- Hot paths indexed; desc index for latest messages.
- No console.* in app code; centralized logger with dev gating.
- Reasonable React Query defaults to reduce refocus churn.

### Next steps (optional)
- Expand analytics to funnel events (join → full → bar assigned → completed).
- Add server-side rate limits via RPCs if needed for abuse protection.
