-- Secret Santa Database Schema - MINIMAL PERMISSIONS VERSION
-- Complete migration script with only absolutely necessary permissions

-- ============================================================================
-- TABLES
-- ============================================================================

-- Groups table (no dependencies)
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    group_guid TEXT NOT NULL,
    name TEXT NOT NULL,
    password BYTEA,
    capacity INTEGER NOT NULL,
    use_code_names BOOLEAN NOT NULL,
    auto_assign_code_names BOOLEAN NOT NULL,
    use_custom_code_names BOOLEAN NOT NULL,
    creator_name TEXT NOT NULL,
    creator_code TEXT NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT,
    is_open BOOLEAN NOT NULL DEFAULT TRUE,
    expiry_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
    is_frozen BOOLEAN NOT NULL DEFAULT FALSE
);

-- Enable RLS but NO POLICIES - only SECURITY DEFINER functions can access
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX idx_group_guid_unique ON groups (group_guid);

-- Custom code names table (depends on groups)
CREATE TABLE custom_code_names (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS but NO POLICIES - only SECURITY DEFINER functions can access
ALTER TABLE custom_code_names ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX idx_custom_code_names_group_name_unique ON custom_code_names (group_id, name);

-- Members table (depends on groups and custom_code_names)
CREATE TABLE members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    code_name TEXT,
    custom_code_name_id INTEGER REFERENCES custom_code_names(id) ON DELETE SET NULL,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS but NO POLICIES - only SECURITY DEFINER functions can access
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
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS but NO POLICIES - only SECURITY DEFINER functions can access
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

-- Enable RLS but NO POLICIES - only SECURITY DEFINER functions can access
ALTER TABLE code_adjectives ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX idx_code_adjectives_value_unique ON code_adjectives (value);

-- Code nouns table
CREATE TABLE code_nouns (
    id SERIAL PRIMARY KEY,
    value TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS but NO POLICIES - only SECURITY DEFINER functions can access
ALTER TABLE code_nouns ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX idx_code_nouns_value_unique ON code_nouns (value);

-- Backup codes table for temporary creator code storage
CREATE TABLE backup_codes (
    id SERIAL PRIMARY KEY,
    backup_guid TEXT NOT NULL,
    creator_code TEXT NOT NULL,
    password TEXT NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 day'),
    restored_by TEXT
);

-- Enable RLS but NO POLICIES - only SECURITY DEFINER functions can access
ALTER TABLE backup_codes ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX idx_backup_codes_guid_unique ON backup_codes (backup_guid);
CREATE INDEX idx_backup_codes_expiry ON backup_codes (expiry_date);
CREATE INDEX idx_backup_codes_creator_code ON backup_codes (creator_code);

-- Messages table for group and individual messaging
-- group_message_id references the original group message (NULL for individual messages and original group messages)
-- sender_id can be NULL for group messages sent by non-member admins
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    recipient_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    group_message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
    is_from_secret_santa BOOLEAN NOT NULL DEFAULT FALSE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_date TIMESTAMP WITH TIME ZONE
);

-- Enable RLS but NO POLICIES - only SECURITY DEFINER functions can access
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_messages_group_id ON messages (group_id);
CREATE INDEX idx_messages_sender_id ON messages (sender_id);
CREATE INDEX idx_messages_recipient_id ON messages (recipient_id);
CREATE INDEX idx_messages_created_date ON messages (created_date);
CREATE INDEX idx_messages_group_message_id ON messages (group_message_id);
CREATE INDEX idx_messages_is_from_secret_santa ON messages (is_from_secret_santa);

-- App schema and outbox table for realtime events
CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE app.outbox (
    id SERIAL PRIMARY KEY,
    topic TEXT NOT NULL,
    event TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS with minimal policy for realtime subscriptions
ALTER TABLE app.outbox ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert adjectives (descriptive words)
INSERT INTO public.code_adjectives (value) VALUES
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
INSERT INTO public.code_nouns (value) VALUES
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
-- FUNCTIONS (All SECURITY DEFINER - handle their own permissions)
-- ============================================================================

-- Function to generate code names (adjective + noun)
CREATE OR REPLACE FUNCTION get_code_name()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    adjective_word TEXT;
    noun_word TEXT;
    combined_name TEXT;
BEGIN
    -- Get random adjective
    SELECT value INTO adjective_word
    FROM public.code_adjectives
    WHERE enabled = TRUE
    ORDER BY RANDOM()
    LIMIT 1;

    -- Get random noun
    SELECT value INTO noun_word
    FROM public.code_nouns
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
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Get random custom code name that is not already assigned to a member
    RETURN QUERY
    SELECT ccn.id, ccn.name
    FROM public.custom_code_names ccn
    WHERE ccn.group_id = p_group_id
    AND ccn.id NOT IN (
        SELECT m.custom_code_name_id
        FROM public.members m
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

-- Function to get all custom code names for a group
CREATE OR REPLACE FUNCTION get_custom_code_names(
    p_group_guid TEXT,
    p_creator_code TEXT
)
RETURNS TABLE(name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    group_id_found INTEGER;
    use_custom_names BOOLEAN;
BEGIN
    -- Check if group exists with correct creator credentials, is not expired, and get the group ID and custom names setting
    SELECT g.id, g.use_custom_code_names INTO group_id_found, use_custom_names
    FROM public.groups g
    WHERE g.group_guid = p_group_guid
      AND g.creator_code = p_creator_code
      AND (g.expiry_date IS NULL OR g.expiry_date > NOW());

    IF group_id_found IS NULL THEN
        RAISE EXCEPTION 'Group not found, invalid creator credentials, or group has expired';
    END IF;

    -- Check if the group uses custom code names
    IF NOT use_custom_names THEN
        RAISE EXCEPTION 'Group does not use custom code names';
    END IF;

    -- Return all custom code names for this group
    RETURN QUERY
    SELECT ccn.name
    FROM public.custom_code_names ccn
    WHERE ccn.group_id = group_id_found
    ORDER BY ccn.name;
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
SET search_path = ''
AS $$
BEGIN
    -- Check if the provided creator_code matches the group's creator_code
    RETURN EXISTS (
        SELECT 1
        FROM public.groups
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
SET search_path = ''
AS $$
BEGIN
    -- Return member information if the provided member_code exists in the members table for this group
    RETURN QUERY
    SELECT m.name, m.code_name
    FROM public.members m
    JOIN public.groups g ON g.id = m.group_id
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
SET search_path = ''
AS $$
BEGIN
    -- Return true if the provided member_code exists in the members table for this group and group is not expired
    RETURN EXISTS (
        SELECT 1
        FROM public.members m
        JOIN public.groups g ON g.id = m.group_id
        WHERE g.group_guid = p_group_guid
        AND m.code = p_member_code
        AND (g.expiry_date IS NULL OR g.expiry_date > NOW())
    );
END;
$$;

-- Function to get group details
CREATE OR REPLACE FUNCTION get_group(
    p_group_guid TEXT,
    p_member_code TEXT DEFAULT NULL
)
RETURNS TABLE(
    name TEXT,
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
    member_count INTEGER,
    is_admin BOOLEAN,
    is_member BOOLEAN,
    has_password BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    group_id_var INTEGER;
    is_creator_check BOOLEAN := FALSE;
    is_member_check BOOLEAN := FALSE;
BEGIN
    -- Check if group exists and get its ID
    SELECT id INTO group_id_var
    FROM public.groups
    WHERE group_guid = p_group_guid;

    -- If group doesn't exist, throw exception
    IF group_id_var IS NULL THEN
        RAISE EXCEPTION 'Group not found';
    END IF;

    -- Check if the member_code matches the creator_code and if user is a member
    IF p_member_code IS NOT NULL THEN
        SELECT (creator_code = p_member_code) INTO is_creator_check
        FROM public.groups
        WHERE group_guid = p_group_guid;

        SELECT EXISTS(
            SELECT 1 FROM public.members
            WHERE group_id = group_id_var AND code = p_member_code
        ) INTO is_member_check;
    END IF;

    -- Return group details with conditional password access and membership info
    RETURN QUERY
    SELECT
        g.name,
        CASE
            WHEN is_creator_check AND g.password IS NOT NULL THEN
                extensions.pgp_sym_decrypt(g.password, app.get_encryption_key())
            ELSE NULL
        END AS password,
        g.capacity,
        g.description,
        g.is_open,
        g.expiry_date,
        g.use_code_names,
        g.auto_assign_code_names,
        g.use_custom_code_names,
        g.creator_name,
        g.is_frozen,
        COALESCE(member_count_result.count, 0)::INTEGER AS member_count,
        is_creator_check AS is_admin,
        is_member_check AS is_member,
        (g.password IS NOT NULL) AS has_password
    FROM public.groups g
    LEFT JOIN (
        SELECT
            group_id,
            COUNT(*)::INTEGER AS count
        FROM public.members
        WHERE group_id = group_id_var
        GROUP BY group_id
    ) member_count_result ON g.id = member_count_result.group_id
    WHERE g.group_guid = p_group_guid;
END;
$$;

-- Function to get groups where user is a member or creator
CREATE OR REPLACE FUNCTION get_my_groups(
    p_member_code TEXT
)
RETURNS TABLE(
    group_guid TEXT,
    name TEXT,
    capacity INTEGER,
    description TEXT,
    is_open BOOLEAN,
    use_code_names BOOLEAN,
    auto_assign_code_names BOOLEAN,
    admin_name TEXT,
    is_frozen BOOLEAN,
    is_admin BOOLEAN,
    is_member BOOLEAN,
    code_name TEXT,
    member_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Return non-expired groups where user is either a member or the creator
    RETURN QUERY
    SELECT
        g.group_guid,
        g.name,
        g.capacity,
        g.description,
        g.is_open,
        g.use_code_names,
        g.auto_assign_code_names,
        g.creator_name AS admin_name,
        g.is_frozen,
        (g.creator_code = p_member_code) AS is_admin,
        (m.code IS NOT NULL) AS is_member,
        COALESCE(m.code_name, m.name) AS code_name,
        COALESCE(member_count_result.count, 0)::INTEGER AS member_count
    FROM public.groups g
    LEFT JOIN public.members m ON g.id = m.group_id AND m.code = p_member_code
    LEFT JOIN (
        SELECT
            group_id,
            COUNT(*)::INTEGER AS count
        FROM public.members
        GROUP BY group_id
    ) member_count_result ON g.id = member_count_result.group_id
    WHERE (g.creator_code = p_member_code OR m.code IS NOT NULL)
      AND (g.expiry_date IS NULL OR g.expiry_date > NOW())
    ORDER BY g.created_date DESC;
END;
$$;

-- Function to create a new group
CREATE OR REPLACE FUNCTION create_group(
    p_name TEXT,
    p_capacity INTEGER,
    p_use_code_names BOOLEAN,
    p_auto_assign_code_names BOOLEAN,
    p_use_custom_code_names BOOLEAN,
    p_creator_name TEXT,
    p_creator_code TEXT,
    p_description TEXT DEFAULT NULL,
    p_password TEXT DEFAULT NULL,
    p_expiry_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_custom_code_names TEXT[] DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    generated_guid TEXT;
    new_group_id INTEGER;
    custom_name TEXT;
BEGIN
    -- Validate that name is provided
    IF p_name IS NULL OR LENGTH(TRIM(p_name)) = 0 THEN
        RAISE EXCEPTION 'Group name is required';
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
    INSERT INTO public.groups (
        group_guid,
        name,
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
        p_name,
        CASE
            WHEN p_password IS NOT NULL AND TRIM(p_password) != '' THEN
                extensions.pgp_sym_encrypt(p_password, app.get_encryption_key())
            ELSE NULL
        END,
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
            INSERT INTO public.custom_code_names (group_id, name)
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
    p_description TEXT,
    p_password TEXT,
    p_capacity INTEGER,
    p_is_open BOOLEAN,
    p_expiry_date TIMESTAMP WITH TIME ZONE,
    p_creator_code TEXT,
    p_additional_custom_code_names TEXT[] DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
    FROM public.groups
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
    FROM public.members
    WHERE group_id = group_record.id;

    -- Validate that new capacity is not lower than current member count
    IF p_capacity < current_member_count THEN
        RAISE EXCEPTION 'Cannot set capacity to % as there are already % members in the group', p_capacity, current_member_count;
    END IF;

    -- If additional custom code names are provided and group uses custom code names, validate them
    IF p_additional_custom_code_names IS NOT NULL AND group_record.use_custom_code_names THEN
        -- Get current count of custom code names for this group
        SELECT COUNT(*) INTO current_custom_names_count
        FROM public.custom_code_names
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
                SELECT 1 FROM public.custom_code_names
                WHERE group_id = group_record.id AND name = custom_name
            ) THEN
                RAISE EXCEPTION 'Custom code name "%" already exists in this group', custom_name;
            END IF;
        END LOOP;

        -- Insert the additional custom code names
        FOREACH custom_name IN ARRAY p_additional_custom_code_names
        LOOP
            INSERT INTO public.custom_code_names (group_id, name)
            VALUES (group_record.id, custom_name);
        END LOOP;
    END IF;

    -- Update the group with all provided fields (excluding name)
    UPDATE public.groups
    SET
        description = p_description,
        password = CASE
            WHEN p_password IS NOT NULL AND TRIM(p_password) != '' THEN
                extensions.pgp_sym_encrypt(p_password, app.get_encryption_key())
            ELSE NULL
        END,
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
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    group_id_found INTEGER;
BEGIN
    -- Check if group exists with correct creator credentials and get the group ID
    SELECT id INTO group_id_found
    FROM public.groups
    WHERE group_guid = p_group_guid
      AND creator_code = p_creator_code;

    -- If no matching record found, throw exception
    IF group_id_found IS NULL THEN
        RAISE EXCEPTION 'Group not found or invalid creator credentials';
    END IF;

    -- Delete all Secret Santa assignments for this group
    DELETE FROM public.santas WHERE group_id = group_id_found;

    -- Delete all members for this group
    DELETE FROM public.members WHERE group_id = group_id_found;

    -- Delete all custom code names for this group
    DELETE FROM public.custom_code_names WHERE group_id = group_id_found;

    -- Delete the group
    DELETE FROM public.groups
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
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    group_record RECORD;
    final_code_name TEXT;
    name_exists BOOLEAN := FALSE;
    code_name_exists BOOLEAN := FALSE;
    max_attempts INTEGER := 100;
    attempt_count INTEGER := 0;
BEGIN
    -- Get group info and validate it exists, is open, not frozen, and not expired
    SELECT id, group_guid, use_code_names, auto_assign_code_names, use_custom_code_names, capacity, creator_name, creator_code, password
    INTO group_record
    FROM public.groups
    WHERE group_guid = p_group_guid
      AND is_open = TRUE
      AND is_frozen = FALSE
      AND (expiry_date IS NULL OR expiry_date > NOW());

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Group not found, group is closed, group is frozen, or group has expired';
    END IF;

    -- Verify password if one is set
    IF group_record.password IS NOT NULL THEN
        IF p_password IS NULL OR TRIM(p_password) = '' THEN
            RAISE EXCEPTION 'Password is required to join this group';
        END IF;

        -- Decrypt and compare password
        BEGIN
            IF extensions.pgp_sym_decrypt(group_record.password, app.get_encryption_key()) != p_password THEN
                RAISE EXCEPTION 'Invalid password';
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'Invalid password';
        END;
    END IF;

    -- Check if name matches creator name and if user is not the creator
    IF p_name = group_record.creator_name AND p_code != group_record.creator_code THEN
        RAISE EXCEPTION 'Name matches the group creator. Only the creator can use this name.';
    END IF;

    -- Check if user is already a member of this group
    IF EXISTS(SELECT 1 FROM public.members WHERE group_id = group_record.id AND code = p_code) THEN
        RAISE EXCEPTION 'You are already a member of this group';
    END IF;

    -- Check if group is at capacity
    IF (SELECT COUNT(*) FROM public.members WHERE group_id = group_record.id) >= group_record.capacity THEN
        RAISE EXCEPTION 'Group is at full capacity';
    END IF;

    -- Check if name already exists in the group
    SELECT EXISTS(
        SELECT 1 FROM public.members
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
                SELECT * INTO custom_code_record FROM public.get_custom_code_name(group_record.id);

                -- Insert the new member with custom code name
                DECLARE
                    new_member_id INTEGER;
                BEGIN
                    INSERT INTO public.members (group_id, name, code, code_name, custom_code_name_id)
                    VALUES (group_record.id, p_name, p_code, custom_code_record.name, custom_code_record.id)
                    RETURNING id INTO new_member_id;

                    -- Copy all existing group messages for the new member
                    INSERT INTO public.messages (group_id, sender_id, recipient_id, message, group_message_id, is_from_secret_santa)
                    SELECT
                        group_record.id,
                        NULL,  -- Group messages always have NULL sender_id
                        new_member_id,  -- New member's ID from RETURNING clause
                        orig.message,
                        orig.id,  -- Reference to original group message
                        FALSE     -- Group messages are not from Secret Santa
                    FROM public.messages orig
                    WHERE orig.group_id = group_record.id
                    AND orig.group_message_id IS NULL  -- Only original group messages
                    AND orig.recipient_id IS NULL;     -- Original group messages have NULL recipient_id
                END;
            END;
        ELSE
            -- Auto-assign regular code name, retry if duplicate found
            LOOP
                attempt_count := attempt_count + 1;

                IF attempt_count > max_attempts THEN
                    RAISE EXCEPTION 'Unable to generate unique code name after % attempts', max_attempts;
                END IF;

                -- Generate new code name
                final_code_name := public.get_code_name();

                -- Check if this code name already exists in the group
                SELECT EXISTS(
                    SELECT 1 FROM public.members
                    WHERE group_id = group_record.id AND code_name = final_code_name
                ) INTO code_name_exists;

                -- Exit loop if we found a unique code name
                IF NOT code_name_exists THEN
                    EXIT;
                END IF;
            END LOOP;

            -- Insert the new member with regular code name and copy group messages
            DECLARE
                new_member_id INTEGER;
            BEGIN
                INSERT INTO public.members (group_id, name, code, code_name)
                VALUES (group_record.id, p_name, p_code, final_code_name)
                RETURNING id INTO new_member_id;

                -- Copy all existing group messages for the new member
                INSERT INTO public.messages (group_id, sender_id, recipient_id, message, group_message_id, is_from_secret_santa)
                SELECT
                    group_record.id,
                    NULL,  -- Group messages always have NULL sender_id
                    new_member_id,  -- New member's ID from RETURNING clause
                    orig.message,
                    orig.id,  -- Reference to original group message
                    FALSE     -- Group messages are not from Secret Santa
                FROM public.messages orig
                WHERE orig.group_id = group_record.id
                AND orig.group_message_id IS NULL  -- Only original group messages
                AND orig.recipient_id IS NULL;     -- Original group messages have NULL recipient_id
            END;
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
                SELECT 1 FROM public.members
                WHERE group_id = group_record.id AND code_name = final_code_name
            ) INTO code_name_exists;

            IF code_name_exists THEN
                RAISE EXCEPTION 'Code name already exists in this group';
            END IF;
        END IF;

        -- Insert the new member with provided code name and copy group messages
        DECLARE
            new_member_id INTEGER;
        BEGIN
            INSERT INTO public.members (group_id, name, code, code_name)
            VALUES (group_record.id, p_name, p_code, final_code_name)
            RETURNING id INTO new_member_id;

            -- Copy all existing group messages for the new member
            INSERT INTO public.messages (group_id, sender_id, recipient_id, message, group_message_id, is_from_secret_santa)
            SELECT
                group_record.id,
                NULL,  -- Group messages always have NULL sender_id
                new_member_id,  -- New member's ID from RETURNING clause
                orig.message,
                orig.id,  -- Reference to original group message
                FALSE     -- Group messages are not from Secret Santa
            FROM public.messages orig
            WHERE orig.group_id = group_record.id
            AND orig.group_message_id IS NULL  -- Only original group messages
            AND orig.recipient_id IS NULL;     -- Original group messages have NULL recipient_id
        END;
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
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    group_id_found INTEGER;
    member_id_found INTEGER;
BEGIN
    -- Validate group exists, is not frozen, and is not expired
    SELECT id INTO group_id_found
    FROM public.groups
    WHERE group_guid = p_group_guid
      AND is_frozen = FALSE
      AND (expiry_date IS NULL OR expiry_date > NOW());

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Group not found, group is frozen, or group has expired';
    END IF;

    -- Check if member exists in the group with matching code and get the member ID
    SELECT id INTO member_id_found
    FROM public.members
    WHERE group_id = group_id_found
      AND code = p_code;

    IF member_id_found IS NULL THEN
        RAISE EXCEPTION 'Member not found in this group or invalid credentials';
    END IF;

    -- Delete all messages for this member (both sent and received)
    -- Individual messages and group message copies will be deleted
    DELETE FROM public.messages
    WHERE group_id = group_id_found
    AND (sender_id = member_id_found OR recipient_id = member_id_found);

    -- Delete the member record
    DELETE FROM public.members
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
SECURITY DEFINER
SET search_path = ''
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
    FROM public.groups
    WHERE group_guid = p_group_guid
      AND creator_code = p_creator_code
      AND (expiry_date IS NULL OR expiry_date > NOW())
      AND is_frozen = FALSE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Group not found, invalid creator credentials, group has expired, or group is already frozen';
    END IF;

    -- Get all member IDs for this group
    SELECT array_agg(id ORDER BY id) INTO member_ids
    FROM public.members
    WHERE group_id = group_record.id;

    -- Check if there are enough members (need at least 2)
    member_count := array_length(member_ids, 1);
    IF member_count IS NULL OR member_count < 2 THEN
        RAISE EXCEPTION 'Need at least 2 members to assign Secret Santa pairs';
    END IF;

    -- Clear any existing assignments for this group
    DELETE FROM public.santas WHERE group_id = group_record.id;

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

        INSERT INTO public.santas (group_id, santa_id, member_id)
        VALUES (group_record.id, santa_id, member_id);
    END LOOP;

    -- Freeze the group after successful assignment
    UPDATE public.groups
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
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    group_id_found INTEGER;
    group_exists BOOLEAN := FALSE;
BEGIN
    -- Check if group exists with correct creator credentials, is not expired, is frozen, and get the group ID
    SELECT id INTO group_id_found
    FROM public.groups
    WHERE group_guid = p_group_guid
      AND creator_code = p_creator_code
      AND (expiry_date IS NULL OR expiry_date > NOW())
      AND is_frozen = TRUE;

    IF group_id_found IS NULL THEN
        RAISE EXCEPTION 'Group not found, invalid creator credentials, group has expired, or group is not frozen';
    END IF;

    -- Delete only Secret Santa messages (individual messages between santa pairs)
    -- Keep group messages (where group_message_id IS NULL and recipient_id IS NULL)
    DELETE FROM public.messages
    WHERE group_id = group_id_found
    AND NOT (group_message_id IS NULL AND recipient_id IS NULL);

    -- Delete all Secret Santa assignments for this group
    DELETE FROM public.santas WHERE group_id = group_id_found;

    -- Unfreeze the group
    UPDATE public.groups
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
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    group_record RECORD;
    member_exists BOOLEAN := FALSE;
BEGIN
    -- Validate group exists with correct creator, is not frozen, and is not expired
    SELECT id, creator_code
    INTO group_record
    FROM public.groups
    WHERE group_guid = p_group_guid
      AND creator_code = p_creator_code
      AND is_frozen = FALSE
      AND (expiry_date IS NULL OR expiry_date > NOW());

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Group not found, invalid creator credentials, group is frozen, or group has expired';
    END IF;

    -- Check if member exists in the group with the given name
    SELECT EXISTS(
        SELECT 1 FROM public.members
        WHERE group_id = group_record.id
          AND name = p_member_name
    ) INTO member_exists;

    IF NOT member_exists THEN
        RAISE EXCEPTION 'Member not found in this group';
    END IF;

    -- Delete the member record
    DELETE FROM public.members
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
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    group_id_var INTEGER;
    my_member_id INTEGER;
    recipient_code_name TEXT;
BEGIN
    -- Validate group exists and is not expired
    SELECT id INTO group_id_var
    FROM public.groups
    WHERE group_guid = p_group_guid
      AND (expiry_date IS NULL OR expiry_date > NOW());

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Group not found or group has expired';
    END IF;

    -- Find my member ID using only code
    SELECT id INTO my_member_id
    FROM public.members
    WHERE group_id = group_id_var
      AND code = p_code;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Member not found in this group or invalid credentials';
    END IF;

    -- Find who I'm giving a gift to (where I am the santa) and get their code_name
    SELECT m.code_name INTO recipient_code_name
    FROM public.santas s
    JOIN public.members m ON m.id = s.member_id
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
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    group_id_found INTEGER;
    member_exists BOOLEAN := FALSE;
    is_creator BOOLEAN := FALSE;
BEGIN
    -- Find the group ID and validate it's not expired
    SELECT id INTO group_id_found
    FROM public.groups
    WHERE group_guid = p_group_guid
      AND (expiry_date IS NULL OR expiry_date > NOW());

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Group not found or group has expired';
    END IF;

    -- Check if member_code is the creator_code
    SELECT EXISTS(
        SELECT 1
        FROM public.groups
        WHERE id = group_id_found
        AND creator_code = p_member_code
    ) INTO is_creator;

    -- Validate that the member exists in this group OR is the creator
    SELECT EXISTS(
        SELECT 1 FROM public.members
        WHERE group_id = group_id_found
          AND code = p_member_code
    ) INTO member_exists;

    IF NOT member_exists AND NOT is_creator THEN
        RAISE EXCEPTION 'Member not found in this group and is not the creator or invalid credentials';
    END IF;

    -- Return all member names for this group
    RETURN QUERY
    SELECT m.name
    FROM public.members m
    WHERE m.group_id = group_id_found
    ORDER BY m.name;
END;
$$;

-- Function to get all Secret Santa relationships in a group (admin only)
CREATE OR REPLACE FUNCTION get_all_secret_santa_relationships(
    p_group_guid TEXT,
    p_creator_code TEXT
)
RETURNS TABLE(
    santa_name TEXT,
    santa_code_name TEXT,
    receiver_name TEXT,
    receiver_code_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    group_id_var INTEGER;
BEGIN
    -- Validate that the caller is the group creator and group exists and is frozen
    SELECT g.id INTO group_id_var
    FROM public.groups g
    WHERE g.group_guid = p_group_guid
      AND g.creator_code = p_creator_code
      AND g.is_frozen = TRUE
      AND (g.expiry_date IS NULL OR g.expiry_date > NOW());

    IF group_id_var IS NULL THEN
        RAISE EXCEPTION 'Group not found, invalid creator credentials, group is not frozen, or group has expired';
    END IF;

    -- Return all Secret Santa relationships for this group
    RETURN QUERY
    SELECT
        santa_member.name AS santa_name,
        santa_member.code_name AS santa_code_name,
        receiver_member.name AS receiver_name,
        receiver_member.code_name AS receiver_code_name
    FROM public.santas s
    JOIN public.members santa_member ON santa_member.id = s.santa_id
    JOIN public.members receiver_member ON receiver_member.id = s.member_id
    WHERE s.group_id = group_id_var
    ORDER BY santa_member.name;
END;
$$;

-- Function to backup creator code with password protection
CREATE OR REPLACE FUNCTION backup_creator_code(
    p_creator_code TEXT,
    p_password TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    generated_backup_guid TEXT;
    hashed_password TEXT;
BEGIN
    -- Validate inputs
    IF p_creator_code IS NULL OR LENGTH(TRIM(p_creator_code)) = 0 THEN
        RAISE EXCEPTION 'Creator code is required';
    END IF;

    IF p_password IS NULL OR LENGTH(TRIM(p_password)) = 0 THEN
        RAISE EXCEPTION 'Password is required';
    END IF;

    -- Hash the password using bcrypt
    hashed_password := extensions.crypt(p_password, extensions.gen_salt('bf', 10));

    -- Mark all existing unused backup codes for this creator as used by setting restored_by to 'REPLACED'
    UPDATE public.backup_codes
    SET restored_by = 'REPLACED'
    WHERE creator_code = p_creator_code
    AND restored_by IS NULL
    AND expiry_date > NOW();

    -- Generate a new backup GUID
    generated_backup_guid := gen_random_uuid()::text;

    -- Insert the new backup code with hashed password
    INSERT INTO public.backup_codes (
        backup_guid,
        creator_code,
        password
    )
    VALUES (
        generated_backup_guid,
        p_creator_code,
        hashed_password
    );

    -- Return the generated backup GUID
    RETURN generated_backup_guid;
END;
$$;

-- Function to restore creator code using backup GUID and password
CREATE OR REPLACE FUNCTION restore_creator_code(
    p_backup_guid TEXT,
    p_password TEXT,
    p_current_guid TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    stored_creator_code TEXT;
    backup_record RECORD;
    password_valid BOOLEAN := FALSE;
BEGIN
    -- Validate inputs
    IF p_backup_guid IS NULL OR LENGTH(TRIM(p_backup_guid)) = 0 THEN
        RAISE EXCEPTION 'Backup GUID is required';
    END IF;

    IF p_password IS NULL OR LENGTH(TRIM(p_password)) = 0 THEN
        RAISE EXCEPTION 'Password is required';
    END IF;

    IF p_current_guid IS NULL OR LENGTH(TRIM(p_current_guid)) = 0 THEN
        RAISE EXCEPTION 'Current GUID is required';
    END IF;

    -- Find the backup record with matching GUID and valid state
    SELECT backup_guid, creator_code, password, restored_by, expiry_date
    INTO backup_record
    FROM public.backup_codes
    WHERE backup_guid = p_backup_guid
    AND restored_by IS NULL
    AND expiry_date > NOW();

    -- Check if record was found
    IF backup_record.backup_guid IS NULL THEN
        RAISE EXCEPTION 'Invalid backup GUID or backup has expired/already been used';
    END IF;

    -- Verify password using bcrypt
    password_valid := (backup_record.password = extensions.crypt(p_password, backup_record.password));

    IF NOT password_valid THEN
        RAISE EXCEPTION 'Invalid password';
    END IF;

    -- Get the creator code
    stored_creator_code := backup_record.creator_code;

    -- Mark this backup as used by recording who restored it (one-time use)
    UPDATE public.backup_codes
    SET restored_by = p_current_guid
    WHERE backup_guid = p_backup_guid;

    -- Return the creator code
    RETURN stored_creator_code;
END;
$$;

-- Function to purge demo messages
CREATE OR REPLACE FUNCTION app.purge_demo_messages()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    demo_messages_deleted INTEGER := 0;
BEGIN
    -- Delete only group message copies sent to demo members (not individual messages from users)
    DELETE FROM public.messages
    WHERE recipient_id IN (
        SELECT id FROM public.members
        WHERE code LIKE 'demo_%'
    )
    AND group_message_id IS NOT NULL;  -- Only delete copies of group messages
    GET DIAGNOSTICS demo_messages_deleted = ROW_COUNT;

    RETURN demo_messages_deleted;
END;
$$;

-- Function to purge expired data
CREATE OR REPLACE FUNCTION app.purge_data(
    delete_all BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
    deleted_messages INTEGER,
    deleted_santas INTEGER,
    deleted_members INTEGER,
    deleted_groups INTEGER,
    deleted_backup_codes INTEGER,
    deleted_outbox_messages INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    messages_deleted INTEGER := 0;
    santas_deleted INTEGER := 0;
    members_deleted INTEGER := 0;
    groups_deleted INTEGER := 0;
    backup_codes_deleted INTEGER := 0;
    outbox_deleted INTEGER := 0;
    target_group_ids INTEGER[];
BEGIN
    -- Purge demo messages first
    PERFORM app.purge_demo_messages();

    IF delete_all THEN
        -- Get all group IDs when delete_all is true
        SELECT array_agg(id) INTO target_group_ids
        FROM public.groups;
    ELSE
        -- Get IDs of expired groups only
        SELECT array_agg(id) INTO target_group_ids
        FROM public.groups
        WHERE expiry_date IS NOT NULL
        AND expiry_date <= NOW();
    END IF;

    -- Only proceed if there are groups to delete
    IF target_group_ids IS NOT NULL AND array_length(target_group_ids, 1) > 0 THEN
        -- Delete messages for target groups (step 1)
        DELETE FROM public.messages
        WHERE group_id = ANY(target_group_ids);
        GET DIAGNOSTICS messages_deleted = ROW_COUNT;

        -- Delete santa assignments for target groups (step 2)
        DELETE FROM public.santas
        WHERE group_id = ANY(target_group_ids);
        GET DIAGNOSTICS santas_deleted = ROW_COUNT;

        -- Delete members from target groups (step 3)
        DELETE FROM public.members
        WHERE group_id = ANY(target_group_ids);
        GET DIAGNOSTICS members_deleted = ROW_COUNT;

        -- Delete target groups (step 4)
        DELETE FROM public.groups
        WHERE id = ANY(target_group_ids);
        GET DIAGNOSTICS groups_deleted = ROW_COUNT;
    END IF;

    IF delete_all THEN
        -- Delete all backup codes when delete_all is true
        DELETE FROM public.backup_codes;
        GET DIAGNOSTICS backup_codes_deleted = ROW_COUNT;
    ELSE
        -- Delete expired or used backup codes
        DELETE FROM public.backup_codes
        WHERE expiry_date <= NOW() OR restored_by IS NOT NULL;
        GET DIAGNOSTICS backup_codes_deleted = ROW_COUNT;
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
    RETURN QUERY SELECT messages_deleted, santas_deleted, members_deleted, groups_deleted, backup_codes_deleted, outbox_deleted;
END;
$$;

-- Function to send a message (individual or group)
-- Group messages: First insert original message with group_message_id=NULL, then create copies for each member
-- Individual messages use actual sender_id from members table
CREATE OR REPLACE FUNCTION send_message(
    p_group_guid TEXT,
    p_sender_code TEXT,
    p_message TEXT,
    p_is_group_message BOOLEAN DEFAULT FALSE,
    p_message_to_secret_santa BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    group_record RECORD;
    sender_record RECORD;
    recipient_record INTEGER;
    member_record RECORD;
    is_creator BOOLEAN := FALSE;
    original_group_message_id INTEGER;
BEGIN
    -- Validate inputs
    IF p_group_guid IS NULL OR LENGTH(TRIM(p_group_guid)) = 0 THEN
        RAISE EXCEPTION 'Group GUID is required';
    END IF;

    IF p_sender_code IS NULL OR LENGTH(TRIM(p_sender_code)) = 0 THEN
        RAISE EXCEPTION 'Sender code is required';
    END IF;

    IF p_message IS NULL OR LENGTH(TRIM(p_message)) = 0 THEN
        RAISE EXCEPTION 'Message is required';
    END IF;

    -- Get group details and validate it's not expired
    SELECT id, creator_code, is_frozen INTO group_record
    FROM public.groups
    WHERE group_guid = p_group_guid
    AND (expiry_date IS NULL OR expiry_date > NOW());

    IF group_record.id IS NULL THEN
        RAISE EXCEPTION 'Group not found or group has expired';
    END IF;

    -- Check if sender is the group creator
    IF group_record.creator_code = p_sender_code THEN
        is_creator := TRUE;
    END IF;

    -- Try to get sender as a member (needed for individual messages)
    SELECT id INTO sender_record
    FROM public.members
    WHERE group_id = group_record.id
    AND code = p_sender_code;

    -- Check message type and handle accordingly
    IF p_is_group_message THEN
        -- GROUP MESSAGE LOGIC
        -- Validate that sender is the group creator (admin)
        IF NOT is_creator THEN
            RAISE EXCEPTION 'Only group admin can send messages to the entire group';
        END IF;

        -- First, insert the original group message with group_message_id = NULL
        INSERT INTO public.messages (
            group_id, sender_id, recipient_id, message, group_message_id, is_from_secret_santa
        ) VALUES (
            group_record.id, NULL, NULL, p_message, NULL, FALSE
        ) RETURNING id INTO original_group_message_id;

        -- Then, create copies for each member referencing the original message
        FOR member_record IN
            SELECT id FROM public.members WHERE group_id = group_record.id
        LOOP
            INSERT INTO public.messages (
                group_id, sender_id, recipient_id, message, group_message_id, is_from_secret_santa
            ) VALUES (
                group_record.id, NULL, member_record.id, p_message, original_group_message_id, FALSE
            );
        END LOOP;

    ELSIF p_message_to_secret_santa THEN
        -- INDIVIDUAL MESSAGE TO SECRET SANTA
        -- Individual message - sender must be a member
        IF sender_record.id IS NULL THEN
            RAISE EXCEPTION 'Individual messages can only be sent by group members';
        END IF;

        -- Get the sender's Secret Santa (who is giving them a gift)
        SELECT s.santa_id INTO recipient_record
        FROM public.santas s
        WHERE s.group_id = group_record.id
        AND s.member_id = sender_record.id;

        IF recipient_record IS NULL THEN
            RAISE EXCEPTION 'Secret Santa assignments not found. Cannot send message to Secret Santa.';
        END IF;

        -- Insert message to Secret Santa (is_from_secret_santa = FALSE because it's FROM giftee TO santa)
        INSERT INTO public.messages (
            group_id, sender_id, recipient_id, message, group_message_id, is_from_secret_santa
        ) VALUES (
            group_record.id, sender_record.id, recipient_record, p_message, NULL, FALSE
        );

    ELSE
        -- INDIVIDUAL MESSAGE TO GIFTEE (FromSecretSanta)
        -- Individual message - sender must be a member
        IF sender_record.id IS NULL THEN
            RAISE EXCEPTION 'Individual messages can only be sent by group members';
        END IF;

        -- Get the sender's giftee (who they are giving a gift to)
        SELECT s.member_id INTO recipient_record
        FROM public.santas s
        WHERE s.group_id = group_record.id
        AND s.santa_id = sender_record.id;

        IF recipient_record IS NULL THEN
            RAISE EXCEPTION 'Secret Santa assignments not found. Cannot send message to giftee.';
        END IF;

        -- Insert message to giftee (is_from_secret_santa = TRUE because it's FROM santa TO giftee)
        INSERT INTO public.messages (
            group_id, sender_id, recipient_id, message, group_message_id, is_from_secret_santa
        ) VALUES (
            group_record.id, sender_record.id, recipient_record, p_message, NULL, TRUE
        );
    END IF;
END;
$$;

-- Function to get message history for a member with automatic read marking
-- Clear if-elif-else logic based on message type
CREATE OR REPLACE FUNCTION get_message_history(
    p_group_guid TEXT,
    p_member_code TEXT,
    p_is_group_message BOOLEAN DEFAULT FALSE,
    p_is_from_secret_santa BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
    id INTEGER,
    message TEXT,
    is_group_message BOOLEAN,
    is_read BOOLEAN,
    created_date TIMESTAMP WITH TIME ZONE,
    sender_name TEXT,
    recipient_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    group_record RECORD;
    member_record RECORD;
    my_giftee_id INTEGER;
    my_secret_santa_id INTEGER;
BEGIN
    -- Validate inputs
    IF p_group_guid IS NULL OR LENGTH(TRIM(p_group_guid)) = 0 THEN
        RAISE EXCEPTION 'Group GUID is required';
    END IF;

    IF p_member_code IS NULL OR LENGTH(TRIM(p_member_code)) = 0 THEN
        RAISE EXCEPTION 'Member code is required';
    END IF;

    -- Get group details and validate it's not expired
    SELECT g.id, g.creator_code INTO group_record
    FROM public.groups g
    WHERE g.group_guid = p_group_guid
    AND (g.expiry_date IS NULL OR g.expiry_date > NOW());

    IF group_record.id IS NULL THEN
        RAISE EXCEPTION 'Group not found or group has expired';
    END IF;

    -- Get member details
    SELECT m.id INTO member_record
    FROM public.members m
    WHERE m.group_id = group_record.id
    AND m.code = p_member_code;

    -- Main logic with clear if-elif-else structure
    IF p_is_group_message THEN
        -- GROUP MESSAGE HISTORY (Admin only)
        IF group_record.creator_code != p_member_code THEN
            RAISE EXCEPTION 'Only group admin can view group message history';
        END IF;

        RETURN QUERY
        SELECT
            msg.id,
            msg.message,
            TRUE AS is_group_message,
            (
                SELECT COALESCE(BOOL_AND(copy_msg.is_read), TRUE)
                FROM public.messages copy_msg
                WHERE copy_msg.group_message_id = msg.id
            ) AS is_read,
            msg.created_date,
            'You'::TEXT AS sender_name,
            'Group'::TEXT AS recipient_name
        FROM public.messages msg
        WHERE msg.group_id = group_record.id
        AND msg.group_message_id IS NULL
        AND msg.recipient_id IS NULL
        ORDER BY msg.created_date DESC;

    ELSIF p_is_from_secret_santa THEN
        -- MESSAGES WITH GIFTEE (You as Secret Santa)
        IF member_record.id IS NULL THEN
            RAISE EXCEPTION 'Individual message history can only be viewed by group members';
        END IF;

        -- Get my giftee
        SELECT s.member_id INTO my_giftee_id
        FROM public.santas s
        WHERE s.group_id = group_record.id
        AND s.santa_id = member_record.id;



        RETURN QUERY
        SELECT
            msg.id,
            msg.message,
            (msg.group_message_id IS NOT NULL) AS is_group_message,
            msg.is_read,
            msg.created_date,
            CASE
                WHEN msg.sender_id IS NULL THEN 'Admin'::TEXT
                WHEN msg.sender_id = my_giftee_id THEN giftee_member.code_name
                WHEN msg.sender_id = member_record.id THEN 'You'::TEXT
                ELSE 'Unknown'::TEXT
            END AS sender_name,
            CASE
                WHEN msg.recipient_id = member_record.id THEN 'You'::TEXT
                WHEN msg.recipient_id = my_giftee_id THEN giftee_member.code_name
                ELSE 'Unknown'::TEXT
            END AS recipient_name
        FROM public.messages msg
        LEFT JOIN public.members giftee_member ON giftee_member.id = my_giftee_id
        WHERE msg.group_id = group_record.id
        AND (
            (msg.recipient_id = member_record.id AND msg.sender_id = my_giftee_id) OR
            (msg.sender_id = member_record.id AND msg.recipient_id = my_giftee_id) OR
            (msg.recipient_id = member_record.id AND msg.sender_id IS NULL AND msg.group_message_id IS NOT NULL)
        )
        ORDER BY msg.created_date DESC;

    ELSE
        -- MESSAGES WITH SECRET SANTA (You as giftee)
        IF member_record.id IS NULL THEN
            RAISE EXCEPTION 'Individual message history can only be viewed by group members';
        END IF;

        -- Get my Secret Santa
        SELECT s.santa_id INTO my_secret_santa_id
        FROM public.santas s
        WHERE s.group_id = group_record.id
        AND s.member_id = member_record.id;

        IF my_secret_santa_id IS NULL THEN
            RAISE EXCEPTION 'Secret Santa assignments not found. Cannot view Secret Santa message history.';
        END IF;



        RETURN QUERY
        SELECT
            msg.id,
            msg.message,
            FALSE AS is_group_message,
            msg.is_read,
            msg.created_date,
            CASE
                WHEN msg.sender_id = my_secret_santa_id THEN 'Secret Santa'::TEXT
                WHEN msg.sender_id = member_record.id THEN 'You'::TEXT
                ELSE 'Unknown'::TEXT
            END AS sender_name,
            CASE
                WHEN msg.recipient_id = member_record.id THEN 'You'::TEXT
                WHEN msg.recipient_id = my_secret_santa_id THEN 'Secret Santa'::TEXT
                ELSE 'Unknown'::TEXT
            END AS recipient_name
        FROM public.messages msg
        WHERE msg.group_id = group_record.id
        AND msg.group_message_id IS NULL
        AND (
            (msg.sender_id = my_secret_santa_id AND msg.recipient_id = member_record.id) OR
            (msg.sender_id = member_record.id AND msg.recipient_id = my_secret_santa_id)
        )
        ORDER BY msg.created_date DESC;
    END IF;

    -- Mark group messages as read if all copies are read
    UPDATE public.messages orig_msg
    SET is_read = TRUE
    WHERE orig_msg.group_id = group_record.id
    AND orig_msg.recipient_id IS NULL
    AND orig_msg.group_message_id IS NULL
    AND NOT EXISTS (
        SELECT 1 FROM public.messages copy_msg
        WHERE copy_msg.group_message_id = orig_msg.id
        AND copy_msg.is_read = FALSE
    );
END;
$$;

-- Function to get count of unread and total messages for a member
-- Uses same logic as get_message_history but returns both counts
CREATE OR REPLACE FUNCTION get_unread_message_count(
    p_group_guid TEXT,
    p_member_code TEXT,
    p_is_group_message BOOLEAN DEFAULT FALSE,
    p_is_from_secret_santa BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(unread_count INTEGER, total_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    group_record RECORD;
    member_record RECORD;
    my_giftee_id INTEGER;
    my_secret_santa_id INTEGER;
    unread_count_val INTEGER := 0;
    total_count_val INTEGER := 0;
BEGIN
    -- Validate inputs
    IF p_group_guid IS NULL OR LENGTH(TRIM(p_group_guid)) = 0 THEN
        RAISE EXCEPTION 'Group GUID is required';
    END IF;

    IF p_member_code IS NULL OR LENGTH(TRIM(p_member_code)) = 0 THEN
        RAISE EXCEPTION 'Member code is required';
    END IF;

    -- Get group details and validate it's not expired
    SELECT g.id, g.creator_code INTO group_record
    FROM public.groups g
    WHERE g.group_guid = p_group_guid
    AND (g.expiry_date IS NULL OR g.expiry_date > NOW());

    IF group_record.id IS NULL THEN
        RAISE EXCEPTION 'Group not found or group has expired';
    END IF;

    -- Get member details
    SELECT m.id INTO member_record
    FROM public.members m
    WHERE m.group_id = group_record.id
    AND m.code = p_member_code;

    -- Main logic with clear if-elif-else structure
    IF p_is_group_message THEN
        -- GROUP MESSAGE COUNTS (Admin only)
        IF group_record.creator_code != p_member_code THEN
            RAISE EXCEPTION 'Only group admin can view group message history';
        END IF;

        -- Admins don't receive group messages, they only send them
        -- So they should never have unread group message counts
        SELECT
            COUNT(*)::INTEGER,
            0::INTEGER  -- Always 0 unread for admin since they only send messages
        INTO total_count_val, unread_count_val
        FROM public.messages msg
        WHERE msg.group_id = group_record.id
        AND msg.group_message_id IS NULL
        AND msg.recipient_id IS NULL;

    ELSIF p_is_from_secret_santa THEN
        -- MESSAGE COUNTS WITH GIFTEE (You as Secret Santa)
        IF member_record.id IS NULL THEN
            RAISE EXCEPTION 'Individual message history can only be viewed by group members';
        END IF;

        -- Get my giftee
        SELECT s.member_id INTO my_giftee_id
        FROM public.santas s
        WHERE s.group_id = group_record.id
        AND s.santa_id = member_record.id;

        SELECT
            COUNT(*)::INTEGER,
            COUNT(CASE WHEN msg.recipient_id = member_record.id AND msg.is_read = FALSE THEN 1 END)::INTEGER
        INTO total_count_val, unread_count_val
        FROM public.messages msg
        WHERE msg.group_id = group_record.id
        AND (
            (msg.recipient_id = member_record.id AND msg.sender_id = my_giftee_id) OR
            (msg.sender_id = member_record.id AND msg.recipient_id = my_giftee_id) OR
            (msg.recipient_id = member_record.id AND msg.sender_id IS NULL AND msg.group_message_id IS NOT NULL)
        );

    ELSE
        -- MESSAGE COUNTS WITH SECRET SANTA (You as giftee)
        IF member_record.id IS NULL THEN
            RAISE EXCEPTION 'Individual message history can only be viewed by group members';
        END IF;

        -- Get my Secret Santa
        SELECT s.santa_id INTO my_secret_santa_id
        FROM public.santas s
        WHERE s.group_id = group_record.id
        AND s.member_id = member_record.id;

        IF my_secret_santa_id IS NULL THEN
            RAISE EXCEPTION 'Secret Santa assignments not found. Cannot view Secret Santa message history.';
        END IF;

        SELECT
            COUNT(*)::INTEGER,
            COUNT(CASE WHEN msg.recipient_id = member_record.id AND msg.is_read = FALSE THEN 1 END)::INTEGER
        INTO total_count_val, unread_count_val
        FROM public.messages msg
        WHERE msg.group_id = group_record.id
        AND msg.group_message_id IS NULL
        AND (
            (msg.sender_id = my_secret_santa_id AND msg.recipient_id = member_record.id) OR
            (msg.sender_id = member_record.id AND msg.recipient_id = my_secret_santa_id)
        );
    END IF;

    RETURN QUERY SELECT unread_count_val, total_count_val;
END;
$$;

-- Function to mark specific messages as read for a member
CREATE OR REPLACE FUNCTION mark_messages_as_read(
    p_group_guid TEXT,
    p_member_code TEXT,
    p_message_ids INTEGER[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    group_record RECORD;
    member_record RECORD;
BEGIN
    -- Validate inputs
    IF p_group_guid IS NULL OR LENGTH(TRIM(p_group_guid)) = 0 THEN
        RAISE EXCEPTION 'Group GUID is required';
    END IF;

    IF p_member_code IS NULL OR LENGTH(TRIM(p_member_code)) = 0 THEN
        RAISE EXCEPTION 'Member code is required';
    END IF;

    IF p_message_ids IS NULL OR array_length(p_message_ids, 1) = 0 THEN
        RAISE EXCEPTION 'Message IDs are required';
    END IF;

    -- Get group details and validate it's not expired
    SELECT g.id INTO group_record
    FROM public.groups g
    WHERE g.group_guid = p_group_guid
    AND (g.expiry_date IS NULL OR g.expiry_date > NOW());

    IF group_record.id IS NULL THEN
        RAISE EXCEPTION 'Group not found or group has expired';
    END IF;

    -- Get member details
    SELECT m.id INTO member_record
    FROM public.members m
    WHERE m.group_id = group_record.id
    AND m.code = p_member_code;

    IF member_record.id IS NULL THEN
        RAISE EXCEPTION 'Member not found in this group';
    END IF;

    -- Mark specific messages as read
    UPDATE public.messages
    SET is_read = TRUE, read_date = NOW()
    WHERE group_id = group_record.id
    AND recipient_id = member_record.id
    AND id = ANY(p_message_ids)
    AND is_read = FALSE;

    -- Mark group messages as read if all copies are read
    UPDATE public.messages orig_msg
    SET is_read = TRUE, read_date = NOW()
    WHERE orig_msg.group_id = group_record.id
    AND orig_msg.recipient_id IS NULL
    AND orig_msg.group_message_id IS NULL
    AND orig_msg.is_read = FALSE
    AND NOT EXISTS (
        SELECT 1 FROM public.messages copy_msg
        WHERE copy_msg.group_message_id = orig_msg.id
        AND copy_msg.is_read = FALSE
    );
END;
$$;


-- ============================================================================
-- Function to create demo groups for a user
-- ============================================================================

CREATE OR REPLACE FUNCTION create_demo_groups(
    p_user_code TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    demo_names TEXT[] := ARRAY[
        'Aaliyah', 'Chen', 'Diego', 'Fatima', 'Giovanni', 'Hiroshi', 'Ingrid', 'Jamal', 'Keiko', 'Lars',
        'Mei', 'Naveen', 'Olga', 'Pablo', 'Qing', 'Rajesh', 'Sana', 'Tariq', 'Uma', 'Viktor',
        'Wei', 'Xiomara', 'Yuki', 'Zainab', 'Andrei', 'Bianca', 'Carlos', 'Deepa', 'Emiko', 'Felipe'
    ];
    selected_names TEXT[];
    shuffled_names TEXT[];
    member_name TEXT;
    member_code TEXT;
    member_code_name TEXT;
    i INTEGER;
    j INTEGER;
    temp TEXT;
    group1_guid_var TEXT;
    group2_guid_var TEXT;
    existing_demo_group1_count INTEGER;
    existing_demo_group2_count INTEGER;
BEGIN
    -- Validate input
    IF p_user_code IS NULL OR LENGTH(TRIM(p_user_code)) = 0 THEN
        RAISE EXCEPTION 'User code is required';
    END IF;

    -- ============================================================================
    -- CHECK FOR EXISTING DEMO GROUPS
    -- ============================================================================

    -- Check for existing Group 1 type: user is admin and has members with demo_ codes
    SELECT COUNT(*) INTO existing_demo_group1_count
    FROM public.groups g
    WHERE g.creator_code = p_user_code
    AND (g.expiry_date IS NULL OR g.expiry_date > NOW())
    AND EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.group_id = g.id
        AND m.code LIKE 'demo_%'
        LIMIT 1
    );

    -- Check for existing Group 2 type: user is a member and admin code starts with demo_
    SELECT COUNT(*) INTO existing_demo_group2_count
    FROM public.groups g
    JOIN public.members m ON m.group_id = g.id
    WHERE m.code = p_user_code
    AND g.creator_code LIKE 'demo_%'
    AND (g.expiry_date IS NULL OR g.expiry_date > NOW());

    -- If any demo groups already exist, don't create new ones
    IF existing_demo_group1_count > 0 OR existing_demo_group2_count > 0 THEN
        RETURN;
    END IF;

    -- ============================================================================
    -- GROUP 1: Auto-assign code names, no password
    -- ============================================================================

    -- Create Group 1
    SELECT public.create_group(
        p_name := 'Demo Group 1',
        p_capacity := 10,
        p_use_code_names := TRUE,
        p_auto_assign_code_names := TRUE,
        p_use_custom_code_names := FALSE,
        p_creator_name := 'Your Name',
        p_creator_code := p_user_code,
        p_description := 'This group is created for demo purposes only and can be used to explore the Secret Santa-inator application. Members in this group are just dummies and will not rejoin when removed.',
        p_password := NULL,
        p_expiry_date := NULL
    ) INTO group1_guid_var;

    -- Shuffle demo names for Group 1
    shuffled_names := demo_names;
    FOR i IN REVERSE array_length(shuffled_names, 1)..2 LOOP
        j := floor(random() * i) + 1;
        temp := shuffled_names[i];
        shuffled_names[i] := shuffled_names[j];
        shuffled_names[j] := temp;
    END LOOP;

    -- Select first 9 names for Group 1
    selected_names := shuffled_names[1:9];

    -- Add 9 members to Group 1
    FOREACH member_name IN ARRAY selected_names
    LOOP
        member_code := 'demo_' || gen_random_uuid()::text;

        -- Join group with auto-assigned code names
        PERFORM public.join_group(
            p_group_guid := group1_guid_var,
            p_password := NULL,
            p_name := 'Demo ' || member_name,
            p_code := member_code,
            p_code_name := NULL  -- Will be auto-assigned
        );
    END LOOP;

    -- Assign Secret Santa for Group 1
    PERFORM public.assign_santa(
        p_group_guid := group1_guid_var,
        p_creator_code := p_user_code
    );

    -- ============================================================================
    -- GROUP 2: Manual code names, password protected, user joins as member
    -- ============================================================================

    -- Create Group 2
    SELECT public.create_group(
        p_name := 'Demo Group 2',
        p_capacity := 10,
        p_use_code_names := TRUE,
        p_auto_assign_code_names := FALSE,
        p_use_custom_code_names := FALSE,
        p_creator_name := 'Demo Admin',
        p_creator_code := 'demo_' || p_user_code,
        p_description := 'This group is created for demo purposes only. You can safely leave this group but you might not be able to rejoin it without the password. The other members in this group are just dummies.',
        p_password := 'demo',
        p_expiry_date := NULL
    ) INTO group2_guid_var;

    -- Shuffle demo names again for Group 2 (get different selection)
    shuffled_names := demo_names;
    FOR i IN REVERSE array_length(shuffled_names, 1)..2 LOOP
        j := floor(random() * i) + 1;
        temp := shuffled_names[i];
        shuffled_names[i] := shuffled_names[j];
        shuffled_names[j] := temp;
    END LOOP;

    -- Select first 5 names for Group 2 (leaving room for the user to be 6th)
    selected_names := shuffled_names[1:5];

    -- Add 5 dummy members to Group 2 with manually assigned code names
    FOREACH member_name IN ARRAY selected_names
    LOOP
        member_code := 'demo_' || gen_random_uuid()::text;
        member_code_name := public.get_code_name();

        PERFORM public.join_group(
            p_group_guid := group2_guid_var,
            p_password := 'demo',
            p_name := 'Demo ' || member_name,
            p_code := member_code,
            p_code_name := member_code_name
        );
    END LOOP;

    -- Add the actual user as a member to Group 2
    member_code_name := public.get_code_name();
    PERFORM public.join_group(
        p_group_guid := group2_guid_var,
        p_password := 'demo',
        p_name := 'Your Name',
        p_code := p_user_code,
        p_code_name := member_code_name
    );

    -- Send group message about the password
    PERFORM public.send_message(
        p_group_guid := group2_guid_var,
        p_sender_code := 'demo_' || p_user_code,  -- Creator code
        p_message := 'The password to join this group is demo',
        p_is_group_message := TRUE,
        p_message_to_secret_santa := FALSE
    );

    -- Delete demo messages (keeps only the user's copies to save space)
    PERFORM app.purge_demo_messages();
END;
$$;


-- ============================================================================
-- TRIGGER FUNCTIONS (SECURITY DEFINER to access tables)
-- ============================================================================

-- Function to handle outbox changes and send realtime events
CREATE OR REPLACE FUNCTION app.handle_outbox_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    group_guid_value TEXT;
BEGIN
    -- Get the group_guid for the group this member joined
    SELECT group_guid INTO group_guid_value
    FROM public.groups
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
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    group_guid_value TEXT;
BEGIN
    -- Get the group_guid for the group this member left
    SELECT group_guid INTO group_guid_value
    FROM public.groups
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



-- Function to handle message read events with correct sender read receipt channels
CREATE OR REPLACE FUNCTION app.handle_message_read()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    sender_code TEXT;
    recipient_code TEXT;
    creator_code TEXT;
BEGIN
    -- Only process if is_read changed from false to true
    IF OLD.is_read = FALSE AND NEW.is_read = TRUE THEN

        -- Get recipient code (always exists for individual messages)
        IF NEW.recipient_id IS NOT NULL THEN
            SELECT code INTO recipient_code
            FROM public.members
            WHERE id = NEW.recipient_id;

            -- Send event to recipient's channel (for unread indicator updates)
            INSERT INTO app.outbox (topic, event, payload)
            VALUES (
                CASE
                    -- If message is FROM Secret Santa to giftee -> recipient (giftee) uses ToSecretSanta mode
                    WHEN NEW.is_from_secret_santa THEN 'to_secret_santa:' || recipient_code
                    -- If message is TO Secret Santa from giftee -> recipient (santa) uses FromSecretSanta mode
                    ELSE 'from_secret_santa:' || recipient_code
                END,
                'read_message',
                jsonb_build_object(
                    'message_id', NEW.id
                )
            );
        END IF;

        -- Handle sender channel (for read receipts/checkmarks)
        IF NEW.sender_id IS NOT NULL THEN
            -- Regular message with sender - send to sender's channel
            SELECT code INTO sender_code
            FROM public.members
            WHERE id = NEW.sender_id;

            -- Send read receipt to sender's channel
            INSERT INTO app.outbox (topic, event, payload)
            VALUES (
                CASE
                    -- If message is FROM Secret Santa -> sender (santa) uses FromSecretSanta mode
                    WHEN NEW.is_from_secret_santa THEN 'from_secret_santa:' || sender_code
                    -- If message is TO Secret Santa -> sender (giftee) uses ToSecretSanta mode
                    ELSE 'to_secret_santa:' || sender_code
                END,
                'read_message',
                jsonb_build_object(
                    'message_id', NEW.id
                )
            );
        ELSE
            -- Group message (sender_id is NULL) - send to creator's channel
            SELECT g.creator_code INTO creator_code
            FROM public.groups g
            WHERE g.id = NEW.group_id;

            IF creator_code IS NOT NULL THEN
                -- Group messages are always "from admin" so use from_secret_santa channel
                INSERT INTO app.outbox (topic, event, payload)
                VALUES (
                    'from_secret_santa:' || creator_code,
                    'read_message',
                    jsonb_build_object(
                        'message_id', NEW.id
                    )
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Function to handle new message events - send to both sender and recipient
CREATE OR REPLACE FUNCTION app.handle_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    recipient_code TEXT;
    sender_code TEXT;
    creator_code TEXT;
    sender_display_name TEXT;
    recipient_display_name TEXT;
BEGIN
    -- Handle original group messages (sender_id=NULL, recipient_id=NULL, group_message_id=NULL)
    IF NEW.sender_id IS NULL AND NEW.recipient_id IS NULL AND NEW.group_message_id IS NULL THEN
        -- This is an original group message - send admin event only
        SELECT g.creator_code INTO creator_code
        FROM public.groups g
        WHERE g.id = NEW.group_id;

        IF creator_code IS NOT NULL THEN
            INSERT INTO app.outbox (topic, event, payload)
            VALUES (
                'from_admin:' || creator_code,
                'new_message',
                jsonb_build_object(
                    'id', NEW.id,
                    'message', NEW.message,
                    'is_group_message', true,
                    'is_read', NEW.is_read,
                    'created_date', NEW.created_date,
                    'sender_name', 'You',
                    'recipient_name', 'Group'
                )
            );
        END IF;

        RETURN NEW;
    END IF;

    -- Only process messages with recipients (includes group message copies and individual messages)
    IF NEW.recipient_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get recipient code
    SELECT code INTO recipient_code
    FROM public.members
    WHERE id = NEW.recipient_id;

    -- Get sender code (if message has a sender)
    IF NEW.sender_id IS NOT NULL THEN
        SELECT code INTO sender_code
        FROM public.members
        WHERE id = NEW.sender_id;
    ELSE
        -- Group message - get creator code
        SELECT g.creator_code INTO creator_code
        FROM public.groups g
        WHERE g.id = NEW.group_id;
    END IF;

    -- Determine sender display name for recipient
    IF NEW.is_from_secret_santa THEN
        sender_display_name := 'Secret Santa';
    ELSIF NEW.sender_id IS NULL THEN
        sender_display_name := 'Admin';
    ELSE
        SELECT code_name INTO sender_display_name
        FROM public.members
        WHERE id = NEW.sender_id;
    END IF;

    -- Determine recipient display name for sender
    IF NEW.is_from_secret_santa THEN
        -- Secret Santa messaging giftee -> sender sees recipient's code_name
        SELECT code_name INTO recipient_display_name
        FROM public.members
        WHERE id = NEW.recipient_id;
    ELSE
        -- Giftee messaging Secret Santa -> sender sees "Secret Santa"
        recipient_display_name := 'Secret Santa';
    END IF;

    -- Send event to RECIPIENT
    INSERT INTO app.outbox (topic, event, payload)
    VALUES (
        CASE WHEN NEW.is_from_secret_santa
             THEN 'to_secret_santa:' || recipient_code
             ELSE 'from_secret_santa:' || recipient_code
        END,
        'new_message',
        jsonb_build_object(
            'id', NEW.id,
            'message', NEW.message,
            'is_group_message', (NEW.group_message_id IS NOT NULL),
            'is_read', NEW.is_read,
            'created_date', NEW.created_date,
            'sender_name', sender_display_name,
            'recipient_name', 'You'
        )
    );

    -- Send event to SENDER (if different from recipient)
    IF NEW.sender_id IS NOT NULL AND sender_code IS NOT NULL AND sender_code != recipient_code THEN
        INSERT INTO app.outbox (topic, event, payload)
        VALUES (
            CASE WHEN NEW.is_from_secret_santa
                 THEN 'from_secret_santa:' || sender_code
                 ELSE 'to_secret_santa:' || sender_code
            END,
            'new_message',
            jsonb_build_object(
                'id', NEW.id,
                'message', NEW.message,
                'is_group_message', (NEW.group_message_id IS NOT NULL),
                'is_read', NEW.is_read,
                'created_date', NEW.created_date,
                'sender_name', 'You',
                'recipient_name', recipient_display_name
            )
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Function to handle group lock/unlock events
CREATE OR REPLACE FUNCTION app.handle_group_lock_unlock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- Enable password hashing functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to get encryption key from Supabase Vault
CREATE OR REPLACE FUNCTION app.get_encryption_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'pwd_encryption_key');
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

-- Trigger for new message events
CREATE TRIGGER messages_new_trigger
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION app.handle_new_message();

-- Trigger for message read events
CREATE TRIGGER messages_read_trigger
    AFTER UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION app.handle_message_read();

-- Trigger for group lock/unlock events
CREATE TRIGGER groups_lock_unlock_trigger
    AFTER UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION app.handle_group_lock_unlock();

-- ============================================================================
-- MINIMAL PERMISSIONS - ONLY WHAT'S ABSOLUTELY NECESSARY
-- ============================================================================

-- Grant schema usage permissions for accessing functions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA app TO anon, authenticated;

-- Grant EXECUTE permissions ONLY on the specific functions that the frontend calls
GRANT EXECUTE ON FUNCTION public.create_group(TEXT, INTEGER, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TEXT[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_group(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_groups(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.join_group(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.leave_group(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_group(TEXT, TEXT, TEXT, INTEGER, BOOLEAN, TIMESTAMP WITH TIME ZONE, TEXT, TEXT[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_santa(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_group(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.kick_member(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_secret_santa(TEXT, TEXT) TO anon, authenticated;


GRANT EXECUTE ON FUNCTION public.get_members(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_creator(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_member(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_member(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_custom_code_names(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_secret_santa_relationships(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.backup_creator_code(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.restore_creator_code(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_message(TEXT, TEXT, TEXT, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_message_history(TEXT, TEXT, BOOLEAN, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_messages_as_read(TEXT, TEXT, INTEGER[], BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_demo_groups(TEXT) TO anon, authenticated;



-- Grant minimal permissions for realtime subscriptions
-- Only SELECT on outbox table for realtime to read events
GRANT SELECT ON TABLE app.outbox TO anon, authenticated;

-- Grant INSERT on outbox table for trigger functions to write events
-- (Trigger functions run as SECURITY DEFINER so they bypass RLS)
GRANT INSERT ON TABLE app.outbox TO anon, authenticated;

-- Grant USAGE on sequences (needed even for SECURITY DEFINER functions)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA app TO anon, authenticated;

-- Grant EXECUTE on gen_random_uuid (extension function)
GRANT EXECUTE ON FUNCTION gen_random_uuid() TO anon, authenticated;

-- Grant permissions to service_role (for server-side operations)
GRANT USAGE, CREATE ON SCHEMA public TO service_role;
GRANT USAGE, CREATE ON SCHEMA app TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA app TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO service_role;

-- ============================================================================
-- REALTIME SETUP - MINIMAL PERMISSIONS
-- ============================================================================

-- Note: app.outbox table is NOT added to the publication because:
-- 1. Realtime events are sent via triggers using realtime.send() function
-- 2. Adding to publication causes Realtime to stream WAL changes
-- 3. Supabase Realtime v2.66.2 has a decoder bug that crashes on integer types
-- 4. The publication is not needed for the trigger-based approach to work

-- Minimal RLS policy for realtime subscriptions on outbox table
-- Allow reading outbox messages for realtime subscriptions
CREATE POLICY "Allow realtime subscription access to outbox"
ON app.outbox
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow triggers to insert outbox messages (they run as SECURITY DEFINER)
CREATE POLICY "Allow triggers to insert outbox messages"
ON app.outbox
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Secret Santa Database Schema with MINIMAL PERMISSIONS Created Successfully!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Security Model:';
    RAISE NOTICE '- All tables have RLS enabled with NO direct access policies';
    RAISE NOTICE '- All data access goes through SECURITY DEFINER functions';
    RAISE NOTICE '- Frontend can only execute specific RPC functions';
    RAISE NOTICE '- Realtime subscriptions work through minimal outbox permissions';
    RAISE NOTICE '';
    RAISE NOTICE 'Permissions granted to anon/authenticated:';
    RAISE NOTICE '- EXECUTE on % frontend-facing functions', (
        SELECT COUNT(*) FROM pg_proc
        WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND proname IN (
            'create_group', 'get_group', 'get_my_groups', 'join_group',
            'leave_group', 'update_group', 'assign_santa', 'unlock_group',
            'kick_member', 'get_my_secret_santa', 'get_members', 'is_creator',
            'is_member', 'get_member', 'get_custom_code_names', 'get_all_secret_santa_relationships',
            'backup_creator_code', 'restore_creator_code', 'send_message', 'get_message_history',
            'mark_messages_as_read', 'get_unread_message_count', 'create_demo_groups', 'delete_group'
        )
    );
    RAISE NOTICE '- SELECT/INSERT on app.outbox for realtime only';
    RAISE NOTICE '- NO direct table access permissions';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables: % with RLS enabled, no direct access', (
        SELECT COUNT(*) FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename IN ('groups', 'members', 'santas', 'code_adjectives', 'code_nouns', 'custom_code_names', 'messages', 'backup_codes')
    );
    RAISE NOTICE 'Triggers: % for realtime events', (
        SELECT COUNT(*) FROM pg_trigger
        WHERE tgname LIKE '%trigger'
    );
    RAISE NOTICE 'Seed Data: % adjectives, % nouns',
        (SELECT COUNT(*) FROM public.code_adjectives),
        (SELECT COUNT(*) FROM public.code_nouns);
    RAISE NOTICE '==============================================';
END $$;
