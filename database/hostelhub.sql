-- Hostel-Hub PostgreSQL schema, data, routines, triggers, and demo queries

-- SECTION 1: EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('student', 'admin');
CREATE TYPE order_status AS ENUM ('confirmed','delivered','cancelled');
CREATE TYPE ticket_status AS ENUM ('submitted','assigned','in_progress','resolved','closed');
CREATE TYPE rsvp_status AS ENUM ('going','not_going','maybe');
CREATE TYPE item_type AS ENUM ('lost','found');
CREATE TYPE listing_status AS ENUM ('active','sold','removed');
CREATE TYPE guidebook_category AS ENUM ('rules','faqs','emergency_contacts');

-- SECTION 2: CREATE TABLES
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  student_id VARCHAR(50) UNIQUE,
  display_name VARCHAR(100),
  profile_picture VARCHAR(500),
  contact_number VARCHAR(20),
  room_number VARCHAR(20),
  role user_role DEFAULT 'student',
  is_verified BOOLEAN DEFAULT FALSE,
  is_suspended BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255) NOT NULL,
  fcm_token VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_verifications (
  verification_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users ON DELETE CASCADE,
  reviewed_by INT REFERENCES users ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  documents_submitted TEXT,
  remarks TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE (user_id)
);

CREATE TABLE safety_alerts (
  alert_id SERIAL PRIMARY KEY,
  created_by INT REFERENCES users ON DELETE SET NULL,
  title VARCHAR(255),
  body TEXT,
  severity VARCHAR(20) CHECK (severity IN ('low','medium','high','critical')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE marketplace_listings (
  listing_id SERIAL PRIMARY KEY,
  seller_id INT REFERENCES users ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  quantity INT,
  category VARCHAR(50),
  status listing_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE marketplace_orders (
  order_id SERIAL PRIMARY KEY,
  listing_id INT REFERENCES marketplace_listings ON DELETE CASCADE,
  buyer_id INT REFERENCES users ON DELETE CASCADE,
  quantity INT,
  status order_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE maintenance_tickets (
  ticket_id SERIAL PRIMARY KEY,
  student_id INT REFERENCES users ON DELETE CASCADE,
  category VARCHAR(50),
  description TEXT,
  room_number VARCHAR(20),
  photo_url VARCHAR(500),
  status ticket_status DEFAULT 'submitted',
  assigned_to INT REFERENCES users ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE polls (
  poll_id SERIAL PRIMARY KEY,
  created_by INT REFERENCES users ON DELETE CASCADE,
  question VARCHAR(500) NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE poll_options (
  option_id SERIAL PRIMARY KEY,
  poll_id INT REFERENCES polls ON DELETE CASCADE,
  option_text VARCHAR(200) NOT NULL,
  display_order INT
);

CREATE TABLE poll_votes (
  vote_id SERIAL PRIMARY KEY,
  poll_id INT REFERENCES polls ON DELETE CASCADE,
  user_id INT REFERENCES users ON DELETE CASCADE,
  option_id INT REFERENCES poll_options ON DELETE CASCADE,
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

CREATE TABLE events (
  event_id SERIAL PRIMARY KEY,
  created_by INT REFERENCES users ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  location VARCHAR(255),
  banner_image VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE event_rsvps (
  rsvp_id SERIAL PRIMARY KEY,
  event_id INT REFERENCES events ON DELETE CASCADE,
  user_id INT REFERENCES users ON DELETE CASCADE,
  status rsvp_status NOT NULL,
  UNIQUE(event_id, user_id)
);

CREATE TABLE lost_found_items (
  item_id SERIAL PRIMARY KEY,
  posted_by INT REFERENCES users ON DELETE CASCADE,
  item_type item_type NOT NULL,
  description TEXT,
  location_tag VARCHAR(255),
  item_date DATE,
  image_url VARCHAR(500),
  is_anonymous BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE guidebook_entries (
  entry_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  category guidebook_category NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  notification_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users ON DELETE CASCADE,
  title VARCHAR(255),
  body VARCHAR(1000),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE otp_verifications (
  otp_id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN DEFAULT FALSE
);

-- Community Posts
CREATE TABLE community_posts (
    post_id     SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content     TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Post Likes (one like per user per post)
CREATE TABLE post_likes (
    like_id     SERIAL PRIMARY KEY,
    post_id     INT NOT NULL REFERENCES community_posts(post_id) ON DELETE CASCADE,
    user_id     INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE (post_id, user_id)
);

-- Indexes on FK columns and requested search columns
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at);

CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON user_verifications (user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_reviewed_by ON user_verifications (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON user_verifications (status);
CREATE INDEX IF NOT EXISTS idx_user_verifications_submitted_at ON user_verifications (submitted_at);

CREATE INDEX IF NOT EXISTS idx_safety_alerts_created_by ON safety_alerts (created_by);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_created_at ON safety_alerts (created_at);

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller_id ON marketplace_listings (seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings (status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_created_at ON marketplace_listings (created_at);

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_listing_id ON marketplace_orders (listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer_id ON marketplace_orders (buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_status ON marketplace_orders (status);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_created_at ON marketplace_orders (created_at);

CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_student_id ON maintenance_tickets (student_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_assigned_to ON maintenance_tickets (assigned_to);
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_status ON maintenance_tickets (status);
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_created_at ON maintenance_tickets (created_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_updated_at ON maintenance_tickets (updated_at);

CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls (created_by);
CREATE INDEX IF NOT EXISTS idx_polls_deadline ON polls (deadline);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls (created_at);

CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options (poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes (poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user_id ON poll_votes (user_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_option_id ON poll_votes (option_id);

CREATE INDEX IF NOT EXISTS idx_events_created_by ON events (created_by);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events (created_at);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events (event_date);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps (event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON event_rsvps (user_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_status ON event_rsvps (status);

CREATE INDEX IF NOT EXISTS idx_lost_found_items_posted_by ON lost_found_items (posted_by);
CREATE INDEX IF NOT EXISTS idx_lost_found_items_created_at ON lost_found_items (created_at);
CREATE INDEX IF NOT EXISTS idx_lost_found_items_item_type ON lost_found_items (item_type);

CREATE INDEX IF NOT EXISTS idx_guidebook_entries_created_at ON guidebook_entries (created_at);
CREATE INDEX IF NOT EXISTS idx_guidebook_entries_category ON guidebook_entries (category);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications (is_read);

CREATE INDEX IF NOT EXISTS idx_otp_verifications_email ON otp_verifications (email);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at ON otp_verifications (expires_at);

-- SECTION 3: SAMPLE DATA
INSERT INTO users (user_id, email, student_id, display_name, profile_picture, contact_number, room_number, role, is_verified, is_suspended, password_hash, fcm_token, created_at) VALUES
  (1, 'warden.ahmed@hostelhub.edu.pk', NULL, 'Ahmed Raza', NULL, '+92-300-1112233', 'W-001', 'admin', TRUE, FALSE, '$2b$12$placeholderhashforhostelhub0000000000000000000000000', NULL, '2026-04-01 09:00:00+05'),
  (2, 'sana.malik@hostelhub.edu.pk', NULL, 'Sana Malik', NULL, '+92-301-2223344', 'W-002', 'admin', TRUE, FALSE, '$2b$12$placeholderhashforhostelhub0000000000000000000000001', NULL, '2026-04-02 09:00:00+05'),
  (3, 'bilal.ahmed@university.edu.pk', '2024-BCS-101', 'Bilal Ahmed', NULL, '+92-300-4001122', 'A-101', 'student', TRUE, FALSE, '$2b$12$placeholderhashforhostelhub0000000000000000000000002', NULL, '2026-04-03 10:00:00+05'),
  (4, 'ayesha.siddiqui@university.edu.pk', '2024-BBA-104', 'Ayesha Siddiqui', NULL, '+92-321-5002233', 'A-102', 'student', TRUE, FALSE, '$2b$12$placeholderhashforhostelhub0000000000000000000000003', NULL, '2026-04-03 10:05:00+05'),
  (5, 'hamza.ali@university.edu.pk', '2023-EE-221', 'Hamza Ali', NULL, '+92-333-6003344', 'B-204', 'student', TRUE, FALSE, '$2b$12$placeholderhashforhostelhub0000000000000000000000004', NULL, '2026-04-04 11:00:00+05'),
  (6, 'fatima.noor@university.edu.pk', '2024-ENG-118', 'Fatima Noor', NULL, '+92-315-7004455', 'B-205', 'student', FALSE, FALSE, '$2b$12$placeholderhashforhostelhub0000000000000000000000005', NULL, '2026-04-04 11:10:00+05'),
  (7, 'umar.farooq@university.edu.pk', '2022-CS-087', 'Umar Farooq', NULL, '+92-300-8005566', 'C-307', 'student', TRUE, FALSE, '$2b$12$placeholderhashforhostelhub0000000000000000000000006', NULL, '2026-04-05 12:00:00+05'),
  (8, 'hira.javed@university.edu.pk', '2024-PSY-056', 'Hira Javed', NULL, '+92-322-9006677', 'C-308', 'student', TRUE, FALSE, '$2b$12$placeholderhashforhostelhub0000000000000000000000007', NULL, '2026-04-05 12:05:00+05'),
  (9, 'saad.hasan@university.edu.pk', '2023-ARCH-044', 'Saad Hasan', NULL, '+92-321-1007788', 'D-410', 'student', TRUE, FALSE, '$2b$12$placeholderhashforhostelhub0000000000000000000000008', NULL, '2026-04-06 12:30:00+05'),
  (10, 'zara.nadeem@university.edu.pk', '2024-BA-122', 'Zara Nadeem', NULL, '+92-333-2008899', 'D-411', 'student', TRUE, FALSE, '$2b$12$placeholderhashforhostelhub0000000000000000000000009', NULL, '2026-04-06 12:35:00+05'),
  (11, 'muhammad.usman@university.edu.pk', '2024-CE-144', 'Muhammad Usman', NULL, '+92-304-3009900', 'E-512', 'student', FALSE, FALSE, '$2b$12$placeholderhashforhostelhub0000000000000000000000010', NULL, '2026-04-07 13:00:00+05'),
  (12, 'noor.fatima@university.edu.pk', '2023-MBA-032', 'Noor Fatima', NULL, '+92-305-4001011', 'E-513', 'student', FALSE, FALSE, '$2b$12$placeholderhashforhostelhub0000000000000000000000011', NULL, '2026-04-07 13:10:00+05');

INSERT INTO user_verifications (verification_id, user_id, reviewed_by, status, documents_submitted, remarks, submitted_at, reviewed_at) VALUES
  (1, 3, 1, 'approved', 'CNIC, Admission Slip, Hostel Allotment', 'Verified against university record', '2026-04-03 10:30:00+05', '2026-04-04 09:30:00+05'),
  (2, 4, 1, 'approved', 'CNIC, Student Card', 'All docs clear', '2026-04-03 10:35:00+05', '2026-04-04 09:35:00+05'),
  (3, 5, 2, 'approved', 'CNIC, Fee Receipt', 'Confirmed with dept office', '2026-04-04 11:20:00+05', '2026-04-05 09:10:00+05'),
  (4, 6, NULL, 'pending', 'CNIC, Admission Slip', 'Waiting for fee receipt', '2026-04-04 11:30:00+05', NULL),
  (5, 7, 2, 'approved', 'CNIC, Student Card', 'Verified successfully', '2026-04-05 12:15:00+05', '2026-04-05 17:00:00+05'),
  (6, 8, NULL, 'pending', 'CNIC, Hostel Form', 'Pending review', '2026-04-05 12:20:00+05', NULL),
  (7, 9, 1, 'approved', 'CNIC, Fee Receipt', 'Approved for Block D', '2026-04-06 12:45:00+05', '2026-04-06 18:00:00+05'),
  (8, 10, 1, 'approved', 'CNIC, Student Card', 'Good to go', '2026-04-06 12:50:00+05', '2026-04-06 18:05:00+05'),
  (9, 11, NULL, 'rejected', 'Blurred CNIC scan', 'Please upload a clearer copy', '2026-04-07 13:10:00+05', NULL),
  (10, 12, NULL, 'pending', 'CNIC, Hostel Slip', 'Awaiting admin review', '2026-04-07 13:15:00+05', NULL);

INSERT INTO safety_alerts (alert_id, created_by, title, body, severity, is_active, created_at) VALUES
  (1, 1, 'Block B Water Shutdown', 'Water supply for Block B will be interrupted for 3 hours for pipe maintenance.', 'high', TRUE, '2026-05-08 08:30:00+05'),
  (2, 2, 'Power Check in Dining Hall', 'Dining hall power will be tested this evening. Use alternate charging spots.', 'medium', TRUE, '2026-05-07 17:00:00+05'),
  (3, 1, 'Main Gate Security Drill', 'Security team will conduct a mock drill near the main gate at 6 PM.', 'low', TRUE, '2026-05-06 09:15:00+05'),
  (4, 2, 'Internet Backbone Maintenance', 'Temporary network instability expected for 20 minutes tonight.', 'medium', TRUE, '2026-05-05 15:00:00+05'),
  (5, 1, 'Severe Weather Advisory', 'Heavy rain and wind are expected; avoid standing near boundary walls.', 'critical', TRUE, '2026-05-09 06:15:00+05');

INSERT INTO marketplace_listings (listing_id, seller_id, title, description, price, quantity, category, status, created_at) VALUES
  (1, 3, 'Chicken Biryani Platter', 'Fresh homemade biryani with raita. Best for lunch or dinner.', 450.00, 8, 'Food', 'active', '2026-05-08 12:00:00+05'),
  (2, 4, 'Campus Shuttle Ride', 'Evening ride to university gate and back for urgent errands.', 150.00, 12, 'Services', 'active', '2026-05-08 13:00:00+05'),
  (3, 5, 'Mechanical Engineering Notes Bundle', 'Semester notes, solved problems, and past paper summaries.', 300.00, 5, 'Books', 'active', '2026-05-07 16:00:00+05'),
  (4, 6, 'Laundry Pickup Service', 'Wash, dry, and fold service for weekly laundry.', 600.00, 10, 'Services', 'active', '2026-05-06 14:00:00+05'),
  (5, 7, 'Study Desk with Lamp', 'Compact wooden desk suitable for hostel rooms.', 2500.00, 2, 'Furniture', 'active', '2026-05-05 11:30:00+05'),
  (6, 8, 'Charged Power Bank Rental', '10,000mAh power bank for overnight rental.', 200.00, 4, 'Electronics', 'active', '2026-05-05 18:00:00+05'),
  (7, 9, 'Homemade Nihari', 'Weekend special nihari served with naan.', 500.00, 6, 'Food', 'active', '2026-05-04 20:00:00+05'),
  (8, 10, 'Typing and Formatting Service', 'Assignment formatting in MS Word and APA style.', 350.00, 9, 'Services', 'active', '2026-05-04 09:00:00+05'),
  (9, 11, 'Used Graphing Calculator', 'Fully working calculator, batteries included.', 1800.00, 1, 'Electronics', 'sold', '2026-05-03 15:15:00+05'),
  (10, 12, 'Fresh Fruit Chaat Cups', 'Desi fruit chaat with chaat masala and lemon.', 120.00, 15, 'Food', 'active', '2026-05-02 19:00:00+05');

INSERT INTO marketplace_orders (order_id, listing_id, buyer_id, quantity, status, created_at) VALUES
  (1, 1, 4, 2, 'confirmed', '2026-05-08 13:00:00+05'),
  (2, 1, 5, 1, 'ready', '2026-05-08 13:20:00+05'),
  (3, 2, 3, 2, 'pending', '2026-05-08 14:00:00+05'),
  (4, 3, 4, 1, 'delivered', '2026-05-07 17:00:00+05'),
  (5, 4, 9, 1, 'confirmed', '2026-05-06 15:00:00+05'),
  (6, 5, 6, 1, 'pending', '2026-05-05 12:00:00+05'),
  (7, 6, 10, 1, 'ready', '2026-05-05 19:00:00+05'),
  (8, 7, 3, 3, 'delivered', '2026-05-04 21:00:00+05'),
  (9, 8, 7, 2, 'confirmed', '2026-05-04 10:30:00+05'),
  (10, 10, 11, 4, 'pending', '2026-05-03 20:30:00+05');

INSERT INTO maintenance_tickets (ticket_id, student_id, category, description, room_number, photo_url, status, assigned_to, created_at, updated_at) VALUES
  (1, 3, 'electrical', 'Room light flickers every few minutes.', 'A-101', NULL, 'submitted', NULL, '2026-05-08 08:00:00+05', '2026-05-08 08:00:00+05'),
  (2, 4, 'plumbing', 'Bathroom sink is leaking constantly.', 'A-102', NULL, 'assigned', 1, '2026-05-07 09:00:00+05', '2026-05-07 12:00:00+05'),
  (3, 5, 'it', 'Wi-Fi drops during evening study hours.', 'B-204', NULL, 'in_progress', 2, '2026-04-28 10:00:00+05', '2026-05-01 09:00:00+05'),
  (4, 6, 'cleaning', 'Shared washroom needs deep cleaning.', 'B-205', NULL, 'resolved', 1, '2026-05-02 13:00:00+05', '2026-05-08 16:00:00+05'),
  (5, 7, 'facilities', 'Fan regulator not working properly.', 'C-307', NULL, 'closed', 2, '2026-04-26 14:00:00+05', '2026-05-05 10:00:00+05'),
  (6, 8, 'electrical', 'Charging socket sparks when plugged in.', 'C-308', NULL, 'assigned', 1, '2026-05-06 08:30:00+05', '2026-05-06 10:00:00+05'),
  (7, 9, 'plumbing', 'Water pressure is very low in the evening.', 'D-410', NULL, 'submitted', NULL, '2026-05-07 11:00:00+05', '2026-05-07 11:00:00+05'),
  (8, 10, 'it', 'Printer in the study room is jammed.', 'D-411', NULL, 'in_progress', 2, '2026-04-30 15:00:00+05', '2026-05-01 15:00:00+05'),
  (9, 11, 'security', 'Main door lock is loose at night.', 'E-512', NULL, 'resolved', 1, '2026-05-01 18:00:00+05', '2026-05-08 09:00:00+05'),
  (10, 12, 'electrical', 'AC remote is not responding.', 'E-513', NULL, 'submitted', NULL, '2026-05-08 19:00:00+05', '2026-05-08 19:00:00+05');

INSERT INTO polls (poll_id, created_by, question, deadline, created_at) VALUES
  (1, 1, 'Best time for hostel mess dinner?', '2026-05-20 20:00:00+05', '2026-05-09 10:00:00+05'),
  (2, 2, 'Which event should we host next month?', '2026-05-18 18:00:00+05', '2026-05-09 11:00:00+05'),
  (3, 1, 'Preferred study hours in the library?', '2026-05-22 23:59:00+05', '2026-05-09 12:00:00+05');

INSERT INTO poll_options (option_id, poll_id, option_text, display_order) VALUES
  (1, 1, '6:00 PM', 1),
  (2, 1, '7:00 PM', 2),
  (3, 1, '8:00 PM', 3),
  (4, 1, '9:00 PM', 4),
  (5, 2, 'Eid Dinner', 1),
  (6, 2, 'Fresher''s Welcome', 2),
  (7, 2, 'Cricket Screening Night', 3),
  (8, 2, 'Qawwali Night', 4),
  (9, 3, 'Morning', 1),
  (10, 3, 'Afternoon', 2),
  (11, 3, 'Late Night', 3);

INSERT INTO poll_votes (vote_id, poll_id, user_id, option_id, voted_at) VALUES
  (1, 1, 3, 2, '2026-05-09 12:15:00+05'),
  (2, 1, 4, 3, '2026-05-09 12:16:00+05'),
  (3, 1, 5, 3, '2026-05-09 12:18:00+05'),
  (4, 1, 6, 4, '2026-05-09 12:20:00+05'),
  (5, 1, 7, 2, '2026-05-09 12:25:00+05'),
  (6, 1, 8, 3, '2026-05-09 12:27:00+05'),
  (7, 1, 9, 2, '2026-05-09 12:30:00+05'),
  (8, 1, 10, 3, '2026-05-09 12:31:00+05'),
  (9, 1, 11, 2, '2026-05-09 12:35:00+05'),
  (10, 1, 12, 3, '2026-05-09 12:36:00+05'),
  (11, 2, 3, 6, '2026-05-09 13:00:00+05'),
  (12, 2, 4, 5, '2026-05-09 13:05:00+05'),
  (13, 2, 5, 7, '2026-05-09 13:10:00+05'),
  (14, 2, 6, 6, '2026-05-09 13:15:00+05'),
  (15, 2, 7, 8, '2026-05-09 13:18:00+05'),
  (16, 2, 8, 5, '2026-05-09 13:20:00+05'),
  (17, 2, 9, 6, '2026-05-09 13:22:00+05'),
  (18, 2, 10, 8, '2026-05-09 13:25:00+05'),
  (19, 2, 11, 6, '2026-05-09 13:26:00+05'),
  (20, 2, 12, 5, '2026-05-09 13:28:00+05'),
  (21, 3, 3, 11, '2026-05-09 13:40:00+05'),
  (22, 3, 4, 10, '2026-05-09 13:41:00+05'),
  (23, 3, 5, 11, '2026-05-09 13:42:00+05'),
  (24, 3, 6, 9, '2026-05-09 13:43:00+05'),
  (25, 3, 7, 11, '2026-05-09 13:44:00+05'),
  (26, 3, 8, 10, '2026-05-09 13:45:00+05'),
  (27, 3, 9, 11, '2026-05-09 13:46:00+05'),
  (28, 3, 10, 10, '2026-05-09 13:47:00+05'),
  (29, 3, 11, 11, '2026-05-09 13:48:00+05'),
  (30, 3, 12, 9, '2026-05-09 13:49:00+05');

INSERT INTO events (event_id, created_by, title, description, event_date, location, banner_image, created_at) VALUES
  (1, 1, 'Eid Dinner', 'A community dinner to celebrate Eid with all hostel residents.', '2026-06-05 20:00:00+05', 'Main Dining Hall', NULL, '2026-05-09 09:00:00+05'),
  (2, 2, 'Fresher''s Welcome', 'Welcome evening for new residents with introductions and games.', '2026-05-18 18:30:00+05', 'Block A Lawn', NULL, '2026-05-09 09:15:00+05'),
  (3, 1, 'Cricket Screening Night', 'Screening of the big match in the common lounge.', '2026-05-24 19:30:00+05', 'Common Lounge', NULL, '2026-05-09 09:30:00+05'),
  (4, 2, 'Study Marathon', 'Quiet group study session before finals with snacks and support.', '2026-05-27 16:00:00+05', 'Library Hall', NULL, '2026-05-09 09:45:00+05'),
  (5, 1, 'Qawwali Night', 'An evening of live qawwali performance and tea.', '2026-06-01 19:00:00+05', 'Courtyard Stage', NULL, '2026-05-09 10:00:00+05'),
  (6, 2, 'Blood Donation Drive', 'Campus health team will be available for voluntary donations.', '2026-05-29 10:00:00+05', 'Medical Wing', NULL, '2026-05-09 10:15:00+05'),
  (7, 1, 'Career Talk with Alumni', 'Alumni from software and finance fields will guide students.', '2026-06-08 15:00:00+05', 'Seminar Hall', NULL, '2026-05-09 10:30:00+05'),
  (8, 2, 'Ramzan Sehri Meetup', 'Early morning sehri meetup for residents in Ramadan.', '2026-05-15 03:30:00+05', 'Mess Terrace', NULL, '2026-05-09 10:45:00+05'),
  (9, 1, 'Volunteer Cleanup Drive', 'Hostel-wide cleanup around the grounds and parking area.', '2026-05-31 09:00:00+05', 'Hostel Grounds', NULL, '2026-05-09 11:00:00+05'),
  (10, 2, 'Desi Food Fair', 'Residents bring homemade food for a charity-style fair.', '2026-06-12 17:30:00+05', 'Central Courtyard', NULL, '2026-05-09 11:15:00+05');

INSERT INTO event_rsvps (rsvp_id, event_id, user_id, status) VALUES
  (1, 1, 3, 'going'),
  (2, 1, 4, 'maybe'),
  (3, 1, 5, 'going'),
  (4, 2, 6, 'going'),
  (5, 2, 7, 'going'),
  (6, 2, 8, 'not_going'),
  (7, 3, 9, 'going'),
  (8, 3, 10, 'maybe'),
  (9, 4, 11, 'going'),
  (10, 4, 12, 'maybe'),
  (11, 5, 3, 'going'),
  (12, 6, 4, 'going'),
  (13, 7, 5, 'maybe'),
  (14, 8, 6, 'going'),
  (15, 9, 7, 'going'),
  (16, 10, 8, 'not_going');

INSERT INTO lost_found_items (item_id, posted_by, item_type, description, location_tag, item_date, image_url, is_anonymous, is_archived, created_at) VALUES
  (1, 3, 'lost', 'Black wallet with student ID and cafeteria card.', 'Block A stairwell', '2026-05-08', NULL, FALSE, FALSE, '2026-05-08 18:00:00+05'),
  (2, 4, 'found', 'Set of keys with a green keychain.', 'Mess entrance', '2026-05-07', NULL, TRUE, FALSE, '2026-05-07 17:00:00+05'),
  (3, 5, 'lost', 'Blue water bottle with name sticker.', 'Study Hall B', '2026-05-06', NULL, FALSE, FALSE, '2026-05-06 12:00:00+05'),
  (4, 6, 'found', 'Umbrella left near reception.', 'Reception desk', '2026-05-05', NULL, TRUE, FALSE, '2026-05-05 15:00:00+05'),
  (5, 7, 'lost', 'Calculus notebook with pink cover.', 'Library table 4', '2026-05-04', NULL, FALSE, FALSE, '2026-05-04 11:00:00+05'),
  (6, 8, 'found', 'Spectacles case found in laundry room.', 'Laundry room', '2026-04-01', NULL, FALSE, TRUE, '2026-04-01 10:00:00+05'),
  (7, 9, 'lost', 'Grey hoodie with hostel badge.', 'Common lounge', '2026-04-03', NULL, TRUE, TRUE, '2026-04-03 12:00:00+05'),
  (8, 10, 'found', 'Earphones in a white pouch.', 'Gym area', '2026-05-02', NULL, FALSE, FALSE, '2026-05-02 19:00:00+05'),
  (9, 11, 'lost', 'Scientific calculator with broken corner.', 'Computer lab', '2026-05-01', NULL, FALSE, FALSE, '2026-05-01 09:30:00+05'),
  (10, 12, 'found', 'Prayer cap near the mosque entrance.', 'Mosque steps', '2026-04-20', NULL, TRUE, TRUE, '2026-04-20 08:00:00+05');

INSERT INTO guidebook_entries (entry_id, title, content, category, created_at, updated_at) VALUES
  (1, 'Quiet Hours Policy', 'Quiet hours run from 10 PM to 7 AM across all hostel blocks.', 'rules', '2026-05-01 10:00:00+05', '2026-05-08 10:00:00+05'),
  (2, 'Guest Entry Rules', 'Guests must be registered at reception before entering residential blocks.', 'rules', '2026-05-01 10:05:00+05', '2026-05-08 10:05:00+05'),
  (3, 'Laundry Timings', 'Laundry machines are available between 8 AM and 9 PM only.', 'rules', '2026-05-01 10:10:00+05', '2026-05-08 10:10:00+05'),
  (4, 'Wi-Fi Access', 'Use your hostel credentials for device registration and support.', 'faqs', '2026-05-01 10:15:00+05', '2026-05-08 10:15:00+05'),
  (5, 'Mess Schedule', 'Breakfast, lunch, and dinner timings are posted weekly in the mess notice board.', 'faqs', '2026-05-01 10:20:00+05', '2026-05-08 10:20:00+05'),
  (6, 'Complaint Process', 'Submit maintenance complaints through the resident portal or front desk.', 'faqs', '2026-05-01 10:25:00+05', '2026-05-08 10:25:00+05'),
  (7, 'Warden Office', 'Warden office contact: +92-300-1112233, available 9 AM to 6 PM.', 'emergency_contacts', '2026-05-01 10:30:00+05', '2026-05-08 10:30:00+05'),
  (8, 'Security Desk', 'Security desk contact: +92-301-2223344, available 24/7.', 'emergency_contacts', '2026-05-01 10:35:00+05', '2026-05-08 10:35:00+05'),
  (9, 'Medical Help', 'Nearest clinic contact: +92-321-5557788 for urgent hostel medical issues.', 'emergency_contacts', '2026-05-01 10:40:00+05', '2026-05-08 10:40:00+05'),
  (10, 'Fire Safety', 'Know the nearest staircase, fire extinguisher, and assembly point in each block.', 'rules', '2026-05-01 10:45:00+05', '2026-05-08 10:45:00+05');

INSERT INTO notifications (notification_id, user_id, title, body, is_read, created_at) VALUES
  (1, 3, 'Ticket #1 Received', 'Your maintenance request has been submitted successfully.', FALSE, '2026-05-08 08:05:00+05'),
  (2, 4, 'Verification Approved', 'Your student profile has been approved by the admin team.', TRUE, '2026-04-04 09:40:00+05'),
  (3, 5, 'Order Confirmed', 'Your biryani order has been confirmed by the seller.', FALSE, '2026-05-08 13:25:00+05'),
  (4, 6, 'Poll Reminder', 'The dinner timing poll is still open. Cast your vote before deadline.', FALSE, '2026-05-09 12:00:00+05'),
  (5, 7, 'Event RSVP Updated', 'You are marked going for the Fresher''s Welcome event.', TRUE, '2026-05-09 09:00:00+05'),
  (6, 8, 'Marketplace Delivery', 'Your order is ready for collection at the reception.', FALSE, '2026-05-05 19:15:00+05'),
  (7, 9, 'Ticket Assigned', 'Your plumbing ticket has been assigned to the maintenance team.', TRUE, '2026-05-07 12:10:00+05'),
  (8, 10, 'Safety Alert', 'A new hostel-wide safety alert has been posted by the warden.', FALSE, '2026-05-08 08:35:00+05'),
  (9, 11, 'Lost Item Found', 'A found item matching your description was posted today.', FALSE, '2026-05-02 19:30:00+05'),
  (10, 12, 'Guidebook Updated', 'The hostel rules and emergency contacts were updated.', TRUE, '2026-05-08 11:00:00+05');

INSERT INTO otp_verifications (otp_id, email, otp_code, expires_at, is_used) VALUES
  (1, 'bilal.ahmed@university.edu.pk', '184562', '2026-05-09 14:00:00+05', TRUE),
  (2, 'ayesha.siddiqui@university.edu.pk', '472910', '2026-05-09 14:05:00+05', FALSE),
  (3, 'fatima.noor@university.edu.pk', '906144', '2026-05-09 14:10:00+05', FALSE);

-- Sample community posts (assumes user_ids 1-5 exist)
INSERT INTO community_posts (user_id, content) VALUES
(1, 'Anyone else think the wifi in Block B has been unusually fast this week?'),
(2, 'Lost my blue water bottle near the study room. Please let me know if you find it!'),
(3, 'Cooking pasta tonight, made too much. First come first served at Room A-204 😄'),
(4, 'Reminder: the common room TV is for everyone. Please don''t leave it on overnight.'),
(5, 'Does anyone have a voltmeter I can borrow for a lab tomorrow?'),
(1, 'The new vending machine on Floor 3 actually has decent snacks. 10/10 recommend.'),
(2, 'Study group for Thursday finals — anyone interested? Drop a comment!'),
(3, 'Heads up: hot water might be off tomorrow morning for maintenance.'),
(4, 'Just listed some textbooks on the marketplace if anyone needs them for next sem.'),
(5, 'Can we get a whiteboard in the common room? Would be super useful for announcements.');

-- Sample likes
INSERT INTO post_likes (post_id, user_id) VALUES
(1, 2), (1, 3), (1, 4),
(2, 1), (2, 5),
(3, 1), (3, 2), (3, 4), (3, 5),
(4, 3), (4, 1),
(5, 2), (5, 3),
(6, 4), (6, 5), (6, 1),
(7, 2), (7, 3), (7, 4),
(8, 1), (8, 5),
(9, 3), (9, 2),
(10, 1), (10, 4);

-- Reset serial sequences after explicit sample IDs
SELECT setval(pg_get_serial_sequence('users', 'user_id'), (SELECT MAX(user_id) FROM users));
SELECT setval(pg_get_serial_sequence('user_verifications', 'verification_id'), (SELECT MAX(verification_id) FROM user_verifications));
SELECT setval(pg_get_serial_sequence('safety_alerts', 'alert_id'), (SELECT MAX(alert_id) FROM safety_alerts));
SELECT setval(pg_get_serial_sequence('marketplace_listings', 'listing_id'), (SELECT MAX(listing_id) FROM marketplace_listings));
SELECT setval(pg_get_serial_sequence('marketplace_orders', 'order_id'), (SELECT MAX(order_id) FROM marketplace_orders));
SELECT setval(pg_get_serial_sequence('maintenance_tickets', 'ticket_id'), (SELECT MAX(ticket_id) FROM maintenance_tickets));
SELECT setval(pg_get_serial_sequence('polls', 'poll_id'), (SELECT MAX(poll_id) FROM polls));
SELECT setval(pg_get_serial_sequence('poll_options', 'option_id'), (SELECT MAX(option_id) FROM poll_options));
SELECT setval(pg_get_serial_sequence('poll_votes', 'vote_id'), (SELECT MAX(vote_id) FROM poll_votes));
SELECT setval(pg_get_serial_sequence('events', 'event_id'), (SELECT MAX(event_id) FROM events));
SELECT setval(pg_get_serial_sequence('event_rsvps', 'rsvp_id'), (SELECT MAX(rsvp_id) FROM event_rsvps));
SELECT setval(pg_get_serial_sequence('lost_found_items', 'item_id'), (SELECT MAX(item_id) FROM lost_found_items));
SELECT setval(pg_get_serial_sequence('guidebook_entries', 'entry_id'), (SELECT MAX(entry_id) FROM guidebook_entries));
SELECT setval(pg_get_serial_sequence('notifications', 'notification_id'), (SELECT MAX(notification_id) FROM notifications));
SELECT setval(pg_get_serial_sequence('otp_verifications', 'otp_id'), (SELECT MAX(otp_id) FROM otp_verifications));

-- SECTION 4: SQL QUERIES (commented, for demonstration)

-- 1. SELECT with WHERE, GROUP BY, HAVING, ORDER BY
-- Active listings grouped by category, average price per category,
-- only categories with more than 2 listings, ordered by avg price DESC
-- SELECT
--   category,
--   COUNT(*) AS listing_count,
--   ROUND(AVG(price), 2) AS avg_price
-- FROM marketplace_listings
-- WHERE status = 'active'
-- GROUP BY category
-- HAVING COUNT(*) > 2
-- ORDER BY avg_price DESC;

-- 2. INNER JOIN
-- Orders with listing title, buyer display_name, seller display_name,
-- and order status
-- SELECT
--   o.order_id,
--   l.title AS listing_title,
--   buyer.display_name AS buyer_display_name,
--   seller.display_name AS seller_display_name,
--   o.status
-- FROM marketplace_orders o
-- INNER JOIN marketplace_listings l ON o.listing_id = l.listing_id
-- INNER JOIN users buyer ON o.buyer_id = buyer.user_id
-- INNER JOIN users seller ON l.seller_id = seller.user_id;

-- 3. LEFT JOIN
-- All students with their total ticket count (include students
-- with zero tickets)
-- SELECT
--   u.user_id,
--   u.display_name,
--   COUNT(t.ticket_id) AS total_tickets
-- FROM users u
-- LEFT JOIN maintenance_tickets t ON u.user_id = t.student_id
-- WHERE u.role = 'student'
-- GROUP BY u.user_id, u.display_name
-- ORDER BY total_tickets DESC, u.display_name;

-- 4. RIGHT JOIN
-- All maintenance tickets with assigned staff name
-- (include unassigned tickets)
-- SELECT
--   t.ticket_id,
--   t.category,
--   t.status,
--   staff.display_name AS assigned_staff_name
-- FROM users staff
-- RIGHT JOIN maintenance_tickets t ON staff.user_id = t.assigned_to;

-- 5. FULL OUTER JOIN
-- Events and RSVPs showing all events and all RSVP responses
-- SELECT
--   e.event_id,
--   e.title,
--   r.user_id,
--   r.status AS rsvp_status
-- FROM events e
-- FULL OUTER JOIN event_rsvps r ON e.event_id = r.event_id;

-- 6. Correlated subquery
-- Students who have placed more orders than the average
-- number of orders per student
-- SELECT
--   u.user_id,
--   u.display_name,
--   COUNT(o.order_id) AS orders_placed
-- FROM users u
-- LEFT JOIN marketplace_orders o ON u.user_id = o.buyer_id
-- WHERE u.role = 'student'
-- GROUP BY u.user_id, u.display_name
-- HAVING COUNT(o.order_id) > (
--   SELECT AVG(student_order_count)
--   FROM (
--     SELECT COUNT(*) AS student_order_count
--     FROM marketplace_orders mo
--     JOIN users us ON mo.buyer_id = us.user_id
--     WHERE us.role = 'student'
--     GROUP BY mo.buyer_id
--   ) AS avg_orders
-- );

-- 7. Non-correlated subquery
-- Listings priced above the overall average listing price
-- SELECT *
-- FROM marketplace_listings
-- WHERE price > (SELECT AVG(price) FROM marketplace_listings);

-- 8. Aggregate functions
-- COUNT, SUM, AVG, MIN, MAX on orders and prices per student
-- SELECT
--   u.user_id,
--   u.display_name,
--   COUNT(o.order_id) AS order_count,
--   SUM(l.price * o.quantity) AS total_spent,
--   AVG(l.price) AS avg_listing_price,
--   MIN(l.price) AS min_listing_price,
--   MAX(l.price) AS max_listing_price
-- FROM users u
-- LEFT JOIN marketplace_orders o ON u.user_id = o.buyer_id
-- LEFT JOIN marketplace_listings l ON o.listing_id = l.listing_id
-- WHERE u.role = 'student'
-- GROUP BY u.user_id, u.display_name;

-- SECTION 5: STORED PROCEDURES

CREATE OR REPLACE FUNCTION register_user(
  p_email TEXT,
  p_student_id TEXT,
  p_display_name TEXT,
  p_password_hash TEXT,
  p_room_number TEXT
)
RETURNS TABLE(user_id INT, result TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id INT;
  v_otp_code TEXT;
BEGIN
  BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
      RAISE EXCEPTION 'Email already registered';
    END IF;

    IF p_student_id IS NOT NULL AND EXISTS (SELECT 1 FROM users WHERE student_id = p_student_id) THEN
      RAISE EXCEPTION 'Student ID already taken';
    END IF;

    INSERT INTO users (email, student_id, display_name, room_number, password_hash)
    VALUES (p_email, p_student_id, p_display_name, p_room_number, p_password_hash)
    RETURNING users.user_id INTO v_user_id;

    v_otp_code := LPAD((FLOOR(RANDOM() * 1000000))::TEXT, 6, '0');

    INSERT INTO otp_verifications (email, otp_code, expires_at, is_used)
    VALUES (p_email, v_otp_code, NOW() + INTERVAL '5 minutes', FALSE);

    RETURN QUERY SELECT v_user_id, 'SUCCESS';
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT NULL::INT, SQLERRM;
  END;
END;
$$;

CREATE OR REPLACE FUNCTION update_ticket_status(
  p_ticket_id INT,
  p_new_status ticket_status,
  p_admin_id INT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_status ticket_status;
  v_student_id INT;
  v_admin_role user_role;
BEGIN
  BEGIN
    SELECT status, student_id
    INTO v_current_status, v_student_id
    FROM maintenance_tickets
    WHERE ticket_id = p_ticket_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Maintenance ticket not found';
    END IF;

    SELECT role INTO v_admin_role
    FROM users
    WHERE user_id = p_admin_id;

    IF NOT FOUND OR v_admin_role <> 'admin' THEN
      RAISE EXCEPTION 'Only admin users can update ticket status';
    END IF;

    IF NOT (
      (v_current_status = 'submitted' AND p_new_status = 'assigned') OR
      (v_current_status = 'assigned' AND p_new_status = 'in_progress') OR
      (v_current_status = 'in_progress' AND p_new_status = 'resolved') OR
      (v_current_status = 'resolved' AND p_new_status = 'closed')
    ) THEN
      RAISE EXCEPTION 'Illegal ticket status transition from % to %', v_current_status, p_new_status;
    END IF;

    PERFORM set_config('hostelhub.skip_ticket_notification', 'on', TRUE);

    UPDATE maintenance_tickets
    SET status = p_new_status,
        updated_at = NOW(),
        assigned_to = COALESCE(assigned_to, p_admin_id)
    WHERE ticket_id = p_ticket_id;

    INSERT INTO notifications (user_id, title, body, is_read)
    VALUES (
      v_student_id,
      'Ticket Status Updated',
      'Your ticket #' || p_ticket_id || ' status has been updated to: ' || p_new_status,
      FALSE
    );

    RETURN 'SUCCESS';
  EXCEPTION
    WHEN OTHERS THEN
      RETURN SQLERRM;
  END;
END;
$$;

CREATE OR REPLACE FUNCTION place_order(
  p_listing_id INT,
  p_buyer_id INT,
  p_quantity INT
)
RETURNS TABLE(order_id INT, result TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id INT;
  v_seller_id INT;
  v_available INT;
BEGIN
  SELECT seller_id, quantity INTO v_seller_id, v_available
  FROM marketplace_listings
  WHERE listing_id = p_listing_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::INT, 'Listing not found or inactive';
    RETURN;
  END IF;

  IF v_seller_id = p_buyer_id THEN
    RETURN QUERY SELECT NULL::INT, 'Seller cannot place an order on their own listing';
    RETURN;
  END IF;

  IF p_quantity > v_available THEN
    RETURN QUERY SELECT NULL::INT, 'Insufficient quantity available';
    RETURN;
  END IF;

  INSERT INTO marketplace_orders (listing_id, buyer_id, quantity, status)
  VALUES (p_listing_id, p_buyer_id, p_quantity, 'pending')
  RETURNING marketplace_orders.order_id INTO v_order_id;

  UPDATE marketplace_listings
  SET quantity = quantity - p_quantity,
      status = CASE WHEN quantity - p_quantity <= 0 THEN 'sold' ELSE status END
  WHERE listing_id = p_listing_id;

  RETURN QUERY SELECT v_order_id, 'SUCCESS'::TEXT;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT NULL::INT, SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION cast_vote(
  p_poll_id INT,
  p_user_id INT,
  p_option_id INT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_deadline TIMESTAMPTZ;
BEGIN
  BEGIN
    SELECT deadline INTO v_deadline
    FROM polls
    WHERE poll_id = p_poll_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Poll not found';
    END IF;

    IF v_deadline <= NOW() THEN
      RAISE EXCEPTION 'Poll deadline has already passed';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM poll_options
      WHERE poll_id = p_poll_id
        AND option_id = p_option_id
    ) THEN
      RAISE EXCEPTION 'Selected option does not belong to this poll';
    END IF;

    INSERT INTO poll_votes (poll_id, user_id, option_id)
    VALUES (p_poll_id, p_user_id, p_option_id);

    RETURN 'SUCCESS';
  EXCEPTION
    WHEN unique_violation THEN
      RETURN 'You have already voted in this poll';
    WHEN OTHERS THEN
      RETURN SQLERRM;
  END;
END;
$$;

-- SECTION 6: FUNCTIONS (returning computed values)

CREATE OR REPLACE FUNCTION get_poll_percentage(p_poll_id INT, p_option_id INT)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_votes INT;
  v_option_votes INT;
BEGIN
  SELECT COUNT(*) INTO v_total_votes
  FROM poll_votes
  WHERE poll_id = p_poll_id;

  IF v_total_votes = 0 THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*) INTO v_option_votes
  FROM poll_votes
  WHERE poll_id = p_poll_id
    AND option_id = p_option_id;

  RETURN ROUND((v_option_votes::NUMERIC / v_total_votes::NUMERIC) * 100, 2);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$;

CREATE OR REPLACE FUNCTION get_student_order_count(p_user_id INT)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_count INT;
BEGIN
  SELECT COUNT(*) INTO v_order_count
  FROM marketplace_orders
  WHERE buyer_id = p_user_id;

  RETURN COALESCE(v_order_count, 0);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$;

CREATE OR REPLACE FUNCTION is_item_archived(p_item_id INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_created_at TIMESTAMPTZ;
  v_is_archived BOOLEAN;
BEGIN
  SELECT created_at, is_archived
  INTO v_created_at, v_is_archived
  FROM lost_found_items
  WHERE item_id = p_item_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  RETURN COALESCE(v_is_archived, FALSE) OR v_created_at < NOW() - INTERVAL '30 days';
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- SECTION 7: TRIGGERS

CREATE OR REPLACE FUNCTION fn_ticket_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    IF current_setting('hostelhub.skip_ticket_notification', TRUE) = 'on' THEN
      RETURN NEW;
    END IF;

    INSERT INTO notifications (user_id, title, body, is_read)
    VALUES (
      NEW.student_id,
      'Ticket Status Updated',
      'Your ticket #' || NEW.ticket_id || ' status has been updated to: ' || NEW.status,
      FALSE
    );

    RETURN NEW;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to create ticket notification: %', SQLERRM;
  END;
END;
$$;

CREATE TRIGGER trg_ticket_notification
AFTER UPDATE ON maintenance_tickets
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION fn_ticket_notification();

CREATE OR REPLACE FUNCTION fn_prevent_self_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_seller_id INT;
BEGIN
  BEGIN
    SELECT seller_id INTO v_seller_id
    FROM marketplace_listings
    WHERE listing_id = NEW.listing_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Marketplace listing not found';
    END IF;

    IF v_seller_id = NEW.buyer_id THEN
      RAISE EXCEPTION 'Buyer cannot purchase their own listing';
    END IF;

    RETURN NEW;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE;
  END;
END;
$$;

CREATE TRIGGER trg_prevent_self_order
BEFORE INSERT ON marketplace_orders
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_self_order();

CREATE OR REPLACE FUNCTION fn_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to refresh updated_at: %', SQLERRM;
  END;
END;
$$;

CREATE TRIGGER trg_updated_at
BEFORE UPDATE ON maintenance_tickets
FOR EACH ROW
EXECUTE FUNCTION fn_updated_at();

CREATE TRIGGER trg_updated_at
BEFORE UPDATE ON guidebook_entries
FOR EACH ROW
EXECUTE FUNCTION fn_updated_at();

CREATE OR REPLACE FUNCTION fn_auto_archive_items()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    IF NEW.created_at < NOW() - INTERVAL '30 days' THEN
      NEW.is_archived := TRUE;
    END IF;

    RETURN NEW;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to auto-archive lost/found item: %', SQLERRM;
  END;
END;
$$;

CREATE TRIGGER trg_auto_archive_items
BEFORE INSERT OR UPDATE ON lost_found_items
FOR EACH ROW
EXECUTE FUNCTION fn_auto_archive_items();

-- SECTION 8: EXPLICIT CURSOR
DO $$
DECLARE
  cur_overdue CURSOR FOR
    SELECT t.ticket_id, u.display_name, t.room_number,
           t.category, NOW() - t.updated_at AS time_in_progress
    FROM maintenance_tickets t
    JOIN users u ON t.student_id = u.user_id
    WHERE t.status = 'in_progress'
      AND t.updated_at < NOW() - INTERVAL '7 days';
  rec RECORD;
BEGIN
  OPEN cur_overdue;
  LOOP
    FETCH cur_overdue INTO rec;
    EXIT WHEN NOT FOUND;
    RAISE NOTICE 'OVERDUE TICKET #% | Student: % | Room: % | Category: % | Days in progress: %',
      rec.ticket_id, rec.display_name, rec.room_number,
      rec.category, EXTRACT(DAY FROM rec.time_in_progress);
  END LOOP;
  CLOSE cur_overdue;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error processing overdue tickets: %', SQLERRM;
END;
$$;

-- Trigger to notify post author when someone likes their post
CREATE OR REPLACE FUNCTION trg_notify_post_like_fn()
RETURNS TRIGGER AS $$
DECLARE
    v_author_id INT;
    v_liker_name VARCHAR;
BEGIN
    SELECT user_id INTO v_author_id FROM community_posts WHERE post_id = NEW.post_id;
    SELECT display_name INTO v_liker_name FROM users WHERE user_id = NEW.user_id;
    
    -- Don't notify if you like your own post
    IF v_author_id != NEW.user_id THEN
        INSERT INTO notifications (user_id, title, body, is_read)
        VALUES (v_author_id, 'New Like', v_liker_name || ' liked your post.', FALSE);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_post_like
AFTER INSERT ON post_likes
FOR EACH ROW EXECUTE FUNCTION trg_notify_post_like_fn();