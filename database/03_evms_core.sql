-- 03_evms_core.sql

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    project_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_name VARCHAR(255) NOT NULL,
    contract_number VARCHAR(100),
    is_cui BOOLEAN DEFAULT TRUE, -- Default to CUI per requirements
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Control Accounts
-- The management control point where scope, budget, and schedule are integrated and compared to EV.
CREATE TABLE IF NOT EXISTS control_accounts (
    ca_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    ca_name VARCHAR(255) NOT NULL,
    ca_code VARCHAR(100) UNIQUE NOT NULL,
    cam_id UUID NOT NULL REFERENCES evms_users(user_id), -- Control Account Manager
    is_cui BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Work Packages
-- Detail level tasks beneath a Control Account
CREATE TABLE IF NOT EXISTS work_packages (
    wp_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ca_id UUID NOT NULL REFERENCES control_accounts(ca_id) ON DELETE CASCADE,
    wp_name VARCHAR(255) NOT NULL,
    wp_code VARCHAR(100) UNIQUE NOT NULL,
    start_date DATE,
    end_date DATE,
    ev_technique VARCHAR(50), -- e.g., '0-100', '50-50', 'Weighted Milestone', 'Level of Effort'
    is_cui BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Planning Packages
-- Future scope that is not yet detailed into Work Packages
CREATE TABLE IF NOT EXISTS planning_packages (
    pp_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ca_id UUID NOT NULL REFERENCES control_accounts(ca_id) ON DELETE CASCADE,
    pp_name VARCHAR(255) NOT NULL,
    pp_code VARCHAR(100) UNIQUE NOT NULL,
    estimated_start_date DATE,
    estimated_end_date DATE,
    is_cui BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
