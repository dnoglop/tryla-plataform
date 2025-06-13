
import { Loader2 } from 'lucide-react';

export function LoadingScreen() {
    return (
        <div className="bg-card p-6 sm:p-10 rounded-2xl shadow-md border text-center">
            <div className="flex flex-col items-center justify-center">
                <Loader2 className="animate-spin h-16 w-16 text-primary mb-6" />
                <h3 className="text-2xl font-bold text-foreground">Cruzando os dados...</h3>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                    Nossos algoritmos estão conectando seus talentos e paixões para um resultado único!
                </p>
            </div>
        </div>
    );
}
