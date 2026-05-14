-- 02_mapping_tables.sql

-- Enums for Mapping
CREATE TYPE source_system AS ENUM ('UNANET', 'NETSUITE', 'QUICKBOOKS');
CREATE TYPE entity_type AS ENUM ('USER', 'TASK', 'GL_ACCOUNT', 'VENDOR');

-- The unified Mapping Table
-- This table reconciles IDs across the three platforms to our internal EVMS UUIDs
CREATE TABLE IF NOT EXISTS entity_mappings (
    mapping_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    internal_uuid UUID NOT NULL, -- The ID used in our core EVMS tables
    source_system source_system NOT NULL,
    external_id VARCHAR(255) NOT NULL, -- The string ID from Unanet/NetSuite/QuickBooks
    entity_type entity_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure we don't map the same external entity twice for the same system
    UNIQUE (source_system, external_id, entity_type)
);

-- Users / Employees table (mapped from Unanet)
CREATE TABLE IF NOT EXISTS evms_users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_cam BOOLEAN DEFAULT FALSE, -- Is this user a Control Account Manager?
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
