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
    // Generate base concept image first
    const baseConceptImage = await generateConceptImage(projectDescription, billOfMaterials);
    
    // Refine concept image for maximum realism and readability
    const refinedConceptImage = await refineConceptImage(baseConceptImage, projectDescription, billOfMaterials);
    
    // Generate circuit diagram
    const circuitDiagram = await generateCircuitDiagram(projectDescription, billOfMaterials);
    
    // Refine circuit diagram for text clarity and technical accuracy
    const refinedCircuitDiagram = await refineCircuitDiagram(circuitDiagram, projectDescription, billOfMaterials);

    return {
      conceptImage: refinedConceptImage,
      circuitDiagram: refinedCircuitDiagram,
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
    console.log('[Concept Image] Attempting to use model: ' + IMAGE_MODEL);
    const conceptImagePrompt = `CRITICAL TEXT READABILITY REQUIREMENTS - ABSOLUTE PRIORITY:
- ALL TEXT MUST BE PERFECTLY READABLE - THIS IS NON-NEGOTIABLE
- Minimum text height: 8% of image dimensions 
- High contrast dark text on light backgrounds
- Sans-serif fonts only (Arial, Helvetica)
- No blurred or artistic text treatments
- Text must not overlap other elements
- Component names and model numbers clearly visible
- Professional engineering documentation style
- NO TEXT DISTORTION OR ARTISTIC EFFECTS
- MAXIMUM SHARPNESS AND CLARITY REQUIRED

Create a detailed concept image of a robot based on this description: ${projectDescription}. Include ALL components from this Bill of Materials: ${billOfMaterials}. Show robot as REAL, BUILDABLE PROTOTYPE with clean neutral background, professional technical photography, every BOM component clearly visible, proper mounting, realistic proportions, photorealistic rendering quality. PRIORITY: TEXT MUST BE PERFECTLY LEGIBLE.`;
    
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
      console.log('[Concept Image] Successfully generated using model: ' + IMAGE_MODEL);
    } catch (modelError: unknown) {
      actualModelUsed = 'dall-e-3';
      console.warn('[Concept Image] ' + IMAGE_MODEL + ' not available, falling back to dall-e-3:', (modelError as Error).message);
      response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: conceptImagePrompt,
        n: 1,
        size: '1024x1024',
        response_format: 'url',
        quality: 'hd',
        style: 'natural',
      });
      console.log('[Concept Image] Successfully generated using fallback model: dall-e-3');
    }

    // Handle different response formats
    if (actualModelUsed === 'gpt-image-1' && response.data?.[0]?.b64_json) {
      console.log('[Concept Image] Received base64 response from ' + actualModelUsed);
      return 'data:image/png;base64,' + response.data[0].b64_json;
    }

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      console.error('[Concept Image] No concept image URL returned from OpenAI');
      return '';
    }

    console.log('[Concept Image] Received URL response from ' + actualModelUsed + ', converting to data URI');
    return await imageUrlToDataUri(imageUrl);
  } catch (error) {
    console.error('[Concept Image] Error generating concept image:', error);
    console.error('Error details:', error);
    return '';
  }
}

async function generateCircuitDiagram(projectDescription: string, billOfMaterials: string): Promise<string> {
  try {
    console.log('[Circuit Diagram] Attempting to use model: ' + IMAGE_MODEL);
    const circuitPrompt = `ABSOLUTE TEXT READABILITY REQUIREMENTS - CRITICAL PRIORITY:
- ALL TEXT MUST BE PERFECTLY LEGIBLE - THIS IS NON-NEGOTIABLE
- Minimum text size: 12pt equivalent at 100% zoom
- High contrast black text on white background ONLY
- Sans-serif fonts: Arial, Helvetica, or similar
- No handwritten, cursive, or artistic text styles
- Text must not cross wires or overlap components
- All labels must be horizontally aligned where possible
- Pin numbers must be clearly visible next to connection points
- Voltage indicators must be prominently displayed
- Component values must be easily readable

Create a professional engineering schematic with ALL electronic components from Bill of Materials. Use standard electronic symbols, complete electrical connections, microcontroller pinouts, power supply connections, clean white background with black lines and text, professional schematic layout like Eagle/KiCad, grid lines, title block with project name.

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

Make it look like a real engineering schematic that could be used for actual construction. Ensure all text is maximally readable with proper sizing, high contrast, and clear positioning. All component labels, pin numbers, and voltage indicators must be crystal clear and easily legible.`;
    
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
      console.log('[Circuit Diagram] Successfully generated using model: ' + IMAGE_MODEL);
    } catch (modelError: unknown) {
      actualModelUsed = 'dall-e-3';
      console.warn('[Circuit Diagram] ' + IMAGE_MODEL + ' not available, falling back to dall-e-3:', (modelError as Error).message);
      response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: circuitPrompt,
        n: 1,
        size: '1024x1024',
        response_format: 'url',
        quality: 'hd',
        style: 'natural',
      });
      console.log('[Circuit Diagram] Successfully generated using fallback model: dall-e-3');
    }

    // Handle different response formats
    if (actualModelUsed === 'gpt-image-1' && response.data?.[0]?.b64_json) {
      console.log('[Circuit Diagram] Received base64 response from ' + actualModelUsed);
      return 'data:image/png;base64,' + response.data[0].b64_json;
    }

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      console.error('[Circuit Diagram] No circuit diagram URL returned from OpenAI');
      return '';
    }

    console.log('[Circuit Diagram] Received URL response from ' + actualModelUsed + ', converting to data URI');
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
      console.error('Failed to fetch image from ' + url + ':', response.statusText);
      return '';
    }
    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    return 'data:' + blob.type + ';base64,' + buffer.toString('base64');
  } catch (error) {
    console.error('Error converting image to data URI:', error);
    return '';
  }
}

async function refineConceptImage(baseImage: string, _projectDescription: string, _billOfMaterials: string): Promise<string> {
  try {
    console.log('[Concept Image Refinement] Starting enhancement for realism and readability');
    
    const refinementPrompt = `PHOTOREALISTIC ENHANCEMENT & TEXT READABILITY:
- Make this look like a REAL PHOTOGRAPH of an actual working robot prototype
- Add realistic materials: brushed aluminum, matte plastic, copper PCB traces
- Include proper shadows, reflections, and studio lighting
- Show actual manufacturing details: real screw heads, connector types, wire routing
- Add subtle imperfections for authenticity: minor dust, slight wear, realistic finishes
- ENHANCE TEXT READABILITY TO MAXIMUM:
  * All text must be CRYSTAL CLEAR and perfectly legible
  * High contrast dark text on light backgrounds
  * Sans-serif fonts only, minimum 8% image height
  * No text distortion, blurring, or artistic effects
  * Component labels and model numbers clearly visible
  * Professional engineering documentation standards
- Ensure EXACT MATCH with Bill of Materials: ${_billOfMaterials}
- Every component from BOM must be visible and identifiable
- Realistic proportions and proper mechanical integration
- Professional product photography quality, not CGI or rendering

BASE DESCRIPTION: ${_projectDescription}

REFINEMENT GOALS:
- Maximum text clarity and readability
- Photorealistic materials and textures
- Perfect BOM component matching
- Realistic lighting and shadows
- Professional prototype photography style`;

    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: refinementPrompt,
      n: 1,
      size: '1024x1024',
      response_format: undefined, // Use base64 for gpt-image-1
      quality: 'high',
    });

    if (response.data?.[0]?.b64_json) {
      console.log('[Concept Image Refinement] Successfully enhanced with gpt-image-1');
      return 'data:image/png;base64,' + response.data[0].b64_json;
    }

    console.warn('[Concept Image Refinement] gpt-image-1 failed, returning original image');
    return baseImage;
  } catch (error) {
    console.error('[Concept Image Refinement] Error during enhancement:', error);
    return baseImage;
  }
}

async function refineCircuitDiagram(baseDiagram: string, _projectDescription: string, _billOfMaterials: string): Promise<string> {
  try {
    console.log('[Circuit Diagram Refinement] Starting enhancement for text clarity and technical accuracy');
    
    const refinementPrompt = `PROFESSIONAL SCHEMATIC ENHANCEMENT - MAXIMUM TEXT CLARITY:
- Transform into a PROFESSIONAL ENGINEERING SCHEMATIC with perfect text legibility
- ALL TEXT MUST BE PERFECTLY READABLE - THIS IS NON-NEGOTIABLE
- Minimum 12pt equivalent text size at 100% zoom
- High contrast black text on white background ONLY
- Sans-serif fonts: Arial, Helvetica, or professional equivalents
- No artistic, handwritten, or distorted text styles
- Text must not cross wires or overlap components
- All labels horizontally aligned where possible

TECHNICAL STANDARDS:
- Use standard electronic symbols (IEEE/IEC compliant)
- Include ALL components from Bill of Materials: ${_billOfMaterials}
- Complete electrical connections between all components
- Microcontroller pinouts and connections clearly marked
- Power supply connections with voltage levels displayed
- Professional schematic layout like Eagle/KiCad/Altium
- Clean white background with black lines and text
- Grid lines and alignment guides for clarity
- Title block with project name and component list

COMPONENT INTEGRATION:
- Every BOM component must be included and properly connected
- Pin numbers clearly visible next to connection points
- Voltage indicators prominently displayed (5V, 3.3V, GND)
- Component values easily readable (resistance, capacitance)
- Wire identifiers and connection labels
- Professional engineering documentation quality

PROJECT CONTEXT: ${_projectDescription}

QUALITY REQUIREMENTS:
- Sharp, anti-aliased text with maximum clarity
- Professional technical drawing appearance
- Industry-standard schematic symbols and layout
- All text must be crystal clear and easily legible
- Build-ready technical documentation`;

    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: refinementPrompt,
      n: 1,
      size: '1024x1024',
      response_format: undefined, // Use base64 for gpt-image-1
      quality: 'high',
    });

    if (response.data?.[0]?.b64_json) {
      console.log('[Circuit Diagram Refinement] Successfully enhanced with gpt-image-1');
      return 'data:image/png;base64,' + response.data[0].b64_json;
    }

    console.warn('[Circuit Diagram Refinement] gpt-image-1 failed, returning original diagram');
    return baseDiagram;
  } catch (error) {
    console.error('[Circuit Diagram Refinement] Error during enhancement:', error);
    return baseDiagram;
  }
}