import type { GenerateBillOfMaterialsOutput } from "@/ai/flows/generate-bill-of-materials";
import type { GenerateCodeOutput } from "@/ai/flows/generate-code";
import type { GenerateAssemblyInstructionsOutput } from "@/ai/flows/generate-assembly-instructions";
import type { GenerateProjectDescriptionOutput } from "@/ai/flows/generate-project-description";

export type ProjectData = {
  projectDescription: GenerateProjectDescriptionOutput;
  billOfMaterials: GenerateBillOfMaterialsOutput;
  code: GenerateCodeOutput;
  assemblyInstructions: GenerateAssemblyInstructionsOutput;
  conceptImage?: string;
  circuitDiagramImage?: string;
  robot3DModelImage?: string; // Deprecated: keeping for backward compatibility
  robot3DModelObjContent?: string;
  robot3DModelFilename?: string;
  platform: 'Raspberry Pi' | 'Arduino' | 'MicroBit';
};
