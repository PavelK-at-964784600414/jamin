# Jamin

This is the codebase for the Jamin Next.js application.

## Project Overview

Jamin is a collaborative music platform built with Next.js, TypeScript, and modern web technologies. It features authentication, theme and layer creation, audio recording/upload, and more.

## Getting Started

- Clone the repository
- Install dependencies with `npm install` or `pnpm install`
- Set up your environment variables in `.env.local`
- Run the development server with `npm run dev` or `pnpm dev`

## Environment Variables

Create a `.env.local` file in the project root and configure the following variables:

```
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<your_nextauth_secret>

# PostgreSQL (Vercel Postgres or other)
DATABASE_URL=postgresql://user:password@host:port/database

# AWS / S3 (for audio uploads)
AWS_S3_BUCKET=<your_s3_bucket_name>
AWS_ACCESS_KEY_ID=<your_aws_access_key_id>
AWS_SECRET_ACCESS_KEY=<your_aws_secret_access_key>
AWS_REGION=<your_s3_region>

# Optional: Rate limiter settings
# MAX_REQUESTS_PER_MINUTE=60
```

Make sure to replace placeholder values with your own credentials.

## Features

- User authentication (NextAuth.js)
- Theme and layer management
- Audio recording and upload (with S3 integration)
- Collaborative music creation
- Modern UI with Tailwind CSS

## Detailed Features

### Authentication
- Built with NextAuth.js supporting email/password and OAuth providers.
- Secure API routes with CSRF protection, rate limiting, and session checks.

### Theme Management
- Create new themes by recording or uploading audio tracks.
- Store metadata (title, description, instrument, key, tempo, chords, mode).
- Secure server actions with real-time client-side redirects.

### Layer Collaboration
- Add layers to existing themes while listening to the original track for synchronization.
- Client-side recording UI with fallback handling for different browsers (WebM, MP4, MP3, WAV).
- Server-side mixing of original theme and new layer into a single WebM/Opus file using FFmpeg.
- Automatic upload of mixed audio to S3 and immediate revalidation of dashboard pages.

### UI Components
- Responsive dashboard with theme and member overviews, charts, and tables.
- Accessible forms and custom components built with React, Tailwind CSS, and Next.js App Router.

## Local Development

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Start the dev server:
   ```bash
   pnpm dev
   ```
3. Open `http://localhost:3000` in your browser.

## Deployment

- Configure your hosting environment (Vercel, AWS, etc.) with the above environment variables.
- Ensure `ffmpeg` is installed on the server or included in the deployment image for audio mixing.
- Build and deploy the Next.js application using:
  ```bash
  pnpm build && pnpm start
  ```

## Documentation

This README is not completed yet. More detailed setup instructions, environment variable descriptions, and feature documentation will be added soon.

---

For questions or contributions, please open an issue or pull request.


