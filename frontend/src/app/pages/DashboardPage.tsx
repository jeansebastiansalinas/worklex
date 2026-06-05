import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import {
  LogOut, User, Settings, Trophy, Target, Flame, BarChart3,
  GraduationCap, Clock, ChevronRight, Play, History, MessageSquare,
  TrendingUp, Award, Calendar
} from "lucide-react";

interface RecentTest {
  id: number;
  score: number;
  level: string;
  correct_answers: number;
  total_questions: number;
  date: string;
}

interface Stats {
  tests_completed: number;
  average_score: number;
  current_level: string;
  recent_tests: RecentTest[];
}

const LEVEL_LABELS: Record<string, string> = {
  'A1': 'Principiante',
  'A2': 'Elemental',
  'B1': 'Intermedio',
  'B2': 'Intermedio Alto',
  'C1': 'Avanzado',
  'C2': 'Maestría',
};

export function DashboardPage() {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [stats, setStats] = useState<Stats>({
    tests_completed: 0,
    average_score: 0,
    current_level: 'A1',
    recent_tests: [],
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [feedbacks] = useState<any[]>([]);

  const userName = localStorage.getItem("userName") || "Usuario";
  const userProgram = localStorage.getItem("userProgram") || "Mecánica";
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) return;
    fetch(`http://localhost:8000/api/stats/${userId}/`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setStats(data);
      })
      .catch(err => console.error('Error cargando stats:', err))
      .finally(() => setLoadingStats(false));
  }, [userId]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-border z-40">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-sena-green rounded-xl flex items-center justify-center shadow-lg shadow-sena-green/25">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-semibold text-foreground">English Level Test</h1>
                <p className="text-xs text-muted-foreground">Panel de Estudiante</p>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-3 p-2 hover:bg-muted rounded-xl transition-colors"
              >
                <div className="w-10 h-10 bg-sena-green rounded-xl flex items-center justify-center text-white font-medium">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="font-medium text-foreground text-sm">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userProgram}</p>
                </div>
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-border py-2 z-50"
                  >
                    <div className="px-4 py-3 border-b border-border">
                      <p className="font-medium text-foreground">{userName}</p>
                      <p className="text-sm text-muted-foreground">{userProgram}</p>
                    </div>
                    <button className="w-full px-4 py-2.5 text-left hover:bg-muted flex items-center gap-3 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      Mi Perfil
                    </button>
                    <button className="w-full px-4 py-2.5 text-left hover:bg-muted flex items-center gap-3 text-sm">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      Configuracion
                    </button>
                    <div className="border-t border-border mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 text-left hover:bg-destructive/10 flex items-center gap-3 text-sm text-destructive"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesion
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Hola, {userName.split(' ')[0]}
          </h2>
          <p className="text-muted-foreground">Continua mejorando tu nivel de inglés técnico.</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Pruebas Realizadas", value: loadingStats ? '...' : stats.tests_completed, icon: BarChart3, color: "sena-blue" },
            { label: "Promedio", value: loadingStats ? '...' : `${stats.average_score}%`, icon: Target, color: "sena-green" },
            { label: "Nivel Actual", value: loadingStats ? '...' : stats.current_level, icon: Trophy, color: "warning" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-5 border border-border shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 bg-${stat.color}/10 rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Start Quiz */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-sena-green to-sena-green-dark rounded-2xl p-6 lg:p-8 text-white shadow-xl"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">10 preguntas</span>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">~5 min</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Iniciar Nueva Prueba</h3>
                  <p className="text-white/80 max-w-md">
                    Evalúa tu vocabulario técnico de mecánica con imagen y audio.
                  </p>
                </div>
                <motion.button
                  onClick={() => navigate("/quiz")}
                  className="flex items-center justify-center gap-2 bg-white text-sena-green px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Play className="w-5 h-5" />
                  Comenzar Ahora
                </motion.button>
              </div>
            </motion.div>

            {/* Historial real */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl border border-border shadow-sm"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sena-blue/10 rounded-xl flex items-center justify-center">
                    <History className="w-5 h-5 text-sena-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Historial de Pruebas</h3>
                    <p className="text-sm text-muted-foreground">Tus últimas evaluaciones</p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-border">
                {loadingStats ? (
                  <div className="p-8 text-center text-muted-foreground">Cargando...</div>
                ) : stats.recent_tests.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>Aún no has realizado ninguna prueba</p>
                  </div>
                ) : (
                  stats.recent_tests.map((test, index) => (
                    <motion.div
                      key={test.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="p-5 flex items-center justify-between hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                          test.score >= 80 ? 'bg-sena-green/10 text-sena-green' :
                          test.score >= 60 ? 'bg-warning/10 text-warning' :
                          'bg-destructive/10 text-destructive'
                        }`}>
                          {test.score}%
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              test.level.startsWith('C') ? 'bg-sena-green/10 text-sena-green' :
                              test.level.startsWith('B') ? 'bg-sena-blue/10 text-sena-blue' :
                              'bg-warning/10 text-warning'
                            }`}>
                              {test.level}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {test.correct_answers}/{test.total_questions} correctas
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            {test.date}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Columna derecha */}
          <div className="space-y-6">
            {/* Nivel actual */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl p-6 border border-border shadow-sm"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5 text-warning" />
                </div>
                <h3 className="font-semibold text-foreground">Tu Nivel Actual</h3>
              </div>
              <div className="text-center py-6">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-sena-green to-sena-green-dark rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-sena-green/30 mb-4">
                  {loadingStats ? '...' : stats.current_level}
                </div>
                <p className="text-foreground font-medium">
                  {loadingStats ? '' : LEVEL_LABELS[stats.current_level] || 'Principiante'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.tests_completed === 0 ? 'Realiza tu primera prueba' : `Basado en ${stats.tests_completed} prueba(s)`}
                </p>
              </div>
            </motion.div>

            {/* Feedback */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-2xl p-6 border border-border shadow-sm"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-sena-blue/10 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-sena-blue" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Retroalimentacion</h3>
                  <p className="text-sm text-muted-foreground">Comentarios del docente</p>
                </div>
              </div>
              <div className="text-center py-6 text-muted-foreground">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay retroalimentacion aun</p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}