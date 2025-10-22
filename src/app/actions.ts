'use server';

import { generateProjectDescription } from '@/ai/flows/generate-project-description';
import { generateBillOfMaterials } from '@/ai/flows/generate-bill-of-materials';
import { generateCode } from '@/ai/flows/generate-code';
import { generateAssemblyInstructions } from '@/ai/flows/generate-assembly-instructions';
import { generateRobotImages } from '@/ai/flows/generate-images';
import type { ProjectData } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export async function generateProjectAction(data: {
  description: string;
  platform: 'Raspberry Pi' | 'Arduino' | 'MicroBit';
}): Promise<{ success: boolean; data?: ProjectData; error?: string }> {
  try {
    const projectDescription = await generateProjectDescription({ input: data.description });
    const billOfMaterials = await generateBillOfMaterials(projectDescription);
    const code = await generateCode({
      robotDescription: projectDescription.projectDescription,
      platform: data.platform,
    });
    
    const bomString = billOfMaterials.billOfMaterials
      .map(item => `${item.component}: ${item.description} - ${item.approximatePriceUSD}`)
      .join('\n');
    
    // Generate images based on the project description and bill of materials
    const generatedImages = await generateRobotImages({
      projectDescription: projectDescription.projectDescription,
      billOfMaterials: bomString,
    });

    const assemblyInstructions = await generateAssemblyInstructions({
      projectDescription: projectDescription.projectDescription,
      billOfMaterials: bomString,
      code: code.code,
      circuitDiagram: generatedImages.circuitDiagram,
      robot3DModel: generatedImages.robot3DModel,
    });
    
    const projectData: ProjectData = {
      projectDescription,
      billOfMaterials,
      code,
      assemblyInstructions,
      conceptImage: generatedImages.conceptImage,
      circuitDiagramImage: generatedImages.circuitDiagram,
      robot3DModelObjContent: generatedImages.robot3DModel,
      robot3DModelFilename: generatedImages.robot3DModelFilename,
      platform: data.platform,
    };

    return { success: true, data: projectData };
  } catch (error) {
    console.error('Error generating project:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during project generation.';
    return { success: false, error: errorMessage };
  }
}
