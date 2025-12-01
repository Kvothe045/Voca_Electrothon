# 🗣️ VOCA — AI-Powered Soft-Skills Analysis App

![Platform](https://img.shields.io/badge/platform-Android-green)
![Language](https://img.shields.io/badge/language-Kotlin-blue)
![Backend](https://img.shields.io/badge/backend-Django%20REST-orange)
![ML](https://img.shields.io/badge/AI-Multimodal%20Analysis-purple)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Storage-yellow)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

VOCA is a modern Android application that helps users improve their **communication and soft skills** through **multimodal AI analysis**.  
The app records a video response, uploads it to the cloud, triggers backend ML processing, and returns a detailed performance report.

---

## 📚 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Android App Features](#-android-app-features)
- [Backend AI Pipeline](#-backend-ai-pipeline)
- [Directory Structure](#-directory-structure)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Screenshots](#-screenshots)
- [Future Enhancements](#-future-enhancements)
- [Contributing](#-contributing)
- [License](#-license)
- [Credits](#-credits)

---

## 📸 Overview

VOCA evaluates:

- Facial expressions  
- Eye contact  
- Gestures and hand movement  
- Body posture  
- Speech rate and clarity  
- Pauses, pitch, and tone  
- Grammar, relevance, and content quality  

The goal is to provide **real interview-style feedback** on each recorded response.

---

## 🏗️ Architecture

### 🔹 High-Level System Diagram

Android App (Jetpack Compose + MVVM)
|
|-- Record Video (CameraX)
|-- Preview Video (ExoPlayer)
|-- Upload to Firebase Storage
|
▼
Django Backend (REST API)
|-- Downloads video from Firebase
|-- Audio Analysis (Librosa)
|-- Video Analysis (OpenCV / MediaPipe)
|-- Content Analysis (LLM / Gemini)
|-- Generates final JSON report
|
▼
Android App (Result Screen)
|-- Polls every 2 sec via /result?userID&reportID
|-- Parses and displays analytics dashboard

---

## 📱 Android App Features

### 🎥 CameraX Video Recording

- Front/back camera switching  
- Pause/Resume recording  
- Timer overlay  
- MP4 saved in secure cache  

### ▶️ Preview Screen

- ExoPlayer playback  
- Option to download video locally  
- Upload to Firebase Storage  

### ☁️ Upload & Metadata Transfer

After upload, Firebase generates a **download URL**, and the Android app sends metadata to the backend:
{
"userID": "uid123",
"videoID": "Education_20250130",
"topicName": "Education",
"videoLink": "https://firebase-storage-url",
"reportID": "abc123"
}

### 🔁 Polling for Results

- App polls backend every **2 seconds** on `/result?userID=&reportID=`  
- Polling stops automatically when `status = "done"`  
- Final JSON is parsed and rendered in the dashboard screen  

### 📊 Result Dashboard (Jetpack Compose)

- Video analysis cards  
- Audio analysis cards  
- Content analysis (LLM feedback)  
- Circular progress indicators and confidence metrics  
- Expandable sections and chart-like components  

---

## 🤖 Backend AI Pipeline

VOCA’s backend performs three independent analyses, then fuses results into a single report.

### 🎥 Video Analysis (OpenCV / MediaPipe)

- Facial expression detection  
- Eye contact estimation  
- Gesture and hand movement  
- Body posture (head tilt, spine angle)  
- Confidence indicators  

### 🔊 Audio Analysis (Librosa)

- MFCC feature extraction  
- Speech rate (words per minute)  
- Pauses and silence detection  
- Tone, pitch, and energy  
- Clarity and articulation  

### 📝 Content Analysis (LLM / Gemini)

- Grammar corrections  
- Vocabulary quality scoring  
- Topic relevance percentage  
- Strengths and weaknesses summary  
- Final structured feedback report  

### 🔄 Processing Flow

Receive Metadata
|
Queue Task (Celery)
|
Download MP4 from Firebase
|
Extract Audio + Frames
|
Audio Model ---> audio_output
Vision Model ---> video_output
LLM Model ---> gemini_output
|
Fuse Results
|
Store in DB (userID + reportID)

text

---

## 📁 Directory Structure (Android)

app/
├── activities/
│ ├── CameraActivity.kt
│ ├── PreviewActivity.kt
│ └── ResultActivity.kt
├── viewmodel/
│ └── RegisterViewModel.kt
├── network/
│ ├── ApiService.kt
│ ├── VideoAnalysisRequest.kt
│ └── VideoAnalysisResponse.kt
├── ui/
│ ├── theme/
│ ├── screens/
│ └── components/
├── utils/
└── ...

text

---

## ⚙️ Tech Stack

### Android

- Kotlin  
- Jetpack Compose  
- CameraX  
- ExoPlayer  
- Firebase Auth  
- Firebase Storage  
- Retrofit + OkHttp  
- MVVM Architecture  
- Coroutines  

### Backend

- Django REST Framework  
- Python  
- Celery + Redis  
- OpenCV  
- MediaPipe  
- Librosa  
- Whisper (optional STT)  
- Gemini / LLM for content evaluation  
- PostgreSQL  

---

## 🚀 Getting Started

### 1. Clone the Repository

git clone https://github.com/yourusername/VOCA.git
cd VOCA/app

text

### 2. Android: Firebase Setup

1. Create a Firebase project and enable:
   - Email/Password or preferred Auth provider  
   - Cloud Storage  

2. Download the `google-services.json` file and place it inside:

app/src/main/

text

### 3. Configure Backend URL

Update your backend base URL inside:

- `PreviewActivity.kt`  
- `ResultActivity.kt`  

private const val BASE_URL = "https://your-backend-url.com/"

text

### 4. Run the Android App

- Open the project in **Android Studio Electric Eel or newer**  
- Sync Gradle and build the project  
- Run on a physical device or emulator with camera support  

---

## 🖼️ Screenshots

_Add your screenshots here once available._

![Recording Screen](assets/screenshots/recording.pngassets/screenshots/previewassets/screenshots/result-time analysis using WebSockets

    On-device ML for faster feedback

    User history dashboard and analytics

    Personalized improvement recommendations

    Dark mode and micro-animations

    Multi-language support

🤝 Contributing

Contributions are welcome!

    Fork the repository

    Create a feature branch (feature/my-awesome-feature)

    Commit your changes with clear messages

    Open a Pull Request with a brief description and screenshots if UI-related

For major changes, please open an issue first to discuss what you would like to change.

