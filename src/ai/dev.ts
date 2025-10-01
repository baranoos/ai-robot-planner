import { config } from 'dotenv';
config();

import '@/ai/flows/generate-code.ts';
import '@/ai/flows/generate-project-description.ts';
import '@/ai/flows/generate-bill-of-materials.ts';
import '@/ai/flows/generate-assembly-instructions.ts';
import '@/ai/flows/generate-images.ts';