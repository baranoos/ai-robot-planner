# **App Name**: RoboSketch Planner

## Core Features:

- Input Interpretation: Accepts image/text input, interprets requirements using GPT-4 and the Vision API to visualize the robot concept, generating a concept image (optional).
- Project Definition: Generates a clear project description from interpreted input.
- Bill of Materials Generation: Generates an open-source Bill of Materials (BOM) with part links (Adafruit, SparkFun, etc.), focusing on affordability.
- Circuit Diagram Generation: Generates wiring diagrams/circuit schematics (PNG/SVG) using a tool as decided by the AI tool.
- Code Generation: Generates working robot control code (Python for Raspberry Pi, C++ for Arduino/MicroBit).
- 3D Model Output: Creates printable 3D model files (STL/STEP) using a 3D design tool selected by the tool for robot casing and parts.
- Assembly Instruction Generation: Generates step-by-step build instructions as PDF or Markdown files.
- Project Export: Bundles project files into a downloadable ZIP. Allows optional cloud-based file storage and sharing.

## Style Guidelines:

- Primary color: Blue (#4285F4), reflecting reliability and engineering.
- Background color: Light gray (#F5F5F5), providing a clean, neutral canvas.
- Accent color: Green (#34A853), used for call-to-action buttons to signify the build process.
- Headline font: 'Space Grotesk', sans-serif. Body font: 'Inter', sans-serif.
- Use a set of clean, geometric icons representing components and actions, designed for clarity.
- Employ a modular layout with clear divisions for each function: input, processing, output. Prioritize mobile-responsiveness and embeddability.
- Subtle transitions and progress animations during AI processing and file generation.