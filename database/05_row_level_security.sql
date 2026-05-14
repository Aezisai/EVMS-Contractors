-- 05_row_level_security.sql

-- Enable RLS on all CUI tables
ALTER TABLE control_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_phased_budgets ENABLE ROW LEVEL SECURITY;

-- 1. Control Accounts RLS
-- A CAM can only see Control Accounts where they are the assigned cam_id.
-- (The application must SET LOCAL request.cam_id = 'uuid' before querying)
CREATE POLICY cam_ca_access_policy ON control_accounts
FOR ALL
TO evms_cam_role
USING (
    cam_id = NULLIF(current_setting('request.cam_id', true), '')::uuid
);

-- 2. Work Packages RLS
-- A CAM can only see Work Packages that belong to a Control Account they own.
CREATE POLICY cam_wp_access_policy ON work_packages
FOR ALL
TO evms_cam_role
USING (
    ca_id IN (
        SELECT ca_id FROM control_accounts 
        WHERE cam_id = NULLIF(current_setting('request.cam_id', true), '')::uuid
    )
);

-- 3. Planning Packages RLS
CREATE POLICY cam_pp_access_policy ON planning_packages
FOR ALL
TO evms_cam_role
USING (
    ca_id IN (
        SELECT ca_id FROM control_accounts 
        WHERE cam_id = NULLIF(current_setting('request.cam_id', true), '')::uuid
    )
);

-- 4. Time Phased Budgets RLS
-- A CAM can only see budgets linked to their Work Packages or Planning Packages.
CREATE POLICY cam_budget_access_policy ON time_phased_budgets
FOR ALL
TO evms_cam_role
USING (
    wp_id IN (
        SELECT wp_id FROM work_packages WHERE ca_id IN (
            SELECT ca_id FROM control_accounts WHERE cam_id = NULLIF(current_setting('request.cam_id', true), '')::uuid
        )
    )
    OR
    pp_id IN (
        SELECT pp_id FROM planning_packages WHERE ca_id IN (
            SELECT ca_id FROM control_accounts WHERE cam_id = NULLIF(current_setting('request.cam_id', true), '')::uuid
        )
    )
);

-- Bypass RLS for the pure service role (e.g., automated ingestion pipelines running as admin)
-- Since evms_service_role acts as the system, we might grant it bypassrls.
-- Or we just apply policies only to the evms_cam_role.
-- The above policies are restricted TO evms_cam_role, so the evms_service_role naturally bypasses them if it's the owner or if we give it a blanket policy.
CREATE POLICY service_ca_access_policy ON control_accounts FOR ALL TO evms_service_role USING (true);
CREATE POLICY service_wp_access_policy ON work_packages FOR ALL TO evms_service_role USING (true);
CREATE POLICY service_pp_access_policy ON planning_packages FOR ALL TO evms_service_role USING (true);
CREATE POLICY service_budget_access_policy ON time_phased_budgets FOR ALL TO evms_service_role USING (true);
