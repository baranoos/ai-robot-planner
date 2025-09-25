import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

const steps = [
    "Analyzing your design...",
    "Generating project description...",
    "Sourcing open-source components...",
    "Generating control code...",
    "Drafting assembly instructions...",
    "Finalizing project files..."
];

export default function GeneratingStep() {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(steps[0]);

  useEffect(() => {
    const totalDuration = 8000; // 8 seconds for the whole process
    const stepDuration = totalDuration / steps.length;
    let stepIndex = 0;

    const stepInterval = setInterval(() => {
        stepIndex++;
        if (stepIndex < steps.length) {
            setCurrentStep(steps[stepIndex]);
        } else {
            clearInterval(stepInterval);
        }
    }, stepDuration);

    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 95) {
          clearInterval(timer);
          return 95;
        }
        return oldProgress + 5;
      });
    }, 400);

    return () => {
      clearInterval(timer);
      clearInterval(stepInterval);
    };
  }, []);

  return (
    <Card className="w-full shadow-lg animate-pulse">
      <CardHeader className="items-center text-center">
        <CardTitle className="font-headline text-2xl">Building Your Robot...</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="w-full max-w-sm">
            <Progress value={progress} className="w-full" />
        </div>
        <p className="text-muted-foreground">{currentStep}</p>
      </CardContent>
    </Card>
  );
}
