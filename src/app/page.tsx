'use client';

import { useState } from 'react';
import type { ProjectData } from '@/lib/types';
import { generateProjectAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/robosketch/header';
import InputStep from '@/components/robosketch/input-step';
import GeneratingStep from '@/components/robosketch/generating-step';
import ResultsDisplay from '@/components/robosketch/results-display';

type ProjectState = 'input' | 'generating' | 'results';

export default function Home() {
  const [projectState, setProjectState] = useState<ProjectState>('input');
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const { toast } = useToast();

  const handleGenerate = async (data: {
    description: string;
    platform: 'Raspberry Pi' | 'Arduino' | 'MicroBit';
    image?: File | null;
  }) => {
    setProjectState('generating');
    
    // Convert image to base64 if provided
    let imageBase64: string | undefined;
    if (data.image) {
      const reader = new FileReader();
      imageBase64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(data.image!);
      });
    }
    
    const result = await generateProjectAction({
      description: data.description,
      platform: data.platform,
      image: imageBase64,
    });
    
    if (result.success && result.data) {
      setProjectData(result.data);
      setProjectState('results');
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Generating Project',
        description: result.error || 'An unknown error occurred.',
      });
      setProjectState('input');
    }
  };

  const handleReset = () => {
    setProjectData(null);
    setProjectState('input');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl">
          {projectState === 'input' && <InputStep onSubmit={handleGenerate} />}
          {projectState === 'generating' && <GeneratingStep />}
          {projectState === 'results' && projectData && (
            <ResultsDisplay data={projectData} onReset={handleReset} />
          )}
        </div>
      </main>
    </div>
  );
}
