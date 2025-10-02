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
});
export type GenerateProjectDescriptionInput = z.infer<typeof GenerateProjectDescriptionInputSchema>;

const GenerateProjectDescriptionOutputSchema = z.object({
  projectDescription: z.string().describe('A clear and concise description of the robot project.'),
});
export type GenerateProjectDescriptionOutput = z.infer<typeof GenerateProjectDescriptionOutputSchema>;

export async function generateProjectDescription(input: GenerateProjectDescriptionInput): Promise<GenerateProjectDescriptionOutput> {
  const prompt = `You are an expert roboticist that can generate a clear project description for a robot design based on a user description. The project description should briefly define the goals, scope and key features of the robot.

User description: ${input.input}`;

  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert roboticist. Respond with valid JSON containing a "projectDescription" field.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    return {
      projectDescription: parsed.projectDescription || '',
    };
  } catch (error) {
    console.error('Error generating project description:', error);
    throw new Error('Failed to generate project description');
  }
}
