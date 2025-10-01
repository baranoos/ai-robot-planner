'use server';

/**
 * @fileOverview A flow to generate images for the robot project using DALL-E.
 *
 * - generateRobotImages - A function that generates robot concept, circuit diagram, and 3D model images.
 * - GenerateImagesInput - The input type for the generateRobotImages function.
 * - GenerateImagesOutput - The return type for the generateRobotImages function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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
  return generateImagesFlow(input);
}

const generateImagesFlow = ai.defineFlow(
  {
    name: 'generateImagesFlow',
    inputSchema: GenerateImagesInputSchema,
    outputSchema: GenerateImagesOutputSchema,
  },
  async (input) => {
    const { projectDescription, billOfMaterials } = input;
    
    // Generate robot concept image using DALL-E (only this one makes sense)
    const conceptImagePrompt = `Create a detailed concept image of a robot based on this description: ${projectDescription}. Include the key components from these materials: ${billOfMaterials}. The image should be realistic, well-lit, and show the robot from a front angle.`;
    
    const conceptImageResponse = await ai.generate({
      prompt: conceptImagePrompt,
      model: 'gpt-image-1',
      config: {
        n: 1,
        size: '1024x1024',
        response_format: 'url',
      },
    });

    // Extract the concept image URL from Genkit response structure
    const conceptImageUrl = extractImageUrl(conceptImageResponse);

    // Convert concept image URL to data URI
    const conceptImageUri = await imageUrlToDataUri(conceptImageUrl);

    // For circuit diagrams and 3D models, we'll return empty strings
    // since DALL-E is not suitable for generating technical diagrams
    // The UI will fall back to placeholder images for these
    return {
      conceptImage: conceptImageUri,
      circuitDiagram: '',  // Will fall back to placeholder
      robot3DModel: '',   // Will fall back to placeholder
    };
  }
);

function extractImageUrl(genkitResponse: any): string {
  // Check if response has the standard format with candidates
  if (genkitResponse && genkitResponse.candidates && genkitResponse.candidates[0]) {
    const candidate = genkitResponse.candidates[0];
    if (candidate.message && candidate.message.content && candidate.message.content[0]) {
      const content = candidate.message.content[0];
      if (content.media && content.media.url) {
        return content.media.url;
      }
    }
  }
  
  // If the response has a different structure, try alternative access patterns
  if (genkitResponse && typeof genkitResponse === 'object') {
    // Check if the response directly contains a media URL
    if (genkitResponse.media && genkitResponse.media.url) {
      return genkitResponse.media.url;
    }
    
    // Check if response.text() method exists (for text generation responses)
    if (typeof genkitResponse.text === 'function') {
      return genkitResponse.text();
    }
  }
  
  // If all else fails, return an empty string
  console.error('Could not extract image URL from response:', genkitResponse);
  return '';
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