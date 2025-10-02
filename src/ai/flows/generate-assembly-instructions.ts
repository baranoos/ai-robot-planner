'use server';

/**
 * @fileOverview A flow to generate step-by-step assembly instructions for a robot.
 *
 * - generateAssemblyInstructions - A function that generates assembly instructions.
 * - GenerateAssemblyInstructionsInput - The input type for the generateAssemblyInstructions function.
 * - GenerateAssemblyInstructionsOutput - The return type for the generateAssemblyInstructions function.
 */

import { openai, DEFAULT_MODEL } from '@/ai/openai-client';
import { z } from 'zod';

const GenerateAssemblyInstructionsInputSchema = z.object({
  projectDescription: z
    .string()
    .describe('A detailed description of the robot project.'),
  billOfMaterials: z
    .string()
    .describe('A list of components needed for the robot, including links to purchase them.'),
  circuitDiagram: z
    .string()
    .describe(
      'A diagram of the robot circuit, provided as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'    ),
  code: z.string().describe('The code for controlling the robot.'),
  robot3DModel: z
    .string()
    .describe(
      'A 3D model of the robot, provided as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'    ),
});
export type GenerateAssemblyInstructionsInput = z.infer<
  typeof GenerateAssemblyInstructionsInputSchema
>;

const GenerateAssemblyInstructionsOutputSchema = z.object({
  assemblyInstructions: z.string().describe('Step-by-step instructions for assembling the robot.'),
  assemblyInstructionsFormat: z
    .enum(['pdf', 'markdown'])
    .describe('The format of the assembly instructions.'),
});
export type GenerateAssemblyInstructionsOutput = z.infer<
  typeof GenerateAssemblyInstructionsOutputSchema
>;

export async function generateAssemblyInstructions(
  input: GenerateAssemblyInstructionsInput
): Promise<GenerateAssemblyInstructionsOutput> {
  const prompt = `You are an expert in robotics and creating clear, concise assembly instructions.

Using the following information, generate step-by-step instructions for assembling the robot.
Specify the format in which the instructions are provided (PDF or Markdown).

Project Description: ${input.projectDescription}
Bill of Materials: ${input.billOfMaterials}
Code: ${input.code}

Note: Circuit diagrams and 3D models are provided as data URIs but may be empty if not available.`;

  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert in robotics. Respond with valid JSON containing "assemblyInstructions" (string) and "assemblyInstructionsFormat" (either "pdf" or "markdown") fields.',
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
      assemblyInstructions: parsed.assemblyInstructions || '',
      assemblyInstructionsFormat: parsed.assemblyInstructionsFormat === 'pdf' ? 'pdf' : 'markdown',
    };
  } catch (error) {
    console.error('Error generating assembly instructions:', error);
    throw new Error('Failed to generate assembly instructions');
  }
}
