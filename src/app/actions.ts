'use server';

import { generateProjectDescription } from '@/ai/flows/generate-project-description';
import { generateBillOfMaterials } from '@/ai/flows/generate-bill-of-materials';
import { generateCode } from '@/ai/flows/generate-code';
import { generateAssemblyInstructions } from '@/ai/flows/generate-assembly-instructions';
import type { ProjectData } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

async function getPlaceholderDataUri(id: string): Promise<string> {
  const placeholder = PlaceHolderImages.find((p) => p.id === id);
  if (!placeholder) return '';
  try {
    const response = await fetch(placeholder.imageUrl);
    if (!response.ok) return '';
    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    return `data:${blob.type};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error(`Failed to fetch placeholder for ${id}:`, error);
    return '';
  }
}

export async function generateProjectAction(data: {
  description: string;
  platform: 'Raspberry Pi' | 'Arduino' | 'MicroBit';
}): Promise<{ success: boolean; data?: ProjectData; error?: string }> {
  try {
    const projectDescription = await generateProjectDescription({ input: data.description });

    const [billOfMaterials, code, circuitDiagramUri, robot3dModelUri] = await Promise.all([
      generateBillOfMaterials(projectDescription),
      generateCode({
        robotDescription: projectDescription.projectDescription,
        platform: data.platform,
      }),
      getPlaceholderDataUri('circuit-diagram'),
      getPlaceholderDataUri('3d-model'),
    ]);
    
    const bomString = billOfMaterials.billOfMaterials
      .map(item => `${item.component}: ${item.description} - $${item.approximatePriceUSD}`)
      .join('\n');

    const assemblyInstructions = await generateAssemblyInstructions({
      projectDescription: projectDescription.projectDescription,
      billOfMaterials: bomString,
      code: code.code,
      circuitDiagram: circuitDiagramUri,
      robot3DModel: robot3dModelUri,
    });
    
    const projectData: ProjectData = {
      projectDescription,
      billOfMaterials,
      code,
      assemblyInstructions,
      platform: data.platform,
    };

    return { success: true, data: projectData };
  } catch (error) {
    console.error('Error generating project:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during project generation.';
    return { success: false, error: errorMessage };
  }
}
