
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import RichTextEditor from "@/components/RichTextEditor";
import YoutubeEmbed from "@/components/YoutubeEmbed";

interface VideoContentProps {
  videoUrl: string;
  videoNotes: string;
  onVideoUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVideoNotesChange: (content: string) => void;
}

const VideoContent = ({ 
  videoUrl, 
  videoNotes, 
  onVideoUrlChange, 
  onVideoNotesChange 
}: VideoContentProps) => {
  return (
    <>
      <div>
        <Label htmlFor="video_url">URL do Vídeo (YouTube)</Label>
        <Input
          id="video_url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={videoUrl}
          onChange={onVideoUrlChange}
        />
        <p className="text-gray-500 text-xs mt-1">Coloque o link completo do YouTube</p>
      </div>
      
      {videoUrl && (
        <div className="mt-4">
          <Label>Pré-visualização:</Label>
          <div className="mt-2">
            <YoutubeEmbed videoId={videoUrl} />
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="video_notes">Anotações sobre o vídeo</Label>
        <div className="mt-1 border rounded-md overflow-hidden">
          <RichTextEditor value={videoNotes} onChange={onVideoNotesChange} height={250} />
        </div>
      </div>
    </>
  );
};

export default VideoContent;
