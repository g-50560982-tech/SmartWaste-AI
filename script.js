/* =========================================================
   SMARTWASTE AI
   Teachable Machine + Direct Camera Access

   4 Classes:
   Paper / Kertas
   Plastic / Plastik
   Tin Aluminium / Metal / Logam
   Glass / Kaca
   ========================================================= */


/* =========================================================
   MODEL
   ========================================================= */

const MODEL_PATH = "./model/";


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let model = null;

let video = null;
let cameraStream = null;
let cameraRunning = false;
let facingMode = "environment";

let lastPredictions = [];
let scannerPointGiven = false;


/* =========================================================
   GAME VARIABLES
   ========================================================= */

let gameScore = 0;
let currentQuestion = 0;
let correctAnswers = 0;
let gameStarted = false;
let answerLocked = false;


/* =========================================================
   HELPER
   ========================================================= */

const $ = (id) => document.getElementById(id);


/* =========================================================
   STARTUP
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    console.log("SmartWaste AI loaded successfully.");

    updateEcoDisplay();
    loadTheme();

    setupNavigation();
    setupThemeToggle();
    setupBinCards();
    setupScanner();
    setupGame();

});


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    const navButtons =
        document.querySelectorAll("[data-section]");

    const goButtons =
        document.querySelectorAll("[data-go]");

    console.log(
        "Navigation buttons:",
        navButtons.length
    );

    console.log(
        "Go buttons:",
        goButtons.length
    );


    function showSection(sectionId) {

        const targetSection =
            document.getElementById(sectionId);


        if (!targetSection) {

            console.warn(
                "Section tidak dijumpai:",
                sectionId
            );

            return;

        }


        document
            .querySelectorAll(".page-section")
            .forEach(section => {

                section.classList.remove(
                    "active-section"
                );

            });


        targetSection.classList.add(
            "active-section"
        );


        document
            .querySelectorAll(".nav-btn")
            .forEach(button => {

                button.classList.remove(
                    "active"
                );

            });


        const activeButton =
            document.querySelector(
                `.nav-btn[data-section="${sectionId}"]`
            );


        if (activeButton) {

            activeButton.classList.add(
                "active"
            );

        }


        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });


        console.log(
            "Section aktif:",
            sectionId
        );

    }


    navButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const sectionId =
                    button.getAttribute(
                        "data-section"
                    );

                showSection(sectionId);

            }
        );

    });


    goButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const sectionId =
                    button.getAttribute(
                        "data-go"
                    );

                showSection(sectionId);

            }
        );

    });

}


/* =========================================================
   THEME / DARK MODE
   ========================================================= */

function setupThemeToggle() {

    const themeToggle =
        $("themeToggle");


    if (!themeToggle) {

        console.warn(
            "themeToggle tidak dijumpai."
        );

        return;

    }


    themeToggle.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "dark"
            );


            const isDark =
                document.body.classList.contains(
                    "dark"
                );


            localStorage.setItem(
                "smartwaste-theme",
                isDark
                    ? "dark"
                    : "light"
            );

        }
    );

}


function loadTheme() {

    const savedTheme =
        localStorage.getItem(
            "smartwaste-theme"
        );


    if (savedTheme === "dark") {

        document.body.classList.add(
            "dark"
        );

    }

}


/* =========================================================
   ECO POINTS
   ========================================================= */

function getEcoPoints() {

    return Number(
        localStorage.getItem(
            "smartwaste-points"
        ) || 0
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

    const current =
        getEcoPoints();

    setEcoPoints(
        current + points
    );

}


function updateEcoDisplay() {

    const points =
        getEcoPoints();


    const elements = [

        $("ecoPoints"),

        $("totalEcoPoints"),

        $("homeEcoPoints"),

        $("scannerEcoPoints"),

        $("gameEcoPoints")

    ];


    elements.forEach(element => {

        if (element) {

            element.textContent =
                points;

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
   TEACHABLE MACHINE MODEL
   ========================================================= */

async function loadModel() {

    if (model) {

        return true;

    }


    const scannerError =
        $("scannerError");


    try {

        if (scannerError) {

            scannerError.textContent =
                "🧠 Memuatkan AI model...";

        }


        if (
            typeof tmImage ===
            "undefined"
        ) {

            throw new Error(
                "Teachable Machine library tidak dimuatkan."
            );

        }


        model =
            await tmImage.load(

                MODEL_PATH +
                "model.json",

                MODEL_PATH +
                "metadata.json"

            );


        console.log(
            "SmartWaste AI model loaded successfully."
        );


        if (scannerError) {

            scannerError.textContent =
                "";

        }


        return true;


    } catch (error) {

        console.error(
            "Model error:",
            error
        );


        if (scannerError) {

            scannerError.textContent =
                "❌ Model AI tidak dapat dimuatkan. Sila semak folder model.";

        }


        return false;

    }

}


/* =========================================================
   SCANNER SETUP
   ========================================================= */

function setupScanner() {

    const startCameraBtn =
        $("startCameraBtn");

    const scanBtn =
        $("scanBtn");

    const switchCameraBtn =
        $("switchCameraBtn");


    if (startCameraBtn) {

        startCameraBtn.addEventListener(
            "click",
            startCamera
        );

    }


    if (scanBtn) {

        scanBtn.addEventListener(
            "click",
            scanWaste
        );

    }


    if (switchCameraBtn) {

        switchCameraBtn.addEventListener(
            "click",
            switchCamera
        );

    }


    console.log(
        "Scanner setup complete."
    );

}


/* =========================================================
   CAMERA
   ========================================================= */

async function startCamera() {

    const startCameraBtn =
        $("startCameraBtn");

    const scanBtn =
        $("scanBtn");

    const switchCameraBtn =
        $("switchCameraBtn");

    const webcamContainer =
        $("webcam-container");

    const cameraPlaceholder =
        $("cameraPlaceholder");


    try {

        clearScannerError();


        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            throw new Error(
                "Browser tidak menyokong akses kamera."
            );

        }


        stopCamera();


        cameraStream =
            await navigator.mediaDevices.getUserMedia({

                video: {

                    facingMode: {

                        ideal:
                            facingMode

                    },

                    width: {

                        ideal:
                            640

                    },

                    height: {

                        ideal:
                            480

                    }

                },

                audio: false

            });


        console.log(
            "Camera permission OK."
        );


        video =
            document.createElement(
                "video"
            );


        video.id =
            "smartwaste-video";


        video.autoplay =
            true;


        video.playsInline =
            true;


        video.muted =
            true;


        video.setAttribute(
            "playsinline",
            ""
        );


        video.style.width =
            "100%";


        video.style.height =
            "auto";


        video.style.display =
            "block";


        video.style.borderRadius =
            "20px";


        video.srcObject =
            cameraStream;


        if (webcamContainer) {

            webcamContainer.innerHTML =
                "";

            webcamContainer.appendChild(
                video
            );

        }


        await video.play();


        cameraRunning =
            true;


        if (startCameraBtn) {

            startCameraBtn.textContent =
                "📷 Kamera Aktif";

            startCameraBtn.disabled =
                true;

        }


        if (scanBtn) {

            scanBtn.disabled =
                false;

        }


        if (switchCameraBtn) {

            switchCameraBtn.disabled =
                false;

        }


        if (cameraPlaceholder) {

            cameraPlaceholder.style.display =
                "none";

        }


        await loadModel();


        console.log(
            "Camera started successfully."
        );


    } catch (error) {

        console.error(
            "Camera error:",
            error
        );


        cameraRunning =
            false;


        showCameraError(
            error
        );

    }

}


/* =========================================================
   CAMERA ERROR
   ========================================================= */

function showCameraError(error) {

    const scannerError =
        $("scannerError");


    let message =
        "❌ Kamera tidak dapat digunakan.";


    if (
        error &&
        error.name ===
            "NotAllowedError"
    ) {

        message =
            "❌ Akses kamera ditolak. Sila benarkan kamera untuk laman ini.";

    }

    else if (
        error &&
        error.name ===
            "NotFoundError"
    ) {

        message =
            "❌ Kamera tidak dijumpai pada peranti.";

    }

    else if (
        error &&
        error.name ===
            "NotReadableError"
    ) {

        message =
            "❌ Kamera sedang digunakan oleh aplikasi lain.";

    }

    else if (
        error &&
        error.name ===
            "OverconstrainedError"
    ) {

        message =
            "❌ Tetapan kamera tidak disokong. Cuba kamera lain.";

    }

    else if (
        error &&
        error.name ===
            "SecurityError"
    ) {

        message =
            "❌ Browser menyekat akses kamera atas sebab keselamatan.";

    }

    else if (
        error &&
        error.message
    ) {

        message =
            "❌ " +
            error.message;

    }


    if (scannerError) {

        scannerError.textContent =
            message;

    }

}


/* =========================================================
   STOP CAMERA
   ========================================================= */

function stopCamera() {

    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(track => {

                track.stop();

            });


        cameraStream =
            null;

    }


    cameraRunning =
        false;


    if (video) {

        video.pause();

        video.srcObject =
            null;

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
        facingMode ===
            "environment"
            ? "user"
            : "environment";


    await startCamera();

}


/* =========================================================
   SCAN WASTE
   ========================================================= */

async function scanWaste() {

    clearScannerError();


    const videoElement =
        video;

    const scannerResult =
        $("scannerResult");

    const predictionLabel =
        $("predictionLabel");

    const binRecommendation =
        $("binRecommendation");

    const confidenceText =
        $("confidenceText");

    const confidenceFill =
        $("confidenceFill");

    const smartTip =
        $("smartTip");

    const scannerPoints =
        $("scannerPoints");


    if (
        !cameraRunning ||
        !videoElement
    ) {

        showScannerMessage(
            "📷 Sila hidupkan kamera terlebih dahulu."
        );

        return;

    }


    if (!model) {

        const loaded =
            await loadModel();


        if (!loaded) {

            return;

        }

    }


    try {

        if (
            videoElement.readyState <
            2
        ) {

            showScannerMessage(
                "⏳ Kamera sedang disediakan..."
            );

            return;

        }


        const predictions =
            await model.predict(
                videoElement
            );


        if (
            !predictions ||
            predictions.length ===
                0
        ) {

            showScannerMessage(
                "⚠️ AI tidak dapat mengenal pasti objek."
            );

            return;

        }


        predictions.sort(
            (a, b) =>
                b.probability -
                a.probability
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
            getClassInfo(
                label
            );


        lastPredictions =
            predictions;


        if (scannerResult) {

            scannerResult.style.display =
                "block";

        }


        if (predictionLabel) {

            predictionLabel.textContent =
                info.emoji +
                " " +
                info.displayName;

        }


        if (binRecommendation) {

            binRecommendation.textContent =
                info.binEmoji +
                " " +
                info.bin;

        }


        if (confidenceText) {

            if (percentage >= 80) {

                confidenceText.textContent =
                    percentage.toFixed(2) +
                    "% • Sangat yakin";

            }

            else if (percentage >= 60) {

                confidenceText.textContent =
                    percentage.toFixed(2) +
                    "% • Yakin";

            }

            else {

                confidenceText.textContent =
                    percentage.toFixed(2) +
                    "% • Cuba imbas semula";

            }

        }


        if (confidenceFill) {

            confidenceFill.style.width =
                Math.min(
                    percentage,
                    100
                ) +
                "%";

        }


        if (smartTip) {

            smartTip.textContent =
                info.tip;

        }


        if (
            percentage >= 60 &&
            !scannerPointGiven
        ) {

            addEcoPoints(10);

            scannerPointGiven =
                true;


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
            percentage.toFixed(2) +
            "%"
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
   CLASS MAPPING
   ========================================================= */

function getClassInfo(label) {

    const text =
        String(label)
            .toLowerCase()
            .trim();


    /* PLASTIC */

    if (
        text.includes("plastic") ||
        text.includes("plastik")
    ) {

        return {

            displayName:
                "Plastik",

            emoji:
                "🧴",

            bin:
                "Tong Oren",

            binEmoji:
                "🟧",

            binColor:
                "orange",

            tip:
                "Asingkan plastik daripada sisa lain dan pastikan ia kosong sebelum dikitar semula."

        };

    }


    /* PAPER */

    if (
        text.includes("paper") ||
        text.includes("kertas")
    ) {

        return {

            displayName:
                "Kertas",

            emoji:
                "📄",

            bin:
                "Tong Biru",

            binEmoji:
                "🔵",

            binColor:
                "blue",

            tip:
                "Asingkan kertas daripada plastik dan sisa makanan. Kertas yang bersih lebih mudah dikitar semula."

        };

    }


    /* METAL / TIN */

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

            emoji:
                "🥫",

            bin:
                "Tong Oren",

            binEmoji:
                "🟧",

            binColor:
                "orange",

            tip:
                "Kosongkan tin atau bekas logam sebelum dimasukkan ke tong kitar semula."

        };

    }


    /* GLASS */

    if (
        text.includes("glass") ||
        text.includes("kaca")
    ) {

        return {

            displayName:
                "Kaca",

            emoji:
                "🍾",

            bin:
                "Tong Coklat",

            binEmoji:
                "🟫",

            binColor:
                "brown",

            tip:
                "Kendalikan kaca dengan berhati-hati. Asingkan kaca daripada sisa lain."

        };

    }


    /* UNKNOWN */

    return {

        displayName:
            label,

        emoji:
            "❓",

        bin:
            "Tidak dapat ditentukan",

        binEmoji:
            "♻️",

        binColor:
            "green",

        tip:
            "Cuba letakkan objek di hadapan kamera dengan pencahayaan yang baik dan imbas semula."

    };

}


/* =========================================================
   SCANNER MESSAGE
   ========================================================= */

function showScannerMessage(message) {

    const scannerError =
        $("scannerError");


    if (scannerError) {

        scannerError.textContent =
            message;

    }

}


function clearScannerError() {

    const scannerError =
        $("scannerError");


    if (scannerError) {

        scannerError.textContent =
            "";

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
                    item => {

                        item.classList.remove(
                            "active"
                        );

                    }
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

        correct:
            0,

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

        correct:
            1,

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

        correct:
            1,

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

        correct:
            2,

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

        correct:
            1,

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

        correct:
            1,

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

        correct:
            0,

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

        correct:
            2,

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

        correct:
            2,

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

        correct:
            1,

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

        correct:
            1,

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

        correct:
            0,

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

        correct:
            2,

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

        correct:
            1,

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

        correct:
            1,

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

    const restartButton =
        $("restartGameBtn");


    if (startButton) {

        startButton.addEventListener(
            "click",
            startGame
        );

    }
    else {

        console.warn(
            "startGameBtn tidak dijumpai."
        );

    }


    if (restartButton) {

        restartButton.addEventListener(
            "click",
            restartGame
        );

    }
    else {

        console.warn(
            "restartGameBtn tidak dijumpai."
        );

    }


    console.log(
        "Game setup complete."
    );

}


/* =========================================================
   START GAME
   ========================================================= */

function startGame() {

    console.log(
        "🚀 GAME DIMULAKAN"
    );


    gameScore =
        0;

    currentQuestion =
        0;

    correctAnswers =
        0;

    gameStarted =
        true;

    answerLocked =
        false;


    const gameStart =
        $("gameStart");

    const gamePlay =
        $("gamePlay");

    const gameResult =
        $("gameResult");


    /* Hide start screen */

    if (gameStart) {

        gameStart.classList.add(
            "hidden"
        );

        gameStart.style.display =
            "none";

    }


    /* Hide result */

    if (gameResult) {

        gameResult.classList.add(
            "hidden"
        );

        gameResult.style.display =
            "none";

    }


    /* Show gameplay */

    if (gamePlay) {

        gamePlay.classList.remove(
            "hidden"
        );

        gamePlay.style.display =
            "block";

    }


    updateGameScore();

    showQuestion();

}


/* =========================================================
   SHOW QUESTION
   ========================================================= */

function showQuestion() {

    const question =
        questions[currentQuestion];


    /* Game tamat */

    if (!question) {

        finishGame();

        return;

    }


    answerLocked =
        false;


    const questionNumber =
        currentQuestion + 1;


    const questionText =
        $("questionText");

    const questionNumberDisplay =
        $("questionNumber");

    const questionProgress =
        $("questionProgress");

    const answerContainer =
        $("answerContainer");

    const gameFeedback =
        $("gameFeedback");

    const feedbackTitle =
        $("feedbackTitle");

    const feedbackText =
        $("feedbackText");

    const feedbackTip =
        $("feedbackTip");

    const feedbackPoints =
        $("feedbackPoints");

    const nextQuestionBtn =
        $("nextQuestionBtn");

    const levelBadge =
        $("levelBadge");


    /* Question */

    if (questionText) {

        questionText.textContent =
            question.question;

    }


    /* Question number */

    if (questionNumberDisplay) {

        questionNumberDisplay.textContent =
            questionNumber;

    }


    /* Progress bar */

    if (questionProgress) {

        questionProgress.style.width =
            (
                questionNumber /
                questions.length *
                100
            ) +
            "%";

        questionProgress.textContent =
            "";

    }


    /* Level */

    if (levelBadge) {

        if (questionNumber <= 5) {

            levelBadge.textContent =
                "🟢 LEVEL 1 — EASY";

        }

        else if (questionNumber <= 10) {

            levelBadge.textContent =
                "🟡 LEVEL 2 — MEDIUM";

        }

        else {

            levelBadge.textContent =
                "🔴 LEVEL 3 — CHALLENGE";

        }

    }


    /* Reset feedback */

    if (gameFeedback) {

        gameFeedback.classList.add(
            "hidden"
        );

        gameFeedback.style.display =
            "none";

    }


    if (feedbackTitle) {

        feedbackTitle.textContent =
            "";

    }


    if (feedbackText) {

        feedbackText.textContent =
            "";

    }


    if (feedbackTip) {

        feedbackTip.textContent =
            "";

    }


    if (feedbackPoints) {

        feedbackPoints.textContent =
            "";

    }


    if (nextQuestionBtn) {

        nextQuestionBtn.style.display =
            "none";

    }


    /* Score */

    updateGameScore();


    /* Answer buttons */

    if (answerContainer) {

        answerContainer.innerHTML =
            "";


        question.answers.forEach(
            (answer, index) => {

                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.className =
                    "answer-btn";


                button.textContent =
                    answer;


                button.addEventListener(
                    "click",
                    () => {

                        answerQuestion(
                            index
                        );

                    }
                );


                answerContainer.appendChild(
                    button
                );

            }
        );

    }


    console.log(
        "Soalan:",
        questionNumber,
        "/",
        questions.length
    );

}


/* =========================================================
   ANSWER QUESTION
   ========================================================= */

function answerQuestion(selectedIndex) {

    if (
        answerLocked ||
        !gameStarted
    ) {

        return;

    }


    const question =
        questions[currentQuestion];


    if (!question) {

        return;

    }


    answerLocked =
        true;


    const answerButtons =
        document.querySelectorAll(
            ".answer-btn"
        );


    answerButtons.forEach(
        button => {

            button.disabled =
                true;

        }
    );


    const isCorrect =
        selectedIndex ===
        question.correct;


    const gameFeedback =
        $("gameFeedback");

    const feedbackTitle =
        $("feedbackTitle");

    const feedbackText =
        $("feedbackText");

    const feedbackTip =
        $("feedbackTip");

    const feedbackPoints =
        $("feedbackPoints");

    const nextQuestionBtn =
        $("nextQuestionBtn");


    /* =====================================================
       BETUL
       ===================================================== */

    if (isCorrect) {

        gameScore +=
            10;

        correctAnswers +=
            1;


        if (answerButtons[selectedIndex]) {

            answerButtons[selectedIndex]
                .classList.add(
                    "correct"
                );

        }


        if (feedbackTitle) {

            feedbackTitle.textContent =
                "✅ BETUL!";

        }


        if (feedbackText) {

            feedbackText.textContent =
                "Syabas! Jawapan anda tepat.";

        }


        if (feedbackTip) {

            feedbackTip.textContent =
                question.tip;

        }


        if (feedbackPoints) {

            feedbackPoints.textContent =
                "+10 Eco Points ⭐";

        }


        /* Tambah Eco Points */

        addEcoPoints(10);

    }


    /* =====================================================
       SALAH
       ===================================================== */

    else {

        if (answerButtons[selectedIndex]) {

            answerButtons[selectedIndex]
                .classList.add(
                    "wrong"
                );

        }


        if (answerButtons[question.correct]) {

            answerButtons[question.correct]
                .classList.add(
                    "correct"
                );

        }


        if (feedbackTitle) {

            feedbackTitle.textContent =
                "❌ BELUM TEPAT";

        }


        if (feedbackText) {

            feedbackText.textContent =
                "Jawapan yang betul telah ditunjukkan.";

        }


        if (feedbackTip) {

            feedbackTip.textContent =
                question.tip;

        }


        if (feedbackPoints) {

            feedbackPoints.textContent =
                "+0 Eco Points";

        }

    }


    /* Update score */

    updateGameScore();


    /* Show feedback */

    if (gameFeedback) {

        gameFeedback.classList.remove(
            "hidden"
        );

        gameFeedback.style.display =
            "block";

    }


    /* Last question */

    if (
        currentQuestion ===
        questions.length - 1
    ) {

        if (nextQuestionBtn) {

            nextQuestionBtn.textContent =
                "🏆 Lihat Keputusan";

            nextQuestionBtn.style.display =
                "block";

            nextQuestionBtn.onclick =
                finishGame;

        }

    }

    else {

        if (nextQuestionBtn) {

            nextQuestionBtn.textContent =
                "Seterusnya →";

            nextQuestionBtn.style.display =
                "block";

            nextQuestionBtn.onclick =
                () => {

                    currentQuestion++;

                    showQuestion();

                };

        }

    }

}


/* =========================================================
   UPDATE GAME SCORE
   ========================================================= */

function updateGameScore() {

    const gameScoreDisplay =
        $("gameScore");


    if (gameScoreDisplay) {

        gameScoreDisplay.textContent =
            gameScore;

    }

}


/* =========================================================
   FINISH GAME
   ========================================================= */

function finishGame() {

    console.log(
        "🏆 GAME TAMAT"
    );


    gameStarted =
        false;

    answerLocked =
        true;


    const gamePlay =
        $("gamePlay");

    const gameResult =
        $("gameResult");

    const finalScore =
        $("finalScore");

    const finalRank =
        $("finalRank");

    const resultMessage =
        $("resultMessage");

    const correctCount =
        $("correctCount");


    /* Hide game */

    if (gamePlay) {

        gamePlay.classList.add(
            "hidden"
        );

        gamePlay.style.display =
            "none";

    }


    /* Show result */

    if (gameResult) {

        gameResult.classList.remove(
            "hidden"
        );

        gameResult.style.display =
            "block";

    }


    /* Final score */

    if (finalScore) {

        finalScore.textContent =
            gameScore +
            " / 150";

    }


    /* Correct answers */

    if (correctCount) {

        correctCount.textContent =
            correctAnswers;

    }


    /* Rank */

    if (finalRank) {

        finalRank.textContent =
            getRank(gameScore);

    }


    /* Result message */

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

function restartGame() {

    console.log(
        "🔄 RESTART GAME"
    );


    gameScore =
        0;

    currentQuestion =
        0;

    correctAnswers =
        0;

    gameStarted =
        false;

    answerLocked =
        false;


    const gameResult =
        $("gameResult");

    const gameStart =
        $("gameStart");

    const gamePlay =
        $("gamePlay");


    /* Hide result */

    if (gameResult) {

        gameResult.classList.add(
            "hidden"
        );

        gameResult.style.display =
            "none";

    }


    /* Hide gameplay */

    if (gamePlay) {

        gamePlay.classList.add(
            "hidden"
        );

        gamePlay.style.display =
            "none";

    }


    /* Show start screen */

    if (gameStart) {

        gameStart.classList.remove(
            "hidden"
        );

        gameStart.style.display =
            "block";

    }


    updateGameScore();

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
