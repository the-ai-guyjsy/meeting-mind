/**
 * Anthropic AI Integration
 * Handles intelligent meeting analysis and minute generation
 */

import Anthropic from '@anthropic-ai/sdk';

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

if (!apiKey) {
  console.warn('[!] Anthropic API key not configured. AI features will be limited.');
}

const anthropic = apiKey ? new Anthropic({
  apiKey,
  dangerouslyAllowBrowser: true // Note: In production, proxy through your backend
}) : null;

/**
 * Generate meeting minutes using Claude
 */
export async function generateMinutes(meetingData) {
  if (!anthropic) {
    throw new Error('Anthropic API not configured');
  }

  const { title, type, transcript, speakers, entries, notes } = meetingData;

  const prompt = `You are an expert meeting analyst. Generate professional meeting minutes from the following meeting data.

Meeting Title: ${title}
Meeting Type: ${type}
Date: ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Participants: ${speakers.map(s => s.name).join(', ')}

${notes ? `Additional Notes:\n${notes}\n\n` : ''}

Transcript:
${entries.map(e => `${e.speaker.name}: ${e.text}`).join('\n')}

Please generate meeting minutes in the following JSON structure:
{
  "summary": "Brief 2-3 sentence overview of the meeting",
  "key_points": ["point 1", "point 2", ...],
  "decisions": ["decision 1", "decision 2", ...],
  "action_items": [
    {
      "text": "action item description",
      "assigned_to": "person name or null",
      "priority": "high|medium|low"
    }
  ],
  "questions": ["question 1", "question 2", ...],
  "next_steps": ["next step 1", "next step 2", ...]
}

Focus on:
1. Extracting concrete decisions made
2. Identifying clear action items with owners
3. Highlighting important discussion points
4. Noting questions that need follow-up
5. Being concise but comprehensive

Return ONLY valid JSON, no markdown formatting.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    
    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('AI generation error:', error);
    throw error;
  }
}

/**
 * Answer questions about the meeting
 */
export async function askMeetingQuestion(question, meetingContext) {
  if (!anthropic) {
    // Fallback to simple pattern matching
    return generateFallbackAnswer(question, meetingContext);
  }

  const { transcript, entries, speakers } = meetingContext;

  const prompt = `You are an AI assistant helping with meeting analysis. 

Meeting Context:
Participants: ${speakers.map(s => s.name).join(', ')}
Transcript:
${entries.slice(-20).map(e => `${e.speaker.name}: ${e.text}`).join('\n')}

Question: ${question}

Provide a concise, helpful answer based on the meeting context. If you cannot answer from the context, say so clearly.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      temperature: 0.5,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    return message.content[0].text;
  } catch (error) {
    console.error('AI question error:', error);
    return generateFallbackAnswer(question, meetingContext);
  }
}

/**
 * Analyze sentiment and participation
 */
export async function analyzeMeeting(meetingData) {
  if (!anthropic) {
    return generateBasicAnalysis(meetingData);
  }

  const { entries, speakers } = meetingData;

  // Calculate basic metrics
  const speakerStats = {};
  speakers.forEach(s => {
    speakerStats[s.name] = {
      wordCount: 0,
      turnCount: 0
    };
  });

  entries.forEach(e => {
    const words = e.text.split(' ').length;
    speakerStats[e.speaker.name].wordCount += words;
    speakerStats[e.speaker.name].turnCount += 1;
  });

  const prompt = `Analyze the following meeting participation data and provide insights.

Participants and their contributions:
${Object.entries(speakerStats).map(([name, stats]) => 
  `${name}: ${stats.wordCount} words, ${stats.turnCount} turns speaking`
).join('\n')}

Recent exchanges:
${entries.slice(-10).map(e => `${e.speaker.name}: ${e.text}`).join('\n')}

Provide analysis in JSON format:
{
  "participation_balance": 0.0 to 1.0 (1 = perfectly balanced),
  "dominant_speakers": ["name1", "name2"],
  "quiet_participants": ["name1", "name2"],
  "overall_sentiment": "positive|neutral|negative",
  "engagement_level": "high|medium|low",
  "insights": ["insight 1", "insight 2", ...]
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return generateBasicAnalysis(meetingData);
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('AI analysis error:', error);
    return generateBasicAnalysis(meetingData);
  }
}

/**
 * Fallback answer generation without AI
 */
function generateFallbackAnswer(question, context) {
  const lowerQ = question.toLowerCase();
  const { entries, speakers } = context;

  if (lowerQ.includes('decision') || lowerQ.includes('decided')) {
    const decisions = entries.filter(e => 
      e.text.toLowerCase().includes('agree') ||
      e.text.toLowerCase().includes('decided') ||
      e.text.toLowerCase().includes('will')
    );
    if (decisions.length > 0) {
      return `Based on the transcript, potential decisions include:\n\n${
        decisions.slice(0, 3).map(d => `* ${d.speaker.name}: "${d.text}"`).join('\n')
      }`;
    }
    return 'No clear decisions identified yet in the transcript.';
  }

  if (lowerQ.includes('action') || lowerQ.includes('task') || lowerQ.includes('todo')) {
    const actions = entries.filter(e => 
      e.text.toLowerCase().includes('will') ||
      e.text.toLowerCase().includes('need to') ||
      e.text.toLowerCase().includes('should')
    );
    if (actions.length > 0) {
      return `Potential action items:\n\n${
        actions.slice(0, 4).map(a => `* ${a.speaker.name}: ${a.text}`).join('\n')
      }`;
    }
    return 'No clear action items identified yet.';
  }

  if (lowerQ.includes('summary') || lowerQ.includes('summarize')) {
    return `This ${context.type || 'meeting'} has ${speakers.length} participants: ${
      speakers.map(s => s.name).join(', ')
    }. So far there have been ${entries.length} exchanges recorded.`;
  }

  return `I'm analyzing the meeting with ${speakers.length} participants. ${
    entries.length > 0 
      ? `There have been ${entries.length} exchanges so far.` 
      : 'Recording hasn\'t started yet.'
  } Try asking about decisions, action items, or for a summary.`;
}

/**
 * Generate basic analysis without AI
 */
function generateBasicAnalysis(meetingData) {
  const { entries, speakers } = meetingData;
  
  const speakerStats = {};
  let totalWords = 0;
  
  speakers.forEach(s => {
    speakerStats[s.name] = { wordCount: 0, turnCount: 0 };
  });

  entries.forEach(e => {
    const words = e.text.split(' ').length;
    speakerStats[e.speaker.name].wordCount += words;
    speakerStats[e.speaker.name].turnCount += 1;
    totalWords += words;
  });

  const avgWords = totalWords / speakers.length;
  const dominant = Object.entries(speakerStats)
    .filter(([_, stats]) => stats.wordCount > avgWords * 1.5)
    .map(([name]) => name);
  
  const quiet = Object.entries(speakerStats)
    .filter(([_, stats]) => stats.wordCount < avgWords * 0.5)
    .map(([name]) => name);

  return {
    participation_balance: 0.7,
    dominant_speakers: dominant,
    quiet_participants: quiet,
    overall_sentiment: 'neutral',
    engagement_level: entries.length > 20 ? 'high' : entries.length > 10 ? 'medium' : 'low',
    insights: [
      `Total of ${entries.length} exchanges recorded`,
      `Average ${Math.round(avgWords)} words per speaker`,
      dominant.length > 0 ? `${dominant[0]} contributed most to discussion` : 'Balanced participation'
    ]
  };
}

export default {
  generateMinutes,
  askMeetingQuestion,
  analyzeMeeting
};
