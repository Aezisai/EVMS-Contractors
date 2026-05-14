-- 04_baselines.sql

CREATE TYPE baseline_status AS ENUM ('DRAFT', 'APPROVED', 'SUPERSEDED');

-- Baselines Table
CREATE TABLE IF NOT EXISTS baselines (
    baseline_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    baseline_name VARCHAR(255) NOT NULL,
    status baseline_status DEFAULT 'DRAFT',
    approved_by UUID REFERENCES evms_users(user_id),
    approved_at TIMESTAMP WITH TIME ZONE,
    is_cui BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Time-Phased Budgeted Cost for Work Scheduled (BCWS)
CREATE TABLE IF NOT EXISTS time_phased_budgets (
    budget_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baseline_id UUID NOT NULL REFERENCES baselines(baseline_id) ON DELETE CASCADE,
    wp_id UUID REFERENCES work_packages(wp_id),
    pp_id UUID REFERENCES planning_packages(pp_id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    bcws_labor_hours NUMERIC(15, 2) DEFAULT 0,
    bcws_labor_cost NUMERIC(15, 2) DEFAULT 0,
    bcws_material_cost NUMERIC(15, 2) DEFAULT 0,
    is_cui BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure a budget record belongs to either a WP or a PP, not both, not neither
    CHECK (
        (wp_id IS NOT NULL AND pp_id IS NULL) OR 
        (wp_id IS NULL AND pp_id IS NOT NULL)
    )
);

-- TRIGGER FUNCTION: Prevent modifications to APPROVED baselines
CREATE OR REPLACE FUNCTION enforce_immutable_baseline()
RETURNS TRIGGER AS $$
DECLARE
    current_status baseline_status;
BEGIN
    -- If updating the baselines table directly, check the old status
    IF TG_TABLE_NAME = 'baselines' THEN
        IF OLD.status = 'APPROVED' AND NEW.status != 'SUPERSEDED' THEN
            RAISE EXCEPTION 'Cannot modify an APPROVED baseline. Create a new baseline instead.';
        END IF;
        RETURN NEW;
    END IF;

    -- If updating child tables (like time_phased_budgets), check parent baseline status
    IF TG_TABLE_NAME = 'time_phased_budgets' THEN
        SELECT status INTO current_status FROM baselines WHERE baseline_id = OLD.baseline_id;
        IF current_status = 'APPROVED' THEN
            RAISE EXCEPTION 'Cannot modify budget records of an APPROVED baseline. This violates EVMS strict change control.';
        END IF;
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to baselines table
CREATE TRIGGER trg_baselines_immutable
BEFORE UPDATE OR DELETE ON baselines
FOR EACH ROW
EXECUTE FUNCTION enforce_immutable_baseline();

-- Attach trigger to time_phased_budgets table
CREATE TRIGGER trg_budgets_immutable
BEFORE UPDATE OR DELETE ON time_phased_budgets
FOR EACH ROW
EXECUTE FUNCTION enforce_immutable_baseline();
