-- test_rls.sql
-- This script provides manual test cases to verify the schema constraints, 
-- RLS policies, and Immutability Triggers.

-- TEST 1: IMMUTABILITY TRIGGER
-- Create a mock project
INSERT INTO projects (project_id, project_name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Test EVMS Project');

-- Create an approved baseline
INSERT INTO baselines (baseline_id, project_id, baseline_name, status)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Initial Baseline', 'APPROVED');

-- Insert a budget record into the approved baseline
-- (In a real scenario, this would be inserted while DRAFT, then status updated to APPROVED. 
-- We allow inserts unless strictly blocked, but the trigger blocks UPDATE/DELETE)
INSERT INTO time_phased_budgets (budget_id, baseline_id, period_start, period_end, bcws_labor_cost)
VALUES ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '2024-01-01', '2024-01-31', 5000);

-- THE FOLLOWING STATEMENT SHOULD FAIL WITH AN EXCEPTION:
-- UPDATE time_phased_budgets SET bcws_labor_cost = 6000 WHERE budget_id = '00000000-0000-0000-0000-000000000003';

-- TEST 2: ROW LEVEL SECURITY (CAM ACCESS)
-- Assuming evms_users contains a user with ID '11111111-1111-1111-1111-111111111111'
-- Create a Control Account owned by that CAM
-- INSERT INTO control_accounts (ca_id, project_id, ca_name, ca_code, cam_id)
-- VALUES ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Software Dev CA', 'CA-SW-01', '11111111-1111-1111-1111-111111111111');

-- Simulate the microservice connecting as a CAM:
-- SET ROLE evms_cam_role;
-- SET LOCAL request.cam_id = '11111111-1111-1111-1111-111111111111';
-- SELECT * FROM control_accounts; -- SHOULD RETURN 1 ROW

-- SET LOCAL request.cam_id = '99999999-9999-9999-9999-999999999999';
-- SELECT * FROM control_accounts; -- SHOULD RETURN 0 ROWS
