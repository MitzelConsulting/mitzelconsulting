-- Ensure we have 12 safety training courses
-- First, let's check what courses we have
SELECT COUNT(*) as course_count FROM courses WHERE is_active = true;

-- If we need more courses, here are additional safety training courses to add
INSERT INTO courses (
    title, 
    description, 
    learning_objectives,
    category,
    tags,
    duration_hours,
    price,
    certification_type,
    difficulty_level,
    delivery_methods,
    image_url,
    is_active,
    is_featured,
    slug
) VALUES
(
    'OSHA 30-Hour Construction Safety',
    'Comprehensive 30-hour construction safety training covering all major OSHA standards and regulations for construction workers and supervisors.',
    'Understand OSHA construction standards, identify workplace hazards, implement safety programs, and maintain compliance records.',
    'Construction Safety',
    ARRAY['OSHA', 'Construction', '30-Hour', 'Supervisor'],
    30,
    595.00,
    'OSHA Certificate',
    'intermediate',
    ARRAY['onsite', 'digital'],
    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop',
    true,
    true,
    'osha-30-hour-construction-safety'
),
(
    'HAZWOPER 40-Hour Training',
    'Comprehensive hazardous waste operations and emergency response training for workers who handle hazardous materials.',
    'Identify hazardous materials, use personal protective equipment, implement emergency response procedures, and maintain safety protocols.',
    'Environmental Safety',
    ARRAY['HAZWOPER', 'Hazardous Materials', 'Emergency Response', '40-Hour'],
    40,
    750.00,
    'HAZWOPER Certificate',
    'advanced',
    ARRAY['onsite', 'digital'],
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
    true,
    true,
    'hazwoper-40-hour-training'
),
(
    'Scaffold Safety Training',
    'Specialized training for workers who erect, dismantle, or work on scaffolding systems.',
    'Proper scaffold erection, inspection procedures, fall protection, and safe work practices on elevated platforms.',
    'Construction Safety',
    ARRAY['Scaffolding', 'Fall Protection', 'Construction', 'Elevated Work'],
    8,
    295.00,
    'Competency Certificate',
    'intermediate',
    ARRAY['onsite', 'digital'],
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=600&fit=crop',
    true,
    false,
    'scaffold-safety-training'
),
(
    'Confined Space Entry Training',
    'Training for workers who enter confined spaces, covering entry procedures, atmospheric testing, and rescue operations.',
    'Identify confined spaces, test atmospheric conditions, implement entry procedures, and coordinate rescue operations.',
    'General Safety',
    ARRAY['Confined Space', 'Atmospheric Testing', 'Rescue', 'Entry Procedures'],
    16,
    425.00,
    'Competency Certificate',
    'intermediate',
    ARRAY['onsite', 'digital'],
    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop',
    true,
    false,
    'confined-space-entry-training'
)
ON CONFLICT (slug) DO NOTHING;

-- Check final count
SELECT COUNT(*) as final_course_count FROM courses WHERE is_active = true;
