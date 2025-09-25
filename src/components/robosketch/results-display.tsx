'use client';

import type { ProjectData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, FileText, Wrench, Cpu, Code, Shapes, Bot } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import BomTable from './bom-table';
import CodeDisplay from './code-display';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';


interface ResultsDisplayProps {
  data: ProjectData;
  onReset: () => void;
}

export default function ResultsDisplay({ data, onReset }: ResultsDisplayProps) {
  const conceptImage = PlaceHolderImages.find((p) => p.id === 'robot-concept');
  const circuitImage = PlaceHolderImages.find((p) => p.id === 'circuit-diagram');
  const modelImage = PlaceHolderImages.find((p) => p.id === '3d-model');

  const handleDownload = async () => {
    const zip = new JSZip();
    zip.file("project_description.txt", data.projectDescription.projectDescription);
    
    const bomCsv = "Component,Description,Link,Price (USD)\n" + data.billOfMaterials.billOfMaterials.map(i => `"${i.component}","${i.description}",${i.link},${i.approximatePriceUSD}`).join("\n");
    zip.file("bill_of_materials.csv", bomCsv);
    
    const codeFileExtension = data.platform === 'Raspberry Pi' ? 'py' : 'cpp';
    zip.file(`code.${codeFileExtension}`, data.code.code);
    
    zip.file("assembly_instructions.md", data.assemblyInstructions.assemblyInstructions);

    if (circuitImage) {
      const response = await fetch(circuitImage.imageUrl);
      const blob = await response.blob();
      zip.file("images/circuit_diagram.jpg", blob);
    }
    if (modelImage) {
      const response = await fetch(modelImage.imageUrl);
      const blob = await response.blob();
      zip.file("images/3d_model.jpg", blob);
    }

    zip.generateAsync({type:"blob"}).then(function(content) {
      saveAs(content, "robosketch-project.zip");
    });
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline text-3xl">Your Robot Project is Ready!</CardTitle>
                <CardDescription>All the files and instructions you need to start building.</CardDescription>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={onReset}><ArrowLeft className="mr-2 h-4 w-4" /> Start Over</Button>
                <Button className="bg-accent hover:bg-accent/90" onClick={handleDownload}><Download className="mr-2 h-4 w-4" /> Download ZIP</Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
            <TabsTrigger value="overview"><Bot className="mr-2 h-4 w-4" />Overview</TabsTrigger>
            <TabsTrigger value="bom"><Wrench className="mr-2 h-4 w-4" />BOM</TabsTrigger>
            <TabsTrigger value="code"><Code className="mr-2 h-4 w-4" />Code</TabsTrigger>
            <TabsTrigger value="hardware"><Shapes className="mr-2 h-4 w-4" />Hardware</TabsTrigger>
            <TabsTrigger value="assembly"><FileText className="mr-2 h-4 w-4" />Assembly</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Project Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-muted-foreground">{data.projectDescription.projectDescription}</p>
                    {conceptImage && (
                        <div>
                            <h3 className="font-semibold mb-2">Concept Visualization</h3>
                             <Image
                                src={conceptImage.imageUrl}
                                alt={conceptImage.description}
                                width={600}
                                height={400}
                                className="rounded-lg border object-cover"
                                data-ai-hint={conceptImage.imageHint}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bom" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Bill of Materials</CardTitle>
                    <CardDescription>All the components you need for your project.</CardDescription>
                </CardHeader>
                <CardContent>
                    <BomTable bom={data.billOfMaterials.billOfMaterials} />
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="code" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Generated Code</CardTitle>
                    <CardDescription>Control code for your <span className="font-semibold">{data.platform}</span>.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CodeDisplay code={data.code.code} platform={data.platform} />
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hardware" className="mt-4">
            <div className="grid md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Circuit Diagram</CardTitle>
                        <CardDescription>Wiring schematics for your robot.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {circuitImage && <Image src={circuitImage.imageUrl} alt={circuitImage.description} width={600} height={400} className="rounded-lg border object-cover" data-ai-hint={circuitImage.imageHint} />}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">3D Model</CardTitle>
                        <CardDescription>Printable parts for your robot's chassis.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {modelImage && <Image src={modelImage.imageUrl} alt={modelImage.description} width={600} height={400} className="rounded-lg border object-cover" data-ai-hint={modelImage.imageHint} />}
                    </CardContent>
                </Card>
            </div>
          </TabsContent>

          <TabsContent value="assembly" className="mt-4">
              <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Assembly Instructions</CardTitle>
                    <CardDescription>Step-by-step guide to build your robot.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none bg-secondary p-4 rounded-md border max-h-[500px] overflow-auto">
                        <pre className="whitespace-pre-wrap font-body text-sm">{data.assemblyInstructions.assemblyInstructions}</pre>
                    </div>
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
