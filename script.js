/* =========================================================
   SMARTWASTE AI
   Teachable Machine + Direct Camera Access
   4 Classes:
   Paper / Kertas
   Plastic / Plastik
   Tin Aluminium / Metal / Logam
   Glass / Kaca
   ========================================================= */

const MODEL_PATH = "./model/";

let model = null;
let video = null;
let cameraStream = null;
let cameraRunning = false;
let facingMode = "environment";
let lastPredictions = [];
let scannerPointGiven = false;

let gameScore = 0;
let currentQuestion = 0;
let gameStarted = false;


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const $ = (id) => document.getElementById(id);

const startCameraBtn = $("startCameraBtn");
const scanBtn = $("scanBtn");
const switchCameraBtn = $("switchCameraBtn");

const webcamContainer = $("webcam-container");
const cameraPlaceholder = $("cameraPlaceholder");

const scannerResult = $("scannerResult");
const predictionLabel = $("predictionLabel");
const binRecommendation = $("binRecommendation");
const confidenceText = $("confidenceText");
const confidenceFill = $("confidenceFill");
const smartTip = $("smartTip");
const scannerPoints = $("scannerPoints");
const scannerError = $("scannerError");

const gameStart = $("gameStart");
const gamePlay = $("gamePlay");
const gameResult = $("gameResult");


/* =========================================================
   STARTUP
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    updateEcoDisplay();
    loadTheme();
    setupNavigation();
    setupThemeToggle();
    setupBinCards();
    setupGame();

});


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    const navButtons = document.querySelectorAll("[data-section]");

    navButtons.forEach(button => {

        button.addEventListener("click", () => {

            const sectionId = button.dataset.section;
            const section = $(sectionId);

            if (section) {
                section.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }

        });

    });

}


/* =========================================================
   THEME / DARK MODE
   ========================================================= */

function setupThemeToggle() {

    const themeToggle = $("themeToggle");

    if (!themeToggle) return;

    themeToggle.addEventListener("click", () => {

        document.body.classList.toggle("dark");

        const isDark = document.body.classList.contains("dark");

        localStorage.setItem(
            "smartwaste-theme",
            isDark ? "dark" : "light"
        );

    });

}


function loadTheme() {

    const savedTheme =
        localStorage.getItem("smartwaste-theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark");
    }

}


/* =========================================================
   ECO POINTS
   ========================================================= */

function getEcoPoints() {

    return Number(
        localStorage.getItem("smartwaste-points") || 0
    );

}


function setEcoPoints(points) {

    localStorage.setItem(
        "smartwaste-points",
        points
    );

    updateEcoDisplay();

}


function addEcoPoints(points) {

    const current = getEcoPoints();

    setEcoPoints(current + points);

}


function updateEcoDisplay() {

    const points = getEcoPoints();

    const elements = [
        $("ecoPoints"),
        $("totalEcoPoints"),
        $("homeEcoPoints"),
        $("scannerEcoPoints"),
        $("gameEcoPoints")
    ];

    elements.forEach(element => {

        if (element) {
            element.textContent = points;
        }

    });

}


/* =========================================================
   ECO RANK
   ========================================================= */

function getRank(points) {

    if (points >= 130) {
        return "🏆 Eco Hero";
    }

    if (points >= 100) {
        return "🌍 Eco Champion";
    }

    if (points >= 60) {
        return "♻️ Eco Learner";
    }

    return "🌱 Eco Beginner";

}


/* =========================================================
   LOAD TEACHABLE MACHINE MODEL
   ========================================================= */

async function loadModel() {

    if (model) return true;

    try {

        scannerError.textContent =
            "🧠 Memuatkan AI model...";

        model = await tmImage.load(
            MODEL_PATH + "model.json",
            MODEL_PATH + "metadata.json"
        );

        console.log("SmartWaste AI model loaded.");

        scannerError.textContent = "";

        return true;

    } catch (error) {

        console.error(error);

        if (scannerError) {
            scannerError.textContent =
                "❌ Model AI tidak dapat dimuatkan. Sila semak folder model.";
        }

        return false;

    }

}


/* =========================================================
   CAMERA
   ========================================================= */

async function startCamera() {

    try {

        clearScannerError();

        if (!navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia) {

            throw new Error(
                "Browser tidak menyokong akses kamera."
            );

        }

        /* Stop camera lama dahulu */
        stopCamera();

        /*
         * Kita guna getUserMedia secara terus.
         * Ini mengelakkan masalah tmImage.Webcam.setup().
         */

        cameraStream =
            await navigator.mediaDevices.getUserMedia({

                video: {
                    facingMode: {
                        ideal: facingMode
                    },
                    width: {
                        ideal: 640
                    },
                    height: {
                        ideal: 480
                    }
                },

                audio: false

            });


        /* =================================================
           CREATE VIDEO ELEMENT
           ================================================= */

        if (!video) {

            video = document.createElement("video");

            video.id = "smartwaste-video";

            video.autoplay = true;
            video.playsInline = true;
            video.muted = true;

            video.setAttribute(
                "playsinline",
                ""
            );

            video.style.width = "100%";
            video.style.height = "auto";
            video.style.display = "block";
            video.style.borderRadius = "20px";

        }


        video.srcObject = cameraStream;

        if (webcamContainer) {

            webcamContainer.innerHTML = "";

            webcamContainer.appendChild(video);

        }


        await video.play();

        cameraRunning = true;


        /* =================================================
           BUTTON STATES
           ================================================= */

        if (startCameraBtn) {

            startCameraBtn.textContent =
                "📷 Kamera Aktif";

            startCameraBtn.disabled = true;

        }

        if (scanBtn) {
            scanBtn.disabled = false;
        }

        if (switchCameraBtn) {
            switchCameraBtn.disabled = false;
        }


        if (cameraPlaceholder) {
            cameraPlaceholder.style.display = "none";
        }


        /* Load AI model */
        await loadModel();


        console.log("Camera started successfully.");

    } catch (error) {

        console.error(
            "Camera error:",
            error
        );

        cameraRunning = false;

        showCameraError(error);

    }

}


/* =========================================================
   CAMERA ERROR HANDLER
   ========================================================= */

function showCameraError(error) {

    let message =
        "❌ Kamera tidak dapat digunakan.";

    if (error.name === "NotAllowedError") {

        message =
            "❌ Akses kamera ditolak. Sila benarkan kamera untuk laman ini.";

    }

    else if (error.name === "NotFoundError") {

        message =
            "❌ Kamera tidak dijumpai pada peranti.";

    }

    else if (error.name === "NotReadableError") {

        message =
            "❌ Kamera sedang digunakan oleh aplikasi lain.";

    }

    else if (error.name === "OverconstrainedError") {

        message =
            "❌ Tetapan kamera tidak disokong. Cuba kamera lain.";

    }

    else if (error.name === "SecurityError") {

        message =
            "❌ Browser menyekat akses kamera atas sebab keselamatan.";

    }

    else if (error.message) {

        message =
            "❌ " + error.message;

    }


    if (scannerError) {
        scannerError.textContent = message;
    }

}


/* =========================================================
   STOP CAMERA
   ========================================================= */

function stopCamera() {

    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(track => track.stop());

        cameraStream = null;

    }

    cameraRunning = false;


    if (video) {

        video.pause();

        video.srcObject = null;

    }

}


/* =========================================================
   SWITCH CAMERA
   ========================================================= */

async function switchCamera() {

    if (!cameraRunning) {

        await startCamera();

        return;

    }

    facingMode =
        facingMode === "environment"
            ? "user"
            : "environment";


    await startCamera();

}


/* =========================================================
   CAMERA BUTTON EVENTS
   ========================================================= */

if (startCameraBtn) {

    startCameraBtn.addEventListener(
        "click",
        startCamera
    );

}


if (switchCameraBtn) {

    switchCameraBtn.addEventListener(
        "click",
        switchCamera
    );

}


/* =========================================================
   SCAN WASTE
   ========================================================= */

async function scanWaste() {

    clearScannerError();

    if (!cameraRunning || !video) {

        showScannerMessage(
            "📷 Sila hidupkan kamera terlebih dahulu."
        );

        return;

    }


    if (!model) {

        const loaded =
            await loadModel();

        if (!loaded) return;

    }


    try {

        if (video.readyState < 2) {

            showScannerMessage(
                "⏳ Kamera sedang disediakan..."
            );

            return;

        }


        /*
         * Teachable Machine boleh menerima HTMLVideoElement
         * sebagai input prediction.
         */

        const predictions =
            await model.predict(video);


        if (!predictions ||
            predictions.length === 0) {

            showScannerMessage(
                "⚠️ AI tidak dapat mengenal pasti objek."
            );

            return;

        }


        /* Susun dari confidence tertinggi */
        predictions.sort(
            (a, b) =>
                b.probability - a.probability
        );


        const best =
            predictions[0];


        const label =
            best.className;

        const probability =
            best.probability;


        const percentage =
            probability * 100;


        const info =
            getClassInfo(label);


        /* Simpan prediction */
        lastPredictions =
            predictions;


        /* =================================================
           DISPLAY RESULT
           ================================================= */

        if (scannerResult) {
            scannerResult.style.display = "block";
        }


        if (predictionLabel) {

            predictionLabel.textContent =
                info.emoji + " " + info.displayName;

        }


        if (binRecommendation) {

            binRecommendation.textContent =
                info.binEmoji + " " + info.bin;

        }


        if (confidenceText) {

            confidenceText.textContent =
                percentage.toFixed(2) + "%";

        }


        if (confidenceFill) {

            confidenceFill.style.width =
                Math.min(
                    percentage,
                    100
                ) + "%";

        }


        if (smartTip) {

            smartTip.textContent =
                info.tip;

        }


        /* =================================================
           CONFIDENCE MESSAGE
           ================================================= */

        if (percentage >= 80) {

            if (confidenceText) {
                confidenceText.textContent =
                    percentage.toFixed(2) +
                    "% • Sangat yakin";
            }

        }

        else if (percentage >= 60) {

            if (confidenceText) {
                confidenceText.textContent =
                    percentage.toFixed(2) +
                    "% • Yakin";
            }

        }

        else {

            if (confidenceText) {
                confidenceText.textContent =
                    percentage.toFixed(2) +
                    "% • Cuba imbas semula";
            }

        }


        /* =================================================
           ECO POINT
           ================================================= */

        /*
         * +10 hanya sekali untuk satu sesi halaman.
         * Ini mengelakkan pengguna mendapat point tanpa had
         * dengan mengimbas objek yang sama berulang kali.
         */

        if (
            percentage >= 60 &&
            !scannerPointGiven
        ) {

            addEcoPoints(10);

            scannerPointGiven = true;

            if (scannerPoints) {

                scannerPoints.textContent =
                    "🎉 +10 Eco Points!";

                scannerPoints.style.display =
                    "block";

            }

        }


        console.log(
            "AI Prediction:",
            label,
            percentage.toFixed(2) + "%"
        );


    } catch (error) {

        console.error(
            "Prediction error:",
            error
        );

        showScannerMessage(
            "❌ AI gagal menganalisis objek."
        );

    }

}


/* =========================================================
   SCAN BUTTON
   ========================================================= */

if (scanBtn) {

    scanBtn.addEventListener(
        "click",
        scanWaste
    );

}


/* =========================================================
   CLASS MAPPING
   ========================================================= */

function getClassInfo(label) {

    const text =
        String(label)
            .toLowerCase()
            .trim();


    /* =====================================================
       PLASTIC
       ===================================================== */

    if (
        text.includes("plastic") ||
        text.includes("plastik")
    ) {

        return {

            displayName: "Plastik",

            emoji: "🧴",

            bin: "Tong Oren",

            binEmoji: "🟧",

            binColor: "orange",

            tip:
                "Asingkan plastik daripada sisa lain dan pastikan ia kosong sebelum dikitar semula."

        };

    }


    /* =====================================================
       PAPER
       ===================================================== */

    if (
        text.includes("paper") ||
        text.includes("kertas")
    ) {

        return {

            displayName: "Kertas",

            emoji: "📄",

            bin: "Tong Biru",

            binEmoji: "🔵",

            binColor: "blue",

            tip:
                "Asingkan kertas daripada plastik dan sisa makanan. Kertas yang bersih lebih mudah dikitar semula."

        };

    }


    /* =====================================================
       METAL / TIN / ALUMINIUM
       ===================================================== */

    if (
        text.includes("metal") ||
        text.includes("tin") ||
        text.includes("aluminium") ||
        text.includes("aluminum") ||
        text.includes("cans") ||
        text.includes("can") ||
        text.includes("logam")
    ) {

        return {

            displayName:
                "Tin Aluminium / Metal",

            emoji: "🥫",

            bin: "Tong Oren",

            binEmoji: "🟧",

            binColor: "orange",

            tip:
                "Kosongkan tin atau bekas logam sebelum dimasukkan ke tong kitar semula."

        };

    }


    /* =====================================================
       GLASS
       ===================================================== */

    if (
        text.includes("glass") ||
        text.includes("kaca")
    ) {

        return {

            displayName: "Kaca",

            emoji: "🍾",

            bin: "Tong Coklat",

            binEmoji: "🟫",

            binColor: "brown",

            tip:
                "Kendalikan kaca dengan berhati-hati. Asingkan kaca daripada sisa lain."

        };

    }


    /* =====================================================
       UNKNOWN
       ===================================================== */

    return {

        displayName: label,

        emoji: "❓",

        bin: "Tidak dapat ditentukan",

        binEmoji: "♻️",

        binColor: "green",

        tip:
            "Cuba letakkan objek di hadapan kamera dengan pencahayaan yang baik dan imbas semula."

    };

}


/* =========================================================
   SCANNER MESSAGE
   ========================================================= */

function showScannerMessage(message) {

    if (scannerError) {
        scannerError.textContent = message;
    }

}


function clearScannerError() {

    if (scannerError) {
        scannerError.textContent = "";
    }

}


/* =========================================================
   BIN CARDS
   ========================================================= */

function setupBinCards() {

    const binCards =
        document.querySelectorAll(
            ".bin-card"
        );


    binCards.forEach(card => {

        card.addEventListener(
            "click",
            () => {

                binCards.forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );

                card.classList.add(
                    "active"
                );

            }
        );

    });

}


/* =========================================================
   WASTE GAME
   ========================================================= */

const questions = [

    {
        question:
            "Apakah tong yang sesuai untuk membuang kertas?",

        answers: [
            "🔵 Tong Biru",
            "🟧 Tong Oren",
            "🟫 Tong Coklat",
            "🗑️ Tong Sampah Biasa"
        ],

        correct: 0,

        tip:
            "Kertas diletakkan di Tong Biru."
    },


    {
        question:
            "Botol plastik biasanya dikategorikan sebagai?",

        answers: [
            "Kaca",
            "Plastik",
            "Kertas",
            "Logam"
        ],

        correct: 1,

        tip:
            "Botol plastik termasuk dalam kategori plastik."
    },


    {
        question:
            "Tin aluminium perlu dimasukkan ke tong?",

        answers: [
            "🔵 Biru",
            "🟧 Oren",
            "🟫 Coklat",
            "Tiada tong"
        ],

        correct: 1,

        tip:
            "Tin aluminium atau logam dimasukkan ke Tong Oren."
    },


    {
        question:
            "Botol kaca sesuai dimasukkan ke?",

        answers: [
            "🔵 Tong Biru",
            "🟧 Tong Oren",
            "🟫 Tong Coklat",
            "Tong sampah biasa"
        ],

        correct: 2,

        tip:
            "Kaca diletakkan di Tong Coklat."
    },


    {
        question:
            "Mengapa kita perlu mengasingkan sisa?",

        answers: [
            "Supaya sampah bertambah",
            "Supaya mudah dikitar semula",
            "Supaya tong cepat penuh",
            "Supaya membazir"
        ],

        correct: 1,

        tip:
            "Pengasingan sisa membantu proses kitar semula."
    },


    {
        question:
            "Apakah contoh sisa plastik?",

        answers: [
            "Surat khabar",
            "Botol plastik",
            "Botol kaca",
            "Tin aluminium"
        ],

        correct: 1,

        tip:
            "Botol plastik ialah contoh sisa plastik."
    },


    {
        question:
            "Apakah warna tong untuk kertas?",

        answers: [
            "🔵 Biru",
            "🟧 Oren",
            "🟫 Coklat",
            "Merah"
        ],

        correct: 0,

        tip:
            "Tong Biru digunakan untuk kertas."
    },


    {
        question:
            "Apakah warna tong untuk kaca?",

        answers: [
            "🔵 Biru",
            "🟧 Oren",
            "🟫 Coklat",
            "Hijau"
        ],

        correct: 2,

        tip:
            "Tong Coklat digunakan untuk kaca."
    },


    {
        question:
            "Tin minuman kosong tergolong dalam kategori?",

        answers: [
            "Kertas",
            "Plastik",
            "Logam",
            "Kaca"
        ],

        correct: 2,

        tip:
            "Tin minuman ialah sisa logam."
    },


    {
        question:
            "Apakah tindakan yang baik sebelum mengitar semula bekas?",

        answers: [
            "Buang bersama makanan",
            "Kosongkan dan bersihkan",
            "Campurkan semua sisa",
            "Pecahkan semua bekas"
        ],

        correct: 1,

        tip:
            "Bekas yang kosong dan bersih lebih sesuai untuk dikitar semula."
    },


    {
        question:
            "AI Waste Scanner membantu kita untuk?",

        answers: [
            "Membakar sampah",
            "Mengenal pasti jenis sisa",
            "Menambah sampah",
            "Membuang sampah merata-rata"
        ],

        correct: 1,

        tip:
            "AI membantu mengenal pasti jenis sisa melalui imej."
    },


    {
        question:
            "Apakah maksud kitar semula?",

        answers: [
            "Menggunakan semula bahan untuk menghasilkan sesuatu",
            "Membuang semua sampah",
            "Membakar sampah",
            "Meninggalkan sampah"
        ],

        correct: 0,

        tip:
            "Kitar semula membantu mengurangkan jumlah sisa."
    },


    {
        question:
            "Apakah SDG yang berkaitan dengan penggunaan dan pengeluaran bertanggungjawab?",

        answers: [
            "SDG 4",
            "SDG 11",
            "SDG 12",
            "SDG 17"
        ],

        correct: 2,

        tip:
            "SDG 12 ialah Penggunaan dan Pengeluaran Bertanggungjawab."
    },


    {
        question:
            "Bagaimanakah kita boleh membantu alam sekitar?",

        answers: [
            "Membuang sampah merata-rata",
            "Mengasingkan sisa",
            "Membakar semua sampah",
            "Menggunakan lebih banyak plastik"
        ],

        correct: 1,

        tip:
            "Pengasingan sisa ialah salah satu amalan baik untuk alam sekitar."
    },


    {
        question:
            "Apakah matlamat utama SmartWaste AI?",

        answers: [
            "Menggalakkan pembaziran",
            "Membantu pembelajaran pengasingan sisa menggunakan AI",
            "Menghasilkan lebih banyak sampah",
            "Menghapuskan tong sampah"
        ],

        correct: 1,

        tip:
            "SmartWaste AI menggabungkan AI dan pendidikan untuk membantu murid mengenal pasti serta mengasingkan sisa."
    }

];


/* =========================================================
   GAME SETUP
   ========================================================= */

function setupGame() {

    const startButton =
        $("startGameBtn");

    if (startButton) {

        startButton.addEventListener(
            "click",
            startGame
        );

    }

}


/* =========================================================
   START GAME
   ========================================================= */

function startGame() {

    gameScore = 0;
    currentQuestion = 0;
    gameStarted = true;


    if (gameStart) {
        gameStart.style.display = "none";
    }

    if (gameResult) {
        gameResult.style.display = "none";
    }

    if (gamePlay) {
        gamePlay.style.display = "block";
    }


    showQuestion();

}


/* =========================================================
   SHOW QUESTION
   ========================================================= */

function showQuestion() {

    const question =
        questions[currentQuestion];

    if (!question) {

        finishGame();

        return;

    }


    const questionNumber =
        currentQuestion + 1;


    const questionText =
        $("questionText");

    const questionProgress =
        $("questionProgress");

    const answerContainer =
        $("answerContainer");


    if (questionText) {

        questionText.textContent =
            question.question;

    }


    if (questionProgress) {

        questionProgress.textContent =
            `Soalan ${questionNumber}/${questions.length}`;

    }


    if (answerContainer) {

        answerContainer.innerHTML = "";


        question.answers.forEach(
            (answer, index) => {

                const button =
                    document.createElement("button");

                button.className =
                    "answer-btn";

                button.textContent =
                    answer;

                button.addEventListener(
                    "click",
                    () =>
                        answerQuestion(index)
                );

                answerContainer.appendChild(
                    button
                );

            }
        );

    }


    const gameFeedback =
        $("gameFeedback");

    if (gameFeedback) {
        gameFeedback.textContent = "";
    }


    const gameScoreDisplay =
        $("gameScore");

    if (gameScoreDisplay) {

        gameScoreDisplay.textContent =
            gameScore;

    }

}


/* =========================================================
   ANSWER QUESTION
   ========================================================= */

function answerQuestion(selectedIndex) {

    const question =
        questions[currentQuestion];


    const answerButtons =
        document.querySelectorAll(
            ".answer-btn"
        );


    answerButtons.forEach(
        button =>
            button.disabled = true
    );


    const feedback =
        $("gameFeedback");


    if (
        selectedIndex ===
        question.correct
    ) {

        gameScore += 10;


        if (answerButtons[selectedIndex]) {

            answerButtons[selectedIndex]
                .classList.add("correct");

        }


        if (feedback) {

            feedback.textContent =
                "✅ Betul! +10 Eco Points — " +
                question.tip;

        }

    }

    else {

        if (answerButtons[selectedIndex]) {

            answerButtons[selectedIndex]
                .classList.add("wrong");

        }


        if (answerButtons[question.correct]) {

            answerButtons[question.correct]
                .classList.add("correct");

        }


        if (feedback) {

            feedback.textContent =
                "❌ Belum tepat. " +
                question.tip;

        }

    }


    const gameScoreDisplay =
        $("gameScore");

    if (gameScoreDisplay) {

        gameScoreDisplay.textContent =
            gameScore;

    }


    setEcoPoints(
        getEcoPoints() +
        (
            selectedIndex === question.correct
                ? 10
                : 0
        )
    );


    setTimeout(() => {

        currentQuestion++;

        showQuestion();

    }, 1800);

}


/* =========================================================
   FINISH GAME
   ========================================================= */

function finishGame() {

    gameStarted = false;


    if (gamePlay) {
        gamePlay.style.display = "none";
    }

    if (gameResult) {
        gameResult.style.display = "block";
    }


    const finalScore =
        $("finalScore");

    const finalRank =
        $("finalRank");


    if (finalScore) {

        finalScore.textContent =
            gameScore + " / 150";

    }


    if (finalRank) {

        finalRank.textContent =
            getRank(gameScore);

    }


    const resultMessage =
        $("resultMessage");


    if (resultMessage) {

        if (gameScore >= 130) {

            resultMessage.textContent =
                "Hebat! Anda sangat peka terhadap pengasingan sisa.";

        }

        else if (gameScore >= 100) {

            resultMessage.textContent =
                "Tahniah! Pengetahuan anda tentang pengurusan sisa sangat baik.";

        }

        else if (gameScore >= 60) {

            resultMessage.textContent =
                "Bagus! Teruskan belajar dan amalkan pengasingan sisa.";

        }

        else {

            resultMessage.textContent =
                "Jangan risau! Cuba lagi dan tingkatkan pengetahuan anda.";

        }

    }


    updateEcoDisplay();

}


/* =========================================================
   RESTART GAME
   ========================================================= */

const restartGameBtn =
    $("restartGameBtn");


if (restartGameBtn) {

    restartGameBtn.addEventListener(
        "click",
        () => {

            if (gameResult) {
                gameResult.style.display =
                    "none";
            }

            if (gameStart) {
                gameStart.style.display =
                    "block";
            }

        }
    );

}


/* =========================================================
   PAGE CLEANUP
   ========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        stopCamera();

    }
);