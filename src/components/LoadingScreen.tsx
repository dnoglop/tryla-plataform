import { Loader2 } from 'lucide-react';

export function LoadingScreen() {
    return (
        <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-md border border-slate-200/80 text-center">
            <div className="flex flex-col items-center justify-center">
                <Loader2 className="animate-spin h-16 w-16 text-orange-500 mb-6" />
                <h3 className="text-2xl font-bold text-slate-800">Cruzando os dados...</h3>
                <p className="text-slate-600 mt-2 max-w-md mx-auto">
                    Nossos algoritmos estão conectando seus talentos e paixões para um resultado único!
                </p>
            </div>
        </div>
    );
}