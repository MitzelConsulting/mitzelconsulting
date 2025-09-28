-- Create Test Analytics Data
-- This script creates sample data to test the analytics dashboard and email generation

-- Insert sample chat sessions
INSERT INTO chat_sessions (id, created_at, user_name, user_email, source_page, chat_mode, message_count, session_duration, is_completed) VALUES
('11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '2 days', 'John Smith', 'john.smith@construction.com', '/courses', 'default', 8, 420, true),
('22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '1 day', 'Sarah Johnson', 'sarah.j@buildingsafety.com', '/', 'course-search', 12, 680, true),
('33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '5 hours', 'Mike Rodriguez', 'mike.r@industrialsafety.com', '/courses', 'default', 6, 340, true),
('44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '1 hour', 'Lisa Chen', 'lisa.chen@workplace-safety.com', '/faq', 'default', 10, 580, true),
('55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '30 minutes', 'David Wilson', 'david.w@osha-training.com', '/', 'course-search', 15, 720, false);

-- Insert sample chat messages
INSERT INTO chat_messages (id, session_id, message, is_user_message, created_at) VALUES
-- John Smith's session (construction safety)
('msg-001', '11111111-1111-1111-1111-111111111111', 'Hi, I need OSHA construction safety training for my team', true, NOW() - INTERVAL '2 days'),
('msg-002', '11111111-1111-1111-1111-111111111111', 'Hello! I can help you with OSHA construction safety training. What specific topics are you looking for?', false, NOW() - INTERVAL '2 days'),
('msg-003', '11111111-1111-1111-1111-111111111111', 'We need fall protection and electrical safety training', true, NOW() - INTERVAL '2 days'),
('msg-004', '11111111-1111-1111-1111-111111111111', 'Perfect! We have comprehensive fall protection and electrical safety courses. Are you looking for OSHA 10 or OSHA 30?', false, NOW() - INTERVAL '2 days'),
('msg-005', '11111111-1111-1111-1111-111111111111', 'OSHA 30 would be ideal for our supervisors', true, NOW() - INTERVAL '2 days'),
('msg-006', '11111111-1111-1111-1111-111111111111', 'Great choice! OSHA 30-Hour Construction includes both fall protection and electrical safety. How many supervisors need training?', false, NOW() - INTERVAL '2 days'),
('msg-007', '11111111-1111-1111-1111-111111111111', 'We have about 15 supervisors who need certification', true, NOW() - INTERVAL '2 days'),
('msg-008', '11111111-1111-1111-1111-111111111111', 'Excellent! I can provide you with a group training package. Would you like me to send you pricing and scheduling options?', false, NOW() - INTERVAL '2 days'),

-- Sarah Johnson's session (building safety)
('msg-009', '22222222-2222-2222-2222-222222222222', 'I need safety training for my building maintenance team', true, NOW() - INTERVAL '1 day'),
('msg-010', '22222222-2222-2222-2222-222222222222', 'Hello! I can help with building maintenance safety training. What type of building and what safety concerns do you have?', false, NOW() - INTERVAL '1 day'),
('msg-011', '22222222-2222-2222-2222-222222222222', 'We manage office buildings and need confined space training', true, NOW() - INTERVAL '1 day'),
('msg-012', '22222222-2222-2222-2222-222222222222', 'Confined space training is crucial for building maintenance. Do you have HVAC systems, electrical rooms, or other confined spaces?', false, NOW() - INTERVAL '1 day'),
('msg-013', '22222222-2222-2222-2222-222222222222', 'Yes, we have both HVAC systems and electrical rooms that require entry', true, NOW() - INTERVAL '1 day'),
('msg-014', '22222222-2222-2222-2222-222222222222', 'Perfect! We offer comprehensive confined space entry training that covers permit-required confined spaces. How many employees need training?', false, NOW() - INTERVAL '1 day'),
('msg-015', '22222222-2222-2222-2222-222222222222', 'About 8 maintenance technicians need this training', true, NOW() - INTERVAL '1 day'),
('msg-016', '22222222-2222-2222-2222-222222222222', 'Great! I can arrange on-site training for your team. Would you like me to send you course details and scheduling options?', false, NOW() - INTERVAL '1 day'),
('msg-017', '22222222-2222-2222-2222-222222222222', 'Yes, please send me the information', true, NOW() - INTERVAL '1 day'),
('msg-018', '22222222-2222-2222-2222-222222222222', 'I will send you detailed information about our confined space training program. What is the best email to reach you?', false, NOW() - INTERVAL '1 day'),
('msg-019', '22222222-2222-2222-2222-222222222222', 'sarah.j@buildingsafety.com', true, NOW() - INTERVAL '1 day'),
('msg-020', '22222222-2222-2222-2222-222222222222', 'Perfect! I will send you the training information shortly. Thank you for your interest!', false, NOW() - INTERVAL '1 day'),

-- Mike Rodriguez's session (industrial safety)
('msg-021', '33333333-3333-3333-3333-333333333333', 'Do you offer forklift safety training?', true, NOW() - INTERVAL '5 hours'),
('msg-022', '33333333-3333-3333-3333-333333333333', 'Yes! We offer comprehensive forklift safety training. Are you looking for operator certification or safety awareness training?', false, NOW() - INTERVAL '5 hours'),
('msg-023', '33333333-3333-3333-3333-333333333333', 'We need operator certification for our warehouse team', true, NOW() - INTERVAL '5 hours'),
('msg-024', '33333333-3333-3333-3333-333333333333', 'Excellent! Our forklift operator certification includes both classroom training and hands-on evaluation. How many operators need certification?', false, NOW() - INTERVAL '5 hours'),
('msg-025', '33333333-3333-3333-3333-333333333333', 'We have 12 forklift operators who need certification', true, NOW() - INTERVAL '5 hours'),
('msg-026', '33333333-3333-3333-3333-333333333333', 'Perfect! I can schedule group training for your team. Would you like on-site training or would you prefer to send them to our training center?', false, NOW() - INTERVAL '5 hours'),

-- Lisa Chen's session (workplace safety)
('msg-027', '44444444-4444-4444-4444-444444444444', 'I need information about workplace safety training programs', true, NOW() - INTERVAL '1 hour'),
('msg-028', '44444444-4444-4444-4444-444444444444', 'Hello! We offer comprehensive workplace safety training programs. What industry are you in and what specific safety topics interest you?', false, NOW() - INTERVAL '1 hour'),
('msg-029', '44444444-4444-4444-4444-444444444444', 'We are a manufacturing company and need hazmat training', true, NOW() - INTERVAL '1 hour'),
('msg-030', '44444444-4444-4444-4444-444444444444', 'Hazmat training is essential for manufacturing. Do you handle hazardous materials, chemicals, or need DOT hazmat training?', false, NOW() - INTERVAL '1 hour'),
('msg-031', '44444444-4444-4444-4444-444444444444', 'We handle chemicals and need both general hazmat and DOT training', true, NOW() - INTERVAL '1 hour'),
('msg-032', '44444444-4444-4444-4444-444444444444', 'Perfect! We offer both general hazmat awareness and DOT hazmat training. How many employees need this training?', false, NOW() - INTERVAL '1 hour'),
('msg-033', '44444444-4444-4444-4444-444444444444', 'About 25 employees need hazmat training', true, NOW() - INTERVAL '1 hour'),
('msg-034', '44444444-4444-4444-4444-444444444444', 'Excellent! I can arrange comprehensive hazmat training for your team. Would you like me to send you course details and pricing?', false, NOW() - INTERVAL '1 hour'),
('msg-035', '44444444-4444-4444-4444-444444444444', 'Yes, please send me the information', true, NOW() - INTERVAL '1 hour'),
('msg-036', '44444444-4444-4444-4444-444444444444', 'I will send you detailed information about our hazmat training programs. What is your email address?', false, NOW() - INTERVAL '1 hour'),

-- David Wilson's session (OSHA training)
('msg-037', '55555555-5555-5555-5555-555555555555', 'I need OSHA 10 hour general industry training', true, NOW() - INTERVAL '30 minutes'),
('msg-038', '55555555-5555-5555-5555-555555555555', 'Great choice! OSHA 10-Hour General Industry is perfect for many workplace environments. What industry are you in?', false, NOW() - INTERVAL '30 minutes'),
('msg-039', '55555555-5555-5555-5555-555555555555', 'I work in food processing and need certification for new hires', true, NOW() - INTERVAL '30 minutes'),
('msg-040', '55555555-5555-5555-5555-555555555555', 'OSHA 10-Hour General Industry is ideal for food processing. It covers workplace hazards, personal protective equipment, and more.', false, NOW() - INTERVAL '30 minutes'),
('msg-041', '55555555-5555-5555-5555-555555555555', 'How many new hires need this training?', true, NOW() - INTERVAL '30 minutes'),
('msg-042', '55555555-5555-5555-5555-555555555555', 'We have about 20 new employees who need OSHA 10 certification', true, NOW() - INTERVAL '30 minutes'),
('msg-043', '55555555-5555-5555-5555-555555555555', 'Perfect! We can arrange group training for your new hires. Would you like on-site training or virtual training options?', false, NOW() - INTERVAL '30 minutes'),
('msg-044', '55555555-5555-5555-5555-555555555555', 'On-site training would be preferred', true, NOW() - INTERVAL '30 minutes'),
('msg-045', '55555555-5555-5555-5555-555555555555', 'Excellent! On-site training is often more effective for new employees. I can arrange an instructor to come to your facility.', false, NOW() - INTERVAL '30 minutes'),
('msg-046', '55555555-5555-5555-5555-555555555555', 'That sounds great. Can you send me pricing information?', true, NOW() - INTERVAL '30 minutes'),
('msg-047', '55555555-5555-5555-5555-555555555555', 'Absolutely! I will send you detailed pricing and scheduling information. What is your email address?', false, NOW() - INTERVAL '30 minutes'),
('msg-048', '55555555-5555-5555-5555-555555555555', 'david.w@osha-training.com', true, NOW() - INTERVAL '30 minutes'),
('msg-049', '55555555-5555-5555-5555-555555555555', 'Perfect! I will send you the information shortly. Thank you for choosing our training services!', false, NOW() - INTERVAL '30 minutes'),
('msg-050', '55555555-5555-5555-5555-555555555555', 'Thank you for your help!', true, NOW() - INTERVAL '30 minutes'),
('msg-051', '55555555-5555-5555-5555-555555555555', 'You are very welcome! Have a great day and stay safe!', false, NOW() - INTERVAL '30 minutes');

-- Insert sample email captures
INSERT INTO email_captures (id, session_id, email, name, captured_at, source_page, chat_mode, is_verified) VALUES
('email-001', '22222222-2222-2222-2222-222222222222', 'sarah.j@buildingsafety.com', 'Sarah Johnson', NOW() - INTERVAL '1 day', '/', 'course-search', true),
('email-002', '44444444-4444-4444-4444-444444444444', 'lisa.chen@workplace-safety.com', 'Lisa Chen', NOW() - INTERVAL '1 hour', '/faq', 'default', true),
('email-003', '55555555-5555-5555-5555-555555555555', 'david.w@osha-training.com', 'David Wilson', NOW() - INTERVAL '30 minutes', '/', 'course-search', true),
('email-004', '11111111-1111-1111-1111-111111111111', 'john.smith@construction.com', 'John Smith', NOW() - INTERVAL '2 days', '/courses', 'default', true),
('email-005', '33333333-3333-3333-3333-333333333333', 'mike.r@industrialsafety.com', 'Mike Rodriguez', NOW() - INTERVAL '5 hours', '/courses', 'default', false);

-- Insert sample course search analytics
INSERT INTO course_search_analytics (id, search_query, keywords, user_email, source_page, search_mode, session_id, ip_address, user_agent, results_count, created_at) VALUES
('search-001', 'OSHA construction safety training', ARRAY['osha', 'construction', 'safety', 'training'], 'john.smith@construction.com', '/courses', 'course-search', '11111111-1111-1111-1111-111111111111', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 8, NOW() - INTERVAL '2 days'),
('search-002', 'confined space entry training building maintenance', ARRAY['confined', 'space', 'entry', 'training', 'building', 'maintenance'], 'sarah.j@buildingsafety.com', '/', 'course-search', '22222222-2222-2222-2222-222222222222', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 6, NOW() - INTERVAL '1 day'),
('search-003', 'forklift operator certification warehouse', ARRAY['forklift', 'operator', 'certification', 'warehouse'], 'mike.r@industrialsafety.com', '/courses', 'course-search', '33333333-3333-3333-3333-333333333333', '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 4, NOW() - INTERVAL '5 hours'),
('search-004', 'hazmat training manufacturing chemicals', ARRAY['hazmat', 'training', 'manufacturing', 'chemicals'], 'lisa.chen@workplace-safety.com', '/faq', 'course-search', '44444444-4444-4444-4444-444444444444', '192.168.1.103', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 7, NOW() - INTERVAL '1 hour'),
('search-005', 'OSHA 10 hour general industry food processing', ARRAY['osha', '10', 'hour', 'general', 'industry', 'food', 'processing'], 'david.w@osha-training.com', '/', 'course-search', '55555555-5555-5555-5555-555555555555', '192.168.1.104', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 5, NOW() - INTERVAL '30 minutes');

-- Insert sample course search keywords
INSERT INTO course_search_keywords (id, search_id, keyword, created_at) VALUES
-- John Smith's search keywords
('kw-001', 'search-001', 'osha', NOW() - INTERVAL '2 days'),
('kw-002', 'search-001', 'construction', NOW() - INTERVAL '2 days'),
('kw-003', 'search-001', 'safety', NOW() - INTERVAL '2 days'),
('kw-004', 'search-001', 'training', NOW() - INTERVAL '2 days'),

-- Sarah Johnson's search keywords
('kw-005', 'search-002', 'confined', NOW() - INTERVAL '1 day'),
('kw-006', 'search-002', 'space', NOW() - INTERVAL '1 day'),
('kw-007', 'search-002', 'entry', NOW() - INTERVAL '1 day'),
('kw-008', 'search-002', 'training', NOW() - INTERVAL '1 day'),
('kw-009', 'search-002', 'building', NOW() - INTERVAL '1 day'),
('kw-010', 'search-002', 'maintenance', NOW() - INTERVAL '1 day'),

-- Mike Rodriguez's search keywords
('kw-011', 'search-003', 'forklift', NOW() - INTERVAL '5 hours'),
('kw-012', 'search-003', 'operator', NOW() - INTERVAL '5 hours'),
('kw-013', 'search-003', 'certification', NOW() - INTERVAL '5 hours'),
('kw-014', 'search-003', 'warehouse', NOW() - INTERVAL '5 hours'),

-- Lisa Chen's search keywords
('kw-015', 'search-004', 'hazmat', NOW() - INTERVAL '1 hour'),
('kw-016', 'search-004', 'training', NOW() - INTERVAL '1 hour'),
('kw-017', 'search-004', 'manufacturing', NOW() - INTERVAL '1 hour'),
('kw-018', 'search-004', 'chemicals', NOW() - INTERVAL '1 hour'),

-- David Wilson's search keywords
('kw-019', 'search-005', 'osha', NOW() - INTERVAL '30 minutes'),
('kw-020', 'search-005', '10', NOW() - INTERVAL '30 minutes'),
('kw-021', 'search-005', 'hour', NOW() - INTERVAL '30 minutes'),
('kw-022', 'search-005', 'general', NOW() - INTERVAL '30 minutes'),
('kw-023', 'search-005', 'industry', NOW() - INTERVAL '30 minutes'),
('kw-024', 'search-005', 'food', NOW() - INTERVAL '30 minutes'),
('kw-025', 'search-005', 'processing', NOW() - INTERVAL '30 minutes');

-- Success message
SELECT 'Test analytics data created successfully!' as status;
