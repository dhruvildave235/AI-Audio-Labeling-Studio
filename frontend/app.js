
const wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: '#4ade80',
    progressColor: '#22c55e',
    height: 120
});

async function uploadFile() {
    const fileInput = document.getElementById('audioFile');
    const file = fileInput.files[0];

    const formData = new FormData();
    formData.append('video', file);

    wavesurfer.load(URL.createObjectURL(file));

    const response = await fetch('http://127.0.0.1:8000/upload', {
        method: 'POST',
        body: formData
    });

    const result = await response.json();

    renderTranscript(result.data);
}

function renderTranscript(words) {
    const div = document.getElementById('transcript');

    div.innerHTML = '';

    words.forEach(word => {
        const el = document.createElement('span');

        el.className = 'word';

        el.innerText = `${word.word} (${word.start} - ${word.end})`;

        el.onclick = () => {
            wavesurfer.seekTo(word.start / wavesurfer.getDuration());
        };

        div.appendChild(el);
    });
}
