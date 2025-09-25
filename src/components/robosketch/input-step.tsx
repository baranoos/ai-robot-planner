'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ImageUp, Sparkles } from 'lucide-react';

const formSchema = z.object({
  description: z
    .string()
    .min(10, 'Please provide a more detailed description (at least 10 characters).')
    .max(500, 'Description cannot exceed 500 characters.'),
  platform: z.enum(['Raspberry Pi', 'Arduino', 'MicroBit'], {
    required_error: 'You need to select a platform.',
  }),
});

type InputFormValues = z.infer<typeof formSchema>;

interface InputStepProps {
  onSubmit: (data: InputFormValues) => void;
}

export default function InputStep({ onSubmit }: InputStepProps) {
  const form = useForm<InputFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
    },
  });

  const { isSubmitting } = form.formState;

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Design Your Robot</CardTitle>
        <CardDescription>
          Describe your robot concept, and our AI will generate a complete project plan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Robot Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., A small wheeled robot that can navigate a classroom and carry a pen."
                      className="resize-none"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Upload a Sketch (Coming Soon)</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input type="file" disabled className="pl-10" />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ImageUp className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Platform</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a hardware platform" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Raspberry Pi">Raspberry Pi</SelectItem>
                      <SelectItem value="Arduino">Arduino</SelectItem>
                      <SelectItem value="MicroBit">Micro:bit</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              size="lg"
              className="w-full bg-accent hover:bg-accent/90"
              disabled={isSubmitting}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {isSubmitting ? 'Generating...' : 'Generate Project'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
