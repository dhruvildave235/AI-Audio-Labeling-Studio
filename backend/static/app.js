
let selectedWord = "";
let startTime = 0;
let endTime = 0;
let currentRegion = null;

const regionsPlugin = WaveSurfer.Regions.create();

const wavesurfer = WaveSurfer.create({
    container: '#waveform',

    waveColor: '#00ffff',
    progressColor: '#00ff99',
    cursorColor: 'red',

    height: 250,

    minPxPerSec: 100,

    plugins: [regionsPlugin]
});


// =======================
// UPLOAD FILES
// =======================

async function uploadFiles(){

    const media = document.getElementById("mediaFile").files[0];
    const excel = document.getElementById("excelFile").files[0];

    let formData = new FormData();

    formData.append("media", media);
    formData.append("transcript", excel);

    const response = await fetch("/upload", {
        method: "POST",
        body: formData
    });

    const data = await response.json();

    console.log(data);

    wavesurfer.load(data.media_url);

    const wordList = document.getElementById("wordList");

    wordList.innerHTML = "";

    data.words.forEach(word => {

        const div = document.createElement("div");

        div.className = "word";

        div.innerText = word;

        div.onclick = () => selectWord(div, word);

        wordList.appendChild(div);
    });
}


// =======================
// SELECT WORD
// =======================

function selectWord(div, word){

    document.querySelectorAll(".word").forEach(w => {
        w.classList.remove("selected");
    });

    div.classList.add("selected");

    selectedWord = word;

    alert("Now drag waveform for word: " + word);
}


// =======================
// ENABLE REGION DRAG
// =======================

wavesurfer.on('ready', () => {

    regionsPlugin.enableDragSelection({
        color: 'rgba(0,255,255,0.3)'
    });

});


// =======================
// REGION CREATED
// =======================

regionsPlugin.on('region-created', (region) => {

    // remove old regions
    regionsPlugin.getRegions().forEach(r => {

        if(r.id !== region.id){
            r.remove();
        }

    });

    currentRegion = region;

    startTime = region.start;
    endTime = region.end;

    // update displayed time
    document.getElementById("startTime").innerText =
        formatTime(startTime);

    document.getElementById("endTime").innerText =
        formatTime(endTime);

});

// ADD THIS HERE ↓↓↓

regionsPlugin.on('region-clicked', (region, e) => {

    e.stopPropagation();

    currentRegion = region;

});


// =======================
// PLAY
// =======================

function playAudio(){

    if(currentRegion){

        wavesurfer.play(
            currentRegion.start,
            currentRegion.end
        );

    }else{

        alert("Please select waveform region");

    }
}


// =======================
// PAUSE
// =======================

function pauseAudio(){
    wavesurfer.pause();
}


// =======================
// SAVE LABEL
// =======================

async function saveLabel(){

    if(selectedWord === ""){
        alert("Please select word");
        return;
    }

    if(currentRegion === null){
        alert("Please select waveform region");
        return;
    }

    const fps = 30;

    const data = {

        word: selectedWord,

        start: formatTime(startTime),

        end: formatTime(endTime),

        start_frame: Math.floor(startTime * fps),

        end_frame: Math.floor(endTime * fps)
    };

    await fetch("/save_label", {

        method: "POST",

        headers: {
            "Content-Type":"application/json"
        },

        body: JSON.stringify(data)
    });

    alert("Label Saved");
}


// =======================
// EXPORT
// =======================

function exportExcel(){
    window.location.href = "/export";
}


// =======================
// FORMAT TIME
// =======================

function formatTime(seconds){

    let hrs = Math.floor(seconds / 3600);

    let mins = Math.floor((seconds % 3600) / 60);

    let secs = (seconds % 60).toFixed(3);

    hrs = String(hrs).padStart(2, '0');
    mins = String(mins).padStart(2, '0');
    secs = String(secs).padStart(6, '0');

    return `${hrs}:${mins}:${secs}`;
}