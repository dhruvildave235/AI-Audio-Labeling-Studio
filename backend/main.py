# backend/main.py

from fastapi import FastAPI, UploadFile, File, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

import pandas as pd
import shutil
import os
from datetime import datetime

app = FastAPI()

UPLOAD_FOLDER = "uploads"
EXPORT_FOLDER = "exports"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(EXPORT_FOLDER, exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")

transcript_words = []
label_data = []

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="index.html"
    )

from moviepy.video.io.VideoFileClip import VideoFileClip
import uuid

@app.post("/upload")
async def upload_files(
    media: UploadFile = File(...),
    transcript: UploadFile = File(...)
):
    global transcript_words

    try:

        media_path = os.path.join(UPLOAD_FOLDER, media.filename)
        transcript_path = os.path.join(UPLOAD_FOLDER, transcript.filename)

        with open(media_path, "wb") as buffer:
            shutil.copyfileobj(media.file, buffer)

        with open(transcript_path, "wb") as buffer:
            shutil.copyfileobj(transcript.file, buffer)

        print("FILES SAVED")

        ext = media.filename.split(".")[-1].lower()

        audio_filename = f"{uuid.uuid4()}.wav"
        audio_path = os.path.join(UPLOAD_FOLDER, audio_filename)

        if ext in ["mp4", "mov", "avi", "mkv"]:

            print("CONVERTING VIDEO TO AUDIO")

            clip = VideoFileClip(media_path)

            clip.audio.write_audiofile(audio_path)

        else:
            audio_path = media_path

        print("AUDIO READY")

        df = pd.read_excel(transcript_path)

        words = []

        for col in df.columns:
            for value in df[col].dropna():
                words.extend(str(value).split())

        transcript_words = words

        print("WORDS LOADED")

        return {
            "media_url": f"/uploads/{os.path.basename(audio_path)}",
            "words": transcript_words
        }

    except Exception as e:

        print("UPLOAD ERROR:", str(e))

        return {
            "error": str(e)
        }

@app.post("/save_label")
async def save_label(data: dict):

    global label_data

    word = data["word"]
    start = data["start"]
    end = data["end"]
    start_frame = data["start_frame"]
    end_frame = data["end_frame"]

    label_data.append({
        "Word": word,
        "Start Time": start,
        "End Time": end,
        "Start Frame": start_frame,
        "End Frame": end_frame
    })

    return {"message": "Saved"}

@app.get("/export")
async def export_excel():

    global label_data

    df = pd.DataFrame(label_data)

    export_path = os.path.join(
        EXPORT_FOLDER,
        f"labels_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    )

    df.to_excel(export_path, index=False)

    return FileResponse(
        export_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=os.path.basename(export_path)
    )