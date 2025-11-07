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
      quantity: z.number().int().positive().describe('The quantity of this component required.'),
      link: z.string().url().describe('A link to purchase the component.'),
      approximatePriceUSD: z.number().describe('Approximate price of the component in USD (per unit)'),
    })
  ).describe('A list of components required for the robot project.'),
});
export type GenerateBillOfMaterialsOutput = z.infer<
  typeof GenerateBillOfMaterialsOutputSchema
>;

export async function generateBillOfMaterials(
  input: GenerateBillOfMaterialsInput
): Promise<GenerateBillOfMaterialsOutput> {
  const prompt = `
You are an expert robotics engineer. Generate a **Bill of Materials (BOM)** for the following robot project:

"${input.projectDescription}"

Your response must be valid JSON and follow this exact structure:

{
  "billOfMaterials": [
    {
      "component": "DC Motor 6V",
      "description": "A small DC motor used for driving the robot wheels.",
      "quantity": 4,
      "link": "https://www.adafruit.com/product/3777",
      "approximatePriceUSD": 3.95
    },
    {
      "component": "Lithium-ion Battery 7.4V 2200mAh",
      "description": "Rechargeable battery pack for powering motors and control electronics.",
      "quantity": 2,
      "link": "https://www.sparkfun.com/products/13855",
      "approximatePriceUSD": 12.95
    }
  ]
}

⚙️ Rules:
- Include 8–15 components depending on the project complexity.
- Always include "quantity" for every part (never leave it out).
- Use affordable, commonly available parts from Adafruit, SparkFun, Pimoroni, or Mouser.
- Prices are per unit in USD.
- Do NOT include total price or explanations outside JSON.
`;

  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert robotics engineer. Respond ONLY with valid JSON. The JSON must contain a "billOfMaterials" array. Each object must have "component", "description", "quantity", "link", and "approximatePriceUSD" fields. No explanations or notes outside the JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
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
