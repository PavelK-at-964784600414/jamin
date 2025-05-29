-- Create likes tables for themes and collaborations
-- This script adds like/dislike functionality to the Jamin music platform

-- Table for theme likes/dislikes
CREATE TABLE IF NOT EXISTS theme_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  theme_id INTEGER NOT NULL,
  member_id UUID NOT NULL,
  like_type VARCHAR(10) NOT NULL CHECK (like_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  UNIQUE(theme_id, member_id) -- One like/dislike per user per theme
);

-- Table for collaboration likes/dislikes
CREATE TABLE IF NOT EXISTS collab_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collab_id INTEGER NOT NULL,
  member_id UUID NOT NULL,
  like_type VARCHAR(10) NOT NULL CHECK (like_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (collab_id) REFERENCES collabs(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  UNIQUE(collab_id, member_id) -- One like/dislike per user per collaboration
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_theme_likes_theme_id ON theme_likes(theme_id);
CREATE INDEX IF NOT EXISTS idx_theme_likes_member_id ON theme_likes(member_id);
CREATE INDEX IF NOT EXISTS idx_theme_likes_type ON theme_likes(like_type);

CREATE INDEX IF NOT EXISTS idx_collab_likes_collab_id ON collab_likes(collab_id);
CREATE INDEX IF NOT EXISTS idx_collab_likes_member_id ON collab_likes(member_id);
CREATE INDEX IF NOT EXISTS idx_collab_likes_type ON collab_likes(like_type);

-- Create functions to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_theme_likes_updated_at ON theme_likes;
CREATE TRIGGER update_theme_likes_updated_at
  BEFORE UPDATE ON theme_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_collab_likes_updated_at ON collab_likes;
CREATE TRIGGER update_collab_likes_updated_at
  BEFORE UPDATE ON collab_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
