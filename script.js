const URL = "./";


let model;

let video;

let stream;

let devices = [];

let currentDeviceId = null;


let lastLabel = "";

let stableLabel = "";

let stableCount = 0;



let recycleSound = new Audio("recycle.mp3");

let notRecycleSound = new Audio("not_recycle.mp3");




// ================= START AI =================

async function init(){


    document.getElementById("statusText").innerHTML =
    "Loading AI Model...";


    const modelURL = URL + "model.json";

    const metadataURL = URL + "metadata.json";



    model = await tmImage.load(
        modelURL,
        metadataURL
    );


    document.getElementById("statusText").innerHTML =
    "🟡 Scanning...";


    await getCameras();


    await startCamera();


    loop();


}





// ================= CAMERA LIST =================


async function getCameras(){


    const allDevices =
    await navigator.mediaDevices.enumerateDevices();


    devices =
    allDevices.filter(
        d => d.kind === "videoinput"
    );


}





// ================= START CAMERA =================


async function startCamera(deviceId=null){



    if(stream){

        stream.getTracks()
        .forEach(track=>track.stop());

    }



    let constraints = {


        video:

        deviceId ?

        {
            deviceId:
            {
                exact:deviceId
            }
        }

        :

        {
            facingMode:"environment"
        }

    };





    stream =
    await navigator.mediaDevices.getUserMedia(
        constraints
    );



    video =
    document.createElement("video");


    video.autoplay=true;

    video.playsInline=true;


    video.srcObject=stream;



    document
    .getElementById("webcam-container")
    .innerHTML="";



    document
    .getElementById("webcam-container")
    .appendChild(video);



}




// ================= SWITCH CAMERA =================


async function switchCamera(){


    if(devices.length===0){

        await getCameras();

    }


    let index =
    devices.findIndex(
        d=>d.deviceId===currentDeviceId
    );


    let next =
    (index+1)%devices.length;


    currentDeviceId =
    devices[next].deviceId;



    await startCamera(currentDeviceId);


}






// ================= AI LOOP =================


function loop(){


    requestAnimationFrame(loop);


    predict();


}






// ================= PREDICTION =================


async function predict(){



    if(!video || video.readyState!==4)
    return;



    let prediction =
    await model.predict(video);




    let highest =
    prediction.reduce(
        (a,b)=>
        a.probability>b.probability?a:b
    );




    let percent =
    (highest.probability*100).toFixed(1);





    // LOCK SYSTEM

    if(highest.className===stableLabel){


        stableCount++;


    }

    else{


        stableLabel =
        highest.className;


        stableCount=0;


    }





    if(stableCount>8){


        showResult(
            highest.className,
            percent
        );


    }



}








// ================= DISPLAY RESULT =================


function showResult(label,percent){



    let name=label;


    let icon="♻️";



    if(label.toLowerCase().includes("plastic")){


        name="Plastic";

        icon="🧴";


    }



    else if(label.toLowerCase().includes("kertas")
    ||
    label.toLowerCase().includes("paper")){


        name="Paper";

        icon="📄";


    }




    document
    .getElementById("wasteIcon")
    .innerHTML=icon;



    document
    .getElementById("result")
    .innerHTML=
    name+" Detected";



    document
    .getElementById("confidence")
    .innerHTML=
    "Confidence: "+percent+"%";



    document
    .getElementById("confidenceBar")
    .style.width=
    percent+"%";





    document
    .getElementById("statusIcon")
    .innerHTML="🟢";


    document
    .getElementById("statusText")
    .innerHTML=
    name+" Detected";





    if(name!==lastLabel){


        if(name==="Plastic"
        ||
        name==="Paper"){


            recycleSound.play()
            .catch(()=>{});


        }


        lastLabel=name;


    }



}
