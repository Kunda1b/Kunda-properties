-- =============================================================================
-- Kunda Properties — PostgreSQL Row Level Security (RLS) policies
-- =============================================================================
-- This project uses Express + Drizzle + Postgres (not Supabase). These policies
-- provide the same isolation model as Supabase RLS when the DB role is not a
-- superuser / table owner, or when FORCE ROW LEVEL SECURITY is enabled.
--
-- Session variables (set per request by the API when using a restricted role):
--   SELECT set_config('app.user_id',   '<uuid>', true);
--   SELECT set_config('app.user_role', '<ROLE>', true);
--
-- Apply:
--   psql "$DATABASE_URL" -f scripts/rls-policies.sql
--
-- IMPORTANT: Table owners and superusers bypass RLS unless FORCE is used.
-- For production, connect the API as a non-owner role (e.g. kunda_app) and
-- optionally FORCE RLS on sensitive tables after verifying the app still works.
-- =============================================================================

CREATE OR REPLACE FUNCTION app_user_id() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.user_id', true), '');
$$;

CREATE OR REPLACE FUNCTION app_user_role() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT coalesce(nullif(current_setting('app.user_role', true), ''), '');
$$;

CREATE OR REPLACE FUNCTION app_is_admin() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT app_user_role() IN ('ADMIN', 'SUPER_ADMIN');
$$;

-- ── users ────────────────────────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_own_or_admin ON users;
CREATE POLICY users_select_own_or_admin ON users
  FOR SELECT USING (id = app_user_id() OR app_is_admin());

DROP POLICY IF EXISTS users_update_own_or_admin ON users;
CREATE POLICY users_update_own_or_admin ON users
  FOR UPDATE USING (id = app_user_id() OR app_is_admin());

-- Inserts are service-only (registration uses app role with BYPASSRLS or SECURITY DEFINER path)
DROP POLICY IF EXISTS users_insert_service ON users;
CREATE POLICY users_insert_service ON users
  FOR INSERT WITH CHECK (true);

-- ── user_profiles ────────────────────────────────────────────────────────────
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select ON user_profiles;
CREATE POLICY profiles_select ON user_profiles
  FOR SELECT USING (
    user_id = app_user_id()
    OR app_is_admin()
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_profiles.user_id
        AND u.role IN ('AGENT', 'SELLER')
        AND u.is_active = true
        AND u.is_suspended = false
    )
  );

DROP POLICY IF EXISTS profiles_mutate_own ON user_profiles;
CREATE POLICY profiles_mutate_own ON user_profiles
  FOR ALL USING (user_id = app_user_id() OR app_is_admin())
  WITH CHECK (user_id = app_user_id() OR app_is_admin());

-- ── sessions ─────────────────────────────────────────────────────────────────
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sessions_own ON sessions;
CREATE POLICY sessions_own ON sessions
  FOR ALL USING (user_id = app_user_id() OR app_is_admin())
  WITH CHECK (user_id = app_user_id() OR app_is_admin());

-- ── kyc_records ──────────────────────────────────────────────────────────────
ALTER TABLE kyc_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kyc_own_or_admin ON kyc_records;
CREATE POLICY kyc_own_or_admin ON kyc_records
  FOR ALL USING (user_id = app_user_id() OR app_is_admin())
  WITH CHECK (user_id = app_user_id() OR app_is_admin());

-- ── listings ─────────────────────────────────────────────────────────────────
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS listings_public_read ON listings;
CREATE POLICY listings_public_read ON listings
  FOR SELECT USING (
    status IN ('ACTIVE', 'UNDER_OFFER', 'SOLD')
    OR seller_id = app_user_id()
    OR app_is_admin()
  );

DROP POLICY IF EXISTS listings_owner_write ON listings;
CREATE POLICY listings_owner_write ON listings
  FOR INSERT WITH CHECK (seller_id = app_user_id() OR app_is_admin());

DROP POLICY IF EXISTS listings_owner_update ON listings;
CREATE POLICY listings_owner_update ON listings
  FOR UPDATE USING (seller_id = app_user_id() OR app_is_admin());

DROP POLICY IF EXISTS listings_owner_delete ON listings;
CREATE POLICY listings_owner_delete ON listings
  FOR DELETE USING (seller_id = app_user_id() OR app_is_admin());

-- ── listing_images / listing_videos ──────────────────────────────────────────
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS listing_images_access ON listing_images;
CREATE POLICY listing_images_access ON listing_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_images.listing_id
        AND (
          l.status IN ('ACTIVE', 'UNDER_OFFER', 'SOLD')
          OR l.seller_id = app_user_id()
          OR app_is_admin()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_images.listing_id
        AND (l.seller_id = app_user_id() OR app_is_admin())
    )
  );

DROP POLICY IF EXISTS listing_videos_access ON listing_videos;
CREATE POLICY listing_videos_access ON listing_videos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_videos.listing_id
        AND (
          l.status IN ('ACTIVE', 'UNDER_OFFER', 'SOLD')
          OR l.seller_id = app_user_id()
          OR app_is_admin()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_videos.listing_id
        AND (l.seller_id = app_user_id() OR app_is_admin())
    )
  );

-- ── saved_listings ───────────────────────────────────────────────────────────
ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS saved_own ON saved_listings;
CREATE POLICY saved_own ON saved_listings
  FOR ALL USING (user_id = app_user_id() OR app_is_admin())
  WITH CHECK (user_id = app_user_id() OR app_is_admin());

-- ── offers ───────────────────────────────────────────────────────────────────
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS offers_party_access ON offers;
CREATE POLICY offers_party_access ON offers
  FOR SELECT USING (
    buyer_id = app_user_id()
    OR app_is_admin()
    OR EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = offers.listing_id AND l.seller_id = app_user_id()
    )
  );

DROP POLICY IF EXISTS offers_buyer_insert ON offers;
CREATE POLICY offers_buyer_insert ON offers
  FOR INSERT WITH CHECK (buyer_id = app_user_id());

DROP POLICY IF EXISTS offers_party_update ON offers;
CREATE POLICY offers_party_update ON offers
  FOR UPDATE USING (
    buyer_id = app_user_id()
    OR app_is_admin()
    OR EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = offers.listing_id AND l.seller_id = app_user_id()
    )
  );

-- ── escrow_accounts ──────────────────────────────────────────────────────────
ALTER TABLE escrow_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS escrow_party_access ON escrow_accounts;
CREATE POLICY escrow_party_access ON escrow_accounts
  FOR ALL USING (
    buyer_id = app_user_id()
    OR seller_id = app_user_id()
    OR app_is_admin()
  )
  WITH CHECK (
    buyer_id = app_user_id()
    OR seller_id = app_user_id()
    OR app_is_admin()
  );

-- ── escrow_milestones / transactions ─────────────────────────────────────────
ALTER TABLE escrow_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS escrow_milestones_access ON escrow_milestones;
CREATE POLICY escrow_milestones_access ON escrow_milestones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM escrow_accounts e
      WHERE e.id = escrow_milestones.escrow_id
        AND (e.buyer_id = app_user_id() OR e.seller_id = app_user_id() OR app_is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM escrow_accounts e
      WHERE e.id = escrow_milestones.escrow_id
        AND (e.buyer_id = app_user_id() OR e.seller_id = app_user_id() OR app_is_admin())
    )
  );

DROP POLICY IF EXISTS transactions_access ON transactions;
CREATE POLICY transactions_access ON transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM escrow_accounts e
      WHERE e.id = transactions.escrow_id
        AND (e.buyer_id = app_user_id() OR e.seller_id = app_user_id() OR app_is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM escrow_accounts e
      WHERE e.id = transactions.escrow_id
        AND (e.buyer_id = app_user_id() OR e.seller_id = app_user_id() OR app_is_admin())
    )
  );

-- ── documents ────────────────────────────────────────────────────────────────
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS documents_access ON documents;
CREATE POLICY documents_access ON documents
  FOR ALL USING (
    uploaded_by_id = app_user_id()
    OR is_public = true
    OR app_is_admin()
    OR (
      listing_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM listings l
        WHERE l.id = documents.listing_id AND l.seller_id = app_user_id()
      )
    )
  )
  WITH CHECK (uploaded_by_id = app_user_id() OR app_is_admin());

-- ── notifications ────────────────────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_own ON notifications;
CREATE POLICY notifications_own ON notifications
  FOR ALL USING (user_id = app_user_id() OR app_is_admin())
  WITH CHECK (user_id = app_user_id() OR app_is_admin());

-- ── audit_logs (admin read; service write) ───────────────────────────────────
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_admin_read ON audit_logs;
CREATE POLICY audit_admin_read ON audit_logs
  FOR SELECT USING (app_is_admin());

DROP POLICY IF EXISTS audit_insert ON audit_logs;
CREATE POLICY audit_insert ON audit_logs
  FOR INSERT WITH CHECK (true);

-- ── conversations / messages ─────────────────────────────────────────────────
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversations_party ON conversations;
CREATE POLICY conversations_party ON conversations
  FOR ALL USING (
    buyer_id = app_user_id() OR seller_id = app_user_id() OR app_is_admin()
  )
  WITH CHECK (
    buyer_id = app_user_id() OR seller_id = app_user_id() OR app_is_admin()
  );

DROP POLICY IF EXISTS messages_party ON messages;
CREATE POLICY messages_party ON messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.buyer_id = app_user_id() OR c.seller_id = app_user_id() OR app_is_admin())
    )
  )
  WITH CHECK (
    sender_id = app_user_id()
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.buyer_id = app_user_id() OR c.seller_id = app_user_id() OR app_is_admin())
    )
  );

-- ── viewing_requests ─────────────────────────────────────────────────────────
ALTER TABLE viewing_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS viewings_party ON viewing_requests;
CREATE POLICY viewings_party ON viewing_requests
  FOR ALL USING (
    buyer_id = app_user_id() OR seller_id = app_user_id() OR app_is_admin()
  )
  WITH CHECK (
    buyer_id = app_user_id() OR seller_id = app_user_id() OR app_is_admin()
  );

-- ── neighbourhood_guides (public read; admin write) ──────────────────────────
ALTER TABLE neighbourhood_guides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS neighbourhoods_public_read ON neighbourhood_guides;
CREATE POLICY neighbourhoods_public_read ON neighbourhood_guides
  FOR SELECT USING (true);

DROP POLICY IF EXISTS neighbourhoods_admin_write ON neighbourhood_guides;
CREATE POLICY neighbourhoods_admin_write ON neighbourhood_guides
  FOR ALL USING (app_is_admin())
  WITH CHECK (app_is_admin());

-- ── exchange_rates (public read; admin write) ────────────────────────────────
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rates_public_read ON exchange_rates;
CREATE POLICY rates_public_read ON exchange_rates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS rates_admin_write ON exchange_rates;
CREATE POLICY rates_admin_write ON exchange_rates
  FOR ALL USING (app_is_admin())
  WITH CHECK (app_is_admin());

-- ── listing_analytics ────────────────────────────────────────────────────────
ALTER TABLE listing_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS analytics_access ON listing_analytics;
CREATE POLICY analytics_access ON listing_analytics
  FOR SELECT USING (
    app_is_admin()
    OR EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_analytics.listing_id AND l.seller_id = app_user_id()
    )
  );

DROP POLICY IF EXISTS analytics_write ON listing_analytics;
CREATE POLICY analytics_write ON listing_analytics
  FOR ALL USING (app_is_admin() OR EXISTS (
    SELECT 1 FROM listings l
    WHERE l.id = listing_analytics.listing_id AND l.seller_id = app_user_id()
  ))
  WITH CHECK (app_is_admin() OR EXISTS (
    SELECT 1 FROM listings l
    WHERE l.id = listing_analytics.listing_id AND l.seller_id = app_user_id()
  ));

-- ── price_history ────────────────────────────────────────────────────────────
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS price_history_read ON price_history;
CREATE POLICY price_history_read ON price_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = price_history.listing_id
        AND (
          l.status IN ('ACTIVE', 'UNDER_OFFER', 'SOLD')
          OR l.seller_id = app_user_id()
          OR app_is_admin()
        )
    )
  );

DROP POLICY IF EXISTS price_history_write ON price_history;
CREATE POLICY price_history_write ON price_history
  FOR ALL USING (
    app_is_admin()
    OR EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = price_history.listing_id AND l.seller_id = app_user_id()
    )
  )
  WITH CHECK (
    app_is_admin()
    OR EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = price_history.listing_id AND l.seller_id = app_user_id()
    )
  );
