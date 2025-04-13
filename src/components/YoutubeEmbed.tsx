
import React, { useEffect, useState } from "react";

interface YoutubeEmbedProps {
  videoId: string;
  className?: string;
}

const YoutubeEmbed = ({ videoId, className = "" }: YoutubeEmbedProps) => {
  const [id, setId] = useState<string>("");

  useEffect(() => {
    // Don't process if the videoId is empty
    if (!videoId) {
      setId("");
      return;
    }
    
    // Parse video ID from different YouTube URL formats
    if (videoId.includes("youtube.com") || videoId.includes("youtu.be")) {
      try {
        const url = new URL(videoId);
        
        if (videoId.includes("youtube.com/watch")) {
          // Format: https://www.youtube.com/watch?v=VIDEO_ID
          const params = new URLSearchParams(url.search);
          const extractedId = params.get("v");
          if (extractedId) setId(extractedId);
        } else if (videoId.includes("youtu.be")) {
          // Format: https://youtu.be/VIDEO_ID
          setId(url.pathname.substring(1));
        } else if (videoId.includes("youtube.com/embed")) {
          // Format: https://www.youtube.com/embed/VIDEO_ID
          setId(url.pathname.split("/").pop() || "");
        }
      } catch (error) {
        console.error("Error parsing YouTube URL:", error);
        // If URL parsing fails, use the original ID
        if (!videoId.includes("http")) {
          setId(videoId);
        } else {
          setId("");
        }
      }
    } else {
      // If not a URL, assume it's the video ID directly
      setId(videoId);
    }
  }, [videoId]);

  if (!id) return <div className="p-4 text-center text-gray-500">Digite uma URL válida do YouTube</div>;

  const embedUrl = `https://www.youtube.com/embed/${id}`;
  
  return (
    <div className={`relative pt-[56.25%] w-full overflow-hidden rounded-lg shadow-md ${className}`}>
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={embedUrl}
        title="YouTube video"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default YoutubeEmbed;
