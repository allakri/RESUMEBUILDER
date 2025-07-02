
"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { cn } from "@/lib/utils";

const templates = [
  { id: 1, name: "Modern", recommended: true, imageUrl: "https://placehold.co/400x566.png", hint: "resume professional" },
  { id: 2, name: "Creative", recommended: true, imageUrl: "https://placehold.co/400x566.png", hint: "resume modern" },
  { id: 3, name: "Professional", recommended: true, imageUrl: "https://placehold.co/400x566.png", hint: "resume classic" },
  { id: 4, name: "Minimalist", recommended: false, imageUrl: "https://placehold.co/400x566.png", hint: "resume simple" },
  { id: 5, name: "Executive", recommended: true, imageUrl: "https://placehold.co/400x566.png", hint: "resume corporate" },
  { id: 6, name: "Academic", recommended: false, imageUrl: "https://placehold.co/400x566.png", hint: "resume elegant" },
  { id: 7, name: "Elegant", recommended: true, imageUrl: "https://placehold.co/400x566.png", hint: "resume design" },
  { id: 8, name: "Compact", recommended: false, imageUrl: "https://placehold.co/400x566.png", hint: "resume compact" },
  { id: 9, name: "Technical", recommended: true, imageUrl: "https://placehold.co/400x566.png", hint: "resume technical" },
];

const colors = [
  { name: "White", value: "#ffffff", ring: "ring-gray-400" },
  { name: "Dark Slate", value: "#374151", ring: "ring-gray-500" },
  { name: "Cool Blue", value: "#3b82f6", ring: "ring-blue-500" },
  { name: "Emerald", value: "#10b981", ring: "ring-emerald-500" },
  { name: "Forest Green", value: "#166534", ring: "ring-green-700" },
  { name: "Sunset Orange", value: "#f97316", ring: "ring-orange-500" },
  { name: "Crimson Red", value: "#dc2626", ring: "ring-red-600" },
];

export default function TemplatesPage() {
  const [selectedColor, setSelectedColor] = useState(colors[0].value);

  return (
    <div className="bg-gray-50 text-gray-800 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="h-8 w-8 text-gray-700" />
            <span className="text-2xl font-bold">Resume <span className="font-light">Now.</span></span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-2">
            Templates we recommend for you
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            You can always change your template later. Our professional templates are designed to get you hired.
          </p>
        </header>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 mb-10 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <span className="font-semibold text-sm text-gray-700">Filters:</span>
          <Select defaultValue="all">
            <SelectTrigger className="w-auto sm:w-[150px] h-9 text-sm">
              <SelectValue placeholder="Headshot" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Headshot</SelectItem>
              <SelectItem value="with">With Headshot</SelectItem>
              <SelectItem value="without">Without Headshot</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-auto sm:w-[150px] h-9 text-sm">
              <SelectValue placeholder="Graphics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Graphics</SelectItem>
              <SelectItem value="with">With Graphics</SelectItem>
              <SelectItem value="without">Without Graphics</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-auto sm:w-[150px] h-9 text-sm">
              <SelectValue placeholder="Columns" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Columns</SelectItem>
              <SelectItem value="one">One Column</SelectItem>
              <SelectItem value="two">Two Columns</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-gray-700">Color:</span>
            <div className="flex items-center gap-2">
              {colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color.value)}
                  className={cn(
                    "h-7 w-7 rounded-full border border-gray-300 transition-all focus:outline-none",
                    selectedColor === color.value && `ring-2 ring-offset-2 ${color.ring}`
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  <span className="sr-only">{color.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-6">
          Showing all templates ({templates.length})
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
          {templates.map((template) => (
            <div key={template.id} className="group flex flex-col items-center">
              <Card
                className="relative w-full overflow-hidden border-gray-300 border-2 rounded-lg hover:border-blue-500 hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                {template.recommended && (
                   <div className="absolute top-[18px] right-[-30px] w-[140px] transform rotate-45 bg-blue-600 text-center text-white font-semibold py-1 z-10 text-xs shadow-md">
                        RECOMMENDED
                   </div>
                )}
                <div className="aspect-[8.5/11] bg-white">
                  <Image
                    src={template.imageUrl}
                    alt={template.name}
                    width={400}
                    height={566}
                    className="w-full h-full object-cover transition-transform duration-300"
                    data-ai-hint={template.hint}
                  />
                </div>
                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                     <Button className="w-1/2" size="lg">Choose template</Button>
                 </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
