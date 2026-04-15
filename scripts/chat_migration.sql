-- ============================================================
-- Live Support Chat System — Database Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Conversations table
CREATE TABLE IF NOT EXISTS support_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id),
  subject TEXT DEFAULT 'General Support',
  status TEXT DEFAULT 'open' CHECK (status IN ('open','pending','resolved','closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ
);

-- 2. Messages table
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user','admin')),
  message TEXT NOT NULL,
  attachment_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user ON support_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON support_conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON support_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON support_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON support_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_read ON support_messages(is_read) WHERE is_read = false;

-- 4. Auto-update updated_at on conversation when a message is inserted
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE support_conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_conversation_ts ON support_messages;
CREATE TRIGGER trg_update_conversation_ts
  AFTER INSERT ON support_messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- 5. RLS Policies
ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Users can see their own conversations
DROP POLICY IF EXISTS "Users view own conversations" ON support_conversations;
CREATE POLICY "Users view own conversations" ON support_conversations
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can see all conversations
DROP POLICY IF EXISTS "Admins view all conversations" ON support_conversations;
CREATE POLICY "Admins view all conversations" ON support_conversations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can create conversations
DROP POLICY IF EXISTS "Users create conversations" ON support_conversations;
CREATE POLICY "Users create conversations" ON support_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can update conversations (assign, close, etc.)
DROP POLICY IF EXISTS "Admins update conversations" ON support_conversations;
CREATE POLICY "Admins update conversations" ON support_conversations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can update their own conversations
DROP POLICY IF EXISTS "Users update own conversations" ON support_conversations;
CREATE POLICY "Users update own conversations" ON support_conversations
  FOR UPDATE USING (auth.uid() = user_id);

-- Messages: users see messages in their conversations
DROP POLICY IF EXISTS "Users view own messages" ON support_messages;
CREATE POLICY "Users view own messages" ON support_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM support_conversations WHERE id = conversation_id AND user_id = auth.uid())
  );

-- Admins see all messages
DROP POLICY IF EXISTS "Admins view all messages" ON support_messages;
CREATE POLICY "Admins view all messages" ON support_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can send messages in their conversations
DROP POLICY IF EXISTS "Users send messages" ON support_messages;
CREATE POLICY "Users send messages" ON support_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (SELECT 1 FROM support_conversations WHERE id = conversation_id AND user_id = auth.uid())
  );

-- Admins can send messages in any conversation
DROP POLICY IF EXISTS "Admins send messages" ON support_messages;
CREATE POLICY "Admins send messages" ON support_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update messages (mark as read)
DROP POLICY IF EXISTS "Admins update messages" ON support_messages;
CREATE POLICY "Admins update messages" ON support_messages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can update messages in their conversations (mark as read)
DROP POLICY IF EXISTS "Users update own messages" ON support_messages;
CREATE POLICY "Users update own messages" ON support_messages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM support_conversations WHERE id = conversation_id AND user_id = auth.uid())
  );

-- 6. Enable Realtime
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE support_conversations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- FAQ Auto-Response System
-- ============================================================

-- 7. FAQ table
CREATE TABLE IF NOT EXISTS support_faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  priority INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faqs_category ON support_faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_status ON support_faqs(status);
CREATE INDEX IF NOT EXISTS idx_faqs_priority ON support_faqs(priority DESC);

-- 8. RLS for FAQ table
ALTER TABLE support_faqs ENABLE ROW LEVEL SECURITY;

-- Everyone can read active FAQs
DROP POLICY IF EXISTS "Anyone can read active FAQs" ON support_faqs;
CREATE POLICY "Anyone can read active FAQs" ON support_faqs
  FOR SELECT USING (status = 'active');

-- Admins can read all FAQs (including inactive)
DROP POLICY IF EXISTS "Admins read all FAQs" ON support_faqs;
CREATE POLICY "Admins read all FAQs" ON support_faqs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can insert FAQs
DROP POLICY IF EXISTS "Admins insert FAQs" ON support_faqs;
CREATE POLICY "Admins insert FAQs" ON support_faqs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update FAQs
DROP POLICY IF EXISTS "Admins update FAQs" ON support_faqs;
CREATE POLICY "Admins update FAQs" ON support_faqs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can delete FAQs
DROP POLICY IF EXISTS "Admins delete FAQs" ON support_faqs;
CREATE POLICY "Admins delete FAQs" ON support_faqs
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 9. Seed default FAQ entries
INSERT INTO support_faqs (question, answer, category, priority) VALUES
(
  'I made a deposit but it is not reflecting',
  'Deposits typically take 10–30 minutes to reflect depending on network congestion. Please ensure you sent the correct amount to the correct wallet address. If the issue persists after 1 hour, please share your transaction hash and our team will investigate immediately.',
  'Deposits',
  10
),
(
  'How do I make a deposit?',
  'Navigate to Dashboard → Wallet → Deposit tab. Select your preferred method (Crypto or Fiat), choose the asset, and follow the on-screen instructions. For crypto deposits, send funds to the displayed wallet address. For fiat deposits, use the bank transfer or card payment options.',
  'Deposits',
  9
),
(
  'My withdrawal is taking too long',
  'Withdrawal requests are processed within 12–48 hours depending on the method and amount. Large withdrawals may require additional verification. Please check your email for any pending verification requests. If your withdrawal has been pending for more than 48 hours, our team will prioritize your case.',
  'Withdrawals',
  8
),
(
  'How do I withdraw funds?',
  'Go to Dashboard → Wallet → Withdraw tab. Select Crypto or Fiat, enter the destination address or bank details, specify the amount, and submit. Please ensure your KYC verification is complete before initiating withdrawals.',
  'Withdrawals',
  7
),
(
  'How do I verify my account?',
  'Go to Dashboard → Settings → KYC Verification. Upload a valid government-issued ID (passport, drivers license, or national ID) and a proof of address document. Verification typically completes within 24–48 hours. You will receive an email confirmation once approved.',
  'KYC',
  6
),
(
  'What is copy trading and how does it work?',
  'Copy trading allows you to automatically replicate the trades of experienced professional traders. Go to Dashboard → Copy Trading, browse available traders, review their performance history, and click "Start Copying" to allocate funds. Your portfolio will mirror their trades in real time.',
  'Copy Trading',
  5
),
(
  'I cannot log in to my account',
  'Please try resetting your password using the "Forgot Password" link on the login page. If you are still unable to access your account, clear your browser cache and cookies, then try again. For persistent issues, please provide your registered email address and our team will assist you.',
  'Account Issues',
  4
),
(
  'How do I change my password?',
  'Go to Dashboard → Settings → Security. Click "Change Password", enter your current password followed by your new password, and confirm. For security reasons, you will be logged out of all other sessions after changing your password.',
  'Account Issues',
  3
),
(
  'I need a payment or transaction confirmation',
  'You can view all your transaction history in Dashboard → Wallet → History tab. Each transaction includes a reference ID, timestamp, amount, and status. If you need an official confirmation document, please provide the transaction reference and we will generate one for you.',
  'Deposits',
  2
),
(
  'How do I contact support?',
  'You are already connected with our support team through this live chat. You can also reach us via email at support@claritytrade.com. Our support team is available 24/7 to assist you with any questions or concerns.',
  'General',
  1
)
ON CONFLICT DO NOTHING;

-- 10. Enable Realtime for FAQs
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE support_faqs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
