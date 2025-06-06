
import { MessageSquare, ThumbsUp } from "lucide-react";

interface ForumThreadProps {
  title: string;
  author: string;
  authorAvatar: string;
  date?: string;
  replies: number;
  likes: number;
  tags?: string[];
  onClick?: () => void;
}

const ForumThread = ({
  title,
  author,
  authorAvatar,
  date = "Hoje",
  replies,
  likes,
  tags = [],
  onClick,
}: ForumThreadProps) => {
  return (
    <div onClick={onClick} className="card-trilha p-4 cursor-pointer hover:border-trilha-orange">
      <h3 className="font-bold mb-2">{title}</h3>
      
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map((tag, index) => (
          <span 
            key={index}
            className="rounded-full bg-trilha-orange/10 px-2 py-0.5 text-xs font-medium text-trilha-orange"
          >
            {tag}
          </span>
        ))}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img 
            src={authorAvatar} 
            alt={author} 
            className="h-6 w-6 rounded-full object-cover"
          />
          <span className="text-xs text-gray-600">{author} • {date}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs text-gray-600">{replies}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs text-gray-600">{likes}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumThread;
