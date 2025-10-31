# AgentPrivacy.ai Landing Page

A beautiful landing page for AgentPrivacy.ai, built with Next.js and matching the exact styling of the AgentDashboard component.

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the landing page.

## Cloudflare Pages Deployment

This project is configured for Cloudflare Pages deployment.

### Setup in Cloudflare Pages Dashboard:

1. Go to Cloudflare Dashboard > Pages
2. Create a new project
3. Connect your GitHub repository: `mitchuski/agentprivacy`
4. Configure build settings:
   - **Framework preset**: `None` or `Custom` (DO NOT use "Next.js" preset - that's for Next.js runtime)
   - **Build command**: `npm run build`
   - **Build output directory**: `out` (this is the output for static export)
   - **Root directory**: `/` (leave blank if deploying from root)
   - **Node version**: 18 or higher
   
   ⚠️ **IMPORTANT**: Do NOT select "Next.js" as the framework preset. That preset uses `@cloudflare/next-on-pages` which expects a different output structure. Since we're using `output: 'export'` for static files, we need to use "None" or "Custom" preset and manually set the build command and output directory.

### Environment Variables:
No environment variables are required for this project.

### Build Settings:
- **Build command**: `npm run build`
- **Node version**: 18+

Cloudflare Pages will automatically detect Next.js and handle the build process.

## Project Structure

- `src/app/page.tsx` - Main landing page component
- `src/app/layout.tsx` - Root layout with footer
- `src/app/globals.css` - Global styles matching AgentDashboard
- `tailwind.config.ts` - Tailwind configuration with same color scheme

## Styling

This landing page uses the exact same styling as the AgentDashboard:
- Same color scheme (primary, secondary, accent, background, surface)
- Same card components
- Same button styles
- Same typography and spacing
- Same dark theme aesthetic

## Build

To build for production:

```bash
npm run build
npm start
```
