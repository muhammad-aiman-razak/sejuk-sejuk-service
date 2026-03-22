-- ============================================================
-- Sejuk Sejuk Service - Supabase Migration (v2)
-- Normalized by business domain / actor responsibility
-- Run in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================


-- ==================== ENUMS ====================

CREATE TYPE user_role AS ENUM ('admin', 'technician', 'manager');

CREATE TYPE order_status AS ENUM (
  'new', 'assigned', 'in_progress', 'job_done', 'reviewed', 'closed'
);

CREATE TYPE file_type AS ENUM ('photo', 'video', 'pdf');

CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'card', 'ewallet');


-- ==================== TABLES ====================

-- ---- Reference data ----

CREATE TABLE technicians (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  phone       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE service_types (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  default_price NUMERIC(10,2),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT UNIQUE,
  role            user_role NOT NULL,
  technician_id   UUID REFERENCES technicians(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_technician_link CHECK (
    (role = 'technician' AND technician_id IS NOT NULL) OR
    (role != 'technician' AND technician_id IS NULL)
  )
);


-- ---- Admin domain: order creation ----

CREATE TABLE orders (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no                TEXT NOT NULL UNIQUE,
  customer_name           TEXT NOT NULL,
  customer_phone          TEXT NOT NULL,
  address                 TEXT NOT NULL,
  problem_description     TEXT NOT NULL,
  service_type_id         UUID NOT NULL REFERENCES service_types(id),
  quoted_price            NUMERIC(10,2) NOT NULL DEFAULT 0,
  assigned_technician_id  UUID REFERENCES technicians(id),
  admin_notes             TEXT,
  status                  order_status NOT NULL DEFAULT 'new',
  scheduled_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ---- Technician domain: service completion ----

CREATE TABLE service_reports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
  work_done           TEXT NOT NULL,
  extra_charges       NUMERIC(10,2) NOT NULL DEFAULT 0,
  remarks             TEXT,
  completed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE service_attachments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_report_id   UUID NOT NULL REFERENCES service_reports(id) ON DELETE CASCADE,
  file_url            TEXT NOT NULL,
  file_type           file_type NOT NULL DEFAULT 'photo',
  original_name       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE service_payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_report_id   UUID NOT NULL REFERENCES service_reports(id) ON DELETE CASCADE UNIQUE,
  amount              NUMERIC(10,2) NOT NULL,
  method              payment_method NOT NULL DEFAULT 'cash',
  receipt_url         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ---- Manager domain: review ----

CREATE TABLE order_reviews (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
  reviewed_by         UUID NOT NULL REFERENCES users(id),
  review_notes        TEXT,
  reviewed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ---- Cross-cutting: traceability ----

CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  action          TEXT NOT NULL,
  old_value       TEXT,
  new_value       TEXT,
  performed_by    UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ---- Scheduling domain: schedule history ----

CREATE TABLE order_schedules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  scheduled_at      TIMESTAMPTZ NOT NULL,
  rescheduled_from  TIMESTAMPTZ,
  reason            TEXT,
  created_by        UUID NOT NULL REFERENCES users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ==================== INDEXES ====================

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_technician ON orders(assigned_technician_id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_order_no ON orders(order_no);
CREATE INDEX idx_service_reports_order ON service_reports(order_id);
CREATE INDEX idx_service_attachments_report ON service_attachments(service_report_id);
CREATE INDEX idx_order_reviews_order ON order_reviews(order_id);
CREATE INDEX idx_audit_order ON audit_logs(order_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_orders_scheduled ON orders(scheduled_at);
CREATE INDEX idx_order_schedules_order ON order_schedules(order_id);
CREATE INDEX idx_order_schedules_created ON order_schedules(created_at DESC);


-- ==================== FUNCTIONS ====================

-- Auto-generate order number: ORD-YYYYMMDD-XXXX
CREATE OR REPLACE FUNCTION generate_order_no()
RETURNS TRIGGER AS $$
DECLARE
  today_prefix TEXT;
  seq_num INTEGER;
BEGIN
  today_prefix := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-';

  SELECT COALESCE(
    MAX(CAST(SUBSTRING(order_no FROM LENGTH(today_prefix) + 1) AS INTEGER)),
    0
  ) + 1
  INTO seq_num
  FROM orders
  WHERE order_no LIKE today_prefix || '%';

  NEW.order_no := today_prefix || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_no
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_no IS NULL OR NEW.order_no = '')
  EXECUTE FUNCTION generate_order_no();

-- Auto-update updated_at on orders
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_updated
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();


-- ==================== VIEWS ====================

-- Full order view (joins all domains for read queries, dashboards, AI module)
CREATE OR REPLACE VIEW order_details AS
SELECT
  o.id,
  o.order_no,
  o.customer_name,
  o.customer_phone,
  o.address,
  o.problem_description,
  st.name                   AS service_type,
  o.quoted_price,
  t.name                    AS technician_name,
  t.id                      AS technician_id,
  o.admin_notes,
  o.status,
  o.scheduled_at,
  o.created_at,
  o.updated_at,
  sr.work_done,
  sr.extra_charges,
  sr.remarks                AS technician_remarks,
  sr.completed_at,
  (o.quoted_price + COALESCE(sr.extra_charges, 0)) AS final_amount,
  rv.reviewed_by,
  rv_user.name              AS reviewer_name,
  rv.review_notes,
  rv.reviewed_at,
  sp.amount                 AS payment_amount,
  sp.method                 AS payment_method,
  COALESCE(osc.reschedule_count, 0) AS reschedule_count
FROM orders o
LEFT JOIN service_types st ON st.id = o.service_type_id
LEFT JOIN technicians t    ON t.id  = o.assigned_technician_id
LEFT JOIN service_reports sr ON sr.order_id = o.id
LEFT JOIN order_reviews rv ON rv.order_id = o.id
LEFT JOIN users rv_user    ON rv_user.id = rv.reviewed_by
LEFT JOIN service_payments sp ON sp.service_report_id = sr.id
LEFT JOIN (
  SELECT order_id, COUNT(*) AS reschedule_count
  FROM order_schedules
  WHERE rescheduled_from IS NOT NULL
  GROUP BY order_id
) osc ON osc.order_id = o.id;

-- Technician KPI (weekly)
CREATE OR REPLACE VIEW technician_weekly_kpi AS
SELECT
  t.id                                    AS technician_id,
  t.name                                  AS technician_name,
  DATE_TRUNC('week', sr.completed_at)     AS week_start,
  COUNT(*)                                AS jobs_completed,
  COALESCE(SUM(o.quoted_price + sr.extra_charges), 0) AS total_revenue,
  COALESCE(AVG(o.quoted_price + sr.extra_charges), 0) AS avg_job_value,
  COALESCE(SUM(osc.reschedule_count), 0)  AS total_reschedules
FROM technicians t
JOIN orders o          ON o.assigned_technician_id = t.id
JOIN service_reports sr ON sr.order_id = o.id
LEFT JOIN (
  SELECT order_id, COUNT(*) AS reschedule_count
  FROM order_schedules
  WHERE rescheduled_from IS NOT NULL
  GROUP BY order_id
) osc ON osc.order_id = o.id
GROUP BY t.id, t.name, DATE_TRUNC('week', sr.completed_at);

-- Daily summary (for AI queries)
CREATE OR REPLACE VIEW daily_order_summary AS
SELECT
  DATE(created_at)  AS order_date,
  COUNT(*)          AS total_orders,
  COUNT(*) FILTER (WHERE status IN ('job_done', 'reviewed', 'closed')) AS completed,
  COUNT(*) FILTER (WHERE status = 'assigned')     AS assigned,
  COUNT(*) FILTER (WHERE status = 'in_progress')  AS in_progress
FROM orders
GROUP BY DATE(created_at);


-- ==================== SEED DATA ====================

-- Technicians
INSERT INTO technicians (id, name, phone) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Ali',    '012-3456001'),
  ('a1000000-0000-0000-0000-000000000002', 'John',   '012-3456002'),
  ('a1000000-0000-0000-0000-000000000003', 'Bala',   '012-3456003'),
  ('a1000000-0000-0000-0000-000000000004', 'Yusoff', '012-3456004');

-- Service types
INSERT INTO service_types (id, name, default_price) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Aircond Cleaning',      120.00),
  ('b1000000-0000-0000-0000-000000000002', 'Aircond Repair',        250.00),
  ('b1000000-0000-0000-0000-000000000003', 'Aircond Installation',  450.00),
  ('b1000000-0000-0000-0000-000000000004', 'Gas Refill',            180.00),
  ('b1000000-0000-0000-0000-000000000005', 'General Servicing',     150.00);

-- Users
INSERT INTO users (id, name, email, role, technician_id) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Sarah (Admin)',     'sarah@sejuksejuk.com',   'admin',      NULL),
  ('c1000000-0000-0000-0000-000000000002', 'Ali',               'ali@sejuksejuk.com',     'technician', 'a1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-000000000003', 'John',              'john@sejuksejuk.com',    'technician', 'a1000000-0000-0000-0000-000000000002'),
  ('c1000000-0000-0000-0000-000000000004', 'Bala',              'bala@sejuksejuk.com',    'technician', 'a1000000-0000-0000-0000-000000000003'),
  ('c1000000-0000-0000-0000-000000000005', 'Yusoff',            'yusoff@sejuksejuk.com',  'technician', 'a1000000-0000-0000-0000-000000000004'),
  ('c1000000-0000-0000-0000-000000000006', 'Encik Razak (Mgr)', 'razak@sejuksejuk.com',  'manager',    NULL);


-- ==================== ORDER SEED DATA ====================

-- Week 1: 2 weeks ago (all completed + closed)
INSERT INTO orders (id, order_no, customer_name, customer_phone, address, problem_description, service_type_id, quoted_price, assigned_technician_id, admin_notes, status, scheduled_at, created_at, updated_at) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'ORD-20260304-0001', 'Ahmad bin Hassan',  '012-9990001', 'No. 12, Jalan Sejuk, Shah Alam',         'Aircond not cooling, making noise',   'b1000000-0000-0000-0000-000000000002', 250.00, 'a1000000-0000-0000-0000-000000000001', NULL,                          'closed', '2026-03-04 10:00:00+08', '2026-03-04 09:00:00+08', '2026-03-05 10:00:00+08'),
  ('d1000000-0000-0000-0000-000000000002', 'ORD-20260304-0002', 'Siti Aminah',       '012-9990002', '45, Taman Maju, Petaling Jaya',          'Routine cleaning for 3 units',        'b1000000-0000-0000-0000-000000000001', 360.00, 'a1000000-0000-0000-0000-000000000002', NULL,                          'closed', '2026-03-04 14:00:00+08', '2026-03-04 09:30:00+08', '2026-03-05 11:00:00+08'),
  ('d1000000-0000-0000-0000-000000000003', 'ORD-20260305-0001', 'Rajesh Kumar',      '012-9990003', '8, Jalan Bunga Raya, Subang Jaya',       'New aircond installation bedroom',    'b1000000-0000-0000-0000-000000000003', 450.00, 'a1000000-0000-0000-0000-000000000003', 'Customer requests morning slot', 'closed', '2026-03-05 09:00:00+08', '2026-03-05 08:00:00+08', '2026-03-06 09:00:00+08'),
  ('d1000000-0000-0000-0000-000000000004', 'ORD-20260305-0002', 'Tan Wei Ming',      '012-9990004', '22A, Jalan SS2/10, Petaling Jaya',       'Gas refill for office unit',          'b1000000-0000-0000-0000-000000000004', 180.00, 'a1000000-0000-0000-0000-000000000001', NULL,                          'closed', '2026-03-05 10:00:00+08', '2026-03-05 09:00:00+08', '2026-03-06 10:00:00+08'),
  ('d1000000-0000-0000-0000-000000000005', 'ORD-20260306-0001', 'Nurul Izzah',       '012-9990005', '15, Persiaran Tropika, Kota Damansara',  'Aircond leaking water',               'b1000000-0000-0000-0000-000000000002', 250.00, 'a1000000-0000-0000-0000-000000000004', NULL,                          'closed', '2026-03-06 10:00:00+08', '2026-03-06 08:30:00+08', '2026-03-07 09:00:00+08'),
  ('d1000000-0000-0000-0000-000000000006', 'ORD-20260306-0002', 'Lee Chong Wei',     '012-9990006', '3, Lorong Damai, Bangsar',               'General servicing 2 units',           'b1000000-0000-0000-0000-000000000005', 300.00, 'a1000000-0000-0000-0000-000000000003', NULL,                          'closed', '2026-03-06 10:00:00+08', '2026-03-06 09:00:00+08', '2026-03-07 10:00:00+08'),
  ('d1000000-0000-0000-0000-000000000007', 'ORD-20260307-0001', 'Farah Diyana',      '012-9990007', '28, Jalan Anggerik, Puchong',            'Aircond cleaning + gas top up',       'b1000000-0000-0000-0000-000000000001', 120.00, 'a1000000-0000-0000-0000-000000000002', NULL,                          'closed', '2026-03-07 09:00:00+08', '2026-03-07 08:00:00+08', '2026-03-08 09:00:00+08');

-- Week 2: last week (mix of reviewed and closed)
INSERT INTO orders (id, order_no, customer_name, customer_phone, address, problem_description, service_type_id, quoted_price, assigned_technician_id, admin_notes, status, scheduled_at, created_at, updated_at) VALUES
  ('d1000000-0000-0000-0000-000000000008', 'ORD-20260310-0001', 'Mohammad Hafiz',    '012-9990008', '55, Jalan Kenanga, Ampang',              'Compressor very loud',                'b1000000-0000-0000-0000-000000000002', 250.00, 'a1000000-0000-0000-0000-000000000001', 'Urgent - customer complaint',   'reviewed',  '2026-03-10 10:00:00+08', '2026-03-10 08:00:00+08', '2026-03-11 09:00:00+08'),
  ('d1000000-0000-0000-0000-000000000009', 'ORD-20260310-0002', 'Priya Devi',        '012-9990009', '7, Jalan Cempaka, Cheras',               'New aircond for living room',         'b1000000-0000-0000-0000-000000000003', 450.00, 'a1000000-0000-0000-0000-000000000003', NULL,                          'closed',    '2026-03-10 14:00:00+08', '2026-03-10 09:00:00+08', '2026-03-11 14:00:00+08'),
  ('d1000000-0000-0000-0000-000000000010', 'ORD-20260311-0001', 'Ong Kah Seng',      '012-9990010', '18, Taman Sri Sinar, Segambut',          'Aircond not turning on',              'b1000000-0000-0000-0000-000000000002', 250.00, 'a1000000-0000-0000-0000-000000000004', NULL,                          'closed',    '2026-03-11 10:00:00+08', '2026-03-11 08:00:00+08', '2026-03-12 09:00:00+08'),
  ('d1000000-0000-0000-0000-000000000011', 'ORD-20260311-0002', 'Zainab bt Osman',   '012-9990011', '33, Jalan Melati, Setapak',              'Routine cleaning',                    'b1000000-0000-0000-0000-000000000001', 120.00, 'a1000000-0000-0000-0000-000000000001', NULL,                          'reviewed',  '2026-03-11 10:00:00+08', '2026-03-11 09:00:00+08', '2026-03-12 10:00:00+08'),
  ('d1000000-0000-0000-0000-000000000012', 'ORD-20260312-0001', 'Kavitha a/p Raman', '012-9990012', '9, Jalan Ros, Kepong',                   'Gas refill for bedroom unit',         'b1000000-0000-0000-0000-000000000004', 180.00, 'a1000000-0000-0000-0000-000000000002', NULL,                          'closed',    '2026-03-12 09:00:00+08', '2026-03-12 08:30:00+08', '2026-03-12 15:00:00+08'),
  ('d1000000-0000-0000-0000-000000000013', 'ORD-20260312-0002', 'Azman bin Ali',     '012-9990013', '77, Persiaran Rimba, Wangsa Maju',       'Aircond installation for new office', 'b1000000-0000-0000-0000-000000000003', 900.00, 'a1000000-0000-0000-0000-000000000003', '2 units, check stock first',    'reviewed',  '2026-03-12 09:00:00+08', '2026-03-12 08:00:00+08', '2026-03-13 09:00:00+08'),
  ('d1000000-0000-0000-0000-000000000014', 'ORD-20260313-0001', 'Lim Bee Hoon',      '012-9990014', '41, Jalan Mawar, Mont Kiara',            'Water dripping from indoor unit',     'b1000000-0000-0000-0000-000000000002', 250.00, 'a1000000-0000-0000-0000-000000000004', NULL,                          'reviewed',  '2026-03-13 10:00:00+08', '2026-03-13 08:00:00+08', '2026-03-14 09:00:00+08');

-- Week 3: this week (active orders in various states)
INSERT INTO orders (id, order_no, customer_name, customer_phone, address, problem_description, service_type_id, quoted_price, assigned_technician_id, admin_notes, status, scheduled_at, created_at, updated_at) VALUES
  ('d1000000-0000-0000-0000-000000000015', 'ORD-20260316-0001', 'Halim bin Yusof',   '012-9990015', '5, Jalan Sakura, Bukit Jalil',           'Servicing 4 units in office',         'b1000000-0000-0000-0000-000000000005', 600.00, 'a1000000-0000-0000-0000-000000000003', 'Big job, schedule full day',     'job_done',    '2026-03-16 09:00:00+08', '2026-03-16 08:00:00+08', '2026-03-16 16:00:00+08'),
  ('d1000000-0000-0000-0000-000000000016', 'ORD-20260316-0002', 'Wong Mei Ling',     '012-9990016', '19, Taman Desa, Old Klang Road',         'Aircond smells bad when turned on',   'b1000000-0000-0000-0000-000000000001', 120.00, 'a1000000-0000-0000-0000-000000000001', NULL,                          'job_done',    '2026-03-16 10:00:00+08', '2026-03-16 09:00:00+08', '2026-03-16 14:00:00+08'),
  ('d1000000-0000-0000-0000-000000000017', 'ORD-20260317-0001', 'Saravanan a/l Muthu','012-9990017', '62, Jalan Teratai, Sri Petaling',       'Gas refill + general checkup',        'b1000000-0000-0000-0000-000000000004', 180.00, 'a1000000-0000-0000-0000-000000000002', NULL,                          'job_done',    '2026-03-17 09:00:00+08', '2026-03-17 08:00:00+08', '2026-03-17 11:00:00+08'),
  ('d1000000-0000-0000-0000-000000000018', 'ORD-20260317-0002', 'Aisha bt Rahman',   '012-9990018', '14, Jalan Delima, Taman Tun',            'New unit installation master bedroom', 'b1000000-0000-0000-0000-000000000003', 450.00, 'a1000000-0000-0000-0000-000000000004', 'Customer prefers afternoon',     'in_progress', '2026-03-18 14:00:00+08', '2026-03-17 09:00:00+08', '2026-03-17 14:00:00+08'),
  ('d1000000-0000-0000-0000-000000000019', 'ORD-20260318-0001', 'Daniel Chong',      '012-9990019', '25, Lorong Harmoni, Damansara Heights',  'Aircond making clicking sound',       'b1000000-0000-0000-0000-000000000002', 250.00, 'a1000000-0000-0000-0000-000000000001', NULL,                          'in_progress', '2026-03-18 10:00:00+08', '2026-03-18 08:00:00+08', '2026-03-18 10:00:00+08'),
  ('d1000000-0000-0000-0000-000000000020', 'ORD-20260318-0002', 'Nor Azizah',        '012-9990020', '38, Jalan Perdana, Desa ParkCity',       'Routine cleaning 2 units',            'b1000000-0000-0000-0000-000000000001', 240.00, 'a1000000-0000-0000-0000-000000000003', NULL,                          'assigned',    '2026-03-19 09:00:00+08', '2026-03-18 09:00:00+08', '2026-03-18 09:00:00+08'),
  ('d1000000-0000-0000-0000-000000000021', 'ORD-20260319-0001', 'Muthu Krishnan',    '012-9990021', '10, Jalan Cendana, Taman Melawati',      'Aircond repair - remote not working', 'b1000000-0000-0000-0000-000000000002', 250.00, 'a1000000-0000-0000-0000-000000000004', 'Could be receiver board issue',  'assigned',    '2026-03-20 10:00:00+08', '2026-03-19 08:00:00+08', '2026-03-19 08:00:00+08'),
  ('d1000000-0000-0000-0000-000000000022', 'ORD-20260320-0001', 'Fatimah bt Ismail', '012-9990022', '51, Persiaran Sutera, Pandan Indah',     'Gas refill for shop unit',            'b1000000-0000-0000-0000-000000000004', 180.00, NULL,                                   'Walk-in customer',              'new',         NULL,                     '2026-03-20 08:00:00+08', '2026-03-20 08:00:00+08'),
  ('d1000000-0000-0000-0000-000000000023', 'ORD-20260320-0002', 'Chew Kar Yee',      '012-9990023', '6, Jalan Kiara, Mont Kiara',             'Full servicing + chemical wash',      'b1000000-0000-0000-0000-000000000005', 350.00, NULL,                                   NULL,                            'new',         NULL,                     '2026-03-20 09:00:00+08', '2026-03-20 09:00:00+08');


-- ==================== SERVICE REPORT SEED DATA ====================

INSERT INTO service_reports (order_id, work_done, extra_charges, remarks, completed_at) VALUES
  -- Week 1
  ('d1000000-0000-0000-0000-000000000001', 'Replaced faulty compressor capacitor',           30.00,  'Customer satisfied',                              '2026-03-04 14:30:00+08'),
  ('d1000000-0000-0000-0000-000000000002', 'Cleaned all 3 indoor and outdoor units',          0.00,  'All units functioning well',                      '2026-03-04 16:00:00+08'),
  ('d1000000-0000-0000-0000-000000000003', 'Installed 1.5HP Daikin wall-mounted unit',        80.00,  'Extra charge for extended piping',                '2026-03-05 17:00:00+08'),
  ('d1000000-0000-0000-0000-000000000004', 'Refilled R410A gas, checked for leaks',            0.00,  'No leaks found',                                 '2026-03-05 11:30:00+08'),
  ('d1000000-0000-0000-0000-000000000005', 'Cleared blocked drainage pipe',                    0.00,  'Advised customer to service every 3 months',     '2026-03-06 15:00:00+08'),
  ('d1000000-0000-0000-0000-000000000006', 'Serviced both units, replaced air filters',       40.00,  'Filters were very dirty',                        '2026-03-06 14:00:00+08'),
  ('d1000000-0000-0000-0000-000000000007', 'Full cleaning done, gas topped up',               60.00,  'Gas was low, topped up R32',                     '2026-03-07 12:00:00+08'),
  -- Week 2
  ('d1000000-0000-0000-0000-000000000008', 'Replaced worn compressor mounting bolts',         15.00,  'Vibration issue resolved',                        '2026-03-10 15:30:00+08'),
  ('d1000000-0000-0000-0000-000000000009', 'Installed 2HP Panasonic cassette unit',          120.00,  'Ceiling cassette required extra bracket',         '2026-03-10 17:00:00+08'),
  ('d1000000-0000-0000-0000-000000000010', 'Replaced faulty PCB board',                     180.00,  'PCB was burnt, replaced with compatible part',    '2026-03-11 14:00:00+08'),
  ('d1000000-0000-0000-0000-000000000011', 'Standard cleaning completed',                      0.00,  NULL,                                              '2026-03-11 11:00:00+08'),
  ('d1000000-0000-0000-0000-000000000012', 'Refilled R32 gas, pressure normal',                0.00,  NULL,                                              '2026-03-12 10:30:00+08'),
  ('d1000000-0000-0000-0000-000000000013', 'Installed 2 units wall-mounted',                 150.00,  'Extra copper piping needed for 2nd unit',         '2026-03-12 17:30:00+08'),
  ('d1000000-0000-0000-0000-000000000014', 'Replaced cracked drain tray',                     45.00,  'Tray had hairline crack',                         '2026-03-13 13:00:00+08'),
  -- Week 3 (only completed jobs)
  ('d1000000-0000-0000-0000-000000000015', 'Serviced all 4 units, replaced 2 filters',        80.00,  'Unit 3 outdoor fan slightly noisy, monitor',     '2026-03-16 16:00:00+08'),
  ('d1000000-0000-0000-0000-000000000016', 'Deep cleaning done, mould found in coil',         30.00,  'Advised annual deep clean',                       '2026-03-16 14:00:00+08'),
  ('d1000000-0000-0000-0000-000000000017', 'Gas refilled, compressor and fan checked',         0.00,  'All good',                                        '2026-03-17 11:00:00+08');


-- ==================== ORDER REVIEW SEED DATA ====================

INSERT INTO order_reviews (order_id, reviewed_by, review_notes, reviewed_at) VALUES
  -- Week 1 (all reviewed before closing)
  ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000006', 'Good work, parts cost reasonable',     '2026-03-05 09:00:00+08'),
  ('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000006', NULL,                                   '2026-03-05 09:30:00+08'),
  ('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000006', 'Extra piping charge approved',         '2026-03-06 08:30:00+08'),
  ('d1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000006', NULL,                                   '2026-03-06 09:00:00+08'),
  ('d1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000006', 'Follow up with customer in 3 months',  '2026-03-07 08:30:00+08'),
  ('d1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000006', NULL,                                   '2026-03-07 09:00:00+08'),
  ('d1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000006', 'Gas top up was necessary',             '2026-03-08 08:00:00+08'),
  -- Week 2 (some reviewed, some still pending)
  ('d1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000006', 'Urgent job handled well',             '2026-03-11 08:30:00+08'),
  ('d1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000006', 'Bracket cost seems high, verify',     '2026-03-11 10:00:00+08'),
  ('d1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000006', 'PCB replacement - check warranty',    '2026-03-12 08:00:00+08'),
  ('d1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000006', NULL,                                  '2026-03-12 09:00:00+08'),
  ('d1000000-0000-0000-0000-000000000012', 'c1000000-0000-0000-0000-000000000006', NULL,                                  '2026-03-12 14:00:00+08'),
  ('d1000000-0000-0000-0000-000000000013', 'c1000000-0000-0000-0000-000000000006', 'Large job, extra piping justified',   '2026-03-13 08:30:00+08'),
  ('d1000000-0000-0000-0000-000000000014', 'c1000000-0000-0000-0000-000000000006', NULL,                                  '2026-03-14 08:30:00+08');


-- ==================== AUDIT LOG SEED DATA ====================

-- Order created events
INSERT INTO audit_logs (order_id, action, old_value, new_value, performed_by, created_at)
SELECT o.id, 'created', NULL, 'new', 'c1000000-0000-0000-0000-000000000001', o.created_at
FROM orders o;

-- Assignment events
INSERT INTO audit_logs (order_id, action, old_value, new_value, performed_by, created_at)
SELECT o.id, 'assigned', 'new', 'assigned',
  'c1000000-0000-0000-0000-000000000001',
  o.created_at + INTERVAL '10 minutes'
FROM orders o
WHERE o.assigned_technician_id IS NOT NULL;

-- Completion events
INSERT INTO audit_logs (order_id, action, old_value, new_value, performed_by, created_at)
SELECT o.id, 'status_changed', 'in_progress', 'job_done',
  u.id, sr.completed_at
FROM orders o
JOIN service_reports sr ON sr.order_id = o.id
JOIN users u ON u.technician_id = o.assigned_technician_id;

-- Review events
INSERT INTO audit_logs (order_id, action, old_value, new_value, performed_by, created_at)
SELECT rv.order_id, 'reviewed', 'job_done', 'reviewed',
  rv.reviewed_by, rv.reviewed_at
FROM order_reviews rv;


-- ==================== ORDER SCHEDULE SEED DATA ====================
-- Original schedules (every assigned order gets one)
-- Plus realistic reschedule events for some orders

-- Original schedules for all assigned orders
INSERT INTO order_schedules (order_id, scheduled_at, rescheduled_from, reason, created_by, created_at) VALUES
  -- Week 1: all on schedule
  ('d1000000-0000-0000-0000-000000000001', '2026-03-04 10:00:00+08', NULL, NULL, 'c1000000-0000-0000-0000-000000000001', '2026-03-04 09:00:00+08'),
  ('d1000000-0000-0000-0000-000000000002', '2026-03-04 14:00:00+08', NULL, NULL, 'c1000000-0000-0000-0000-000000000001', '2026-03-04 09:30:00+08'),
  ('d1000000-0000-0000-0000-000000000003', '2026-03-05 09:00:00+08', NULL, NULL, 'c1000000-0000-0000-0000-000000000001', '2026-03-05 08:00:00+08'),
  ('d1000000-0000-0000-0000-000000000004', '2026-03-05 10:00:00+08', NULL, NULL, 'c1000000-0000-0000-0000-000000000001', '2026-03-05 09:00:00+08'),
  ('d1000000-0000-0000-0000-000000000005', '2026-03-06 10:00:00+08', NULL, NULL, 'c1000000-0000-0000-0000-000000000001', '2026-03-06 08:30:00+08'),
  ('d1000000-0000-0000-0000-000000000006', '2026-03-06 10:00:00+08', NULL, NULL, 'c1000000-0000-0000-0000-000000000001', '2026-03-06 09:00:00+08'),
  ('d1000000-0000-0000-0000-000000000007', '2026-03-07 09:00:00+08', NULL, NULL, 'c1000000-0000-0000-0000-000000000001', '2026-03-07 08:00:00+08'),

  -- Week 2: some rescheduled
  ('d1000000-0000-0000-0000-000000000008', '2026-03-10 10:00:00+08', NULL, NULL, 'c1000000-0000-0000-0000-000000000001', '2026-03-10 08:00:00+08'),
  ('d1000000-0000-0000-0000-000000000009', '2026-03-10 10:00:00+08', NULL, NULL, 'c1000000-0000-0000-0000-000000000001', '2026-03-10 09:00:00+08'),
  ('d1000000-0000-0000-0000-000000000010', '2026-03-11 10:00:00+08', NULL, NULL, 'c1000000-0000-0000-0000-000000000001', '2026-03-11 08:00:00+08'),
  ('d1000000-0000-0000-0000-000000000011', '2026-03-11 10:00:00+08', NULL, NULL, 'c1000000-0000-0000-0000-000000000001', '2026-03-11 09:00:00+08'),
  ('d1000000-0000-0000-0000-000000000012', '2026-03-12 09:00:00+08', NULL, NULL, 'c1000000-0000-0000-0000-000000000001', '2026-03-12 08:30:00+08'),
  -- Order 13: originally March 11, postponed to March 12 (waiting for stock)
  ('d1000000-0000-0000-0000-000000000013', '2026-03-11 09:00:00+08', NULL, NULL, 'c1000000-0000-0000-0000-000000000001', '2026-03-10 17:00:00+08'),
  ('d1000000-0000-0000-0000-000000000013', '2026-03-12 09:00:00+08', '2026-03-11 09:00:00+08', 'Waiting for stock - 2 units not in warehouse yet', 'c1000000-0000-0000-0000-000000000001', '2026-03-11 08:00:00+08'),
  ('d1000000-0000-0000-0000-000000000014', '2026-03-13 10:00:00+08', NULL, NULL, 'c1000000-0000-0000-0000-000000000001', '2026-03-13 08:00:00+08'),

  -- Week 3
  -- Order 15: originally March 15, postponed to March 16 (Bala overloaded)
  ('d1000000-0000-0000-0000-000000000015', '2026-03-15 09:00:00+08', NULL, NULL, 'c1000000-0000-0000-0000-000000000001', '2026-03-14 17:00:00+08'),
  ('d1000000-0000-0000-0000-000000000015', '2026-03-16 09:00:00+08', '2026-03-15 09:00:00+08', 'Technician Bala had too many jobs on the 15th', 'c1000000-0000-0000-0000-000000000001', '2026-03-15 08:00:00+08'),
  ('d1000000-0000-0000-0000-000000000016', '2026-03-16 10:00:00+08', NULL, NULL, 'c1000000-0000-0000-0000-000000000001', '2026-03-16 09:00:00+08'),
  ('d1000000-0000-0000-0000-000000000017', '2026-03-17 09:00:00+08', NULL, NULL, 'c1000000-0000-0000-0000-000000000001', '2026-03-17 08:00:00+08'),
  -- Order 18: originally March 17 morning, customer requested afternoon, then postponed to March 18
  ('d1000000-0000-0000-0000-000000000018', '2026-03-17 10:00:00+08', NULL, NULL, 'c1000000-0000-0000-0000-000000000001', '2026-03-17 09:00:00+08'),
  ('d1000000-0000-0000-0000-000000000018', '2026-03-17 14:00:00+08', '2026-03-17 10:00:00+08', 'Customer requested afternoon slot', 'c1000000-0000-0000-0000-000000000001', '2026-03-17 10:00:00+08'),
  ('d1000000-0000-0000-0000-000000000018', '2026-03-18 14:00:00+08', '2026-03-17 14:00:00+08', 'Parts not ready, postponed to next day', 'c1000000-0000-0000-0000-000000000001', '2026-03-17 13:00:00+08'),
  ('d1000000-0000-0000-0000-000000000019', '2026-03-18 10:00:00+08', NULL, NULL, 'c1000000-0000-0000-0000-000000000001', '2026-03-18 08:00:00+08'),
  ('d1000000-0000-0000-0000-000000000020', '2026-03-19 09:00:00+08', NULL, NULL, 'c1000000-0000-0000-0000-000000000001', '2026-03-18 09:00:00+08'),
  -- Order 21: originally March 19, postponed to March 20 (customer not available)
  ('d1000000-0000-0000-0000-000000000021', '2026-03-19 10:00:00+08', NULL, NULL, 'c1000000-0000-0000-0000-000000000001', '2026-03-19 08:00:00+08'),
  ('d1000000-0000-0000-0000-000000000021', '2026-03-20 10:00:00+08', '2026-03-19 10:00:00+08', 'Customer not available, moved to Friday', 'c1000000-0000-0000-0000-000000000001', '2026-03-19 09:00:00+08');

-- Reschedule audit trail
INSERT INTO audit_logs (order_id, action, old_value, new_value, performed_by, created_at) VALUES
  ('d1000000-0000-0000-0000-000000000013', 'rescheduled', '2026-03-11 09:00', '2026-03-12 09:00', 'c1000000-0000-0000-0000-000000000001', '2026-03-11 08:00:00+08'),
  ('d1000000-0000-0000-0000-000000000015', 'rescheduled', '2026-03-15 09:00', '2026-03-16 09:00', 'c1000000-0000-0000-0000-000000000001', '2026-03-15 08:00:00+08'),
  ('d1000000-0000-0000-0000-000000000018', 'rescheduled', '2026-03-17 10:00', '2026-03-17 14:00', 'c1000000-0000-0000-0000-000000000001', '2026-03-17 10:00:00+08'),
  ('d1000000-0000-0000-0000-000000000018', 'rescheduled', '2026-03-17 14:00', '2026-03-18 14:00', 'c1000000-0000-0000-0000-000000000001', '2026-03-17 13:00:00+08'),
  ('d1000000-0000-0000-0000-000000000021', 'rescheduled', '2026-03-19 10:00', '2026-03-20 10:00', 'c1000000-0000-0000-0000-000000000001', '2026-03-19 09:00:00+08');


-- ==================== TABLE COMMENTS ====================

COMMENT ON TABLE orders IS 'Admin domain: service order created by admin staff';
COMMENT ON TABLE service_reports IS 'Technician domain: completion report submitted by assigned technician';
COMMENT ON TABLE service_attachments IS 'Technician domain: photos/videos/PDFs uploaded with service report';
COMMENT ON TABLE service_payments IS 'Technician domain: payment collected from customer on-site';
COMMENT ON TABLE order_reviews IS 'Manager domain: review and approval of completed jobs';
COMMENT ON TABLE order_schedules IS 'Scheduling domain: tracks original schedule and all reschedules per order';
COMMENT ON TABLE audit_logs IS 'Cross-cutting: tracks all key actions for traceability';
COMMENT ON COLUMN orders.order_no IS 'Format: ORD-YYYYMMDD-XXXX. Auto-generated on insert via trigger.';
COMMENT ON COLUMN orders.scheduled_at IS 'Current scheduled datetime. Updated on reschedule. NULL if unassigned.';
COMMENT ON VIEW order_details IS 'Joins all domains into a single read view for dashboards and AI queries.';
