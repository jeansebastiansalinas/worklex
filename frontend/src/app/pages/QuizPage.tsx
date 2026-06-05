import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { Clock, Trophy, Zap, X, GraduationCap, Volume2 } from "lucide-react";
import { createTestResult } from "../services/api";
import { getLevelFromScore } from "../data/questions";
import { useAuth } from "../context/AuthContext";

interface Question {
  id: number;
  word_id: string;
  image: string;
  audio: string;
  definition: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: string;
}

type AnswerState = "idle" | "correct" | "incorrect";

interface UserAnswer {
  questionId: number;
  question: string;
  userAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  category: string;
}

export function QuizPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/quiz/?subject=mecanica&limit=10');
        const data = await res.json();
        setQuestions(data);
      } catch (err) {
        console.error('Error cargando quiz:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const question = questions[currentQuestion];
  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  useEffect(() => {
    if (question?.audio) {
      audioRef.current = new Audio(question.audio);
      audioRef.current.play().catch(() => {});
    }
  }, [currentQuestion, question]);

  useEffect(() => {
    if (!question) return;
    if (timeLeft > 0 && answerState === "idle") {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && answerState === "idle") {
      handleNextQuestion();
    }
  }, [timeLeft, answerState, question]);

  const playAudio = () => {
    if (question?.audio) {
      new Audio(question.audio).play().catch(() => {});
    }
  };

  const handleAnswerClick = (answerIndex: number) => {
    if (answerState !== "idle") return;
    setSelectedAnswer(answerIndex);
    const isCorrect = answerIndex === question.correctAnswer;
    setUserAnswers(prev => [...prev, {
      questionId: question.id,
      question: question.word_id,
      userAnswer: answerIndex,
      correctAnswer: question.correctAnswer,
      isCorrect,
      category: question.category,
    }]);
    if (isCorrect) { setAnswerState("correct"); setScore(s => s + 1); }
    else { setAnswerState("incorrect"); }
    setTimeout(() => handleNextQuestion(), 2000);
  };

  const handleNextQuestion = async () => {
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(q => q + 1);
      setTimeLeft(30);
      setSelectedAnswer(null);
      setAnswerState("idle");
    } else {
      const finalCorrect = answerState === "correct" ? score : score;
      const finalScore = Math.round((finalCorrect / questions.length) * 100);
      const levelInfo = getLevelFromScore(finalScore);
      const userId = user?.id || localStorage.getItem("userId");
      const accessToken = localStorage.getItem("accessToken");
      
      // Save to localStorage for immediate use
      localStorage.setItem("quizScore", finalScore.toString());
      localStorage.setItem("correctAnswers", finalCorrect.toString());
      localStorage.setItem("lastTestResult", JSON.stringify({
        id: Date.now().toString(),
        userId: userId,
        userName: user?.name || localStorage.getItem("userName"),
        score: finalScore,
        correctAnswers: finalCorrect,
        totalQuestions: questions.length,
        answers: userAnswers,
        completedAt: new Date().toISOString(),
      }));

      // Save to backend API - only if we have both userId and accessToken
      if (userId && accessToken) {
        try {
          await createTestResult({
            userId: userId,
            score: finalScore,
            level: levelInfo.level,
            correctAnswers: finalCorrect,
            totalQuestions: questions.length,
            duration: `${Math.floor((30 * questions.length - timeLeft) / 60)}:${String((30 * questions.length - timeLeft) % 60).padStart(2, '0')}`,
            answers: userAnswers,
          });
        } catch (error) {
          console.error("[v0] Error saving test result:", error);
        }
      }
      
      navigate("/results");
    }
  };

  const answerColors = [
    { bg: "bg-answer-red", hover: "hover:bg-answer-red/90" },
    { bg: "bg-answer-blue", hover: "hover:bg-answer-blue/90" },
    { bg: "bg-answer-yellow", hover: "hover:bg-answer-yellow/90" },
    { bg: "bg-answer-green", hover: "hover:bg-answer-green/90" },
  ];

  const getButtonStyle = (index: number) => {
    if (answerState === "idle") return `${answerColors[index].bg} ${answerColors[index].hover}`;
    if (index === question.correctAnswer) return "bg-green-500";
    if (index === selectedAnswer && answerState === "incorrect") return "bg-red-500";
    return "bg-gray-400";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-green-500 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xl font-semibold">Cargando quiz...</p>
        </div>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-green-500 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0YzAtMi4yMDkgMS43OTEtNCA0LTRzNCAxLjc5MSA0IDQtMS43OTEgNC00IDQtNC0xLjc5MS00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />

      <div className="container mx-auto max-w-4xl px-4 py-6 relative">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-lg rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-medium hidden sm:block">English Level Test</span>
          </div>
          <button onClick={() => setShowExitConfirm(true)}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Progress Bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <div className="flex justify-between text-white/80 text-sm mb-2">
            <span>Pregunta {currentQuestion + 1} de {questions.length}</span>
            <span>{Math.round(progress)}% completado</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div className="h-full bg-white rounded-full"
              animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
          </div>
        </motion.div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-lg rounded-xl">
            <Clock className={`w-5 h-5 ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`} />
            <span className={`font-bold text-lg ${timeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>{timeLeft}s</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-lg rounded-xl">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="font-bold text-lg text-white">{score}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-lg rounded-xl">
            <Zap className="w-5 h-5 text-green-400" />
            <span className="font-bold text-lg text-white">{userAnswers.filter(a => a.isCorrect).length}</span>
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div key={currentQuestion}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden">

            <div className="relative bg-gray-50">
              <img
                src={question.image}
                alt={question.word_id}
                className="w-full h-72 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/800x288?text=Imagen+no+disponible';
                }}
              />
              <button
                onClick={playAudio}
                className="absolute bottom-4 right-4 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
              >
                <Volume2 className="w-6 h-6" />
              </button>
              <div className="absolute top-4 left-4 px-3 py-1 bg-black/40 backdrop-blur-sm text-white rounded-lg text-sm font-medium capitalize">
                {question.category}
              </div>
            </div>

            {/* Pregunta */}
            <div className="px-6 lg:px-8 pt-5 pb-4">
              <h2 className="text-xl lg:text-2xl font-bold text-foreground text-center">
                {`¿Cual es la palabra correcta para esta imagen?`}
              </h2>
              <p className="text-center text-muted-foreground text-sm mt-1">
                Escucha el audio y selecciona la opcion correcta
              </p>
            </div>

            {/* Opciones */}
            <div className="px-6 lg:px-8 pb-6 lg:pb-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {question.options.map((option, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleAnswerClick(index)}
                  disabled={answerState !== "idle"}
                  className={`${getButtonStyle(index)} text-white p-5 rounded-2xl text-left transition-all disabled:cursor-not-allowed shadow-lg`}
                  whileHover={answerState === "idle" ? { scale: 1.02, y: -2 } : {}}
                  whileTap={answerState === "idle" ? { scale: 0.98 } : {}}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="font-medium text-base lg:text-lg capitalize">{option}</span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {answerState !== "idle" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`px-6 py-5 text-center text-white ${answerState === "correct" ? "bg-green-500" : "bg-red-500"}`}
                >
                  {answerState === "correct" ? (
                    <div className="flex items-center justify-center gap-3">
                      <Trophy className="w-6 h-6" />
                      <span className="text-lg font-bold">Correcto! +1 punto</span>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold mb-1">Incorrecto</p>
                      <p className="text-white/90 text-sm">
                        La respuesta correcta es: <span className="font-bold capitalize">{question.options[question.correctAnswer]}</span>
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Exit Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Salir de la prueba?</h3>
              <p className="text-muted-foreground mb-6">Perderas todo tu progreso actual.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors">
                  Continuar
                </button>
                <button onClick={() => navigate("/dashboard")}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors">
                  Salir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
