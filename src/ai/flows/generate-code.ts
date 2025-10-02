'use server';

/**
 * @fileOverview Generates code for controlling the robot.
 *
 * - generateCode - A function that generates the robot code.
 * - GenerateCodeInput - The input type for the generateCode function.
 * - GenerateCodeOutput - The return type for the generateCode function.
 */

import { openai, DEFAULT_MODEL } from '@/ai/openai-client';
import { z } from 'zod';

const GenerateCodeInputSchema = z.object({
  robotDescription: z
    .string()
    .describe('The description of the robot for which code needs to be generated.'),
  platform: z.enum(['Raspberry Pi', 'Arduino', 'MicroBit']).describe('The platform for which the code will be generated.'),
});
export type GenerateCodeInput = z.infer<typeof GenerateCodeInputSchema>;

const GenerateCodeOutputSchema = z.object({
  code: z.string().describe('The generated code for controlling the robot.'),
});
export type GenerateCodeOutput = z.infer<typeof GenerateCodeOutputSchema>;

export async function generateCode(input: GenerateCodeInput): Promise<GenerateCodeOutput> {
  const { robotDescription, platform } = input;
  
  const prompt = `You are an expert in generating code for robots. Based on the description of the robot and the platform, you will generate the code to control the robot.

Robot Description: ${robotDescription}
Platform: ${platform}

Please generate the code:`;

  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert in generating code for robots. Respond with valid JSON containing a "code" field with the generated code.',
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
      code: parsed.code || '',
    };
  } catch (error) {
    console.error('Error generating code:', error);
    throw new Error('Failed to generate code');
  }
}
