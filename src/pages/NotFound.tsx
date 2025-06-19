
import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center flex-col bg-background px-4">
      <div className="text-center space-y-6">
        <div className="text-9xl font-bold text-primary">404</div>
        <h1 className="text-3xl font-bold text-foreground">Opa, se perdeu no caminho?</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          A página que você está procurando parece não existir. Mas não se preocupe, 
          você pode voltar ao caminho principal!
        </p>
        <Button 
          asChild
          className="mt-6"
        >
          <Link to="/dashboard">
            <Home className="mr-2 h-4 w-4" />
            Voltar ao início
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
