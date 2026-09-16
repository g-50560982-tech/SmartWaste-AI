/* =========================================================
   SMARTWASTE AI
   SCRIPT
========================================================= */


/* =========================================================
   MODEL AI
========================================================= */

const MODEL_PATH = "./model/";

let model = null;
let webcam = null;

let cameraStarted = false;

let facingMode = "environment";

let lastPrediction = null;


/* =========================================================
   ECO POINTS
========================================================= */

let ecoPoints =
  Number(localStorage.getItem("smartwaste-points")) || 0;

let scannerPointGiven = false;


/* =========================================================
   PAGE NAVIGATION
========================================================= */

const sections =
  document.querySelectorAll(".page-section");

const navButtons =
  document.querySelectorAll(".nav-btn");


function showSection(sectionId) {

  sections.forEach(section => {

    section.classList.remove(
      "active-section"
    );

  });


  const target =
    document.getElementById(sectionId);

  if (target) {

    target.classList.add(
      "active-section"
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }


  navButtons.forEach(button => {

    button.classList.toggle(
      "active",
      button.dataset.section === sectionId
    );

  });

}


navButtons.forEach(button => {

  button.addEventListener(
    "click",
    () => {

      showSection(
        button.dataset.section
      );

    }
  );

});


document
  .querySelectorAll("[data-go]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        showSection(
          button.dataset.go
        );

      }
    );

  });


/* =========================================================
   ECO POINTS
========================================================= */

function saveEcoPoints() {

  localStorage.setItem(
    "smartwaste-points",
    ecoPoints
  );

  updateEcoDisplay();

}


function addEcoPoints(points) {

  ecoPoints += points;

  saveEcoPoints();

}


function updateEcoDisplay() {

  const homePoints =
    document.getElementById("homePoints");

  if (homePoints) {

    homePoints.textContent =
      ecoPoints;

  }


  const homeRank =
    document.getElementById("homeRank");

  if (homeRank) {

    homeRank.textContent =
      getRankShort(ecoPoints);

  }


  const gamePoints =
    document.getElementById("gamePoints");

  if (gamePoints) {

    gamePoints.textContent =
      gameScore;

  }

}


function getRank(points) {

  if (points >= 130) {

    return "🏆 ECO HERO";

  }

  if (points >= 100) {

    return "🌍 ECO CHAMPION";

  }

  if (points >= 60) {

    return "♻️ ECO LEARNER";

  }

  return "🌱 ECO BEGINNER";

}


function getRankShort(points) {

  if (points >= 130) return "🏆";

  if (points >= 100) return "🌍";

  if (points >= 60) return "♻️";

  return "🌱";

}


/* =========================================================
   THEME
========================================================= */

const themeToggle =
  document.getElementById(
    "themeToggle"
  );

const savedTheme =
  localStorage.getItem(
    "smartwaste-theme"
  );


if (savedTheme === "dark") {

  document.body.classList.add("dark");

  themeToggle.textContent = "☀️";

}


themeToggle.addEventListener(
  "click",
  () => {

    document.body.classList.toggle(
      "dark"
    );

    const dark =
      document.body.classList.contains(
        "dark"
      );

    localStorage.setItem(
      "smartwaste-theme",
      dark ? "dark" : "light"
    );

    themeToggle.textContent =
      dark ? "☀️" : "🌙";

  }
);


/* =========================================================
   BIN INFORMATION
========================================================= */

const binData = {

  paper: {

    title:
      "🔵 Tong Biru — Kertas",

    text:
      "Tong biru digunakan untuk bahan berasaskan kertas yang sesuai dikitar semula.",

    examples: [
      "📄 Surat khabar",
      "📚 Majalah",
      "📃 Kertas",
      "📦 Kotak kertas"
    ]

  },


  orange: {

    title:
      "🟧 Tong Oren — Plastik & Logam",

    text:
      "Tong oren digunakan untuk bahan plastik serta logam seperti tin keluli dan tin aluminium.",

    examples: [
      "🧴 Botol plastik",
      "🥤 Bekas plastik",
      "🥫 Tin aluminium",
      "🥫 Tin keluli"
    ]

  },


  glass: {

    title:
      "🟫 Tong Coklat — Kaca",

    text:
      "Tong coklat digunakan untuk bahan kaca yang sesuai dikitar semula.",

    examples: [
      "🍾 Botol kaca",
      "🫙 Bekas kaca",
      "🥛 Bekas kaca"
    ]

  }

};


document
  .querySelectorAll(".bin-card")
  .forEach(card => {

    card.addEventListener(
      "click",
      () => {

        const type =
          card.dataset.bin;

        const data =
          binData[type];

        if (!data) return;

        document.getElementById(
          "binInfoTitle"
        ).textContent = data.title;

        document.getElementById(
          "binInfoText"
        ).textContent = data.text;


        const examples =
          document.getElementById(
            "binExamples"
          );

        examples.innerHTML = "";

        data.examples.forEach(item => {

          const span =
            document.createElement(
              "span"
            );

          span.textContent = item;

          examples.appendChild(span);

        });


        document
          .getElementById("binInfo")
          .classList.remove("hidden");

      }
    );

  });


document
  .getElementById("closeBinInfo")
  .addEventListener(
    "click",
    () => {

      document
        .getElementById("binInfo")
        .classList.add("hidden");

    }
  );


/* =========================================================
   WASTE GAME
========================================================= */

const questions = [

  {
    level: "🟢 LEVEL 1 — EASY",

    question:
      "🧴 Botol plastik perlu dimasukkan ke tong mana?",

    options: [
      "🔵 Biru",
      "🟧 Oren",
      "🟫 Coklat",
      "Tidak pasti"
    ],

    answer: 1,

    tip:
      "Plastik boleh diasingkan untuk dikitar semula."

  },


  {
    level: "🟢 LEVEL 1 — EASY",

    question:
      "📄 Surat khabar perlu dimasukkan ke tong mana?",

    options: [
      "🟧 Oren",
      "🔵 Biru",
      "🟫 Coklat",
      "Tidak pasti"
    ],

    answer: 1,

    tip:
      "Surat khabar ialah bahan kertas."

  },


  {
    level: "🟢 LEVEL 1 — EASY",

    question:
      "🍾 Botol kaca perlu dimasukkan ke tong mana?",

    options: [
      "🟫 Coklat",
      "🔵 Biru",
      "🟧 Oren",
      "Tidak pasti"
    ],

    answer: 0,

    tip:
      "Kaca boleh dikumpulkan untuk proses kitar semula."

  },


  {
    level: "🟢 LEVEL 1 — EASY",

    question:
      "🥫 Tin minuman aluminium perlu dimasukkan ke tong mana?",

    options: [
      "🔵 Biru",
      "🟫 Coklat",
      "🟧 Oren",
      "Tidak pasti"
    ],

    answer: 2,

    tip:
      "Tin aluminium ialah bahan logam."

  },


  {
    level: "🟢 LEVEL 1 — EASY",

    question:
      "Antara berikut, yang manakah sisa kertas?",

    options: [
      "🧴 Botol plastik",
      "📄 Surat khabar",
      "🍾 Botol kaca",
      "🥫 Tin aluminium"
    ],

    answer: 1,

    tip:
      "Surat khabar diperbuat daripada kertas."

  },


  {
    level: "🟡 LEVEL 2 — MEDIUM",

    question:
      "Apakah tujuan utama pengasingan sisa?",

    options: [
      "Menambah sampah",
      "Memudahkan kitar semula",
      "Membakar semua sampah",
      "Mencampurkan semua sisa"
    ],

    answer: 1,

    tip:
      "Pengasingan membantu bahan yang sesuai dikitar semula diproses dengan lebih mudah."

  },


  {
    level: "🟡 LEVEL 2 — MEDIUM",

    question:
      "Apakah yang patut dilakukan sebelum memasukkan bahan kitar semula ke dalam tong?",

    options: [
      "Buang merata-rata",
      "Campurkan dengan sisa makanan",
      "Asingkan mengikut jenis",
      "Bakar"
    ],

    answer: 2,

    tip:
      "Asingkan sisa mengikut jenis supaya lebih mudah diurus."

  },


  {
    level: "🟡 LEVEL 2 — MEDIUM",

    question:
      "Tin minuman biasanya diperbuat daripada bahan apa?",

    options: [
      "Kertas",
      "Kaca",
      "Aluminium",
      "Kayu"
    ],

    answer: 2,

    tip:
      "Banyak tin minuman diperbuat daripada aluminium."

  },


  {
    level: "🟡 LEVEL 2 — MEDIUM",

    question:
      "Mengapakah kita perlu mengurangkan pembaziran?",

    options: [
      "Untuk menghasilkan lebih banyak sampah",
      "Untuk menjaga alam sekitar",
      "Untuk memenuhi tong sampah",
      "Untuk membazirkan sumber"
    ],

    answer: 1,

    tip:
      "Mengurangkan pembaziran membantu menjimatkan sumber dan menjaga alam sekitar."

  },


  {
    level: "🟡 LEVEL 2 — MEDIUM",

    question:
      "Botol kaca yang telah digunakan boleh...", 

    options: [
      "Dikitar semula",
      "Dibuang ke sungai",
      "Dibakar",
      "Dibiarkan di jalan"
    ],

    answer: 0,

    tip:
      "Kaca tertentu boleh dikitar semula."

  },


  {
    level: "🔴 LEVEL 3 — CHALLENGE",

    question:
      "Ali mempunyai botol plastik, surat khabar dan botol kaca. Apakah pengasingan yang betul?",

    options: [
      "Semua ke tong oren",
      "Plastik & surat khabar ke tong biru",
      "Plastik → 🟧, Kertas → 🔵, Kaca → 🟫",
      "Semua ke tong coklat"
    ],

    answer: 2,

    tip:
      "Kenal pasti bahan dahulu sebelum memilih tong."

  },


  {
    level: "🔴 LEVEL 3 — CHALLENGE",

    question:
      "Apakah tindakan paling baik apabila kita tidak pasti jenis sisa?",

    options: [
      "Buang sahaja",
      "Campurkan dengan sisa lain",
      "Kenal pasti jenis sisa terlebih dahulu",
      "Bakar sisa tersebut"
    ],

    answer: 2,

    tip:
      "Jangan teka. Kenal pasti jenis bahan terlebih dahulu."

  },


  {
    level: "🔴 LEVEL 3 — CHALLENGE",

    question:
      "Bagaimanakah AI membantu SmartWaste AI?",

    options: [
      "Menghasilkan sampah",
      "Mengenal pasti jenis sisa melalui imej",
      "Membakar sisa",
      "Mengutip sampah secara automatik"
    ],

    answer: 1,

    tip:
      "AI menggunakan model yang dilatih untuk mengenali kategori sisa melalui imej."

  },


  {
    level: "🔴 LEVEL 3 — CHALLENGE",

    question:
      "Apakah kaitan SmartWaste AI dengan SDG 12?",

    options: [
      "Menggalakkan pembaziran",
      "Menggalakkan penggunaan dan pengeluaran yang bertanggungjawab",
      "Menggalakkan pencemaran",
      "Menggalakkan pembuangan sampah"
    ],

    answer: 1,

    tip:
      "SDG 12 berkaitan penggunaan dan pengeluaran yang bertanggungjawab."

  },


  {
    level: "🏆 FINAL CHALLENGE",

    question:
      "Kamu nampak tiga objek: 🧴 botol plastik, 🥫 tin aluminium dan 🍾 botol kaca. Apakah susunan yang betul?",

    options: [
      "🟧 Oren → 🟧 Oren → 🟫 Coklat",
      "🔵 Biru → 🟧 Oren → 🟫 Coklat",
      "🟫 Coklat → 🔵 Biru → 🟧 Oren",
      "🔵 Biru → 🔵 Biru → 🔵 Biru"
    ],

    answer: 0,

    tip:
      "Plastik dan logam → Oren. Kaca → Coklat."

  }

];


let currentQuestion = 0;

let gameScore = 0;

let correctAnswers = 0;

let answered = false;


const gameStart =
  document.getElementById(
    "gameStart"
  );

const gamePlay =
  document.getElementById(
    "gamePlay"
  );

const gameResult =
  document.getElementById(
    "gameResult"
  );


document
  .getElementById("startGameBtn")
  .addEventListener(
    "click",
    startGame
  );


function startGame() {

  currentQuestion = 0;

  gameScore = 0;

  correctAnswers = 0;

  answered = false;


  gameStart.classList.add(
    "hidden"
  );

  gameResult.classList.add(
    "hidden"
  );

  gamePlay.classList.remove(
    "hidden"
  );

  updateEcoDisplay();

  loadQuestion();

}


function loadQuestion() {

  answered = false;

  const q =
    questions[currentQuestion];


  document.getElementById(
    "questionNumber"
  ).textContent =
    currentQuestion + 1;


  document.getElementById(
    "gamePoints"
  ).textContent =
    gameScore;


  document.getElementById(
    "levelBadge"
  ).textContent =
    q.level;


  document.getElementById(
    "questionText"
  ).textContent =
    q.question;


  document.getElementById(
    "questionProgress"
  ).style.width =
    `${((currentQuestion + 1) / questions.length) * 100}%`;


  const options =
    document.getElementById(
      "answerOptions"
    );

  options.innerHTML = "";


  q.options.forEach(
    (option, index) => {

      const button =
        document.createElement(
          "button"
        );

      button.className =
        "answer-btn";

      button.textContent =
        `${String.fromCharCode(65 + index)}. ${option}`;


      button.addEventListener(
        "click",
        () => {

          checkAnswer(
            index,
            button
          );

        }
      );


      options.appendChild(button);

    }
  );


  document
    .getElementById("gameFeedback")
    .classList.add("hidden");

}


function checkAnswer(
  selectedIndex,
  selectedButton
) {

  if (answered) return;

  answered = true;


  const q =
    questions[currentQuestion];

  const buttons =
    document.querySelectorAll(
      ".answer-btn"
    );


  buttons.forEach(
    button => {

      button.disabled = true;

    }
  );


  const correct =
    selectedIndex === q.answer;


  if (correct) {

    gameScore += 10;

    correctAnswers++;

    addEcoPoints(10);

    selectedButton.classList.add(
      "correct"
    );


    document.getElementById(
      "feedbackTitle"
    ).textContent =
      "✅ BETUL!";


    document.getElementById(
      "feedbackPoints"
    ).textContent =
      "+10 ECO POINTS";

  } else {

    selectedButton.classList.add(
      "wrong"
    );


    buttons[q.answer].classList.add(
      "correct"
    );


    document.getElementById(
      "feedbackTitle"
    ).textContent =
      "❌ CUBA LAGI!";


    document.getElementById(
      "feedbackPoints"
    ).textContent =
      "0 POINT";

  }


  document.getElementById(
    "feedbackText"
  ).textContent =
    q.options[q.answer];


  document.getElementById(
    "feedbackTip"
  ).textContent =
    `💡 Smart Tip: ${q.tip}`;


  document
    .getElementById("gameFeedback")
    .classList.remove("hidden");


  updateEcoDisplay();

}


document
  .getElementById("nextQuestionBtn")
  .addEventListener(
    "click",
    () => {

      currentQuestion++;

      if (
        currentQuestion >=
        questions.length
      ) {

        finishGame();

      } else {

        loadQuestion();

      }

    }
  );


function finishGame() {

  gamePlay.classList.add(
    "hidden"
  );

  gameResult.classList.remove(
    "hidden"
  );


  document.getElementById(
    "finalPoints"
  ).textContent =
    gameScore;


  document.getElementById(
    "correctCount"
  ).textContent =
    correctAnswers;


  document.getElementById(
    "ecoRank"
  ).textContent =
    getRank(gameScore);


  let message = "";


  if (gameScore >= 130) {

    message =
      "Hebat! Kamu menunjukkan kemahiran pengasingan sisa yang sangat baik.";

  } else if (gameScore >= 100) {

    message =
      "Bagus! Teruskan amalan pengasingan sisa.";

  } else if (gameScore >= 60) {

    message =
      "Bagus! Teruskan belajar dan cuba lagi.";

  } else {

    message =
      "Teruskan mencuba. Setiap cabaran membantu kita belajar.";

  }


  document.getElementById(
    "resultMessage"
  ).textContent =
    message;

}


document
  .getElementById("playAgainBtn")
  .addEventListener(
    "click",
    startGame
  );


/* =========================================================
   AI SCANNER
========================================================= */

const startCameraBtn =
  document.getElementById(
    "startCameraBtn"
  );

const scanBtn =
  document.getElementById(
    "scanBtn"
  );

const switchCameraBtn =
  document.getElementById(
    "switchCameraBtn"
  );


startCameraBtn.addEventListener(
  "click",
  startCamera
);


scanBtn.addEventListener(
  "click",
  predictWaste
);


switchCameraBtn.addEventListener(
  "click",
  switchCamera
);


/* =========================================================
   LOAD MODEL
========================================================= */

async function loadAIModel() {

  try {

    model =
      await tmImage.load(
        MODEL_PATH +
          "model.json",

        MODEL_PATH +
          "metadata.json"
      );

    console.log(
      "SmartWaste AI model loaded."
    );

  } catch (error) {

    console.error(
      "Model loading error:",
      error
    );

    showScannerError(
      "Model AI tidak dapat dimuat. Pastikan folder model berada di lokasi yang betul."
    );

  }

}


/* =========================================================
   START CAMERA
========================================================= */

async function startCamera() {

  try {

    clearScannerError();


    if (!model) {

      await loadAIModel();

    }


    if (!model) {

      throw new Error(
        "Model AI tidak tersedia."
      );

    }


    if (webcam) {

      webcam.stop();

      webcam = null;

    }


    webcam =
      new tmImage.Webcam(
        640,
        480,
        true
      );


  await webcam.setup();

    await webcam.play();


    const container =
      document.getElementById(
        "webcam-container"
      );


    container.innerHTML = "";

    container.appendChild(
      webcam.canvas
    );


    cameraStarted = true;


    document
      .getElementById(
        "cameraPlaceholder"
      )
      .classList.add("hidden");


    scanBtn.disabled = false;

    switchCameraBtn.disabled =
      false;


    startCameraBtn.textContent =
      "🔄 Mulakan Semula Kamera";


    document.getElementById(
      "cameraStatus"
    ).textContent =
      "Kamera aktif. Letakkan sisa di hadapan kamera.";


    requestAnimationFrame(
      webcamLoop
    );


  } catch (error) {

    console.error(
      error
    );

    showScannerError(
      "Kamera tidak dapat digunakan. Sila benarkan akses kamera pada browser."
    );

  }

}


/* =========================================================
   WEBCAM LOOP
========================================================= */

async function webcamLoop() {

  if (!webcam) return;


  webcam.update();


  requestAnimationFrame(
    webcamLoop
  );

}


/* =========================================================
   SWITCH CAMERA
========================================================= */

async function switchCamera() {

  if (!cameraStarted) return;


  facingMode =
    facingMode ===
    "environment"
      ? "user"
      : "environment";


  await startCamera();

}


/* =========================================================
   PREDICT
========================================================= */

async function predictWaste() {

  if (!model || !webcam) {

    showScannerError(
      "Sila mulakan kamera terlebih dahulu."
    );

    return;

  }


  try {

    clearScannerError();


    const predictions =
      await model.predict(
        webcam.canvas
      );


    predictions.sort(
      (a, b) =>
        b.probability -
        a.probability
    );


    const best =
      predictions[0];


    lastPrediction = best;


    const label =
      best.className;

    const confidence =
      best.probability * 100;


    displayPrediction(
      label,
      confidence
    );


  } catch (error) {

    console.error(
      error
    );

    showScannerError(
      "AI tidak dapat menganalisis imej."
    );

  }

}


/* =========================================================
   CLASS INFORMATION
========================================================= */

function getClassInfo(label) {

  const name =
    label
      .toLowerCase()
      .trim();


  /* -------------------------
     PLASTIC
  ------------------------- */

  if (
    name.includes("plastic") ||
    name.includes("plastik")
  ) {

    return {

      title: "🧴 PLASTIC",

      bin: "🟧 TONG OREN",

      tip:
        "Pastikan botol atau bekas plastik kosong dan asingkan sebelum dikitar semula.",

      icon: "🧴"

    };

  }


  /* -------------------------
     PAPER
  ------------------------- */

  if (
    name.includes("paper") ||
    name.includes("kertas")
  ) {

    return {

      title: "📄 PAPER",

      bin: "🔵 TONG BIRU",

      tip:
        "Asingkan kertas daripada bahan lain dan pastikan ia sesuai untuk dikitar semula.",

      icon: "📄"

    };

  }


  /* -------------------------
     METAL / TIN / ALUMINIUM
  ------------------------- */

  if (
    name.includes("metal") ||
    name.includes("tin") ||
    name.includes("aluminium") ||
    name.includes("aluminum") ||
    name.includes("can") ||
    name.includes("cans") ||
    name.includes("logam")
  ) {

    return {

      title: "🥫 METAL / TIN",

      bin: "🟧 TONG OREN",

      tip:
        "Tin aluminium dan tin keluli boleh diasingkan untuk dikitar semula.",

      icon: "🥫"

    };

  }


  /* -------------------------
     GLASS
  ------------------------- */

  if (
    name.includes("glass") ||
    name.includes("kaca")
  ) {

    return {

      title: "🍾 GLASS",

      bin: "🟫 TONG COKLAT",

      tip:
        "Kaca perlu diasingkan daripada bahan lain dan dikendalikan dengan berhati-hati.",

      icon: "🍾"

    };

  }


  /* -------------------------
     UNKNOWN
  ------------------------- */

  return {

    title:
      label.toUpperCase(),

    bin:
      "🗑️ KENAL PASTI BAHAN",

    tip:
      "Sila semak jenis bahan sebelum menentukan tong yang sesuai.",

    icon: "♻️"

  };

}


/* =========================================================
   DISPLAY PREDICTION
========================================================= */

function displayPrediction(
  label,
  confidence
) {

  const info =
    getClassInfo(label);


  document.getElementById(
    "predictionLabel"
  ).textContent =
    info.title;


  document.getElementById(
    "binRecommendation"
  ).textContent =
    info.bin;


  document.getElementById(
    "confidenceText"
  ).textContent =
    `${confidence.toFixed(2)}%`;


  document.getElementById(
    "confidenceFill"
  ).style.width =
    `${Math.min(confidence, 100)}%`;


  document.getElementById(
    "smartTip"
  ).textContent =
    info.tip;


  document.querySelector(
    ".result-icon"
  ).textContent =
    info.icon;


  /*
     Eco Points diberikan sekali
     untuk setiap sesi scan.
  */

  if (
    confidence >= 60 &&
    !scannerPointGiven
  ) {

    addEcoPoints(10);

    scannerPointGiven = true;


    document
      .getElementById(
        "scannerPoints"
      )
      .classList.remove("hidden");

  }

}


/* =========================================================
   SCANNER ERROR
========================================================= */

function showScannerError(
  message
) {

  const error =
    document.getElementById(
      "scannerError"
    );

  error.textContent =
    message;

  error.classList.remove(
    "hidden"
  );

}


function clearScannerError() {

  document
    .getElementById(
      "scannerError"
    )
    .classList.add("hidden");

}


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
  "beforeunload",
  () => {

    if (webcam) {

      webcam.stop();

    }

  }
);


/* =========================================================
   INITIALISE
========================================================= */

updateEcoDisplay();
