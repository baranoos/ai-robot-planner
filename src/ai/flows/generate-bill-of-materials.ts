'use server';
/**
 * @fileOverview Generates a Bill of Materials (BOM) for a robot project.
 *
 * - generateBillOfMaterials - A function that generates the BOM.
 * - GenerateBillOfMaterialsInput - The input type for the generateBillOfMaterials function.
 * - GenerateBillOfMaterialsOutput - The return type for the generateBillOfMaterials function.
 */

import { openai, DEFAULT_MODEL } from '@/ai/openai-client';
import { z } from 'zod';

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
  const prompt = `You are an expert robotics engineer who specializes in creating Bills of Materials for open-source robot projects.

Based on the project description, generate a Bill of Materials (BOM) with affordable, open-source components and links to purchase them from Adafruit, SparkFun, Pimoroni, and Mouser, along with approximate prices in USD.

Project Description: ${input.projectDescription}`;

  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert robotics engineer. Respond with valid JSON containing a "billOfMaterials" array with objects that have "component", "description", "link", and "approximatePriceUSD" fields.',
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
      billOfMaterials: parsed.billOfMaterials || [],
    };
  } catch (error) {
    console.error('Error generating bill of materials:', error);
    throw new Error('Failed to generate bill of materials');
  }
}
