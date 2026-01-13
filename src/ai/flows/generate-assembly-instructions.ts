'use server';

/**
 * @fileOverview A flow to generate extremely detailed, step-by-step assembly instructions for a robot.
 *
 * This version enforces highly detailed, validated, and bug-resistant instructions.
 * It ensures valid JSON output and automatically includes validation and troubleshooting sections.
 */

import { openai, DEFAULT_MODEL } from '@/ai/openai-client';
import { z } from 'zod';

const GenerateAssemblyInstructionsInputSchema = z.object({
  projectDescription: z
    .string()
    .describe('A detailed description of the robot project.'),
  billOfMaterials: z
    .string()
    .describe('A list of components needed for the robot, including links to purchase them.'),
  circuitDiagram: z
    .string()
    .describe(
      'A diagram of the robot circuit, provided as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.',
    ),
  code: z.string().describe('The code for controlling the robot.'),
  robot3DModel: z
    .string()
    .describe('A 3D model of the robot in OBJ format, provided as text content that can be used for 3D printing and assembly reference.'),
});
export type GenerateAssemblyInstructionsInput = z.infer<
  typeof GenerateAssemblyInstructionsInputSchema
>;

const GenerateAssemblyInstructionsOutputSchema = z.object({
  assemblyInstructions: z.string().describe('Step-by-step instructions for assembling the robot.'),
  assemblyInstructionsFormat: z
    .enum(['pdf', 'markdown'])
    .describe('The format of the assembly instructions.'),
});
export type GenerateAssemblyInstructionsOutput = z.infer<
  typeof GenerateAssemblyInstructionsOutputSchema
>;

export async function generateAssemblyInstructions(
  input: GenerateAssemblyInstructionsInput,
): Promise<GenerateAssemblyInstructionsOutput> {
  const prompt = `
You are a senior robotics engineer and technical documentation specialist.

Generate **extremely detailed, step-by-step assembly instructions** for building the described robot.  
Each step must be *explicit, practical, and testable* — never assume the user knows what to do.

---

### Context

Project Description:
${input.projectDescription}

Bill of Materials:
${input.billOfMaterials}

Circuit Diagram (may be Base64 data URI or empty):
${input.circuitDiagram ? '[included]' : '[none]'}

Code:
${input.code ? '[included]' : '[none]'}

Robot 3D Model (OBJ format):
${input.robot3DModel ? '[included]' : '[none]'}

---

### OUTPUT FORMAT
Respond with **valid JSON** containing:
- "assemblyInstructions": (string) detailed Markdown instructions
- "assemblyInstructionsFormat": either "pdf" or "markdown"

---

### CRITICAL BOM INTEGRATION RULES

- Every single component listed in the Bill of Materials **must appear in the assembly steps**.
- If the BOM specifies a **quantity**, you must reference it explicitly.
  - Example: “Install 2 × DC 6V motors on each side of the chassis.”
- If multiple identical components are used (e.g., 4 screws, 2 sensors), describe **each installation step individually or in grouped form** (e.g., “Repeat for all 4 wheels”).
- If a component from the BOM is not used during assembly, include a note in **Appendices** explaining why.
- If the BOM contains pricing or vendor links, ignore those for now — only focus on component usage, quantity, and placement.

🔧  MECHANICAL COMPATIBILITY CHECKLIST:
- Verify motor shaft diameter matches wheel hubs
- Ensure screw sizes match mounting holes on components  
- Check that chassis dimensions accommodate all components
- Confirm that fastener quantities are sufficient for all attachments

⚡  ELECTRICAL COMPATIBILITY VALIDATION:
- Verify voltage requirements match power supply capabilities
- Ensure pin connections are compatible between components
- Check that connector types match (JST, Dupont, screw terminals)
- Validate current requirements don't exceed component ratings

📋  COMPONENT TRACKING:
- Create a checklist of all BOM items with quantities
- Reference this checklist throughout the assembly process
- Include a final verification step confirming all components are used
- Document any purpose for which each component is used

---

### INSTRUCTION REQUIREMENTS

Make the assembly guide **hyper-detailed**.  
Each section should contain exact component names, screw sizes, wire colors, pin numbers, and connector types.

#### Sections (in order):

1. **Overview**
   - Summarize the robot’s goal and purpose.
   - Include safety precautions: anti-static handling, battery safety, soldering safety.

2. **Tools & Materials**
   - List all required tools and consumables with details.
   - Example: “Phillips screwdriver #1”, “M3 wrench”, “22 AWG wire stripper”, “Multimeter with continuity mode.”

3. **Component Inventory & Verification**
   - List all parts from the Bill of Materials with **quantities** (e.g., “2 × DC Motors”, “1 × Raspberry Pi 4 Model B”).
   - Instruct the user to label, test, and pre-fit parts before assembly.
   - Example: “Label each ultrasonic sensor (FRONT, LEFT, RIGHT).”

4. **Mechanical Assembly**
   - Describe exactly how to attach each mechanical part.
   - Include direction, orientation, screw sizes, torque guidance, and alignment notes.
   - Example: “Attach both left and right DC motors (2× total) using 2× M3×10 mm screws per motor. Torque 0.5 Nm.”

5. **Electrical Wiring**
   - Describe each connection in precise terms:
     - Wire color, connector type, port/pin label, length, and wire gauge (AWG).
     - Example: “Connect red (V+) wire from 7.4 V Li-ion battery pack to Arduino VIN via JST-SM 2-pin connector (22 AWG, 120 mm).”
   - Include wiring for every listed component that requires power or communication.
   - Verify correct polarity and connector locking.

6. **Circuit Verification**
   - Explain how to check continuity and voltage with a multimeter.
   - Include expected voltage values and polarity checks.

7. **Firmware Upload & Setup**
   - Step-by-step: connect controller board, upload firmware, configure settings.
   - Example: “Set approach interval = 1 hour in main.py line 42.”

8. **Calibration**
   - Include sensor calibration (e.g., ultrasonic distance, motor balance).
   - Provide expected tolerances and verification tests.

9. **Validation Tests (Goal #1)**
   - Define specific functional tests to ensure the robot performs correctly.
   - Each test must include objective, steps, expected result, and pass criteria.
   - Example: “Obstacle avoidance: place object 20 cm ahead → robot stops within 0.5 s and turns ≥ 45°.”

10. **Common Issues & Fixes (Goal #2)**
    - List common wiring and code issues with cause and resolution.
    - Example: “If left motor doesn’t spin → verify ENA pin connection and motor polarity.”

11. **Maintenance & Safety**
    - Battery care, cleaning, and mechanical inspection steps.

12. **Final Component Verification**
    - Cross-reference assembly with complete Bill of Materials
    - Confirm every BOM component is properly installed and functional
    - Provide a component-by-component verification checklist
    - Include troubleshooting for any component that fails verification
    - Document any modifications made during assembly

13. **Build Completion & Validation**
    - End with a “Build Complete” summary confirming successful setup.

---

### STYLE & FORMAT
- Use Markdown numbering (1., 1.1., etc.).
- Use **imperative verbs** (“Attach”, “Connect”, “Verify”, “Upload”).
- Reference components and quantities exactly as in the BOM.
- Write concise but specific sentences.
- If any detail is missing, state assumptions clearly.
- Keep tone professional and instructional.

---

Return only the JSON object — no commentary, no extra text.
`;

  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert robotics engineer and technical documentation specialist specializing in PERFECT BOM-ASSEMBLY INTEGRATION. Respond ONLY with valid JSON containing "assemblyInstructions" (string) and "assemblyInstructionsFormat" ("pdf" or "markdown").\n\nABSOLUTE REQUIREMENTS - NON-NEGOTIABLE:\n1. EVERY single component from Bill of Materials MUST be used in assembly steps\n2. EXACT quantities from BOM must be referenced explicitly\n3. Component names MUST match BOM exactly\n4. Each assembly step must be mechanically and electrically feasible\n5. Text must be clear, precise, and executable\n6. No component from BOM can be omitted or ignored\n\nBOM COMPLIANCE CHECKLIST:\n- Cross-reference every BOM item with assembly steps\n- Verify exact quantities are used\n- Ensure all connectors, fasteners, and components included\n- Validate mechanical compatibility between components\n- Check electrical connections are possible with listed parts\n- Confirm no BOM components are left unused\n\nThe content must be fully detailed, validated, and ensure every component from the Bill of Materials is properly integrated and accounted for. All instructions must be technically accurate and mechanically feasible.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.55,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from OpenAI');

    const parsed = JSON.parse(content);
    return {
      assemblyInstructions: parsed.assemblyInstructions || '',
      assemblyInstructionsFormat:
        parsed.assemblyInstructionsFormat === 'pdf' ? 'pdf' : 'markdown',
    };
  } catch (error) {
    console.error('Error generating assembly instructions:', error);
    throw new Error('Failed to generate assembly instructions');
  }
}