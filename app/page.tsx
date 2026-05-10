"use client";

import { useEffect, useRef, useState } from "react";

type Question = {
  id: number;
  text: string;
  options: string[];
  answer: string;
};

type AnswersMap = Record<number, string>;

const questions: Question[] = [
  {
    id: 1,
    text: "Limit: lim x→2 (x² - 4) / (x - 2) = ?",
    options: ["2", "4", "0", "8"],
    answer: "4",
  },
  {
    id: 2,
    text: "Türev: f(x)=x² ise f'(3) = ?",
    options: ["3", "6", "9", "12"],
    answer: "6",
  },
  {
    id: 3,
    text: "İntegral: ∫ 2x dx = ?",
    options: ["x² + C", "2x²", "x + C", "x²"],
    answer: "x² + C",
  },
];

const QUESTION_TIME = 60;
const LOCK_TIME = 20;

const USERS_KEY = "used_test_ids";

export default function Page() {
  const [userId, setUserId] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);

  const [answers, setAnswers] = useState<AnswersMap>({});

  // ANA SORU SÜRESİ
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);

  // İŞARETLEME KİLİDİ
  const [lockLeft, setLockLeft] = useState(LOCK_TIME);

  const [canAnswer, setCanAnswer] = useState(false);

  const [message, setMessage] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = questions[currentIndex];

  // START
  const startTest = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setStarted(true);
    } catch {
      alert("Tam ekran gerekli");
    }
  };

  // FULLSCREEN EXIT
  useEffect(() => {
    if (!started || finished) return;

    const handle = () => {
      if (!document.fullscreenElement) {
        setFinished(true);
        setMessage("Test geçersiz sayıldı");
      }
    };

    document.addEventListener("fullscreenchange", handle);

    return () => {
      document.removeEventListener("fullscreenchange", handle);
    };
  }, [started, finished]);

  // SORU TIMER
  useEffect(() => {
    if (!started || finished) return;

    setTimeLeft(QUESTION_TIME);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          nextQuestionAuto();
          return QUESTION_TIME;
        }

        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, started, finished]);

  // 20 SANİYELİK İŞARETLEME KİLİDİ
  useEffect(() => {
    setCanAnswer(false);
    setLockLeft(LOCK_TIME);

    const interval = setInterval(() => {
      setLockLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setCanAnswer(true);
          return 0;
        }

        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  // CEVAP
  const handleAnswer = (opt: string) => {
    if (!canAnswer) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: opt,
    }));
  };

  // SONRAKİ
  const nextQuestion = () => {
    if (!answers[currentQuestion.id]) {
      alert("Bir seçenek işaretleyin");
      return;
    }

    goNext();
  };

  // OTOMATİK GEÇİŞ
  const nextQuestionAuto = () => {
    goNext();
  };

  // NEXT LOGIC
  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setFinished(true);

      // TEST BİTTİYSE ID KAYDET
      const ids = JSON.parse(
        localStorage.getItem(USERS_KEY) || "[]"
      );

      localStorage.setItem(
        USERS_KEY,
        JSON.stringify([...ids, userId])
      );
    }
  };

  // SCORE
  const score = () => {
    const correct = questions.filter(
      (q) => answers[q.id] === q.answer
    ).length;

    return ((correct / questions.length) * 100).toFixed(1);
  };

  // LOGIN SCREEN
  if (!loggedIn) {
    return (
      <div style={center}>
        <div style={card}>
          <h2>Teste Giriş</h2>

          <input
            placeholder="Kullanıcı ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={input}
          />

          <button
            style={btn}
            onClick={() => {
              if (!userId) return;

              const ids = JSON.parse(
                localStorage.getItem(USERS_KEY) || "[]"
              );

              if (ids.includes(userId)) {
                alert("Bu ID testi daha önce tamamladı");
                return;
              }

              setLoggedIn(true);
            }}
          >
            Devam Et
          </button>
        </div>
      </div>
    );
  }

  // START SCREEN
  if (!started) {
    return (
      <div style={center}>
        <div style={card}>
          <h2>Teste Başla</h2>

          <button style={btn} onClick={startTest}>
            Başlat
          </button>
        </div>
      </div>
    );
  }

  // RESULT
  if (finished) {
    return (
      <div style={center}>
        <div style={card}>
          <h1>Test Bitti</h1>

          <h2>Skor: {score()} / 100</h2>

          {message && <p>{message}</p>}
        </div>
      </div>
    );
  }

  // TEST SCREEN
  return (
    <div style={center}>
      <div style={card}>
        <h3>Soru {currentIndex + 1}</h3>

        <p>{currentQuestion.text}</p>

        {/* ANA SORU SÜRESİ */}
        <p style={timer}>
          ⏱ Soru Süresi: {timeLeft}
        </p>

        {/* İŞARETLEME KİLİDİ */}
        {!canAnswer ? (
          <p style={lockText}>
            🔒 İşaretlemek için {lockLeft}
          </p>
        ) : (
          <p style={unlockText}>
            ✅ Soruyu işaretleyebilirsiniz
          </p>
        )}

        {currentQuestion.options.map((o) => {
          const selected =
            answers[currentQuestion.id] === o;

          return (
            <button
              key={o}
              disabled={!canAnswer}
              onClick={() => handleAnswer(o)}
              style={{
                ...option,
                background: selected ? "#444" : "#eee",
                color: selected ? "white" : "black",
                opacity: canAnswer ? 1 : 0.5,
              }}
            >
              {o}
            </button>
          );
        })}

        <button style={btn} onClick={nextQuestion}>
          Sonraki Soru
        </button>
      </div>
    </div>
  );
}

// STYLES

const center: any = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#f5f5f5",
};

const card: any = {
  width: 420,
  background: "white",
  padding: 20,
  borderRadius: 12,
};

const btn: any = {
  width: "100%",
  padding: 12,
  marginTop: 10,
  background: "black",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

const input: any = {
  width: "100%",
  padding: 12,
  marginBottom: 10,
};

const option: any = {
  width: "100%",
  padding: 12,
  marginTop: 6,
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

const timer: any = {
  fontWeight: "bold",
  marginTop: 10,
};

const lockText: any = {
  color: "red",
  fontWeight: "bold",
};

const unlockText: any = {
  color: "green",
  fontWeight: "bold",
};
