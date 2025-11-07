'use server';

/**
 * @fileOverview A flow to generate images for the robot project using GPT-Image-1.
 *
 * - generateRobotImages - A function that generates robot concept, circuit diagram, and 3D model images.
 * - GenerateImagesInput - The input type for the generateRobotImages function.
 * - GenerateImagesOutput - The return type for the generateRobotImages function.
 */

import { openai, IMAGE_MODEL } from '@/ai/openai-client';
import { z } from 'zod';

const GenerateImagesInputSchema = z.object({
  projectDescription: z.string().describe('A detailed description of the robot project.'),
  billOfMaterials: z.string().describe('The bill of materials for the robot project.'),
});

export type GenerateImagesInput = z.infer<typeof GenerateImagesInputSchema>;

const GenerateImagesOutputSchema = z.object({
  conceptImage: z.string().describe('Generated concept image as a data URI.'),
  circuitDiagram: z.string().describe('Generated circuit diagram as a data URI.'),
  robot3DModel: z.string().describe('Generated 3D OBJ model content as a string.'),
  robot3DModelFilename: z.string().describe('Filename for the 3D OBJ model file.'),
});

export type GenerateImagesOutput = z.infer<typeof GenerateImagesOutputSchema>;

export async function generateRobotImages(input: GenerateImagesInput): Promise<GenerateImagesOutput> {
  const { projectDescription, billOfMaterials } = input;
  
  try {
    // Generate images only (skipping OBJ model generation for now)
    const [conceptImage, circuitDiagram] = await Promise.all([
      generateConceptImage(projectDescription, billOfMaterials),
      generateCircuitDiagram(projectDescription, billOfMaterials),
    ]);

    return {
      conceptImage,
      circuitDiagram,
      robot3DModel: '', // Empty string since we're skipping OBJ generation
      robot3DModelFilename: 'robot_model.obj',
    };
  } catch (error) {
    console.error('Error generating robot images:', error);
    return {
      conceptImage: '',
      circuitDiagram: '',
      robot3DModel: '',
      robot3DModelFilename: 'robot_model.obj',
    };
  }
}

async function generateConceptImage(projectDescription: string, billOfMaterials: string): Promise<string> {
  try {
    console.log(`[Concept Image] Attempting to use model: ${IMAGE_MODEL}`);
    const conceptImagePrompt = `Create a detailed concept image of a robot based on this description: ${projectDescription}. Include the key components from these materials: ${billOfMaterials}. The image should be realistic, well-lit, and show the robot from a front angle with clear visibility of all major components. Ensure the text is fully readable.`;
    
    // Try with GPT-Image-1 first, fallback to DALL-E 3 if not available
    let response;
    let actualModelUsed = IMAGE_MODEL;
    try {
      response = await openai.images.generate({
        model: IMAGE_MODEL,
        prompt: conceptImagePrompt,
        n: 1,
        size: '1024x1024',
        response_format: IMAGE_MODEL === 'gpt-image-1' ? undefined : 'url',
        quality: 'high',
      });
      console.log(`[Concept Image] Successfully generated using model: ${IMAGE_MODEL}`);
    } catch (modelError: any) {
      actualModelUsed = 'dall-e-3';
      console.warn(`[Concept Image] ${IMAGE_MODEL} not available, falling back to dall-e-3:`, modelError.message);
      response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: conceptImagePrompt,
        n: 1,
        size: '1024x1024',
        response_format: 'url',
        quality: 'standard',
      });
      console.log(`[Concept Image] Successfully generated using fallback model: dall-e-3`);
    }

    // Handle different response formats
    if (actualModelUsed === 'gpt-image-1' && response.data?.[0]?.b64_json) {
      console.log(`[Concept Image] Received base64 response from ${actualModelUsed}`);
      return `data:image/png;base64,${response.data[0].b64_json}`;
    }

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      console.error('[Concept Image] No concept image URL returned from OpenAI');
      return '';
    }

    console.log(`[Concept Image] Received URL response from ${actualModelUsed}, converting to data URI`);
    return await imageUrlToDataUri(imageUrl);
  } catch (error) {
    console.error('[Concept Image] Error generating concept image:', error);
    console.error('Error details:', error);
    return '';
  }
}

async function generateCircuitDiagram(projectDescription: string, billOfMaterials: string): Promise<string> {
  try {
    console.log(`[Circuit Diagram] Attempting to use model: ${IMAGE_MODEL}`);
    const circuitPrompt = `Create a detailed electronic circuit diagram for a robot project. Project description: ${projectDescription}. Components to include: ${billOfMaterials}.

The diagram should be:
- A professional schematic diagram with clear component symbols
- Include proper electrical connections between components
- Show microcontroller/processor connections clearly
- Include power supply connections and voltage levels
- Use standard electronic schematic symbols
- Have clean, readable labels for all components
- Include pin numbers and connection details
- Use a white background with black lines and text
- Professional engineering diagram style
- Include a title block with component list

Make it look like a real engineering schematic that could be used for actual construction. Ensure the text is as readable as possible.`;
    
    // Try with GPT-Image-1 first, fallback to DALL-E 3 if not available
    let response;
    let actualModelUsed = IMAGE_MODEL;
    try {
      response = await openai.images.generate({
        model: IMAGE_MODEL,
        prompt: circuitPrompt,
        n: 1,
        size: '1024x1024',
        response_format: IMAGE_MODEL === 'gpt-image-1' ? undefined : 'url',
        quality: 'high',
      });
      console.log(`[Circuit Diagram] Successfully generated using model: ${IMAGE_MODEL}`);
    } catch (modelError: any) {
      actualModelUsed = 'dall-e-3';
      console.warn(`[Circuit Diagram] ${IMAGE_MODEL} not available, falling back to dall-e-3:`, modelError.message);
      response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: circuitPrompt,
        n: 1,
        size: '1024x1024',
        response_format: 'url',
        quality: 'standard',
      });
      console.log(`[Circuit Diagram] Successfully generated using fallback model: dall-e-3`);
    }

    // Handle different response formats
    if (actualModelUsed === 'gpt-image-1' && response.data?.[0]?.b64_json) {
      console.log(`[Circuit Diagram] Received base64 response from ${actualModelUsed}`);
      return `data:image/png;base64,${response.data[0].b64_json}`;
    }

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      console.error('[Circuit Diagram] No circuit diagram URL returned from OpenAI');
      return '';
    }

    console.log(`[Circuit Diagram] Received URL response from ${actualModelUsed}, converting to data URI`);
    return await imageUrlToDataUri(imageUrl);
  } catch (error) {
    console.error('[Circuit Diagram] Error generating circuit diagram:', error);
    console.error('Error details:', error);
    return '';
  }
}



async function imageUrlToDataUri(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch image from ${url}:`, response.statusText);
      return '';
    }
    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    return `data:${blob.type};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error(`Error converting image to data URI:`, error);
    return '';
  }
}