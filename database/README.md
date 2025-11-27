# Database Setup

## Supabase Configuration

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Save your project URL and anon key

### 2. Run Migrations

Execute the SQL files in order:

```sql
-- In Supabase SQL Editor, run each migration in order:
1. users.sql
2. playlists.sql
3. playlist_tracks.sql
4. triggers.sql
5. followers.sql
```

### 3. Configure Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Database Schema

### Tables

#### `users`

- `id` (UUID, PK) - User ID from Supabase Auth
- `username` (VARCHAR) - Unique username
- `display_name` (VARCHAR) - Display name
- `avatar_url` (TEXT) - Avatar image URL
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `playlists`

- `id` (UUID, PK) - Playlist ID
- `user_id` (UUID, FK) - Owner user ID
- `name` (VARCHAR) - Playlist name
- `description` (TEXT) - Playlist description
- `cover_image_url` (TEXT) - Cover image URL
- `is_public` (BOOLEAN) - Public or private
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `playlist_tracks`

- `id` (UUID, PK) - Track entry ID
- `playlist_id` (UUID, FK) - Playlist ID
- `video_id` (VARCHAR) - YouTube video ID
- `title` (VARCHAR) - Track title
- `artist` (VARCHAR) - Artist name
- `thumbnail_url` (TEXT) - Thumbnail URL
- `duration` (INTEGER) - Duration in seconds
- `position` (INTEGER) - Position in playlist
- `added_at` (TIMESTAMP)

#### `followers`
- `id` (UUID, PK) — Relationship entry ID
- `follower_id` (UUID, FK → users.id) — User who follows
- `following_id` (UUID, FK → users.id) — User being followed
- `created_at` (TIMESTAMP) — When the follow happened
- UNIQUE(`follower_id`, `following_id`) — Prevent duplicate follows
- CHECK (`follower_id` != `following_id`) — Prevent following oneself

## Row Level Security (RLS)

All tables have RLS enabled with policies:

- Users can view public playlists
- Users can manage their own playlists
- Users can add/remove tracks from their playlists
- Anyone can view follower relationships
- Users can follow/unfollow other users safely
