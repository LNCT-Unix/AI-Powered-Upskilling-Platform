-- ==============================================================================
-- AI-Powered Upskilling Platform - Sample Accounts Seed Script
-- 1 Mentor Account + 3 Student Accounts linked to the Mentor
-- ==============================================================================

DO $$
DECLARE
    v_mentor_id BIGINT;
    v_student1_id BIGINT;
    v_student2_id BIGINT;
    v_student3_id BIGINT;
    v_mentor_key_id UUID := gen_random_uuid();
    v_mentor_key_val VARCHAR := 'MENTOR-SMPL88';
    v_track_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
    -- Password hash for 'Password123!' using Spring Security DelegatingPasswordEncoder
    v_pw_hash VARCHAR := '{bcrypt}$2a$10$RFR0ohdrLRgqPPJZB4bjteG3nLVhoq3L8xeRd0wl4MNjvwiG3yHoK';
BEGIN
    -- 1. Create Mentor Account
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'mentor.sample@example.com') THEN
        INSERT INTO users (
            email, username, full_name, password_hash, role, status,
            email_verified, email_verified_at, bio, created_at, updated_at
        ) VALUES (
            'mentor.sample@example.com',
            'sample.mentor',
            'Prof. Alex Miller',
            v_pw_hash,
            'MENTOR',
            'ACTIVE',
            TRUE,
            NOW(),
            'Lead Engineering Mentor specializing in Backend Systems & Cloud Architecture.',
            NOW(),
            NOW()
        ) RETURNING id INTO v_mentor_id;

        -- Mentor Profile
        INSERT INTO mentor_profiles (user_id, title, location, joined_at)
        VALUES (v_mentor_id, 'Senior Engineering Mentor', 'San Francisco, USA', NOW());

        -- Mentor Expertise
        INSERT INTO mentor_expertise (mentor_user_id, label) VALUES
            (v_mentor_id, 'Java'),
            (v_mentor_id, 'Spring Boot'),
            (v_mentor_id, 'System Design'),
            (v_mentor_id, 'Cloud Architecture');

        -- Mentor Key
        INSERT INTO mentor_keys (id, mentor_user_id, key_value, status, created_at)
        VALUES (v_mentor_key_id, v_mentor_id, v_mentor_key_val, 'ACTIVE', NOW());

        RAISE NOTICE 'Created Mentor: ID=%, Key=%', v_mentor_id, v_mentor_key_val;
    ELSE
        SELECT id INTO v_mentor_id FROM users WHERE email = 'mentor.sample@example.com';
        SELECT id INTO v_mentor_key_id FROM mentor_keys WHERE mentor_user_id = v_mentor_id AND status = 'ACTIVE' LIMIT 1;
        RAISE NOTICE 'Mentor already exists: ID=%', v_mentor_id;
    END IF;

    -- 2. Create Student 1: Alex Johnson
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'student.alex@example.com') THEN
        INSERT INTO users (
            email, username, full_name, password_hash, role, status,
            email_verified, email_verified_at, bio, created_at, updated_at
        ) VALUES (
            'student.alex@example.com',
            'student.alex',
            'Alex Johnson',
            v_pw_hash,
            'USER',
            'ACTIVE',
            TRUE,
            NOW(),
            'Passionate backend student exploring Spring Boot and cloud-native systems.',
            NOW(),
            NOW()
        ) RETURNING id INTO v_student1_id;

        -- Link Student 1 to Mentor
        INSERT INTO mentor_student_links (mentor_user_id, student_user_id, key_id, linked_at)
        VALUES (v_mentor_id, v_student1_id, v_mentor_key_id, NOW() - INTERVAL '15 days');

        -- Skill Achievements
        INSERT INTO skill_achievements (id, student_user_id, skill_name, skill_slug, category, proficiency, progress, verified_at)
        VALUES
            (gen_random_uuid(), v_student1_id, 'Spring Boot', 'spring-boot', 'Backend Frameworks', 'ADVANCED', 88, NOW() - INTERVAL '5 days'),
            (gen_random_uuid(), v_student1_id, 'Java Fundamentals', 'java-fundamentals', 'Programming', 'EXPERT', 94, NOW() - INTERVAL '10 days');

        -- Assessments
        INSERT INTO assessments (id, user_id, track_id, status, items_administered, correct_count, completed_at)
        VALUES
            (gen_random_uuid(), ('00000000-0000-0000-0000-' || lpad(to_hex(v_student1_id), 12, '0'))::uuid, v_track_id, 'COMPLETED', 10, 9, NOW() - INTERVAL '5 days'),
            (gen_random_uuid(), ('00000000-0000-0000-0000-' || lpad(to_hex(v_student1_id), 12, '0'))::uuid, v_track_id, 'COMPLETED', 10, 8, NOW() - INTERVAL '10 days');

        RAISE NOTICE 'Created and linked Student 1: ID=% (Alex Johnson)', v_student1_id;
    END IF;

    -- 3. Create Student 2: Sarah Jenkins
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'student.sarah@example.com') THEN
        INSERT INTO users (
            email, username, full_name, password_hash, role, status,
            email_verified, email_verified_at, bio, created_at, updated_at
        ) VALUES (
            'student.sarah@example.com',
            'student.sarah',
            'Sarah Jenkins',
            v_pw_hash,
            'USER',
            'ACTIVE',
            TRUE,
            NOW(),
            'Computer Science learner practicing relational databases and REST API architectures.',
            NOW(),
            NOW()
        ) RETURNING id INTO v_student2_id;

        -- Link Student 2 to Mentor
        INSERT INTO mentor_student_links (mentor_user_id, student_user_id, key_id, linked_at)
        VALUES (v_mentor_id, v_student2_id, v_mentor_key_id, NOW() - INTERVAL '12 days');

        -- Skill Achievements
        INSERT INTO skill_achievements (id, student_user_id, skill_name, skill_slug, category, proficiency, progress, verified_at)
        VALUES
            (gen_random_uuid(), v_student2_id, 'SQL Fundamentals', 'sql', 'Databases', 'ADVANCED', 82, NOW() - INTERVAL '3 days'),
            (gen_random_uuid(), v_student2_id, 'RESTful APIs', 'rest-apis', 'Backend Frameworks', 'INTERMEDIATE', 76, NOW() - INTERVAL '7 days');

        -- Assessments
        INSERT INTO assessments (id, user_id, track_id, status, items_administered, correct_count, completed_at)
        VALUES
            (gen_random_uuid(), ('00000000-0000-0000-0000-' || lpad(to_hex(v_student2_id), 12, '0'))::uuid, v_track_id, 'COMPLETED', 10, 8, NOW() - INTERVAL '3 days'),
            (gen_random_uuid(), ('00000000-0000-0000-0000-' || lpad(to_hex(v_student2_id), 12, '0'))::uuid, v_track_id, 'COMPLETED', 10, 7, NOW() - INTERVAL '7 days');

        RAISE NOTICE 'Created and linked Student 2: ID=% (Sarah Jenkins)', v_student2_id;
    END IF;

    -- 4. Create Student 3: Kevin Zhao
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'student.kevin@example.com') THEN
        INSERT INTO users (
            email, username, full_name, password_hash, role, status,
            email_verified, email_verified_at, bio, created_at, updated_at
        ) VALUES (
            'student.kevin@example.com',
            'student.kevin',
            'Kevin Zhao',
            v_pw_hash,
            'USER',
            'ACTIVE',
            TRUE,
            NOW(),
            'Full-stack student honing algorithms and core backend principles.',
            NOW(),
            NOW()
        ) RETURNING id INTO v_student3_id;

        -- Link Student 3 to Mentor
        INSERT INTO mentor_student_links (mentor_user_id, student_user_id, key_id, linked_at)
        VALUES (v_mentor_id, v_student3_id, v_mentor_key_id, NOW() - INTERVAL '8 days');

        -- Skill Achievements
        INSERT INTO skill_achievements (id, student_user_id, skill_name, skill_slug, category, proficiency, progress, verified_at)
        VALUES
            (gen_random_uuid(), v_student3_id, 'Data Structures & Algorithms', 'dsa', 'Data Structures', 'INTERMEDIATE', 68, NOW() - INTERVAL '2 days');

        -- Assessments
        INSERT INTO assessments (id, user_id, track_id, status, items_administered, correct_count, completed_at)
        VALUES
            (gen_random_uuid(), ('00000000-0000-0000-0000-' || lpad(to_hex(v_student3_id), 12, '0'))::uuid, v_track_id, 'COMPLETED', 10, 7, NOW() - INTERVAL '2 days'),
            (gen_random_uuid(), ('00000000-0000-0000-0000-' || lpad(to_hex(v_student3_id), 12, '0'))::uuid, v_track_id, 'IN_PROGRESS', 5, 3, NULL);

        RAISE NOTICE 'Created and linked Student 3: ID=% (Kevin Zhao)', v_student3_id;
    END IF;

END $$;

