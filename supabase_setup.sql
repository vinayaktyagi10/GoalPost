-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create USERS table
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT auth.uid(), -- Links to Supabase Auth
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text CHECK (role IN ('employee', 'manager', 'admin')) NOT NULL,
  manager_id uuid REFERENCES public.users(id),
  department text,
  created_at timestamptz DEFAULT now()
);

-- 3. Create GOALS table
CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.users(id) NOT NULL,
  thrust_area text NOT NULL,
  title text NOT NULL,
  description text,
  uom_type text CHECK (uom_type IN ('min', 'max', 'timeline', 'zero')) NOT NULL,
  target numeric,
  target_date date,
  weightage numeric NOT NULL CHECK (weightage >= 10),
  status text CHECK (status IN ('draft','submitted','approved','locked','returned')) DEFAULT 'draft',
  is_shared boolean DEFAULT false,
  parent_shared_goal_id uuid REFERENCES public.goals(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Create ACHIEVEMENTS table
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES public.goals(id) NOT NULL,
  quarter text CHECK (quarter IN ('Q1','Q2','Q3','Q4')) NOT NULL,
  actual_value numeric,
  actual_date date,
  progress_status text CHECK (progress_status IN ('not_started','on_track','completed')) DEFAULT 'not_started',
  computed_score numeric,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(goal_id, quarter)
);

-- 5. Create CHECKIN_COMMENTS table
CREATE TABLE public.checkin_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES public.goals(id) NOT NULL,
  manager_id uuid REFERENCES public.users(id) NOT NULL,
  quarter text NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 6. Create AUDIT_LOG table
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES public.goals(id),
  changed_by uuid REFERENCES public.users(id),
  action text NOT NULL,
  field_changed text,
  old_value text,
  new_value text,
  timestamp timestamptz DEFAULT now()
);

-- 7. Create ESCALATION_RULES table
CREATE TABLE public.escalation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  trigger_event text NOT NULL,
  days_threshold integer NOT NULL,
  is_active boolean DEFAULT true
);

-- 8. RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_rules ENABLE ROW LEVEL SECURITY;

-- USERS POLICIES
CREATE POLICY "Users can view relevant profiles" ON public.users 
FOR SELECT USING (
  auth.uid() = id OR 
  manager_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- GOALS POLICIES
CREATE POLICY "Employees can view own goals" ON public.goals 
FOR SELECT USING (auth.uid() = employee_id);

CREATE POLICY "Managers can view team goals" ON public.goals 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'manager'
  )
);

CREATE POLICY "Admins can view all goals" ON public.goals 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Employees can insert own goals" ON public.goals 
FOR INSERT WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Admins can insert goals" ON public.goals 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Employees can update own goals" ON public.goals 
FOR UPDATE USING (auth.uid() = employee_id)
WITH CHECK (status IN ('draft', 'returned'));

CREATE POLICY "Managers can update team goals" ON public.goals 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'manager'
  )
);

CREATE POLICY "Admins can update all goals" ON public.goals 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- ACHIEVEMENTS POLICIES
CREATE POLICY "Anyone authenticated can view achievements" ON public.achievements 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Employees can insert achievements" ON public.achievements 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.goals 
    WHERE id = goal_id AND employee_id = auth.uid()
  )
);

CREATE POLICY "Employees can update achievements" ON public.achievements 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.goals 
    WHERE id = goal_id AND employee_id = auth.uid()
  )
);

-- CHECKIN_COMMENTS POLICIES
CREATE POLICY "Authenticated users can view comments" ON public.checkin_comments 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can insert comments" ON public.checkin_comments 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'manager'
  )
);

-- AUDIT LOG
CREATE POLICY "Allow authenticated to insert logs" ON public.audit_log 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can view all logs" ON public.audit_log 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- 9. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON public.achievements FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- STEP 1.1: SEED DATA
-- Assuming auth users are created with Demo@1234
-- Note: Replace these with actual auth.uid()s once created in Auth > Users

-- Mock UUIDs for seed data
DO $$
DECLARE
  admin_id uuid := gen_random_uuid();
  manager_id uuid := gen_random_uuid();
  employee_id uuid := gen_random_uuid();
  goal1_id uuid := gen_random_uuid();
  goal2_id uuid := gen_random_uuid();
  goal3_id uuid := gen_random_uuid();
  goal4_id uuid := gen_random_uuid();
  goal5_id uuid := gen_random_uuid();
BEGIN

INSERT INTO public.users (id, email, name, role, department)
VALUES 
  (admin_id, 'admin@demo.com', 'Admin User', 'admin', 'HR'),
  (manager_id, 'manager@demo.com', 'Manager User', 'manager', 'Sales'),
  (employee_id, 'employee@demo.com', 'Employee User', 'employee', 'Sales')
ON CONFLICT (email) DO UPDATE SET 
  name = EXCLUDED.name, 
  role = EXCLUDED.role;

UPDATE public.users SET manager_id = manager_id WHERE id = employee_id;

INSERT INTO public.goals (id, employee_id, thrust_area, title, description, uom_type, target, weightage, status)
VALUES 
  (goal1_id, employee_id, 'Sales', 'Quarterly Revenue', 'Reach $100k revenue', 'min', 100000, 30, 'locked'),
  (goal2_id, employee_id, 'Product', 'Feature Launch', 'Launch v2.0', 'timeline', null, 25, 'locked'),
  (goal3_id, employee_id, 'Customer', 'NPS Score', 'Maintain NPS > 8', 'min', 8, 25, 'locked'),
  (goal4_id, employee_id, 'Learning', 'Certifications', 'Complete 2 courses', 'min', 2, 10, 'locked'),
  (goal5_id, employee_id, 'Operations', 'Bug Reduction', 'Reduce bugs by 50%', 'max', 10, 10, 'locked');

INSERT INTO public.achievements (goal_id, quarter, actual_value, progress_status, computed_score)
VALUES
  (goal1_id, 'Q1', 110000, 'completed', 100),
  (goal2_id, 'Q1', null, 'on_track', 0),
  (goal3_id, 'Q1', 9, 'completed', 100),
  (goal4_id, 'Q1', 1, 'on_track', 50),
  (goal5_id, 'Q1', 8, 'on_track', 80);

END $$;
