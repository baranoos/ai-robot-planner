'use server';

/**
 * @fileOverview Generates code for controlling the robot.
 *
 * - generateCode - A function that generates the robot code.
 * - GenerateCodeInput - The input type for the generateCode function.
 * - GenerateCodeOutput - The return type for the generateCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  return generateCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCodePrompt',
  input: {schema: GenerateCodeInputSchema},
  output: {schema: GenerateCodeOutputSchema},
  prompt: `You are an expert in generating code for robots. Based on the description of the robot and the platform, you will generate the code to control the robot.

Robot Description: {{{robotDescription}}}
Platform: {{{platform}}}

Please generate the code:
`,
});

const generateCodeFlow = ai.defineFlow(
  {
    name: 'generateCodeFlow',
    inputSchema: GenerateCodeInputSchema,
    outputSchema: GenerateCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
