
import React from "react";

interface YoutubeEmbedProps {
  videoId: string;
}

const YoutubeEmbed = ({ videoId }: YoutubeEmbedProps) => {
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
  
  return (
    <div className="relative pt-[56.25%] w-full overflow-hidden rounded-lg shadow-md">
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
