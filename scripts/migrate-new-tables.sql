-- Migration: Add new columns to listings
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS verified_by_id TEXT REFERENCES users(id);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS enquiry_count INTEGER NOT NULL DEFAULT 0;

-- Conversations (in-platform messaging)
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id TEXT NOT NULL REFERENCES users(id),
  seller_id TEXT NOT NULL REFERENCES users(id),
  subject TEXT,
  last_message_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS conv_listing_idx ON conversations(listing_id);
CREATE INDEX IF NOT EXISTS conv_buyer_idx ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS conv_seller_idx ON conversations(seller_id);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  read_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS msg_conv_idx ON messages(conversation_id);

-- Viewing Requests
CREATE TABLE IF NOT EXISTS viewing_requests (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id),
  buyer_id TEXT NOT NULL REFERENCES users(id),
  seller_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL DEFAULT 'IN_PERSON',
  preferred_date TIMESTAMP NOT NULL,
  preferred_time TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  scheduled_date TIMESTAMP,
  scheduled_time TEXT,
  meeting_link TEXT,
  notes TEXT,
  responded_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS vr_listing_idx ON viewing_requests(listing_id);
CREATE INDEX IF NOT EXISTS vr_buyer_idx ON viewing_requests(buyer_id);
CREATE INDEX IF NOT EXISTS vr_seller_idx ON viewing_requests(seller_id);

-- Neighbourhood Guides
CREATE TABLE IF NOT EXISTS neighbourhood_guides (
  id TEXT PRIMARY KEY,
  area TEXT NOT NULL UNIQUE,
  region TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  highlights TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  diaspora_tips TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Listing Analytics (daily snapshots)
CREATE TABLE IF NOT EXISTS listing_analytics (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL UNIQUE REFERENCES listings(id) ON DELETE CASCADE,
  view_count INTEGER NOT NULL DEFAULT 0,
  saved_count INTEGER NOT NULL DEFAULT 0,
  enquiry_count INTEGER NOT NULL DEFAULT 0,
  offer_count INTEGER NOT NULL DEFAULT 0,
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS la_listing_idx ON listing_analytics(listing_id);
CREATE INDEX IF NOT EXISTS la_date_idx ON listing_analytics(date);
