'use server';
/**
 * @fileOverview Generates a Bill of Materials (BOM) for a robot project.
 *
 * - generateBillOfMaterials - A function that generates the BOM.
 * - GenerateBillOfMaterialsInput - The input type for the generateBillOfMaterials function.
 * - GenerateBillOfMaterialsOutput - The return type for the generateBillOfMaterials function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBillOfMaterialsInputSchema = z.object({
  projectDescription: z
    .string()
    .describe('A description of the robot project, including its purpose and requirements.'),
});
export type GenerateBillOfMaterialsInput = z.infer<
  typeof GenerateBillOfMaterialsInputSchema
>;

const GenerateBillOfMaterialsOutputSchema = z.object({
  billOfMaterials: z.array(
    z.object({
      component: z.string().describe('The name of the component.'),
      description: z.string().describe('A short description of the component.'),
      link: z.string().url().describe('A link to purchase the component.'),
      approximatePriceUSD: z.number().describe('Approximate price of the component in USD')
    })
  ).describe('A list of components required for the robot project.'),
});
export type GenerateBillOfMaterialsOutput = z.infer<
  typeof GenerateBillOfMaterialsOutputSchema
>;

export async function generateBillOfMaterials(
  input: GenerateBillOfMaterialsInput
): Promise<GenerateBillOfMaterialsOutput> {
  return generateBillOfMaterialsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBillOfMaterialsPrompt',
  input: {schema: GenerateBillOfMaterialsInputSchema},
  output: {schema: GenerateBillOfMaterialsOutputSchema},
  prompt: `You are an expert robotics engineer who specializes in creating Bills of Materials for open-source robot projects.

  Based on the project description, generate a Bill of Materials (BOM) with affordable, open-source components and links to purchase them from Adafruit, SparkFun, Pimoroni, and Mouser, along with approximate prices in USD.

  Project Description: {{{projectDescription}}}`,
});

const generateBillOfMaterialsFlow = ai.defineFlow(
  {
    name: 'generateBillOfMaterialsFlow',
    inputSchema: GenerateBillOfMaterialsInputSchema,
    outputSchema: GenerateBillOfMaterialsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
