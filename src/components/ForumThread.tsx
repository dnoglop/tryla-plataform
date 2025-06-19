
import { MessageCircle, ThumbsUp, Clock } from "lucide-react";

interface ForumThreadProps {
  title: string;
  author: string;
  preview: string;
  replies: number;
  likes: number;
  timeAgo: string;
  onClick?: () => void;
}

const ForumThread = ({ title, author, preview, replies, likes, timeAgo, onClick }: ForumThreadProps) => {
  return (
    <div onClick={onClick} className="bg-card p-4 rounded-xl shadow-sm border hover:bg-muted/50 transition-colors cursor-pointer">
      <div className="space-y-3">
        <h3 className="font-bold text-card-foreground line-clamp-2">{title}</h3>
        
        <p className="text-sm text-muted-foreground line-clamp-2">{preview}</p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="font-medium text-card-foreground">por {author}</span>
            
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{timeAgo}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              <span>{replies}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" />
              <span>{likes}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumThread;
