'use server';

/**
 * @fileOverview A flow to generate a project description based on user input.
 *
 * - generateProjectDescription - A function that generates the project description.
 * - GenerateProjectDescriptionInput - The input type for the generateProjectDescription function.
 * - GenerateProjectDescriptionOutput - The return type for the generateProjectDescription function.
 */

import { openai, DEFAULT_MODEL } from '@/ai/openai-client';
import { z } from 'zod';

const GenerateProjectDescriptionInputSchema = z.object({
  input: z.string().describe('A description of the desired robot.'),
  image: z.string().optional().describe('An image of the robot sketch or design as a base64 data URI.'),
});
export type GenerateProjectDescriptionInput = z.infer<typeof GenerateProjectDescriptionInputSchema>;

const GenerateProjectDescriptionOutputSchema = z.object({
  projectDescription: z.string().describe('A clear and concise description of the robot project.'),
});
export type GenerateProjectDescriptionOutput = z.infer<typeof GenerateProjectDescriptionOutputSchema>;

export async function generateProjectDescription(input: GenerateProjectDescriptionInput): Promise<GenerateProjectDescriptionOutput> {
  const prompt = `You are an expert roboticist that can generate a clear project description for a robot design based on a user description${input.image ? ' and an uploaded image' : ''}. The project description should briefly define the goals, scope and key features of the robot.

User description: ${input.input}`;

  // Prepare the content for the API call
  const userContent: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = [
    { type: 'text', text: prompt }
  ];

  // Add image if provided
  if (input.image) {
    userContent.push({ 
      type: 'image_url', 
      image_url: { url: input.image } 
    });
  }

  try {
    const response = await openai.chat.completions.create({
      model: input.image ? 'gpt-4o' : DEFAULT_MODEL, // Use gpt-4o for vision, fallback to gpt-4-turbo for text only
      messages: [
        {
          role: 'system',
          content: 'You are an expert roboticist. Respond with valid JSON containing a "projectDescription" field.',
        },
        {
          role: 'user',
          content: userContent as any, // OpenAI API accepts this format for vision
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      console.warn('No response from OpenAI, using fallback description.');
      return {
        projectDescription: `Robot project based on your description: ${input.input}`,
      };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(responseContent);
    } catch (e) {
      // If it's not JSON (unexpected), use the raw content as description
      console.warn('Non-JSON response content, using raw text as description.');
      return {
        projectDescription: String(responseContent),
      };
    }
    let projectDescription: unknown = parsed.projectDescription;

    // Ensure we always return a string for projectDescription
    if (typeof projectDescription === 'object' && projectDescription !== null) {
      // Common structure: { goals, scope, keyFeatures }
      const asRecord = projectDescription as Record<string, unknown>;
      const parts: string[] = [];
      if (asRecord.goals) {
        const goalsText = Array.isArray(asRecord.goals)
          ? (asRecord.goals as unknown[]).map((g) => String(g)).join('; ')
          : String(asRecord.goals);
        parts.push(`Goals: ${goalsText}`);
      }
      if (asRecord.scope) {
        parts.push(`Scope: ${String(asRecord.scope)}`);
      }
      if (asRecord.keyFeatures) {
        const featuresText = Array.isArray(asRecord.keyFeatures)
          ? (asRecord.keyFeatures as unknown[]).map((f) => String(f)).join('; ')
          : String(asRecord.keyFeatures);
        parts.push(`Key Features: ${featuresText}`);
      }
      // Fallback to JSON string if we couldn't format nicely
      projectDescription = parts.length > 0 ? parts.join('\n') : JSON.stringify(asRecord);
    } else if (projectDescription == null) {
      projectDescription = '';
    } else {
      projectDescription = String(projectDescription);
    }

    return {
      projectDescription: projectDescription as string,
    };
  } catch (error) {
    console.error('Error generating project description:', error);
    // Final fallback: echo the user's input as a minimal description
    return {
      projectDescription: `Robot project based on your description: ${input.input}`,
    };
  }
}
