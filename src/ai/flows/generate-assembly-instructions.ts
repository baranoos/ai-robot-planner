'use server';

/**
 * @fileOverview A flow to generate step-by-step assembly instructions for a robot.
 *
 * - generateAssemblyInstructions - A function that generates assembly instructions.
 * - GenerateAssemblyInstructionsInput - The input type for the generateAssemblyInstructions function.
 * - GenerateAssemblyInstructionsOutput - The return type for the generateAssemblyInstructions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  return generateAssemblyInstructionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAssemblyInstructionsPrompt',
  input: {
    schema: GenerateAssemblyInstructionsInputSchema,
  },
  output: {schema: GenerateAssemblyInstructionsOutputSchema},
  prompt: `You are an expert in robotics and creating clear, concise assembly instructions.

  Using the following information, generate step-by-step instructions for assembling the robot.
  Specify the format in which the instructions are provided (PDF or Markdown).

  Project Description: {{{projectDescription}}}
  Bill of Materials: {{{billOfMaterials}}}
  Circuit Diagram: {{media url=circuitDiagram}}
  Code: {{{code}}}
  3D Model: {{media url=robot3DModel}}`,
});

const generateAssemblyInstructionsFlow = ai.defineFlow(
  {
    name: 'generateAssemblyInstructionsFlow',
    inputSchema: GenerateAssemblyInstructionsInputSchema,
    outputSchema: GenerateAssemblyInstructionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
