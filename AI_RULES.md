AI Rules for This App

Tech Stack (5–10 bullet points)
- Next.js (App Router) with React 18 and TypeScript for pages and components in the app/ directory.
- Tailwind CSS for all styling; utility-first classes drive layout, spacing, colors, and responsiveness.
- shadcn/ui (Radix UI based) for accessible, composable UI components; custom UI lives in components/.
- Supabase for database, auth, storage, and server-side operations; helpers live in lib/supabase/.
- SQL migration scripts are maintained under scripts/ to version database changes and RLS policies.
- Lucide React for icons to keep UI consistent and lightweight.
- Public assets (images/icons) live under public/ and can be served directly or via Next.js.
- Device fingerprint helpers and general utilities live in lib/ for reuse across the app.
- Global styles live in app/globals.css (and styles/globals.css if needed), scoped styling via Tailwind classes.

Library Usage Rules
UI Components
- Prefer shadcn/ui components for all interactive and accessible UI; compose them in components/ rather than modifying library files.
- If a customization is needed, wrap or extend shadcn/ui components in new files under components/; do not edit the library-generated files directly.
- Use Radix primitives (already included via shadcn/ui) for complex, accessible interactions when no ready-made component exists.

Styling
- Use Tailwind CSS exclusively for styling; avoid CSS-in-JS and external UI kits.
- Favor utility classes over custom CSS; keep custom CSS minimal and place it in app/globals.css only when necessary.
- Always implement responsive behavior with Tailwind breakpoints (sm, md, lg, xl, 2xl).
- Use semantic class patterns (flex, grid, space, gap, container, typography) to keep layouts simple and maintainable.

Icons
- Use lucide-react; import only the icons you need from lucide-react to keep bundles small.
- Store any custom SVGs in public/ and use Next.js Image or standard img tags when appropriate.

Routing & Pages
- Use Next.js App Router; page directories live under app/ with page.tsx files for routes and layout.tsx for per-route layout.
- Keep server actions in app/actions.ts; prefer server-side code for privileged operations.
- Client components are only for interactive UI; keep data fetching and privileged logic in server components or server actions.

Data, Auth, and Backend
- Use Supabase client helpers from lib/supabase/client.ts for client-side interactions and lib/supabase/server.ts for server-side usage.
- Do not bypass Supabase; all database access must respect RLS policies enforced by the SQL scripts in scripts/.
- Use Supabase Auth for user management; store tenant-aware data as defined by the schema and RLS docs.
- Use Supabase Storage for file uploads; never write files directly to the filesystem at runtime.
- For privileged or cross-tenant operations, use server actions or Supabase edge functions (as applicable), never in client components.

Forms and Validation
- Build forms with native HTML inputs combined with shadcn/ui form-related components (e.g., Input, Label, Button).
- Perform basic client-side validation before submitting; rely on server-side validation and Supabase constraints/RLS for enforcement.
- Keep form state local using React useState/useReducer; avoid global state libraries.

State Management and Data Fetching
- Use React local state and context; avoid Redux or other heavy state tools unless strictly necessary.
- Prefer server components and server actions for data fetching when possible; use client-side fetching only for interactive or real-time needs.
- Keep caching and revalidation strategies within Next.js conventions (e.g., fetch with caching/revalidate where appropriate).

Notifications
- Use shadcn/ui toast component for user feedback (success, error, info) and keep messages short and actionable.
- Do not introduce alternate toast libraries.

Images and Assets
- Prefer Next.js Image for images that benefit from optimization; static assets should be placed under public/.
- Keep image sizes reasonable and leverage responsive sizes and alt text for accessibility.

Testing and Quality (lightweight guidance)
- Keep components small and focused (<100 lines when possible).
- Name files and directories clearly; keep custom code in components/ and pages under app/.
- Avoid overengineering; implement only what is needed for the feature.