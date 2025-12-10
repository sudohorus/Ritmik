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
6. user_settings.sql
7. statistics.sql
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

#### `play_history`

- `id` (UUID, PK) - Play history entry ID
- `user_id` (UUID, FK) - User who played the track
- `video_id` (TEXT) - YouTube video ID
- `title` (TEXT) - Track title
- `artist` (TEXT) - Artist name
- `playlist_id` (UUID, FK) - Playlist context (optional)
- `played_at` (TIMESTAMP) - When the track was played
- `listen_duration` (INTEGER) - Seconds actually listened
- `completed` (BOOLEAN) - True if played >80%

#### `user_statistics`

- `user_id` (UUID, PK, FK) - User ID
- `total_plays` (INTEGER) - Total number of plays
- `total_listen_time` (INTEGER) - Total seconds listened
- `completed_plays` (INTEGER) - Number of completed plays
- `playlists_created` (INTEGER) - Number of playlists created
- `followers_count` (INTEGER) - Number of followers
- `following_count` (INTEGER) - Number of users following

#### `track_statistics`

- `video_id` (TEXT, PK) - YouTube video ID
- `title` (TEXT) - Track title
- `artist` (TEXT) - Artist name
- `total_plays` (INTEGER) - Total plays across all users
- `unique_listeners` (INTEGER) - Number of unique users
- `plays_last_7_days` (INTEGER) - Plays in last 7 days (trending)
- `plays_last_30_days` (INTEGER) - Plays in last 30 days

#### `playlist_statistics`

- `playlist_id` (UUID, PK, FK) - Playlist ID
- `total_plays` (INTEGER) - Total plays
- `unique_listeners` (INTEGER) - Number of unique listeners
- `followers_count` (INTEGER) - Number of followers
- `plays_last_7_days` (INTEGER) - Plays in last 7 days

#### `user_favorites`

- `id` (UUID, PK) - Favorite entry ID
- `user_id` (UUID, FK) - User ID
- `video_id` (TEXT) - YouTube video ID
- `title` (TEXT) - Track title
- `favorited_at` (TIMESTAMP) - When favorited

## Row Level Security (RLS)

All tables have RLS enabled with policies:

### Core Tables
- Users can view public playlists
- Users can manage their own playlists
- Users can add/remove tracks from their playlists
- Anyone can view follower relationships
- Users can follow/unfollow other users safely

### Statistics Tables
- Users can only insert/view their own play history
- Users can only view their own user statistics
- Track and playlist statistics are public (viewable by all)
- Users can only manage their own favorites
- Automatic triggers update statistics in real-time
