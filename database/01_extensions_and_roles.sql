-- 01_extensions_and_roles.sql

-- Enable UUID extension for robust distributed keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Role for the microservices to connect as
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'evms_service_role') THEN
        CREATE ROLE evms_service_role WITH NOLOGIN;
    END IF;
END
$$;

-- Role specifically for Control Account Managers (CAMs)
-- (This role is used for logical grouping, actual connection happens via evms_admin/service role 
-- which assumes the context of the CAM via SET LOCAL)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'evms_cam_role') THEN
        CREATE ROLE evms_cam_role WITH NOLOGIN;
    END IF;
END
$$;

-- Grant permissions (evms_admin is the default user created by Terraform)
GRANT evms_service_role TO evms_admin;
GRANT evms_cam_role TO evms_admin;
