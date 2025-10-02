'use server';

/**
 * @fileOverview A flow to generate images for the robot project using DALL-E.
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
  robot3DModel: z.string().describe('Generated 3D model image as a data URI.'),
});

export type GenerateImagesOutput = z.infer<typeof GenerateImagesOutputSchema>;

export async function generateRobotImages(input: GenerateImagesInput): Promise<GenerateImagesOutput> {
  const { projectDescription, billOfMaterials } = input;
  
  try {
    // Generate robot concept image using DALL-E
    const conceptImagePrompt = `Create a detailed concept image of a robot based on this description: ${projectDescription}. Include the key components from these materials: ${billOfMaterials}. The image should be realistic, well-lit, and show the robot from a front angle.`;
    
    const response = await openai.images.generate({
      model: IMAGE_MODEL,
      prompt: conceptImagePrompt,
      n: 1,
      size: '1024x1024',
      response_format: 'url',
    });

    // Extract the image URL from OpenAI response
    const imageUrl = response.data?.[0]?.url;
    
    if (!imageUrl) {
      console.error('No image URL returned from OpenAI');
      return {
        conceptImage: '',
        circuitDiagram: '',
        robot3DModel: '',
      };
    }

    // Convert image URL to data URI
    const conceptImageUri = await imageUrlToDataUri(imageUrl);

    // For circuit diagrams and 3D models, we'll return empty strings
    // since DALL-E is not suitable for generating technical diagrams
    // The UI will fall back to placeholder images for these
    return {
      conceptImage: conceptImageUri,
      circuitDiagram: '',  // Will fall back to placeholder
      robot3DModel: '',   // Will fall back to placeholder
    };
  } catch (error) {
    console.error('Error generating robot images:', error);
    return {
      conceptImage: '',
      circuitDiagram: '',
      robot3DModel: '',
    };
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