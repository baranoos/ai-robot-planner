'use server';

/**
 * @fileOverview A flow to generate 3D OBJ model files for the robot project using GPT-4.
 *
 * - generateObjModel - A function that generates a 3D OBJ file content for the robot.
 * - GenerateObjModelInput - The input type for the generateObjModel function.
 * - GenerateObjModelOutput - The return type for the generateObjModel function.
 */

import { openai, DEFAULT_MODEL } from '@/ai/openai-client';
import { z } from 'zod';

const GenerateObjModelInputSchema = z.object({
  projectDescription: z.string().describe('A detailed description of the robot project.'),
  billOfMaterials: z.string().describe('The bill of materials for the robot project.'),
});

export type GenerateObjModelInput = z.infer<typeof GenerateObjModelInputSchema>;

const GenerateObjModelOutputSchema = z.object({
  objContent: z.string().describe('Generated OBJ file content as a string.'),
  filename: z.string().describe('Suggested filename for the OBJ file.'),
});

export type GenerateObjModelOutput = z.infer<typeof GenerateObjModelOutputSchema>;

/**
 * Generates a 3D OBJ model file content for a robot project.
 */
export async function generateObjModel(input: GenerateObjModelInput): Promise<GenerateObjModelOutput> {
  try {
    const { projectDescription, billOfMaterials } = input;

    console.log(`[OBJ Model] Generating 3D model for project: ${projectDescription.substring(0, 100)}...`);
    console.log(`[OBJ Model] Using components: ${billOfMaterials.substring(0, 100)}...`);

    const prompt = `Create a detailed and realistic 3D OBJ file for a robot based on this specific project:

PROJECT DESCRIPTION:
${projectDescription}

BILL OF MATERIALS (Components to incorporate):
${billOfMaterials}

Requirements for the OBJ file:
- Design the robot chassis and structure to accommodate ALL the specified components from the bill of materials
- Create realistic mounting points, brackets, and housings for each component listed
- If servos are mentioned, include servo mount brackets and attachment points
- If sensors are listed, create appropriate sensor housings and mounting positions
- If wheels are specified, model them with appropriate size and attachment to motors
- If a microcontroller/processor is listed, create a protective case or mounting platform
- Include cable management channels and wire routing paths
- Design for the specific robot's intended function described in the project description
- Scale appropriately: main chassis should be 15-25cm, components sized realistically
- Use proper 3D modeling techniques with vertices (v), normals (vn), and faces (f)
- Create separate named objects (o) for each major component/part
- Include detailed comments describing each section
- Ensure all faces are properly oriented for 3D printing
- Create functional design elements like screw holes, mounting tabs, brackets
- Make the design practical and buildable based on the project requirements

The robot should look like it could actually fulfill the purpose described in the project description, using the exact components from the bill of materials. Make it detailed and functional, not a generic cube.

Generate ONLY the complete OBJ file content with no additional text or explanations.`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a professional 3D CAD designer and robotics engineer. Generate detailed, functional, and realistic OBJ file content for robot designs. The models should be practical, buildable, and specifically designed for the described components and purpose. Output only valid OBJ file content with detailed geometry.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent technical output
      max_tokens: 4000,
    });

    const objContent = response.choices[0]?.message?.content?.trim() || '';
    
    if (!objContent) {
      throw new Error('Failed to generate OBJ content');
    }

    console.log(`[OBJ Model] Successfully generated OBJ file with ${objContent.split('\n').length} lines`);

    // Generate a filename based on the project description
    const sanitizedDescription = projectDescription
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30);
    
    const filename = `robot_${sanitizedDescription}.obj`;

    console.log(`[OBJ Model] Generated filename: ${filename}`);

    return {
      objContent,
      filename,
    };
  } catch (error) {
    console.error('[OBJ Model] Error generating OBJ model:', error);
    throw new Error(`Failed to generate 3D model: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}