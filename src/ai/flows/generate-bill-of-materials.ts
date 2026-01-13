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

⚙️ CRITICAL RULES FOR VISUAL CONSISTENCY:
- Include 8-15 realistic, commonly available components
- Every component must be visually distinctive and clearly identifiable in images
- Choose components with standardized appearances (Arduino Uno, Raspberry Pi, standard servos, etc.)
- Include specific model numbers and brands that have consistent visual appearance
- Ensure components are compatible with each other mechanically and electrically
- Use affordable parts from Adafruit, SparkFun, Pimoroni, or Mouser with real product links
- All prices must be realistic current market prices per unit in USD
- Every component must be something that can be realistically assembled together
- Include fasteners (screws, nuts, bolts) appropriate for the selected components
- Add wiring/connectors that match the components' actual connection types
- Always include "quantity" for every part (never leave it out)
- Do NOT include total price or explanations outside JSON

🎯 VISUAL DESIGN GUIDELINES:
- Prefer components with clear labels and distinct colors/shapes
- Choose microcontrollers with recognizable boards (Arduino Uno R3, Raspberry Pi 4)
- Select sensors with standard packages (HC-SR04 ultrasonic, IR obstacle sensors)
- Use motors with standard mounting patterns (NEMA 17, TT motors)
🔧 EXACT ASSEMBLY COMPATIBILITY:
- Every component selected must have clear assembly path
- Fasteners must match mounting holes of components
- Connectors must be compatible between components
- Power requirements must be consistent across all parts
- Mechanical dimensions must allow proper integration
- MUST ENSURE ALL COMPONENTS CAN BE ASSEMBLED TOGETHER REALISTICALLY`;

  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert robotics engineer specializing in component selection for visually consistent robotics projects. Respond ONLY with valid JSON. The JSON must contain a "billOfMaterials" array. Each object must have "component", "description", "quantity", "link", and "approximatePriceUSD" fields. Every component must be visually distinctive, commonly available, mechanically compatible with other components, and clearly identifiable in generated images. No explanations or notes outside the JSON.',
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
