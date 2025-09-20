-- Sample Blog Posts for Mitzel Consulting Demo
-- Insert sample blog posts into the database

-- First, ensure we have blog categories
INSERT INTO blog_categories (id, name, slug, description, color) VALUES
('cat-osha', 'OSHA Training', 'osha-training', 'OSHA certification and safety training articles', '#E55A2B'),
('cat-hazwoper', 'HAZWOPER', 'hazwoper', 'Hazardous waste operations and emergency response', '#DC2626'),
('cat-construction', 'Construction Safety', 'construction-safety', 'Construction industry safety best practices', '#059669'),
('cat-general', 'General Safety', 'general-safety', 'General workplace safety topics', '#7C3AED')
ON CONFLICT (id) DO NOTHING;

-- Sample Blog Posts
INSERT INTO blog_posts (
  id, title, slug, excerpt, content, featured_image_url, featured_image_alt,
  author_name, author_bio, author_image_url, published_at, category_id,
  tags, seo_title, seo_description, seo_keywords, status, view_count, read_time_minutes
) VALUES

-- Post 1: OSHA 10 vs 30 Hour Training
(
  gen_random_uuid(),
  'OSHA 10-Hour vs 30-Hour Training: Which Certification Do You Need?',
  'osha-10-vs-30-hour-training-certification-guide',
  'Understanding the key differences between OSHA 10-Hour and 30-Hour training programs to choose the right certification for your career.',
  'When it comes to OSHA training, choosing between the 10-Hour and 30-Hour programs can be confusing. Both certifications are valuable, but they serve different purposes and are designed for different roles in the workplace.

## OSHA 10-Hour Training Overview

The OSHA 10-Hour training program is designed for entry-level workers who need basic safety awareness. This program covers fundamental safety and health hazards in the workplace, providing workers with the knowledge to recognize and avoid common workplace dangers.

### Key Topics Covered:
- Introduction to OSHA
- Fall protection
- Electrical safety
- Personal protective equipment (PPE)
- Hazard communication
- Machine guarding
- Ergonomics basics

### Who Should Take OSHA 10-Hour Training?
- Entry-level construction workers
- General industry workers
- New employees requiring safety orientation
- Workers in low-risk environments

## OSHA 30-Hour Training Overview

The OSHA 30-Hour training program provides more comprehensive safety training with detailed instruction on safety management systems, hazard recognition, and prevention strategies. This program is significantly more in-depth and covers advanced safety topics.

### Key Topics Covered:
- All topics from OSHA 10-Hour training
- Safety management systems
- Advanced hazard recognition
- Incident investigation
- Emergency action plans
- Safety program development
- Leadership in safety

### Who Should Take OSHA 30-Hour Training?
- Supervisors and foremen
- Safety coordinators
- Project managers
- Safety committee members
- Workers in high-risk environments

## Key Differences

| Aspect | OSHA 10-Hour | OSHA 30-Hour |
|--------|--------------|--------------|
| Duration | 10 hours | 30 hours |
| Target Audience | Entry-level workers | Supervisors and safety personnel |
| Depth of Content | Basic awareness | Comprehensive training |
| Cost | Lower | Higher |
| Certification Value | Entry-level | Advanced |

## Making the Right Choice

Consider these factors when choosing between OSHA 10-Hour and 30-Hour training:

1. **Your Role**: Are you a worker or supervisor?
2. **Industry Requirements**: Some industries prefer or require 30-Hour certification
3. **Career Goals**: 30-Hour certification can open doors to safety-related positions
4. **Budget**: Consider the investment in your safety education

## Conclusion

Both OSHA certifications are valuable investments in workplace safety. The 10-Hour program provides essential safety awareness for workers, while the 30-Hour program offers comprehensive training for those in supervisory or safety-focused roles. Choose the program that best aligns with your current role and career aspirations.

Remember, OSHA training is not just about compliance—it''s about protecting yourself and your colleagues from workplace hazards. Whether you choose 10-Hour or 30-Hour training, you''re taking an important step toward a safer workplace.',
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800',
  'OSHA training certificate and safety equipment',
  'Kris Mitzel',
  'Certified safety professional with 15+ years of experience in OSHA training and workplace safety consulting.',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  NOW() - INTERVAL '5 days',
  'cat-osha',
  ARRAY['OSHA training', 'safety certification', 'workplace safety', 'construction safety'],
  'OSHA 10 vs 30 Hour Training: Complete Certification Guide | Mitzel Consulting',
  'Learn the key differences between OSHA 10-Hour and 30-Hour training programs. Choose the right OSHA certification for your career with expert guidance.',
  ARRAY['OSHA 10 hour training', 'OSHA 30 hour training', 'OSHA certification', 'safety training comparison'],
  'published',
  234,
  8
),

-- Post 2: HAZWOPER Training Guide
(
  gen_random_uuid(),
  'Complete Guide to HAZWOPER Training: Levels, Requirements, and Certification',
  'hazwoper-training-complete-guide-levels-requirements',
  'Everything you need to know about HAZWOPER training, including the different levels, who needs it, and how to get certified.',
  'HAZWOPER (Hazardous Waste Operations and Emergency Response) training is essential for workers involved in hazardous waste cleanup, emergency response, or handling dangerous substances. This comprehensive guide will help you understand the different levels of HAZWOPER training and determine which certification you need.

## What is HAZWOPER Training?

HAZWOPER training is mandated by OSHA for workers who are exposed to hazardous substances during cleanup operations, emergency response activities, or routine operations involving hazardous waste. The training ensures workers have the knowledge and skills to protect themselves and others from hazardous materials.

## The Five Levels of HAZWOPER Training

### Level 1: Awareness Level
- Basic knowledge of hazardous substances
- Recognition of potential hazards
- Understanding of emergency procedures
- Duration: 8 hours

### Level 2: Operations Level
- Direct involvement in handling hazardous materials
- Limited capacity response activities
- Understanding of containment and control measures
- Duration: 24 hours

### Level 3: Technician Level
- Active involvement in hazardous materials response
- Support to specialized response teams
- Advanced technical knowledge
- Duration: 40 hours

### Level 4: Specialist Level
- In-depth knowledge of specific hazardous substances
- Expertise in handling complex incidents
- Advanced technical skills
- Duration: 40+ hours with specialization

### Level 5: Incident Commander Level
- Leadership and decision-making skills
- Management of hazardous materials incidents
- Coordination of response teams
- Duration: 40+ hours with leadership training

## Who Needs HAZWOPER Training?

### Required Training Groups:
1. **Cleanup and Remediation Workers**: Personnel involved in cleanup at uncontrolled hazardous waste sites
2. **TSDF Personnel**: Workers at Treatment, Storage, and Disposal Facilities
3. **Emergency Responders**: Fire departments, hazmat teams, and facility response teams
4. **Supervisors**: Anyone supervising HAZWOPER operations

## Training Requirements by Job Function

### HAZWOPER 40-Hour Training
Required for workers who:
- Perform cleanup activities at uncontrolled hazardous waste sites
- Work in areas with high concentrations of toxic substances
- Handle hazardous materials on a regular basis
- Serve as emergency responders

### HAZWOPER 24-Hour Training
Required for workers who:
- Have occasional site access
- Work in support roles
- Are not directly involved in cleanup operations
- Need awareness-level training

### HAZWOPER 8-Hour Refresher Training
Required annually for all workers who have completed initial HAZWOPER training to maintain certification and stay current with regulations.

## Key Training Topics

### Core HAZWOPER Topics:
- Site characterization and analysis
- Toxicology and health effects
- Hazard recognition and evaluation
- Personal protective equipment (PPE)
- Decontamination procedures
- Emergency response procedures
- Medical surveillance
- Confined space entry
- Spill response and containment

## Certification Process

1. **Complete Initial Training**: Choose the appropriate level (24 or 40 hours)
2. **Pass Final Exam**: Demonstrate understanding of course material
3. **Receive Certificate**: Official certification upon successful completion
4. **Annual Refresher**: Maintain certification with 8-hour annual training

## Training Delivery Options

### Online Training
- Self-paced learning
- 24/7 accessibility
- Interactive modules
- Immediate certification

### On-Site Training
- Customized content
- Hands-on practice
- Group training options
- Site-specific scenarios

## Conclusion

HAZWOPER training is not just a regulatory requirement—it''s a critical investment in worker safety. Whether you''re involved in hazardous waste cleanup, emergency response, or routine operations with hazardous materials, proper HAZWOPER certification ensures you have the knowledge and skills to work safely.

Choose the training level that matches your job responsibilities and exposure risks. Remember, HAZWOPER certification requires annual refresher training to maintain validity and stay current with evolving regulations and best practices.',
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800',
  'HAZWOPER training equipment and safety gear',
  'Kris Mitzel',
  'Certified safety professional with specialized expertise in HAZWOPER training and hazardous materials management.',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  NOW() - INTERVAL '3 days',
  'cat-hazwoper',
  ARRAY['HAZWOPER training', 'hazardous waste', 'emergency response', 'OSHA compliance'],
  'HAZWOPER Training Guide: Levels, Requirements & Certification | Mitzel Consulting',
  'Complete guide to HAZWOPER training levels, requirements, and certification. Expert insights on hazardous waste operations and emergency response training.',
  ARRAY['HAZWOPER training', 'hazardous waste operations', 'emergency response training', 'OSHA HAZWOPER'],
  'published',
  189,
  12
),

-- Post 3: Construction Safety Best Practices
(
  gen_random_uuid(),
  'Top 10 Construction Safety Best Practices for 2024',
  'construction-safety-best-practices-2024',
  'Essential construction safety practices every contractor and worker should implement to prevent accidents and ensure OSHA compliance.',
  'Construction remains one of the most dangerous industries, with thousands of injuries and fatalities occurring each year. Implementing proper safety practices is not just a legal requirement—it''s essential for protecting workers and maintaining project productivity.

## 1. Develop a Comprehensive Safety Plan

Every construction project should begin with a detailed safety plan that addresses:
- Site-specific hazards
- Emergency procedures
- Safety responsibilities
- Training requirements
- Incident reporting protocols

## 2. Conduct Regular Safety Meetings

Daily safety meetings (toolbox talks) help:
- Reinforce safety protocols
- Address emerging hazards
- Share lessons learned
- Maintain safety awareness
- Build a safety culture

## 3. Implement Fall Protection Systems

Falls are the leading cause of construction fatalities. Ensure:
- Proper guardrail installation
- Safety net systems where appropriate
- Personal fall arrest systems (PFAS)
- Regular equipment inspection
- Worker training on fall protection

## 4. Maintain Clean and Organized Work Areas

A clean worksite reduces hazards:
- Regular debris removal
- Proper material storage
- Clear walkways and exits
- Organized tool storage
- Adequate lighting

## 5. Use Proper Personal Protective Equipment (PPE)

Essential PPE for construction workers:
- Hard hats
- Safety glasses or goggles
- High-visibility clothing
- Steel-toed boots
- Hearing protection
- Respiratory protection when needed

## 6. Implement Lockout/Tagout Procedures

Protect workers from hazardous energy:
- Develop written procedures
- Train all affected workers
- Use proper lockout devices
- Verify energy isolation
- Follow established protocols

## 7. Conduct Regular Equipment Inspections

Prevent equipment-related accidents:
- Daily equipment checks
- Scheduled maintenance
- Document inspection results
- Remove defective equipment
- Train operators properly

## 8. Provide Comprehensive Safety Training

Invest in worker education:
- OSHA 10-Hour or 30-Hour training
- Site-specific safety training
- Equipment operation training
- Emergency response training
- Regular refresher courses

## 9. Establish Emergency Response Procedures

Prepare for emergencies:
- Evacuation routes and procedures
- Emergency contact information
- First aid and medical response
- Fire prevention and suppression
- Communication protocols

## 10. Monitor and Improve Safety Performance

Continuous improvement:
- Track safety metrics
- Investigate incidents thoroughly
- Implement corrective actions
- Regular safety audits
- Employee feedback systems

## The Role of Technology in Construction Safety

Modern technology can enhance safety:
- Drones for site inspections
- Wearable safety devices
- Mobile safety apps
- Virtual reality training
- IoT sensors for hazard detection

## Creating a Safety Culture

Building a strong safety culture requires:
- Leadership commitment
- Employee involvement
- Clear communication
- Recognition programs
- Continuous improvement

## Conclusion

Implementing these construction safety best practices requires commitment from all levels of the organization. Safety is everyone''s responsibility, and it starts with proper planning, training, and ongoing vigilance.

Remember, the cost of preventing accidents is always less than the cost of dealing with them. Invest in safety training, proper equipment, and a strong safety culture to protect your workers and your business.

For comprehensive OSHA training and safety consulting services, contact Mitzel Consulting. We provide expert guidance to help you implement effective safety programs and maintain compliance with all applicable regulations.',
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800',
  'Construction workers in safety gear on a construction site',
  'Kris Mitzel',
  'Construction safety expert with extensive experience in OSHA compliance and workplace safety program development.',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  NOW() - INTERVAL '1 day',
  'cat-construction',
  ARRAY['construction safety', 'OSHA compliance', 'workplace safety', 'construction training'],
  'Top 10 Construction Safety Best Practices 2024 | Mitzel Consulting',
  'Essential construction safety practices for 2024. Expert tips on OSHA compliance, fall protection, and creating a safe construction environment.',
  ARRAY['construction safety best practices', 'OSHA construction training', 'construction safety tips', 'workplace safety'],
  'published',
  156,
  10
);

-- Add more sample posts if needed
INSERT INTO blog_posts (
  id, title, slug, excerpt, content, featured_image_url, featured_image_alt,
  author_name, author_bio, author_image_url, published_at, category_id,
  tags, seo_title, seo_description, seo_keywords, status, view_count, read_time_minutes
) VALUES

-- Post 4: Fall Protection Guide
(
  gen_random_uuid(),
  'Fall Protection in Construction: A Complete Safety Guide',
  'fall-protection-construction-safety-guide',
  'Comprehensive guide to fall protection systems, equipment, and procedures for construction workers and supervisors.',
  'Falls are the leading cause of death in construction, accounting for over one-third of all construction fatalities. Understanding and implementing proper fall protection measures is crucial for every construction project.

## Understanding Fall Hazards

### Common Fall Scenarios:
- Falls from ladders
- Falls from scaffolding
- Falls from roofs
- Falls from elevated work platforms
- Falls through floor openings
- Falls from unprotected edges

### OSHA Fall Protection Requirements:
- 6 feet or higher in construction
- 4 feet or higher in general industry
- Any height over dangerous equipment or materials

## Fall Protection Systems

### 1. Guardrail Systems
- Top rail: 42 inches high (±3 inches)
- Mid rail: 21 inches high
- Toe boards: 3.5 inches minimum
- 200-pound force resistance

### 2. Safety Net Systems
- Installed as close as possible under work surface
- Maximum mesh size: 36 square inches
- Must extend 8 feet beyond work area
- Regular inspection required

### 3. Personal Fall Arrest Systems (PFAS)
- Full-body harness
- Shock-absorbing lanyard
- Secure anchor point
- Proper connection hardware

## Equipment Selection and Use

### Choosing the Right Harness:
- Full-body harness required
- Proper size and fit
- Regular inspection
- Manufacturer instructions
- ANSI/ASSE Z359.11 compliance

### Anchor Points:
- 5,000-pound minimum strength
- Independent of work platform
- Above worker''s head
- Professional engineer certification

### Lanyards and Lifelines:
- Shock-absorbing capabilities
- Proper length calculation
- Regular inspection
- Correct attachment methods

## Training Requirements

### Essential Training Topics:
- Fall hazard recognition
- Equipment selection and use
- Proper donning and doffing
- Inspection procedures
- Emergency rescue procedures
- Equipment maintenance

### Training Frequency:
- Initial training before use
- Annual refresher training
- Additional training for new equipment
- Competency assessment required

## Inspection and Maintenance

### Daily Inspections:
- Check harness for damage
- Inspect lanyards and connectors
- Verify anchor point integrity
- Test equipment functionality

### Documentation:
- Inspection checklists
- Maintenance records
- Training certificates
- Equipment certifications

## Emergency Rescue Planning

### Rescue Requirements:
- Written rescue procedures
- Trained rescue personnel
- Appropriate rescue equipment
- Communication protocols
- Medical response coordination

### Rescue Time Limits:
- Suspension trauma prevention
- Maximum 15-minute rescue window
- Emergency medical services contact
- Worker monitoring procedures

## Common Mistakes to Avoid

1. **Improper Anchor Points**: Using inadequate or unapproved anchors
2. **Incorrect Harness Fit**: Loose or improperly adjusted harnesses
3. **Inadequate Training**: Insufficient fall protection education
4. **Poor Inspection**: Skipping regular equipment checks
5. **No Rescue Plan**: Failing to plan for emergency situations

## Best Practices

### For Workers:
- Always wear fall protection when required
- Inspect equipment before each use
- Follow manufacturer instructions
- Report damaged equipment immediately
- Participate in safety training

### For Supervisors:
- Ensure proper equipment provision
- Verify training completion
- Conduct regular safety inspections
- Enforce safety policies consistently
- Plan for emergency situations

## Conclusion

Fall protection is not optional in construction—it''s a critical safety requirement that saves lives. Proper implementation requires commitment from management, comprehensive training, quality equipment, and ongoing vigilance.

Invest in proper fall protection systems, provide thorough training, and maintain a culture of safety to protect your workers from the leading cause of construction fatalities.

For expert fall protection training and consultation, contact Mitzel Consulting. We provide comprehensive OSHA-compliant training programs tailored to your specific workplace needs.',
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800',
  'Construction worker wearing fall protection harness on scaffolding',
  'Kris Mitzel',
  'Certified safety professional specializing in fall protection systems and construction safety training.',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  NOW() - INTERVAL '7 days',
  'cat-construction',
  ARRAY['fall protection', 'construction safety', 'OSHA training', 'safety equipment'],
  'Fall Protection Construction Safety Guide | Mitzel Consulting',
  'Complete guide to fall protection in construction. Learn about safety systems, equipment, training, and OSHA compliance requirements.',
  ARRAY['fall protection training', 'construction fall safety', 'OSHA fall protection', 'safety harness'],
  'published',
  298,
  9
),

-- Post 5: Electrical Safety
(
  gen_random_uuid(),
  'Electrical Safety in the Workplace: Preventing Electrical Accidents',
  'electrical-safety-workplace-preventing-accidents',
  'Essential electrical safety practices to prevent workplace accidents, including lockout/tagout procedures and electrical hazard recognition.',
  'Electrical accidents in the workplace can result in serious injuries, fatalities, and property damage. Understanding electrical hazards and implementing proper safety measures is essential for all workers who may be exposed to electrical energy.

## Understanding Electrical Hazards

### Types of Electrical Hazards:
- **Electric Shock**: Current passing through the body
- **Arc Flash**: High-temperature electrical explosion
- **Arc Blast**: Pressure wave from arc flash
- **Electrical Burns**: Tissue damage from electrical current
- **Fire and Explosion**: Ignition of flammable materials

### Common Causes of Electrical Accidents:
- Contact with overhead power lines
- Improper use of electrical equipment
- Damaged or defective equipment
- Inadequate grounding
- Wet conditions near electrical equipment
- Lack of proper training

## Electrical Safety Fundamentals

### The Electrical Safety Hierarchy:
1. **Elimination**: Remove electrical hazards completely
2. **Substitution**: Use safer alternatives when possible
3. **Engineering Controls**: Implement safety devices and systems
4. **Administrative Controls**: Establish safe work procedures
5. **PPE**: Use appropriate personal protective equipment

### Basic Safety Principles:
- Always assume electrical equipment is energized
- Use proper lockout/tagout procedures
- Maintain safe working distances
- Inspect equipment before use
- Use appropriate PPE

## Lockout/Tagout (LOTO) Procedures

### When LOTO is Required:
- Servicing or maintaining equipment
- Clearing jams or blockages
- Adjusting or lubricating machinery
- Cleaning equipment
- Any work on energized equipment

### LOTO Steps:
1. **Preparation**: Identify all energy sources
2. **Notification**: Inform affected employees
3. **Shutdown**: Turn off equipment properly
4. **Isolation**: Disconnect energy sources
5. **Lockout**: Apply locks to energy isolation devices
6. **Tagout**: Apply warning tags
7. **Verification**: Test equipment to ensure de-energization
8. **Work**: Perform required maintenance
9. **Removal**: Remove locks and tags only by authorized personnel

## Personal Protective Equipment (PPE)

### Electrical PPE Requirements:
- **Voltage-rated gloves**: For direct contact with energized equipment
- **Arc-rated clothing**: Protection from arc flash hazards
- **Safety glasses**: Eye protection from electrical hazards
- **Insulated tools**: Non-conductive tools for electrical work
- **Voltage-rated boots**: Foot protection in electrical environments

### PPE Selection Factors:
- Voltage level of equipment
- Arc flash hazard analysis
- Work environment conditions
- Task requirements
- ANSI/NFPA standards compliance

## Electrical Safety Training

### Essential Training Topics:
- Electrical hazard recognition
- Safe work practices
- Lockout/tagout procedures
- Emergency response
- Equipment inspection
- PPE selection and use

### Training Requirements:
- Initial training before electrical work
- Annual refresher training
- Task-specific training
- Competency assessment
- Documentation of training completion

## Equipment Inspection and Maintenance

### Daily Inspections:
- Check for damaged cords and plugs
- Inspect electrical panels and outlets
- Verify GFCI functionality
- Look for signs of overheating
- Ensure proper grounding

### Regular Maintenance:
- Scheduled equipment testing
- Professional electrical inspections
- Preventive maintenance programs
- Equipment replacement schedules
- Documentation of maintenance activities

## Emergency Response

### Electrical Accident Response:
1. **Assess the Scene**: Ensure your own safety first
2. **Call for Help**: Contact emergency services immediately
3. **Do Not Touch**: Never touch a victim in contact with electricity
4. **Turn Off Power**: If safe to do so, shut off electrical source
5. **Provide First Aid**: Only after power is confirmed off
6. **Preserve Evidence**: Document the incident scene

### First Aid for Electrical Injuries:
- Check for breathing and pulse
- Begin CPR if necessary
- Treat for shock
- Cover burns with sterile dressings
- Seek immediate medical attention

## Best Practices for Electrical Safety

### For Workers:
- Never work on energized equipment unless qualified
- Use appropriate PPE for the task
- Follow established safety procedures
- Report electrical hazards immediately
- Participate in safety training

### For Supervisors:
- Ensure proper training and qualifications
- Provide appropriate safety equipment
- Conduct regular safety inspections
- Enforce safety policies consistently
- Investigate all electrical incidents

## Common Electrical Safety Mistakes

1. **Working on Live Equipment**: Attempting repairs without proper lockout
2. **Inadequate Training**: Insufficient electrical safety education
3. **Improper PPE**: Using incorrect or damaged protective equipment
4. **Poor Maintenance**: Neglecting equipment inspection and repair
5. **Ignoring Hazards**: Failing to address electrical safety concerns

## Conclusion

Electrical safety requires constant vigilance and proper training. By understanding electrical hazards, implementing appropriate safety measures, and maintaining a culture of safety, workplaces can significantly reduce the risk of electrical accidents.

Remember, electrical safety is everyone''s responsibility. Invest in proper training, maintain equipment properly, and always follow established safety procedures to protect yourself and your colleagues from electrical hazards.

For comprehensive electrical safety training and consultation, contact Mitzel Consulting. We provide expert OSHA-compliant training programs designed to keep your workers safe from electrical hazards.',
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800',
  'Electrical safety equipment and warning signs in industrial setting',
  'Kris Mitzel',
  'Electrical safety expert with extensive experience in OSHA electrical standards and workplace safety training.',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  NOW() - INTERVAL '10 days',
  'cat-general',
  ARRAY['electrical safety', 'OSHA training', 'lockout tagout', 'workplace safety'],
  'Electrical Safety Workplace Guide: Preventing Electrical Accidents | Mitzel Consulting',
  'Complete guide to electrical safety in the workplace. Learn about lockout/tagout, electrical hazards, and OSHA compliance requirements.',
  ARRAY['electrical safety training', 'lockout tagout procedures', 'electrical hazards', 'OSHA electrical standards'],
  'published',
  167,
  11
);

-- Update view counts for some posts to make them look more realistic
UPDATE blog_posts SET view_count = FLOOR(RANDOM() * 500) + 50 WHERE status = 'published';
