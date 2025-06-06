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

const ForumThread = ({ title, author, authorAvatar, date = "Hoje", replies, likes, tags = [], onClick }: ForumThreadProps) => {
  return (
    <div onClick={onClick} className="bg-white p-4 rounded-xl shadow-sm hover:bg-slate-50 transition-colors cursor-pointer">
      <div className="flex items-center gap-2 mb-3">
        {tags.map((tag, index) => (
          <span 
            key={index}
            className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700"
          >
            {tag}
          </span>
        ))}
      </div>
      
      <h3 className="font-bold text-slate-800 mb-3">{title}</h3>
      
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2">
          <img 
            src={authorAvatar} 
            alt={author} 
            className="h-6 w-6 rounded-full object-cover"
          />
          <span className="text-xs text-slate-500">{author} • {date}</span>
        </div>
        
        <div className="flex items-center gap-4 text-slate-500">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs font-medium">{replies}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ThumbsUp className="h-4 w-4" />
            <span className="text-xs font-medium">{likes}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumThread;