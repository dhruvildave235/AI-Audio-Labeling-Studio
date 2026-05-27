
import whisperx

def process_alignment(audio_path):
    model = whisperx.load_model("small", device="cpu")

    result = model.transcribe(audio_path)

    words = []

    for seg in result["segments"]:
        for w in seg.get("words", []):
            words.append({
                "word": w["word"],
                "start": round(w["start"], 3),
                "end": round(w["end"], 3)
            })

    return words
