import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhaseType, IconType } from "@/services/moduleService";
import { 
  FileText, 
  Video, 
  HelpCircle, 
  Target, 
  Play, 
  Brain, 
  Trophy, 
  Gamepad2,
  Clock,
  Hash,
  Sparkles
} from "lucide-react";

interface FormHeaderProps {
  name: string;
  description: string;
  phaseType: PhaseType;
  iconType: IconType;
  duration: number;
  orderIndex: number;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onPhaseTypeChange: (value: PhaseType) => void;
  onIconTypeChange: (value: IconType) => void;
  onDurationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOrderIndexChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors: {
    name?: { message?: string };
    duration?: { message?: string };
    order_index?: { message?: string };
  };
}

const PhaseTypeIcon = ({ type }: { type: PhaseType }) => {
  const iconMap = {
    text: FileText,
    video: Video,
    quiz: HelpCircle,
    challenge: Target
  };
  const Icon = iconMap[type];
  return <Icon className="h-4 w-4" />;
};

const IconTypeIcon = ({ type }: { type: IconType }) => {
  const iconMap = {
    video: Play,
    quiz: Brain,
    challenge: Trophy,
    game: Gamepad2
  };
  const Icon = iconMap[type];
  return <Icon className="h-4 w-4" />;
};

const FormHeader = ({
  name,
  description,
  phaseType,
  iconType,
  duration,
  orderIndex,
  onNameChange,
  onDescriptionChange,
  onPhaseTypeChange,
  onIconTypeChange,
  onDurationChange,
  onOrderIndexChange,
  errors
}: FormHeaderProps) => {
  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 -m-4 sm:-m-6">
      {/* Header com glassmorphism */}
      <div className="sticky top-0 z-10 mb-8">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-xl">
              <Sparkles className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Nova Fase</h1>
              <p className="text-slate-500">Configure os detalhes da sua fase de aprendizado</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Container com glassmorphism */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-xl p-8 space-y-8">
          
          {/* Seção Principal */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-8 bg-orange-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-slate-800">Informações Básicas</h2>
            </div>

            {/* Nome da Fase */}
            <div className="space-y-2">
              <Label 
                htmlFor="name" 
                className="text-sm font-medium text-slate-700 flex items-center gap-2"
              >
                <FileText className="h-4 w-4 text-orange-500" />
                Nome da fase *
              </Label>
              <div className="relative">
                <Input
                  id="name"
                  placeholder="Ex: Introdução ao Growth Mindset"
                  value={name}
                  onChange={onNameChange}
                  className={`
                    h-12 px-4 text-base bg-white/50 backdrop-blur-sm border-2 rounded-xl
                    transition-all duration-200 placeholder:text-slate-400
                    focus:bg-white focus:border-orange-300 focus:ring-4 focus:ring-orange-100
                    hover:bg-white/70 hover:border-slate-300
                    ${errors.name ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200"}
                  `}
                />
                {errors.name && (
                  <div className="absolute -bottom-6 left-0">
                    <p className="text-red-500 text-sm font-medium">{errors.name.message}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2 mt-8">
              <Label 
                htmlFor="description" 
                className="text-sm font-medium text-slate-700 flex items-center gap-2"
              >
                <FileText className="h-4 w-4 text-slate-500" />
                Descrição
              </Label>
              <Textarea
                id="description"
                placeholder="Descreva brevemente o conteúdo e objetivos desta fase..."
                value={description}
                onChange={onDescriptionChange}
                className="
                  min-h-[100px] p-4 text-base bg-white/50 backdrop-blur-sm border-2 border-slate-200 rounded-xl
                  transition-all duration-200 placeholder:text-slate-400 resize-none
                  focus:bg-white focus:border-orange-300 focus:ring-4 focus:ring-orange-100
                  hover:bg-white/70 hover:border-slate-300
                "
              />
            </div>
          </div>

          {/* Seção de Configurações */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-8 bg-blue-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-slate-800">Configurações</h2>
            </div>

            {/* Grid de Selects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipo de Fase */}
              <div className="space-y-2">
                <Label 
                  htmlFor="type" 
                  className="text-sm font-medium text-slate-700 flex items-center gap-2"
                >
                  <PhaseTypeIcon type={phaseType} />
                  Tipo de fase *
                </Label>
                <Select value={phaseType} onValueChange={onPhaseTypeChange}>
                  <SelectTrigger 
                    id="type"
                    className="
                      h-12 px-4 text-base bg-white/50 backdrop-blur-sm border-2 border-slate-200 rounded-xl
                      transition-all duration-200 hover:bg-white/70 hover:border-slate-300
                      focus:bg-white focus:border-orange-300 focus:ring-4 focus:ring-orange-100
                    "
                  >
                    <SelectValue placeholder="Selecione o tipo de conteúdo" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl">
                    <SelectItem value="text" className="flex items-center gap-2 p-3 hover:bg-slate-50 rounded-lg">
                      <FileText className="h-4 w-4 text-slate-600" />
                      <span>Conteúdo de texto</span>
                    </SelectItem>
                    <SelectItem value="video" className="flex items-center gap-2 p-3 hover:bg-slate-50 rounded-lg">
                      <Video className="h-4 w-4 text-slate-600" />
                      <span>Vídeo</span>
                    </SelectItem>
                    <SelectItem value="quiz" className="flex items-center gap-2 p-3 hover:bg-slate-50 rounded-lg">
                      <HelpCircle className="h-4 w-4 text-slate-600" />
                      <span>Quiz</span>
                    </SelectItem>
                    <SelectItem value="challenge" className="flex items-center gap-2 p-3 hover:bg-slate-50 rounded-lg">
                      <Target className="h-4 w-4 text-slate-600" />
                      <span>Desafio</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de Ícone */}
              <div className="space-y-2">
                <Label 
                  htmlFor="icon_type" 
                  className="text-sm font-medium text-slate-700 flex items-center gap-2"
                >
                  <IconTypeIcon type={iconType} />
                  Ícone da fase
                </Label>
                <Select value={iconType} onValueChange={onIconTypeChange}>
                  <SelectTrigger 
                    id="icon_type"
                    className="
                      h-12 px-4 text-base bg-white/50 backdrop-blur-sm border-2 border-slate-200 rounded-xl
                      transition-all duration-200 hover:bg-white/70 hover:border-slate-300
                      focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100
                    "
                  >
                    <SelectValue placeholder="Escolha um ícone" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl">
                    <SelectItem value="video" className="flex items-center gap-2 p-3 hover:bg-slate-50 rounded-lg">
                      <Play className="h-4 w-4 text-slate-600" />
                      <span>Vídeo</span>
                    </SelectItem>
                    <SelectItem value="quiz" className="flex items-center gap-2 p-3 hover:bg-slate-50 rounded-lg">
                      <Brain className="h-4 w-4 text-slate-600" />
                      <span>Quiz</span>
                    </SelectItem>
                    <SelectItem value="challenge" className="flex items-center gap-2 p-3 hover:bg-slate-50 rounded-lg">
                      <Trophy className="h-4 w-4 text-slate-600" />
                      <span>Desafio</span>
                    </SelectItem>
                    <SelectItem value="game" className="flex items-center gap-2 p-3 hover:bg-slate-50 rounded-lg">
                      <Gamepad2 className="h-4 w-4 text-slate-600" />
                      <span>Jogo</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Grid de Números */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Duração */}
              <div className="space-y-2">
                <Label 
                  htmlFor="duration" 
                  className="text-sm font-medium text-slate-700 flex items-center gap-2"
                >
                  <Clock className="h-4 w-4 text-green-500" />
                  Duração estimada
                </Label>
                <div className="relative">
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="300"
                    placeholder="15"
                    value={duration.toString()}
                    onChange={onDurationChange}
                    className={`
                      h-12 px-4 text-base bg-white/50 backdrop-blur-sm border-2 rounded-xl
                      transition-all duration-200 placeholder:text-slate-400
                      focus:bg-white focus:border-green-300 focus:ring-4 focus:ring-green-100
                      hover:bg-white/70 hover:border-slate-300
                      ${errors.duration ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200"}
                    `}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">
                    min
                  </span>
                  {errors.duration && (
                    <div className="absolute -bottom-6 left-0">
                      <p className="text-red-500 text-sm font-medium">{errors.duration.message}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Ordem */}
              <div className="space-y-2">
                <Label 
                  htmlFor="order_index" 
                  className="text-sm font-medium text-slate-700 flex items-center gap-2"
                >
                  <Hash className="h-4 w-4 text-purple-500" />
                  Posição na trilha
                </Label>
                <div className="relative">
                  <Input
                    id="order_index"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={orderIndex.toString()}
                    onChange={onOrderIndexChange}
                    className={`
                      h-12 px-4 text-base bg-white/50 backdrop-blur-sm border-2 rounded-xl
                      transition-all duration-200 placeholder:text-slate-400
                      focus:bg-white focus:border-purple-300 focus:ring-4 focus:ring-purple-100
                      hover:bg-white/70 hover:border-slate-300
                      ${errors.order_index ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200"}
                    `}
                  />
                  {errors.order_index && (
                    <div className="absolute -bottom-6 left-0">
                      <p className="text-red-500 text-sm font-medium">{errors.order_index.message}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Preview Card */}
          <div className="mt-8 p-6 bg-gradient-to-br from-slate-50 to-white border-2 border-slate-100 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-1 w-8 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full"></div>
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Preview</h3>
            </div>
            <div className="flex items-start gap-4 p-4 bg-white/60 backdrop-blur-sm border border-slate-200/50 rounded-xl">
              <div className="p-3 bg-orange-100 rounded-xl">
                <IconTypeIcon type={iconType} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900">
                  {name || "Nome da fase aparecerá aqui"}
                </h4>
                <p className="text-sm text-slate-600 mt-1">
                  {description || "Descrição da fase será exibida aqui"}
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {duration} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    Posição {orderIndex}
                  </span>
                  <span className="px-2 py-1 bg-slate-100 rounded-full text-xs font-medium">
                    {phaseType}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormHeader;