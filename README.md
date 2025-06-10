https://jamin-gamma.vercel.app/


# 🎵 Jamin - Music Collaboration Platform

A modern, real-time music collaboration platform built with Next.js, TypeScript, and Web Audio APIs. Create, share, and collaborate on musical compositions with advanced audio tools and seamless layering capabilities.

![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 🎛️ Interactive Music Tools
- **Metronome**: Programmable metronome with customizable BPM and time signatures
- **Chord Generator**: Generate and play chord progressions with multiple sound types (piano, drums & bass)
- **Interactive Fretboard Visualizer**: Visual guitar/bass fretboard with scale/chord visualization and animated chord progression playback

### 🎼 Music Collaboration
- **Theme Creation**: Record or upload original musical themes
- **Layer Addition**: Add harmonies, melodies, or accompaniments to existing themes
- **Real-time Audio Mixing**: Server-side FFmpeg integration for seamless audio layering
- **Chord Progression Looping**: Continuous playback with visual fretboard highlighting

### 🔐 User Management
- **Authentication**: Secure login/signup with NextAuth.js
- **User Profiles**: Customizable profiles with collaboration history
- **Member Directory**: Discover and connect with other musicians

### 🎨 Modern Interface
- **Responsive Design**: Optimized for desktop and mobile devices
- **Dark Theme**: Professional music production aesthetic
- **Real-time Updates**: Live collaboration status and audio playback controls
- **Accessibility**: WCAG compliant with keyboard navigation support

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- PostgreSQL database
- AWS S3 bucket (for audio storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/PavelK-at-964784600414/jamin.git
   cd jamin
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the project root:
   ```env
   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_super_secret_key_here
   
   # Database
   DATABASE_URL=postgresql://user:password@host:port/database
   
   # AWS S3 for Audio Storage
   AWS_S3_BUCKET=your-audio-bucket
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   
   # Optional: Rate Limiting
   MAX_REQUESTS_PER_MINUTE=60
   ```

4. **Set up the database**
   ```bash
   # Run database migrations (if applicable)
   pnpm db:migrate
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Heroicons
- **Authentication**: NextAuth.js
- **Database**: PostgreSQL with Vercel Postgres
- **Audio Processing**: Web Audio API, ffmpeg-static
- **File Storage**: AWS S3
- **Deployment**: Vercel (recommended)

## 📱 Audio Tools Documentation

### Metronome
- Customizable BPM (60-200)
- Multiple time signatures
- Visual and audio click tracks
- Browser audio context optimization

### Chord Generator
- 20+ chord progressions (I-V-vi-IV, ii-V-I, etc.)
- Piano and drums & bass sound options
- Continuous looping playback
- Real-time chord visualization

### Interactive Fretboard Visualizer
- Multi-string instrument support (4-12 strings)
- Scale and chord visualization
- Animated chord progression playback
- Custom tuning support
- Visual highlighting of active chord notes

## 🎯 Browser Compatibility

- **Audio Features**: Chrome 66+, Firefox 60+, Safari 14+
- **Recording**: Chrome 52+, Firefox 29+, Safari 14.1+
- **File Upload**: All modern browsers with drag-and-drop support

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
- Server-side mixing of original theme and new layer into a single WebM/Opus file using ffmpeg-static.
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

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Enable Vercel Postgres addon
4. Deploy with automatic CI/CD

### Self-Hosting
1. **Build the application**
   ```bash
   pnpm build
   ```

2. **Start the production server**
   ```bash
   pnpm start
   ```

   *Note: FFmpeg is included as `ffmpeg-static` package and requires no separate installation.*

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Use TypeScript for all new code
- Follow the existing code style and formatting
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) for audio synthesis
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Heroicons](https://heroicons.com/) for beautiful icons

## 📞 Support

- 📫 Open an [issue](https://github.com/PavelK-at-964784600414/jamin/issues) for bug reports
- 💡 Use [discussions](https://github.com/PavelK-at-964784600414/jamin/discussions) for feature requests
- 📖 Check the [wiki](https://github.com/PavelK-at-964784600414/jamin/wiki) for detailed documentation

---

**Made with ❤️ by Pavel Klug**


