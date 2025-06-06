import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getProfile, Profile } from '@/services/profileService';

// Ícones e Componentes
import { ArrowLeft, Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// --- CONFIGURAÇÕES DO POMODORO ---
const FOCUS_TIME = 25 * 60; // 25 minutos
const SHORT_BREAK_TIME = 5 * 60; // 5 minutos
const LONG_BREAK_TIME = 15 * 60; // 15 minutos
const CYCLES_BEFORE_LONG_BREAK = 4;

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

// --- COMPONENTE PRINCIPAL ---
export function PomodoroPage() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    // Estados do Timer
    const [mode, setMode] = useState<TimerMode>('focus');
    const [time, setTime] = useState(FOCUS_TIME);
    const [isActive, setIsActive] = useState(false);
    const [cycles, setCycles] = useState(0);

    // Lógica para buscar o perfil do usuário
    useEffect(() => {
        const fetchUserProfile = async () => {
            setIsLoadingProfile(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setProfile(await getProfile(user.id));
            setIsLoadingProfile(false);
        };
        fetchUserProfile();
    }, []);

    // Efeito para controlar a contagem regressiva
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isActive && time > 0) {
            interval = setInterval(() => {
                setTime(prevTime => prevTime - 1);
            }, 1000);
        } else if (time === 0) {
            handleTimerEnd();
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, time]);
    
    const switchMode = useCallback((newMode: TimerMode) => {
        setIsActive(false);
        setMode(newMode);
        if (newMode === 'focus') setTime(FOCUS_TIME);
        else if (newMode === 'shortBreak') setTime(SHORT_BREAK_TIME);
        else if (newMode === 'longBreak') setTime(LONG_BREAK_TIME);
    }, []);

    const handleTimerEnd = () => {
        alert(mode === 'focus' ? 'Hora da pausa!' : 'Hora de focar!');
        if (mode === 'focus') {
            const newCycles = cycles + 1;
            setCycles(newCycles);
            if (newCycles % CYCLES_BEFORE_LONG_BREAK === 0) {
                switchMode('longBreak');
            } else {
                switchMode('shortBreak');
            }
        } else {
            switchMode('focus');
        }
    };

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => switchMode(mode);
    
    // Formatação do tempo para exibição (ex: 25:00)
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const totalDuration = mode === 'focus' ? FOCUS_TIME : mode === 'shortBreak' ? SHORT_BREAK_TIME : LONG_BREAK_TIME;
    const progressPercentage = ((totalDuration - time) / totalDuration) * 100;

    if (isLoadingProfile) {
        return <div className="min-h-screen bg-slate-100 flex items-center justify-center">Carregando...</div>;
    }

    return (
        <div className="min-h-screen w-full bg-slate-100">
            {/* Cabeçalho no padrão do App */}
            <header className="p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-transform hover:scale-110 active:scale-95" aria-label="Voltar">
                            <ArrowLeft className="h-5 w-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-slate-800">Modo Foco</h1>
                        </div>
                    </div>
                    <Link to="/perfil">
                        <img src={profile?.avatar_url || ''} alt="Foto do perfil" className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-md transition-transform hover:scale-110" />
                    </Link>
                </div>
            </header>

            {/* Corpo da Ferramenta */}
            <main className="flex flex-col items-center justify-center p-4 text-center" style={{ minHeight: 'calc(100vh - 104px)' }}>
                <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-lg border border-slate-200/80">
                    {/* Abas de Modo */}
                    <div className="flex justify-center bg-slate-100 p-1 rounded-full mb-8">
                        <button onClick={() => switchMode('focus')} className={cn('flex-1 py-2 rounded-full text-sm font-semibold transition-colors', mode === 'focus' && 'bg-orange-500 text-white shadow')}>Foco</button>
                        <button onClick={() => switchMode('shortBreak')} className={cn('flex-1 py-2 rounded-full text-sm font-semibold transition-colors', mode === 'shortBreak' && 'bg-orange-500 text-white shadow')}>Pausa Curta</button>
                        <button onClick={() => switchMode('longBreak')} className={cn('flex-1 py-2 rounded-full text-sm font-semibold transition-colors', mode === 'longBreak' && 'bg-orange-500 text-white shadow')}>Pausa Longa</button>
                    </div>

                    {/* Timer Visual */}
                    <div className="relative w-48 h-48 sm:w-60 sm:h-60 mx-auto mb-8">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            {/* Círculo de fundo */}
                            <circle className="text-slate-200" strokeWidth="7" cx="50" cy="50" r="45" fill="transparent" />
                            {/* Círculo de progresso */}
                            <circle
                                className="text-orange-500"
                                strokeWidth="7"
                                strokeLinecap="round"
                                cx="50" cy="50" r="45"
                                fill="transparent"
                                strokeDasharray="282.743"
                                strokeDashoffset={282.743 - (progressPercentage / 100) * 282.743}
                                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s linear' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl sm:text-5xl font-bold text-slate-800">{formatTime(time)}</span>
                        </div>
                    </div>

                    {/* Botões de Controle */}
                    <div className="flex items-center justify-center gap-4">
                        <Button variant="ghost" size="icon" onClick={resetTimer} className="h-12 w-12 rounded-full bg-slate-100 hover:bg-slate-200"><RotateCcw className="h-6 w-6 text-slate-500" /></Button>
                        <Button onClick={toggleTimer} className="h-16 w-16 rounded-full bg-orange-500 hover:bg-orange-600 shadow-lg text-white text-lg font-bold">
                            {isActive ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleTimerEnd} className="h-12 w-12 rounded-full bg-slate-100 hover:bg-slate-200"><SkipForward className="h-6 w-6 text-slate-500" /></Button>
                    </div>
                </div>
                <p className="text-sm text-slate-500 mt-4">Ciclos de foco completados: {cycles}</p>
            </main>
        </div>
    );
}