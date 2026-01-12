# Retro Tool - Team Retrospective Application

A real-time collaborative tool for team retrospectives using the Start/Stop/Continue framework.

## Features

- **Magic Link Authentication**: No passwords, JWT-based secure access
- **Real-time Collaboration**: Socket.io powered live updates
- **Start/Stop/Continue Framework**: Classic retrospective structure
- **Drag & Drop Grouping**: Organize notes visually
- **Voting System**: Democratic prioritization
- **Action Items**: Track next steps with assignments
- **Export**: Download complete session data as JSON

## Tech Stack

- **Backend**: Node.js, Express, Socket.io, SQLite
- **Frontend**: React, Vite, TailwindCSS, @dnd-kit
- **Authentication**: JWT magic links
- **Database**: SQLite (file-based, zero configuration)

## Project Structure

```
retro-tool/
├── server/          # Backend API and Socket.io server
├── client/          # React frontend
├── render.yaml      # Render.com deployment config
└── README.md
```

## Local Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

1. **Install server dependencies**:
```bash
cd server
npm install
cp .env.example .env
```

2. **Install client dependencies**:
```bash
cd client
npm install
```

3. **Start the development servers**:

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Usage Flow

1. **Setup**: Facilitator creates a session with participant emails and vote count
2. **Waiting Room**: All participants join via magic links
3. **Brainstorming**: Everyone writes notes in Start/Stop/Continue columns (notes are blurred)
4. **Reveal**: Facilitator reveals all notes
5. **Grouping**: Team organizes notes with drag & drop
6. **Voting**: Team votes on grouped items
7. **Action Items**: Facilitator creates action items based on votes
8. **Export**: Download complete retrospective data

## Deployment

### Render.com

1. Push your code to GitHub
2. Connect your repository to Render
3. Use the provided `render.yaml` configuration
4. Render will automatically build and deploy

The SQLite database is persisted on a Render disk mount.

## Environment Variables

### Server (.env)

```
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key-here
CLIENT_URL=http://localhost:5173
```

### Production

Set `JWT_SECRET` via Render dashboard (auto-generated recommended).

## License

MIT
