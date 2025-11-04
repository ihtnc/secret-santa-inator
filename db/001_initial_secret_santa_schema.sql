-- Secret Santa Database Schema
-- Complete migration script for all tables, functions, triggers, and permissions

-- ============================================================================
-- TABLES
-- ============================================================================

-- Groups table
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    group_guid TEXT NOT NULL,
    password TEXT,
    capacity INTEGER NOT NULL,
    use_code_names BOOLEAN NOT NULL,
    auto_assign_code_names BOOLEAN NOT NULL,
    use_custom_code_names BOOLEAN NOT NULL,
    creator_name TEXT NOT NULL,
    creator_code TEXT NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT NOT NULL,
    is_open BOOLEAN NOT NULL DEFAULT TRUE,
    expiry_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
    is_frozen BOOLEAN NOT NULL DEFAULT FALSE
);

-- Enable RLS and create unique index
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX idx_group_guid_unique ON groups (group_guid);

-- Members table
CREATE TABLE members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    code_name TEXT,
    custom_code_name_id INTEGER REFERENCES custom_code_names(id) ON DELETE SET NULL,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and create unique indexes
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX idx_members_group_name_unique ON members (group_id, name);
CREATE UNIQUE INDEX idx_members_group_code_name_unique ON members (group_id, code_name) WHERE code_name IS NOT NULL;
CREATE UNIQUE INDEX idx_members_group_custom_code_name_unique ON members (group_id, custom_code_name_id) WHERE custom_code_name_id IS NOT NULL;

-- Santas table (Secret Santa assignments)
CREATE TABLE santas (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    santa_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and create indexes
ALTER TABLE santas ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX idx_santas_group_santa_unique ON santas (group_id, santa_id);
CREATE INDEX idx_santas_member_id ON santas (member_id);

-- Code adjectives table
CREATE TABLE code_adjectives (
    id SERIAL PRIMARY KEY,
    value TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and create unique index
ALTER TABLE code_adjectives ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX idx_code_adjectives_value_unique ON code_adjectives (value);

-- Code nouns table
CREATE TABLE code_nouns (
    id SERIAL PRIMARY KEY,
    value TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and create unique index
ALTER TABLE code_nouns ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX idx_code_nouns_value_unique ON code_nouns (value);

-- Custom code names table
CREATE TABLE custom_code_names (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and create unique index
ALTER TABLE custom_code_names ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX idx_custom_code_names_group_name_unique ON custom_code_names (group_id, name);

-- App schema and outbox table
CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE app.outbox (
    id SERIAL PRIMARY KEY,
    topic TEXT NOT NULL,
    event TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app.outbox ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert adjectives (descriptive words)
INSERT INTO code_adjectives (value) VALUES
('Fuzzy'), ('Fluffy'), ('Bumpy'), ('Lumpy'), ('Wiggly'), ('Jiggly'), ('Bouncy'), ('Springy'), ('Stretchy'), ('Squishy'),
('Tiny'), ('Mini'), ('Micro'), ('Giant'), ('Mega'), ('Super'), ('Ultra'), ('Hyper'), ('Turbo'), ('Rocket'),
('Happy'), ('Jolly'), ('Merry'), ('Glad'), ('Joyful'), ('Cheerful'), ('Bright'), ('Sunny'), ('Warm'), ('Kind'),
('Sweet'), ('Nice'), ('Good'), ('Great'), ('Amazing'), ('Awesome'), ('Cool'), ('Fun'), ('Silly'), ('Funny'),
('Witty'), ('Smart'), ('Clever'), ('Wise'), ('Brave'), ('Bold'), ('Strong'), ('Tough'), ('Gentle'), ('Swift'),
('Quick'), ('Fast'), ('Speedy'), ('Rapid'), ('Flash'), ('Blur'), ('Whiz'), ('Rush'), ('Zippy'), ('Snappy'),
('Red'), ('Blue'), ('Green'), ('Yellow'), ('Orange'), ('Purple'), ('Pink'), ('Brown'), ('Golden'), ('Silver'),
('Crimson'), ('Scarlet'), ('Azure'), ('Teal'), ('Mint'), ('Lime'), ('Navy'), ('Royal'), ('Sky'), ('Forest'),
('Magic'), ('Mystic'), ('Wonder'), ('Secret'), ('Hidden'), ('Ancient'), ('Noble'), ('Majestic'), ('Grand'), ('Epic'),
('Cozy'), ('Comfy'), ('Snug'), ('Soft'), ('Smooth'), ('Silky'), ('Velvet'), ('Shiny'), ('Sparkly'), ('Glittery'),
('Dancing'), ('Singing'), ('Laughing'), ('Smiling'), ('Giggling'), ('Cheering'), ('Playing'), ('Dreaming'), ('Wishing'), ('Hoping'),
('Loving'), ('Caring'), ('Helping'), ('Sharing'), ('Giving'), ('Hugging'), ('Clapping'), ('Waving'), ('Peeking'), ('Hiding'),
('Fresh'), ('Crisp'), ('Mild'), ('Light'), ('Dark'), ('Morning'), ('Evening'), ('Midnight'), ('Sleepy'), ('Dreamy'),
('Peaceful'), ('Calm'), ('Quiet'), ('Loud'), ('Noisy'), ('Busy'), ('Lazy'), ('Active'), ('Zesty'), ('Spicy'),
('Shimmery'), ('Glowing'), ('Radiant'), ('Brilliant'), ('Dazzling'), ('Gleaming'), ('Twinkling'), ('Beaming'), ('Luminous'), ('Cosmic');

-- Insert nouns (animals, objects, nature, etc.)
INSERT INTO code_nouns (value) VALUES
('Bear'), ('Cat'), ('Dog'), ('Fox'), ('Owl'), ('Bee'), ('Ant'), ('Pig'), ('Cow'), ('Duck'),
('Goat'), ('Fish'), ('Bird'), ('Frog'), ('Seal'), ('Deer'), ('Lamb'), ('Pup'), ('Cub'), ('Kit'),
('Bunny'), ('Chick'), ('Kitten'), ('Puppy'), ('Piglet'), ('Duckling'), ('Calf'), ('Foal'), ('Joey'), ('Fawn'),
('Tiger'), ('Lion'), ('Panda'), ('Koala'), ('Sloth'), ('Otter'), ('Beaver'), ('Squirrel'), ('Chipmunk'), ('Hamster'),
('Mouse'), ('Rat'), ('Mole'), ('Badger'), ('Weasel'), ('Ferret'), ('Raccoon'), ('Hedgehog'), ('Penguin'), ('Dolphin'),
('Apple'), ('Berry'), ('Cherry'), ('Grape'), ('Lemon'), ('Orange'), ('Peach'), ('Pear'), ('Banana'), ('Mango'),
('Cookie'), ('Cake'), ('Pie'), ('Muffin'), ('Donut'), ('Candy'), ('Honey'), ('Sugar'), ('Vanilla'), ('Cocoa'),
('Sun'), ('Moon'), ('Star'), ('Cloud'), ('Rain'), ('Snow'), ('Wind'), ('Storm'), ('Thunder'), ('Lightning'),
('River'), ('Lake'), ('Sea'), ('Beach'), ('Wave'), ('Rock'), ('Stone'), ('Crystal'), ('Diamond'), ('Pearl'),
('Tree'), ('Leaf'), ('Branch'), ('Flower'), ('Rose'), ('Daisy'), ('Tulip'), ('Lily'), ('Mountain'), ('Hill'),
('Ball'), ('Box'), ('Cup'), ('Hat'), ('Key'), ('Bell'), ('Book'), ('Pen'), ('Clock'), ('Watch'),
('Lamp'), ('Candle'), ('Mirror'), ('Window'), ('Door'), ('Toy'), ('Game'), ('Puzzle'), ('Card'), ('Coin'),
('Ring'), ('Gem'), ('Crown'), ('Boat'), ('Ship'), ('Car'), ('Train'), ('Plane'), ('Bike'), ('Kite'),
('Balloon'), ('Castle'), ('Tower'), ('Palace'), ('Bridge'), ('Gate'), ('Garden'), ('Meadow'), ('Valley'), ('Canyon'),
('Quest'), ('Adventure'), ('Journey'), ('Path'), ('Trail'), ('Road'), ('World'), ('Planet'), ('Comet'), ('Galaxy'),
('Wizard'), ('Fairy'), ('Angel'), ('Knight'), ('Prince'), ('Princess'), ('King'), ('Queen'), ('Hero'), ('Champion'),
('Ninja'), ('Pirate'), ('Explorer'), ('Hunter'), ('Scout'), ('Guardian'), ('Warrior'), ('Archer'), ('Mage'), ('Sage'),
('Phoenix'), ('Dragon'), ('Unicorn'), ('Griffin'), ('Pegasus'), ('Sphinx'), ('Kraken'), ('Hydra'), ('Centaur'), ('Minotaur'),
('Tornado'), ('Hurricane'), ('Blizzard'), ('Rainbow'), ('Aurora'), ('Eclipse'), ('Meteor'), ('Nebula'), ('Quasar'), ('Pulsar'),
('Compass'), ('Anchor'), ('Sword'), ('Shield'), ('Bow'), ('Arrow'), ('Spear'), ('Staff'), ('Wand'), ('Orb');

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to generate code names (adjective + noun)
CREATE OR REPLACE FUNCTION get_code_name()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    adjective_word TEXT;
    noun_word TEXT;
    combined_name TEXT;
BEGIN
    -- Get random adjective
    SELECT value INTO adjective_word
    FROM code_adjectives
    WHERE enabled = TRUE
    ORDER BY RANDOM()
    LIMIT 1;

    -- Get random noun
    SELECT value INTO noun_word
    FROM code_nouns
    WHERE enabled = TRUE
    ORDER BY RANDOM()
    LIMIT 1;

    -- Check if we have both words
    IF adjective_word IS NULL THEN
        RAISE EXCEPTION 'No enabled adjectives available';
    END IF;

    IF noun_word IS NULL THEN
        RAISE EXCEPTION 'No enabled nouns available';
    END IF;

    -- Combine adjective + noun
    combined_name := adjective_word || noun_word;

    RETURN combined_name;
END;
$$;

-- Function to get available custom code name from group
CREATE OR REPLACE FUNCTION get_custom_code_name(p_group_id INTEGER)
RETURNS TABLE(id INTEGER, name TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Get random custom code name that is not already assigned to a member
    RETURN QUERY
    SELECT ccn.id, ccn.name
    FROM custom_code_names ccn
    WHERE ccn.group_id = p_group_id
    AND ccn.id NOT IN (
        SELECT m.custom_code_name_id
        FROM members m
        WHERE m.group_id = p_group_id
        AND m.custom_code_name_id IS NOT NULL
    )
    ORDER BY RANDOM()
    LIMIT 1;

    -- Check if we found an available name
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No available custom code names for this group';
    END IF;
END;
$$;

-- Function to validate if creator code matches group's creator
CREATE OR REPLACE FUNCTION is_creator(
    p_group_guid TEXT,
    p_creator_code TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the provided creator_code matches the group's creator_code
    RETURN EXISTS (
        SELECT 1
        FROM groups
        WHERE group_guid = p_group_guid
        AND creator_code = p_creator_code
    );
END;
$$;

-- Function to get member information if exists in group
CREATE OR REPLACE FUNCTION get_member(
    p_group_guid TEXT,
    p_member_code TEXT
)
RETURNS TABLE(name TEXT, code_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Return member information if the provided member_code exists in the members table for this group
    RETURN QUERY
    SELECT m.name, m.code_name
    FROM members m
    JOIN groups g ON g.id = m.group_id
    WHERE g.group_guid = p_group_guid
    AND m.code = p_member_code;
END;
$$;

-- Function to check if a member exists in a group and group is not expired
CREATE OR REPLACE FUNCTION is_member(
    p_group_guid TEXT,
    p_member_code TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Return true if the provided member_code exists in the members table for this group and group is not expired
    RETURN EXISTS (
        SELECT 1
        FROM members m
        JOIN groups g ON g.id = m.group_id
        WHERE g.group_guid = p_group_guid
        AND m.code = p_member_code
        AND (g.expiry_date IS NULL OR g.expiry_date > NOW())
    );
END;
$$;

-- Function to get group details
CREATE OR REPLACE FUNCTION get_group(
    p_group_guid TEXT
)
RETURNS TABLE(
    password TEXT,
    capacity INTEGER,
    description TEXT,
    is_open BOOLEAN,
    expiry_date TIMESTAMP WITH TIME ZONE,
    use_code_names BOOLEAN,
    auto_assign_code_names BOOLEAN,
    use_custom_code_names BOOLEAN,
    creator_name TEXT,
    is_frozen BOOLEAN,
    member_count INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    group_id_var INTEGER;
BEGIN
    -- Check if group exists and get its ID
    SELECT id INTO group_id_var
    FROM groups
    WHERE group_guid = p_group_guid;

    -- If group doesn't exist, throw exception
    IF group_id_var IS NULL THEN
        RAISE EXCEPTION 'Group with GUID % does not exist', p_group_guid;
    END IF;

    -- Return group details including member count
    RETURN QUERY
    SELECT
        g.password,
        g.capacity,
        g.description,
        g.is_open,
        g.expiry_date,
        g.use_code_names,
        g.auto_assign_code_names,
        g.use_custom_code_names,
        g.creator_name,
        g.is_frozen,
        COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM members m
            WHERE m.group_id = g.id
        ), 0) AS member_count
    FROM groups g
    WHERE g.id = group_id_var;
END;
$$;

-- Function to get groups where user is a member or creator
CREATE OR REPLACE FUNCTION get_my_groups(
    p_member_code TEXT
)
RETURNS TABLE(
    group_guid TEXT,
    password_required BOOLEAN,
    capacity INTEGER,
    description TEXT,
    is_open BOOLEAN,
    expiry_date TIMESTAMP WITH TIME ZONE,
    use_code_names BOOLEAN,
    auto_assign_code_names BOOLEAN,
    use_custom_code_names BOOLEAN,
    creator_name TEXT,
    is_frozen BOOLEAN,
    is_creator BOOLEAN,
    name TEXT,
    member_count INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Return non-expired groups where user is either a member or the creator
    RETURN QUERY
    SELECT
        g.group_guid,
        (g.password IS NOT NULL) AS password_required,
        g.capacity,
        g.description,
        g.is_open,
        g.expiry_date,
        g.use_code_names,
        g.auto_assign_code_names,
        g.use_custom_code_names,
        g.creator_name,
        g.is_frozen,
        (g.creator_code = p_member_code) AS is_creator,
        CASE
            WHEN m.code IS NOT NULL AND g.use_code_names = false THEN m.name
            WHEN m.code IS NOT NULL AND g.use_code_names = true THEN m.code_name
            ELSE g.creator_name
        END AS name,
        COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM members m2
            WHERE m2.group_id = g.id
        ), 0) AS member_count
    FROM groups g
    LEFT JOIN members m ON g.id = m.group_id AND m.code = p_member_code
    WHERE
        -- Group is not expired
        (g.expiry_date IS NULL OR g.expiry_date > NOW())
        AND (
            -- User is a member of this group
            m.code IS NOT NULL
            OR
            -- User is the creator of this group
            g.creator_code = p_member_code
        )
    ORDER BY g.created_date DESC;
END;
$$;

-- Function to create a new group
CREATE OR REPLACE FUNCTION create_group(
    p_capacity INTEGER,
    p_use_code_names BOOLEAN,
    p_auto_assign_code_names BOOLEAN,
    p_use_custom_code_names BOOLEAN,
    p_creator_name TEXT,
    p_creator_code TEXT,
    p_description TEXT,
    p_password TEXT DEFAULT NULL,
    p_expiry_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_custom_code_names TEXT[] DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    generated_guid TEXT;
    new_group_id INTEGER;
    custom_name TEXT;
BEGIN
    -- Validate that description is provided
    IF p_description IS NULL OR LENGTH(TRIM(p_description)) = 0 THEN
        RAISE EXCEPTION 'Description is required';
    END IF;

    -- Validate that expiry date is in the future (if provided)
    IF p_expiry_date IS NOT NULL AND p_expiry_date <= NOW() THEN
        RAISE EXCEPTION 'Expiry date must be in the future';
    END IF;

    -- Validate custom code names if use_custom_code_names is true
    IF p_use_custom_code_names THEN
            IF p_custom_code_names IS NULL OR array_length(p_custom_code_names, 1) IS NULL THEN
                RAISE EXCEPTION 'Custom code names are required';
            END IF;

            IF array_length(p_custom_code_names, 1) < p_capacity THEN
                RAISE EXCEPTION 'The number of custom code names should not be less than the group''s capacity';
            END IF;
    END IF;

    -- Generate a new GUID
    generated_guid := gen_random_uuid()::text;

    -- Insert the new group
    INSERT INTO groups (
        group_guid,
        password,
        capacity,
        use_code_names,
        auto_assign_code_names,
        use_custom_code_names,
        creator_name,
        creator_code,
        description,
        is_open,
        expiry_date
    )
    VALUES (
        generated_guid,
        p_password,
        p_capacity,
        p_use_code_names,
        p_auto_assign_code_names,
        p_use_custom_code_names,
        p_creator_name,
        p_creator_code,
        p_description,
        TRUE, -- Always open for new groups
        COALESCE(p_expiry_date, NOW() + INTERVAL '1 month')
    )
    RETURNING id INTO new_group_id;

    -- Insert custom code names if provided
    IF p_use_custom_code_names AND p_custom_code_names IS NOT NULL THEN
        FOREACH custom_name IN ARRAY p_custom_code_names
        LOOP
            INSERT INTO custom_code_names (group_id, name)
            VALUES (new_group_id, custom_name);
        END LOOP;
    END IF;

    -- Return only the generated GUID
    RETURN generated_guid;
END;
$$;

-- Function to update group settings
CREATE OR REPLACE FUNCTION update_group(
    p_group_guid TEXT,
    p_password TEXT,
    p_capacity INTEGER,
    p_is_open BOOLEAN,
    p_expiry_date TIMESTAMP WITH TIME ZONE,
    p_creator_code TEXT,
    p_additional_custom_code_names TEXT[] DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    group_record RECORD;
    current_member_count INTEGER;
    current_custom_names_count INTEGER;
    total_custom_names_count INTEGER;
    custom_name TEXT;
BEGIN
    -- Validate that expiry date is in the future (if provided)
    IF p_expiry_date IS NOT NULL AND p_expiry_date <= NOW() THEN
        RAISE EXCEPTION 'Expiry date must be in the future';
    END IF;

    -- Check if a matching record exists with the provided credentials, is not frozen, and is not expired
    SELECT id, capacity, use_custom_code_names
    INTO group_record
    FROM groups
    WHERE group_guid = p_group_guid
      AND creator_code = p_creator_code
      AND is_frozen = FALSE
      AND (expiry_date IS NULL OR expiry_date > NOW());

    -- If no matching record found or group is frozen/expired, throw exception
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Group not found, invalid creator credentials, group is frozen, or group has expired';
    END IF;

    -- Get current member count
    SELECT COUNT(*) INTO current_member_count
    FROM members
    WHERE group_id = group_record.id;

    -- Validate that new capacity is not lower than current member count
    IF p_capacity < current_member_count THEN
        RAISE EXCEPTION 'Cannot set capacity to % as there are already % members in the group', p_capacity, current_member_count;
    END IF;

    -- If additional custom code names are provided and group uses custom code names, validate them
    IF p_additional_custom_code_names IS NOT NULL AND group_record.use_custom_code_names THEN
        -- Get current count of custom code names for this group
        SELECT COUNT(*) INTO current_custom_names_count
        FROM custom_code_names
        WHERE group_id = group_record.id;

        -- Calculate total count including additional names
        total_custom_names_count := current_custom_names_count + array_length(p_additional_custom_code_names, 1);

        -- Validate that total custom code names is not less than capacity
        IF total_custom_names_count < p_capacity THEN
            RAISE EXCEPTION 'Total custom code names (% existing + % additional = %) cannot be less than capacity (%)',
                current_custom_names_count,
                array_length(p_additional_custom_code_names, 1),
                total_custom_names_count,
                p_capacity;
        END IF;

        -- Validate that none of the additional custom code names already exist
        FOREACH custom_name IN ARRAY p_additional_custom_code_names
        LOOP
            IF EXISTS(
                SELECT 1 FROM custom_code_names
                WHERE group_id = group_record.id AND name = custom_name
            ) THEN
                RAISE EXCEPTION 'Custom code name "%" already exists in this group', custom_name;
            END IF;
        END LOOP;

        -- Insert the additional custom code names
        FOREACH custom_name IN ARRAY p_additional_custom_code_names
        LOOP
            INSERT INTO custom_code_names (group_id, name)
            VALUES (group_record.id, custom_name);
        END LOOP;
    END IF;

    -- Update the group with all provided fields
    UPDATE groups
    SET
        password = p_password,
        capacity = p_capacity,
        is_open = p_is_open,
        expiry_date = p_expiry_date
    WHERE group_guid = p_group_guid
      AND creator_code = p_creator_code;
END;
$$;

-- Function to delete a group
CREATE OR REPLACE FUNCTION delete_group(
    p_group_guid TEXT,
    p_creator_code TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    group_id_found INTEGER;
BEGIN
    -- Check if group exists with correct creator credentials and get the group ID
    SELECT id INTO group_id_found
    FROM groups
    WHERE group_guid = p_group_guid
      AND creator_code = p_creator_code;

    -- If no matching record found, throw exception
    IF group_id_found IS NULL THEN
        RAISE EXCEPTION 'Group not found or invalid creator credentials';
    END IF;

    -- Delete all Secret Santa assignments for this group
    DELETE FROM santas WHERE group_id = group_id_found;

    -- Delete all members for this group
    DELETE FROM members WHERE group_id = group_id_found;

    -- Delete all custom code names for this group
    DELETE FROM custom_code_names WHERE group_id = group_id_found;

    -- Delete the group
    DELETE FROM groups
    WHERE group_guid = p_group_guid
      AND creator_code = p_creator_code;
END;
$$;

-- Function to join a group
CREATE OR REPLACE FUNCTION join_group(
    p_group_guid TEXT,
    p_password TEXT,
    p_name TEXT,
    p_code TEXT,
    p_code_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    group_record RECORD;
    final_code_name TEXT;
    name_exists BOOLEAN := FALSE;
    code_name_exists BOOLEAN := FALSE;
    max_attempts INTEGER := 100;
    attempt_count INTEGER := 0;
BEGIN
    -- Validate group exists with correct password, is not frozen, and is not expired
    SELECT id, group_guid, use_code_names, auto_assign_code_names, use_custom_code_names, capacity, creator_name, creator_code
    INTO group_record
    FROM groups
    WHERE group_guid = p_group_guid
      AND (
          (p_password IS NOT NULL AND password = p_password) OR
          (p_password IS NULL AND password IS NULL)
      )
      AND is_open = TRUE
      AND is_frozen = FALSE
      AND (expiry_date IS NULL OR expiry_date > NOW());

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Group not found, invalid password, group is closed, group is frozen, or group has expired';
    END IF;

    -- Check if name matches creator name and if user is not the creator
    IF p_name = group_record.creator_name AND p_code != group_record.creator_code THEN
        RAISE EXCEPTION 'Name matches the group creator. Only the creator can use this name.';
    END IF;

    -- Check if user is already a member of this group
    IF EXISTS(SELECT 1 FROM members WHERE group_id = group_record.id AND code = p_code) THEN
        RAISE EXCEPTION 'You are already a member of this group';
    END IF;

    -- Check if group is at capacity
    IF (SELECT COUNT(*) FROM members WHERE group_id = group_record.id) >= group_record.capacity THEN
        RAISE EXCEPTION 'Group is at full capacity';
    END IF;

    -- Check if name already exists in the group
    SELECT EXISTS(
        SELECT 1 FROM members
        WHERE group_id = group_record.id AND name = p_name
    ) INTO name_exists;

    IF name_exists THEN
        RAISE EXCEPTION 'Name already exists in this group';
    END IF;

    -- Validate code_name requirements
    IF group_record.use_code_names AND p_code_name IS NULL AND NOT group_record.auto_assign_code_names THEN
        RAISE EXCEPTION 'Code name is required for this group';
    END IF;

    -- Determine final code name and custom code name assignment
    IF group_record.auto_assign_code_names THEN
        IF group_record.use_custom_code_names THEN
            -- Auto-assign custom code name
            DECLARE
                custom_code_record RECORD;
            BEGIN
                SELECT * INTO custom_code_record FROM get_custom_code_name(group_record.id);

                -- Insert the new member with custom code name
                INSERT INTO members (group_id, name, code, code_name, custom_code_name_id)
                VALUES (group_record.id, p_name, p_code, custom_code_record.name, custom_code_record.id);
            END;
        ELSE
            -- Auto-assign regular code name, retry if duplicate found
            LOOP
                attempt_count := attempt_count + 1;

                IF attempt_count > max_attempts THEN
                    RAISE EXCEPTION 'Unable to generate unique code name after % attempts', max_attempts;
                END IF;

                -- Generate new code name
                final_code_name := get_code_name();

                -- Check if this code name already exists in the group
                SELECT EXISTS(
                    SELECT 1 FROM members
                    WHERE group_id = group_record.id AND code_name = final_code_name
                ) INTO code_name_exists;

                -- Exit loop if we found a unique code name
                IF NOT code_name_exists THEN
                    EXIT;
                END IF;
            END LOOP;

            -- Insert the new member with regular code name
            INSERT INTO members (group_id, name, code, code_name)
            VALUES (group_record.id, p_name, p_code, final_code_name);
        END IF;
    ELSE
        -- Use provided code name or assign name if use_code_names is false
        IF group_record.use_code_names THEN
            final_code_name := p_code_name;
        ELSE
            final_code_name := p_name;
        END IF;

        -- If code name is provided, check for duplicates
        IF final_code_name IS NOT NULL THEN
            SELECT EXISTS(
                SELECT 1 FROM members
                WHERE group_id = group_record.id AND code_name = final_code_name
            ) INTO code_name_exists;

            IF code_name_exists THEN
                RAISE EXCEPTION 'Code name already exists in this group';
            END IF;
        END IF;

        -- Insert the new member with provided code name
        INSERT INTO members (group_id, name, code, code_name)
        VALUES (group_record.id, p_name, p_code, final_code_name);
    END IF;
END;
$$;

-- Function to leave a group
CREATE OR REPLACE FUNCTION leave_group(
    p_group_guid TEXT,
    p_code TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    group_id_found INTEGER;
    member_exists BOOLEAN := FALSE;
BEGIN
    -- Validate group exists, is not frozen, and is not expired
    SELECT id INTO group_id_found
    FROM groups
    WHERE group_guid = p_group_guid
      AND is_frozen = FALSE
      AND (expiry_date IS NULL OR expiry_date > NOW());

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Group not found, group is frozen, or group has expired';
    END IF;

    -- Check if member exists in the group with matching code
    SELECT EXISTS(
        SELECT 1 FROM members
        WHERE group_id = group_id_found
          AND code = p_code
    ) INTO member_exists;

    IF NOT member_exists THEN
        RAISE EXCEPTION 'Member not found in this group or invalid credentials';
    END IF;

    -- Delete the member record
    DELETE FROM members
    WHERE group_id = group_id_found
      AND code = p_code;
END;
$$;

-- Function to assign Secret Santa pairs
CREATE OR REPLACE FUNCTION assign_santa(
    p_group_guid TEXT,
    p_creator_code TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    group_record RECORD;
    member_ids INTEGER[];
    shuffled_ids INTEGER[];
    i INTEGER;
    santa_id INTEGER;
    member_id INTEGER;
    member_count INTEGER;
BEGIN
    -- Validate group exists with correct credentials, creator, is not expired, and is not already frozen
    SELECT id, capacity
    INTO group_record
    FROM groups
    WHERE group_guid = p_group_guid
      AND creator_code = p_creator_code
      AND (expiry_date IS NULL OR expiry_date > NOW())
      AND is_frozen = FALSE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Group not found, invalid creator credentials, group has expired, or group is already frozen';
    END IF;

    -- Get all member IDs for this group
    SELECT array_agg(id ORDER BY id) INTO member_ids
    FROM members
    WHERE group_id = group_record.id;

    -- Check if there are enough members (need at least 2)
    member_count := array_length(member_ids, 1);
    IF member_count IS NULL OR member_count < 2 THEN
        RAISE EXCEPTION 'Need at least 2 members to assign Secret Santa pairs';
    END IF;

    -- Clear any existing assignments for this group
    DELETE FROM santas WHERE group_id = group_record.id;

    -- Create a shuffled copy of member IDs
    shuffled_ids := member_ids;

    -- Simple shuffle algorithm (Fisher-Yates)
    FOR i IN REVERSE array_length(shuffled_ids, 1)..2 LOOP
        DECLARE
            j INTEGER;
            temp INTEGER;
        BEGIN
            -- Generate random index from 1 to i
            j := floor(random() * i) + 1;

            -- Swap elements at positions i and j
            temp := shuffled_ids[i];
            shuffled_ids[i] := shuffled_ids[j];
            shuffled_ids[j] := temp;
        END;
    END LOOP;

    -- Ensure no one is assigned to themselves
    -- If someone is assigned to themselves, swap with the next person
    FOR i IN 1..array_length(shuffled_ids, 1) LOOP
        IF member_ids[i] = shuffled_ids[i] THEN
            DECLARE
                next_index INTEGER;
                temp INTEGER;
            BEGIN
                -- Find next index (wrap around if at end)
                next_index := CASE WHEN i = array_length(shuffled_ids, 1) THEN 1 ELSE i + 1 END;

                -- Swap with next person
                temp := shuffled_ids[i];
                shuffled_ids[i] := shuffled_ids[next_index];
                shuffled_ids[next_index] := temp;
            END;
        END IF;
    END LOOP;

    -- Insert the Santa assignments
    FOR i IN 1..array_length(member_ids, 1) LOOP
        santa_id := member_ids[i];           -- Who is the Santa
        member_id := shuffled_ids[i];        -- Who they are giving to

        INSERT INTO santas (group_id, santa_id, member_id)
        VALUES (group_record.id, santa_id, member_id);
    END LOOP;

    -- Freeze the group after successful assignment
    UPDATE groups
    SET is_frozen = TRUE
    WHERE id = group_record.id;
END;
$$;

-- Function to unlock a group
CREATE OR REPLACE FUNCTION unlock_group(
    p_group_guid TEXT,
    p_creator_code TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    group_id_found INTEGER;
    group_exists BOOLEAN := FALSE;
BEGIN
    -- Check if group exists with correct creator credentials, is not expired, is frozen, and get the group ID
    SELECT id INTO group_id_found
    FROM groups
    WHERE group_guid = p_group_guid
      AND creator_code = p_creator_code
      AND (expiry_date IS NULL OR expiry_date > NOW())
      AND is_frozen = TRUE;

    IF group_id_found IS NULL THEN
        RAISE EXCEPTION 'Group not found, invalid creator credentials, group has expired, or group is not frozen';
    END IF;

    -- Delete all Secret Santa assignments for this group
    DELETE FROM santas WHERE group_id = group_id_found;

    -- Unfreeze the group
    UPDATE groups
    SET is_frozen = FALSE
    WHERE group_guid = p_group_guid
      AND creator_code = p_creator_code;
END;
$$;

-- Function to kick a member (creator only)
CREATE OR REPLACE FUNCTION kick_member(
    p_group_guid TEXT,
    p_creator_code TEXT,
    p_member_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    group_record RECORD;
    member_exists BOOLEAN := FALSE;
BEGIN
    -- Validate group exists with correct creator, is not frozen, and is not expired
    SELECT id, creator_code
    INTO group_record
    FROM groups
    WHERE group_guid = p_group_guid
      AND creator_code = p_creator_code
      AND is_frozen = FALSE
      AND (expiry_date IS NULL OR expiry_date > NOW());

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Group not found, invalid creator credentials, group is frozen, or group has expired';
    END IF;

    -- Check if member exists in the group with the given name
    SELECT EXISTS(
        SELECT 1 FROM members
        WHERE group_id = group_record.id
          AND name = p_member_name
    ) INTO member_exists;

    IF NOT member_exists THEN
        RAISE EXCEPTION 'Member not found in this group';
    END IF;

    -- Delete the member record
    DELETE FROM members
    WHERE group_id = group_record.id
      AND name = p_member_name;
END;
$$;

-- Function to get Secret Santa recipient
CREATE OR REPLACE FUNCTION get_my_secret_santa(
    p_group_guid TEXT,
    p_code TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    group_id_var INTEGER;
    my_member_id INTEGER;
    recipient_code_name TEXT;
BEGIN
    -- Validate group exists and is not expired
    SELECT id INTO group_id_var
    FROM groups
    WHERE group_guid = p_group_guid
      AND (expiry_date IS NULL OR expiry_date > NOW());

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Group not found or group has expired';
    END IF;

    -- Find my member ID using only code
    SELECT id INTO my_member_id
    FROM members
    WHERE group_id = group_id_var
      AND code = p_code;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Member not found in this group or invalid credentials';
    END IF;

    -- Find who I'm giving a gift to (where I am the santa) and get their code_name
    SELECT m.code_name INTO recipient_code_name
    FROM santas s
    JOIN members m ON m.id = s.member_id
    WHERE s.group_id = group_id_var
      AND s.santa_id = my_member_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Secret Santa assignments have not been made yet';
    END IF;

    -- Return the code_name directly
    RETURN recipient_code_name;
END;
$$;

-- Function to get all members in a group
CREATE OR REPLACE FUNCTION get_members(
    p_group_guid TEXT,
    p_member_code TEXT
)
RETURNS TABLE(name TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
    group_id_found INTEGER;
    member_exists BOOLEAN := FALSE;
    is_creator BOOLEAN := FALSE;
BEGIN
    -- Find the group ID and validate it's not expired
    SELECT id INTO group_id_found
    FROM groups
    WHERE group_guid = p_group_guid
      AND (expiry_date IS NULL OR expiry_date > NOW());

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Group not found or group has expired';
    END IF;

    -- Check if member_code is the creator_code
    SELECT EXISTS(
        SELECT 1
        FROM groups
        WHERE id = group_id_found
        AND creator_code = p_member_code
    ) INTO is_creator;

    -- Validate that the member exists in this group OR is the creator
    SELECT EXISTS(
        SELECT 1 FROM members
        WHERE group_id = group_id_found
          AND code = p_member_code
    ) INTO member_exists;

    IF NOT member_exists AND NOT is_creator THEN
        RAISE EXCEPTION 'Member not found in this group and is not the creator or invalid credentials';
    END IF;

    -- Return all member names for this group
    RETURN QUERY
    SELECT m.name
    FROM members m
    WHERE m.group_id = group_id_found
    ORDER BY m.name;
END;
$$;

-- ============================================================================
-- TRIGGER FUNCTIONS
-- ============================================================================

-- Function to handle outbox changes and send realtime events
CREATE OR REPLACE FUNCTION app.handle_outbox_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Send realtime notification with the event data
    PERFORM realtime.send(
        NEW.payload,
        NEW.event,
        NEW.topic,
        false
    );

    RETURN NEW;
END;
$$;

-- Function to handle member join events
CREATE OR REPLACE FUNCTION app.handle_member_joined()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    group_guid_value TEXT;
BEGIN
    -- Get the group_guid for the group this member joined
    SELECT group_guid INTO group_guid_value
    FROM groups
    WHERE id = NEW.group_id;

    -- Insert outbox event for member joined
    INSERT INTO app.outbox (topic, event, payload)
    VALUES (
        'group:' || group_guid_value,
        'member_joined',
        jsonb_build_object(
            'group_guid', group_guid_value,
            'name', NEW.name
        )
    );

    RETURN NEW;
END;
$$;

-- Function to handle member leave events
CREATE OR REPLACE FUNCTION app.handle_member_left()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    group_guid_value TEXT;
BEGIN
    -- Get the group_guid for the group this member left
    SELECT group_guid INTO group_guid_value
    FROM groups
    WHERE id = OLD.group_id;

    -- Insert outbox event for member left
    INSERT INTO app.outbox (topic, event, payload)
    VALUES (
        'group:' || group_guid_value,
        'member_left',
        jsonb_build_object(
            'group_guid', group_guid_value,
            'name', OLD.name
        )
    );

    RETURN OLD;
END;
$$;

-- Function to handle group lock/unlock events
CREATE OR REPLACE FUNCTION app.handle_group_lock_unlock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if is_frozen column changed
    IF OLD.is_frozen IS DISTINCT FROM NEW.is_frozen THEN
        -- Group was locked (frozen)
        IF NEW.is_frozen = TRUE AND OLD.is_frozen = FALSE THEN
            INSERT INTO app.outbox (topic, event, payload)
            VALUES (
                'group:' || NEW.group_guid,
                'group_locked',
                jsonb_build_object(
                    'group_guid', NEW.group_guid
                )
            );
        -- Group was unlocked (unfrozen)
        ELSIF NEW.is_frozen = FALSE AND OLD.is_frozen = TRUE THEN
            INSERT INTO app.outbox (topic, event, payload)
            VALUES (
                'group:' || NEW.group_guid,
                'group_unlocked',
                jsonb_build_object(
                    'group_guid', NEW.group_guid
                )
            );
        END IF;
    END IF;

    -- Check if is_open column changed
    IF OLD.is_open IS DISTINCT FROM NEW.is_open THEN
        -- Group was opened
        IF NEW.is_open = TRUE AND OLD.is_open = FALSE THEN
            INSERT INTO app.outbox (topic, event, payload)
            VALUES (
                'group:' || NEW.group_guid,
                'group_opened',
                jsonb_build_object(
                    'group_guid', NEW.group_guid
                )
            );
        -- Group was closed
        ELSIF NEW.is_open = FALSE AND OLD.is_open = TRUE THEN
            INSERT INTO app.outbox (topic, event, payload)
            VALUES (
                'group:' || NEW.group_guid,
                'group_closed',
                jsonb_build_object(
                    'group_guid', NEW.group_guid
                )
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Function to purge expired data
CREATE OR REPLACE FUNCTION app.purge_data(
    delete_all BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
    deleted_santas INTEGER,
    deleted_members INTEGER,
    deleted_groups INTEGER,
    deleted_outbox_messages INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    santas_deleted INTEGER := 0;
    members_deleted INTEGER := 0;
    groups_deleted INTEGER := 0;
    outbox_deleted INTEGER := 0;
    target_group_ids INTEGER[];
BEGIN
    IF delete_all THEN
        -- Get all group IDs when delete_all is true
        SELECT array_agg(id) INTO target_group_ids
        FROM groups;
    ELSE
        -- Get IDs of expired groups only
        SELECT array_agg(id) INTO target_group_ids
        FROM groups
        WHERE expiry_date IS NOT NULL
        AND expiry_date <= NOW();
    END IF;

    -- Only proceed if there are groups to delete
    IF target_group_ids IS NOT NULL AND array_length(target_group_ids, 1) > 0 THEN
        -- Delete santa assignments for target groups (step 1)
        DELETE FROM santas
        WHERE group_id = ANY(target_group_ids);
        GET DIAGNOSTICS santas_deleted = ROW_COUNT;

        -- Delete members from target groups (step 2)
        DELETE FROM members
        WHERE group_id = ANY(target_group_ids);
        GET DIAGNOSTICS members_deleted = ROW_COUNT;

        -- Delete target groups (step 3)
        DELETE FROM groups
        WHERE id = ANY(target_group_ids);
        GET DIAGNOSTICS groups_deleted = ROW_COUNT;
    END IF;

    IF delete_all THEN
        -- Delete all outbox messages when delete_all is true
        DELETE FROM app.outbox;
        GET DIAGNOSTICS outbox_deleted = ROW_COUNT;
    ELSE
        -- Delete outbox messages older than 1 hour
        DELETE FROM app.outbox
        WHERE created_date <= NOW() - INTERVAL '1 hour';
        GET DIAGNOSTICS outbox_deleted = ROW_COUNT;
    END IF;

    -- Return counts
    RETURN QUERY SELECT santas_deleted, members_deleted, groups_deleted, outbox_deleted;
END;
$$;

-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- SCHEDULED JOBS
-- ============================================================================

-- Add a daily cron job to purge expired data
-- This job runs every day at 2:00 AM UTC
SELECT cron.schedule(
    'daily_purge_expired_data',
    '0 2 * * *',
    'SELECT app.purge_data();'
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for outbox realtime events
CREATE TRIGGER outbox_realtime_trigger
    AFTER INSERT ON app.outbox
    FOR EACH ROW
    EXECUTE FUNCTION app.handle_outbox_changes();

-- Trigger for member joined events
CREATE TRIGGER members_joined_trigger
    AFTER INSERT ON public.members
    FOR EACH ROW
    EXECUTE FUNCTION app.handle_member_joined();

-- Trigger for member left events
CREATE TRIGGER members_left_trigger
    AFTER DELETE ON public.members
    FOR EACH ROW
    EXECUTE FUNCTION app.handle_member_left();

-- Trigger for group lock/unlock events
CREATE TRIGGER groups_lock_unlock_trigger
    AFTER UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION app.handle_group_lock_unlock();

-- ============================================================================
-- PERMISSIONS AND SECURITY
-- ============================================================================

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA app TO anon, authenticated;

-- Grant schema usage permissions to PUBLIC (includes all roles)
GRANT USAGE ON SCHEMA app TO PUBLIC;

-- Grant table permissions on app.outbox to PUBLIC so trigger functions can insert/select
GRANT INSERT ON TABLE app.outbox TO PUBLIC;
GRANT SELECT ON TABLE app.outbox TO PUBLIC;

-- Grant sequence permissions for auto-incrementing id column
GRANT USAGE, SELECT ON SEQUENCE app.outbox_id_seq TO PUBLIC;

-- Grant execute permissions on trigger functions (called automatically by triggers)
GRANT EXECUTE ON FUNCTION app.handle_outbox_changes() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app.handle_member_joined() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app.handle_member_left() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app.handle_group_lock_unlock() TO anon, authenticated;

-- ============================================================================
-- REALTIME SETUP
-- ============================================================================

-- Enable realtime for outbox table
ALTER PUBLICATION supabase_realtime_messages_publication ADD TABLE app.outbox;

-- Allow anonymous access to realtime messages for subscriptions
CREATE POLICY "Allow anonymous access to realtime messages"
ON realtime.messages
FOR SELECT
TO anon
USING (true);

-- Allow anonymous access to app.outbox for sending subscription events
CREATE POLICY "Allow anon to select access outbox"
ON app.outbox
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anon to insert access outbox"
ON app.outbox
FOR INSERT
TO anon
WITH CHECK (true);


-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Secret Santa Database Schema Created Successfully!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Tables: groups, members, santas, code_adjectives, code_nouns, app.outbox';
    RAISE NOTICE 'Functions: % functions created', (
        SELECT COUNT(*) FROM pg_proc
        WHERE pronamespace IN (
            SELECT oid FROM pg_namespace WHERE nspname IN ('public', 'app')
        ) AND proname IN (
            'create_group', 'update_group', 'delete_group', 'join_group',
            'leave_group', 'assign_santa', 'unlock_group', 'kick_member',
            'get_my_secret_santa', 'get_members', 'get_code_name', 'get_group'
        )
    );
    RAISE NOTICE 'Triggers: % triggers created', (
        SELECT COUNT(*) FROM pg_trigger
        WHERE tgname IN (
            'outbox_realtime_trigger', 'members_joined_trigger',
            'members_left_trigger', 'groups_lock_unlock_trigger'
        )
    );
    RAISE NOTICE 'Seed Data: % adjectives, % nouns',
        (SELECT COUNT(*) FROM code_adjectives),
        (SELECT COUNT(*) FROM code_nouns);
    RAISE NOTICE 'Realtime: Enabled for outbox events';
    RAISE NOTICE '==============================================';
END $$;