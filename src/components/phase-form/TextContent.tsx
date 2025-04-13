
import React from "react";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/RichTextEditor";

interface TextContentProps {
  content: string;
  onChange: (content: string) => void;
}

const TextContent = ({ content, onChange }: TextContentProps) => {
  return (
    <div>
      <Label htmlFor="content">Conteúdo</Label>
      <div className="mt-1">
        <RichTextEditor value={content} onChange={onChange} />
      </div>
    </div>
  );
};

export default TextContent;
