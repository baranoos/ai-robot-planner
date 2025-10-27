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
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(responseContent);
    return {
      projectDescription: parsed.projectDescription || '',
    };
  } catch (error) {
    console.error('Error generating project description:', error);
    throw new Error('Failed to generate project description');
  }
}
