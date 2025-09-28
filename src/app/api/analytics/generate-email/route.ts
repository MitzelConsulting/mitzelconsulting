import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, name, keywords, searchQueries, hasUserAccount, sourcePage } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate personalized email based on keywords and context
    const emailContent = generateFollowUpEmail({
      email,
      name: name || 'Valued Prospect',
      keywords: keywords || [],
      searchQueries: searchQueries || [],
      hasUserAccount,
      sourcePage: sourcePage || 'website'
    });

    return NextResponse.json({
      success: true,
      emailContent
    });

  } catch (error) {
    console.error('Email generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateFollowUpEmail({
  email,
  name,
  keywords,
  searchQueries,
  hasUserAccount,
  sourcePage
}: {
  email: string;
  name: string;
  keywords: Array<{ keyword: string; count: number }>;
  searchQueries: string[];
  hasUserAccount: boolean;
  sourcePage: string;
}) {
  const topKeywords = keywords.slice(0, 5).map(k => k.keyword);
  const greeting = name !== 'Valued Prospect' ? `Hi ${name}` : 'Hello';
  
  // Determine interest areas based on keywords
  const interestAreas = determineInterestAreas(topKeywords);
  const courseRecommendations = getCourseRecommendations(topKeywords);
  
  // Generate personalized content
  let personalizedContent = '';
  
  if (interestAreas.length > 0) {
    personalizedContent += `I noticed you're interested in ${interestAreas.join(', ')}. `;
  }
  
  if (searchQueries.length > 0) {
    personalizedContent += `Based on your searches for "${searchQueries.slice(0, 2).join('" and "')}", `;
  }
  
  if (hasUserAccount) {
    personalizedContent += `I see you've already created an account with us - thank you! `;
  } else {
    personalizedContent += `I'd love to help you get started with our safety training programs. `;
  }

  const emailTemplate = `
Subject: Personalized Safety Training Solutions for ${name}

${greeting},

${personalizedContent}

At Mizel Consulting, we specialize in comprehensive safety training solutions that can help your organization meet compliance requirements while keeping your team safe.

${courseRecommendations}

Here's what makes us different:
• Expert-led training programs designed by industry professionals
• Flexible delivery options: on-site, virtual, or hybrid
• Comprehensive compliance tracking and reporting
• Custom training solutions tailored to your specific needs
• Ongoing support and consultation

${hasUserAccount ? 
  'Since you already have an account, you can log in anytime to explore our full course catalog and enroll in training programs.' :
  'I\'d be happy to set up a brief call to discuss your specific training needs and how we can help your organization.'
}

Would you be available for a 15-minute call this week to discuss your safety training requirements? I can show you how our programs can benefit your team and help you stay compliant.

Best regards,
Kris Mizel
CEO, Mizel Consulting
kris@mizelconsulting.com
(Your Phone Number)

P.S. If you have any immediate questions about safety training requirements or compliance, feel free to reply to this email - I personally read and respond to every message.

---
This email was generated based on your interest in: ${topKeywords.join(', ')}
Generated on: ${new Date().toLocaleDateString()}
  `.trim();

  return emailTemplate;
}

function determineInterestAreas(keywords: string[]): string[] {
  const interestMap: Record<string, string> = {
    'construction': 'construction safety',
    'osha': 'OSHA compliance',
    'safety': 'workplace safety',
    'training': 'safety training',
    'certification': 'safety certifications',
    'hazard': 'hazard identification',
    'ppe': 'personal protective equipment',
    'fall': 'fall protection',
    'electrical': 'electrical safety',
    'fire': 'fire safety',
    'emergency': 'emergency response',
    'first': 'first aid',
    'cpr': 'CPR training',
    'confined': 'confined space safety',
    'lockout': 'lockout/tagout procedures',
    'scaffold': 'scaffolding safety',
    'crane': 'crane safety',
    'forklift': 'forklift safety',
    'welding': 'welding safety',
    'chemical': 'chemical safety',
    'environmental': 'environmental safety'
  };

  const interests: string[] = [];
  keywords.forEach(keyword => {
    const interest = interestMap[keyword.toLowerCase()];
    if (interest && !interests.includes(interest)) {
      interests.push(interest);
    }
  });

  return interests.length > 0 ? interests : ['workplace safety'];
}

function getCourseRecommendations(keywords: string[]): string {
  const recommendations: string[] = [];
  
  if (keywords.some(k => ['construction', 'osha', 'safety'].includes(k.toLowerCase()))) {
    recommendations.push('• OSHA 10-Hour Construction Safety Course');
  }
  
  if (keywords.some(k => ['general', 'industry', 'workplace'].includes(k.toLowerCase()))) {
    recommendations.push('• OSHA 10-Hour General Industry Safety Course');
  }
  
  if (keywords.some(k => ['fall', 'protection', 'height'].includes(k.toLowerCase()))) {
    recommendations.push('• Fall Protection and Prevention Training');
  }
  
  if (keywords.some(k => ['electrical', 'arc', 'flash'].includes(k.toLowerCase()))) {
    recommendations.push('• Electrical Safety and Arc Flash Prevention');
  }
  
  if (keywords.some(k => ['confined', 'space', 'entry'].includes(k.toLowerCase()))) {
    recommendations.push('• Confined Space Entry and Rescue Training');
  }
  
  if (keywords.some(k => ['crane', 'lift', 'rigging'].includes(k.toLowerCase()))) {
    recommendations.push('• Crane and Rigging Safety Training');
  }
  
  if (keywords.some(k => ['hazmat', 'chemical', 'spill'].includes(k.toLowerCase()))) {
    recommendations.push('• Hazardous Materials Handling and Spill Response');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('• OSHA 10-Hour Construction Safety Course');
    recommendations.push('• Workplace Safety Fundamentals');
    recommendations.push('• Safety Management and Compliance Training');
  }

  return `Based on your interests, I recommend these training programs:

${recommendations.join('\n')}

Each program is designed to meet OSHA requirements and can be customized for your specific industry and needs.`;
}
