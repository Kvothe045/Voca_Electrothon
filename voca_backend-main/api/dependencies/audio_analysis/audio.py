import moviepy.editor as mp
from pydub import AudioSegment
import speech_recognition as sr
import parselmouth
import numpy as np
from nltk.sentiment import SentimentIntensityAnalyzer
import plotly.graph_objects as go
import librosa
from python_speech_features import mfcc, delta
from speech_recognition import AudioData
import io
import wave

#added librosa, wave, python_speech_features, io, wave 
# nltk.download('vader_lexicon')


def extract_audio_from_video(video_path, output_audio_path) -> str:
    """
    Extracts audio from a video file and saves it as a WAV file.

    Args:
        video_path (str): The path to the video file.
        output_audio_path (str): The path to save the extracted audio file.

    Returns:
        str: The path to the extracted audio file.
    """
    video_clip = mp.VideoFileClip(video_path)
    audio_clip = video_clip.audio
    audio_clip.write_audiofile(output_audio_path, codec='pcm_s16le')
    audio_clip.close()
    video_clip.close()
    return output_audio_path

def speech_to_text(audio_path) -> str:
    """
    Converts speech in an audio file to text using Google Speech Recognition.

    Args:
        audio_path (str): The path to the audio file.

    Returns:
        str: The text transcribed from the audio file.
    """
    recognizer = sr.Recognizer()
    with sr.AudioFile(audio_path) as source:
        audio_data = recognizer.record(source)
        try:
            text = recognizer.recognize_google(audio_data)
            return text
        except sr.UnknownValueError:
            print("Speech recognition could not understand audio")
        except sr.RequestError as e:
            print(f"Could not request results from Google Speech Recognition service; {e}")

def calculate_speech_rate(text, audio_path) -> int:
    """
    Calculates the speech rate (words per minute) based on the text and audio duration.

    Args:
        text (str): The text transcribed from the audio.
        audio_path (str): The path to the audio file.

    Returns:
        int: The speech rate in words per minute.
    """
    audio = AudioSegment.from_file(audio_path)
    duration_in_seconds = audio.duration_seconds
    words = len(text.split())
    words_per_minute = words / (duration_in_seconds / 60)
    return words_per_minute

def analyse(audio_path, text, save_dir) -> dict:
    """
    Analyzes various aspects of the audio, including speech rate, fluency, pauses, pitch and tone variations,
    word emphasis, tone, pace, clarity, and volume and energy. Also, plots the pitch and tone variations,
    as well as the volume and energy variations.

    Args:
        audio_path (str): The path to the audio file.
        text (str): The text transcribed from the audio.
    Returns:
        dict: A dict containing all the results
    """

    print("Starting audio analysis")
    if text:
        recognizer = sr.Recognizer()
            
        speech_rate = calculate_speech_rate(text, audio_path)
        fluency = analyze_fluency(text)
        pauses = detect_pauses(audio_path, threshold=20, duration_threshold=0.5)
        clarity = analyze_clarity(audio_path) #added clarity
        pitch_tone_variations = analyze_pitch_and_tone(audio_path)
        word_emphasis = analyze_word_emphasis(text)
        tone_analysis = analyze_tone(text)
        pace_analysis = analyze_pace(audio_path, text)
        volume_energy_analysis = analyze_volume_energy(audio_path)
        # pitch_and_tone = pitch_and_tone_graph(audio_path, save_dir)
        # volume_energy =   volume_energy_graph(audio_path, save_dir)
        audio_results = {
            "Speech Rate (words per minute)": "{:.2f}".format(speech_rate),
            "Fluency": fluency,
            "Pauses": pauses,
            "Pitch and Tone Variations": pitch_tone_variations,
            "Word Emphasis": word_emphasis,
            "Tone Analysis": tone_analysis,
            "Pace Analysis": pace_analysis,
            "Clarity Analysis": clarity, #added clarity
            "Volume and Energy Analysis": volume_energy_analysis,
        }
        print("Finishing video analysis")
        return audio_results

def analyze_fluency(text) -> str:
    """
    Analyzes the fluency of speech based on the presence of certain keywords related to stuttering or hesitation.

    Args:
        text (str): The text transcribed from the audio.

    Returns:
        str: "Fluent" if no stuttering or hesitation keywords are found, "Not Fluent" otherwise.
    """
    stutter_keywords = ["stutter", "stammer", "hesitate"]
    return "Fluent" if not any(keyword in text.lower() for keyword in stutter_keywords) else "Not Fluent"

#modified pause detection
def detect_pauses(audio_path, threshold=20, duration_threshold=0.5):
    """
    Detect the duration of the longest silence interval in an audio file.

    Args:
    - audio_path (str): Path to the audio file.
    - threshold (float): Threshold in decibels below which amplitudes are considered as silence. Default is 20 dB.
    - duration_threshold (float): Minimum duration (in seconds) of a silence interval to be considered. Default is 0.5.

    Returns:
    - Float: Duration of the longest silence interval in seconds.
    """
    audio_array, sr = librosa.load(audio_path, sr=None, mono=True)

    # Detect silent intervals
    silent_intervals = librosa.effects.split(y=audio_array, top_db=threshold, frame_length=2048, hop_length=512)
    longest_silence_duration = 0
    for interval in silent_intervals:
        silence_start, silence_end = interval
        silence_duration = silence_end - silence_start
        if silence_duration > longest_silence_duration:
            longest_silence_duration = silence_duration
    # Convert duration to seconds
    longest_silence_duration_sec = round(longest_silence_duration / sr, 3)+1

    return longest_silence_duration_sec

#added clarity analysis
def audio_data(audio_path):
    recognizer = sr.Recognizer()
    with sr.AudioFile(audio_path) as source:
        audio_data = recognizer.record(source)

def analyze_clarity(audio_data) -> str:
    """
    Analyzes the clarity of speech using audio features.

    Args:
        audio_data: Audio data as a numpy array or AudioData object.

    Returns:
        str: "High clarity" if the clarity is high,
             "Moderate clarity" if the clarity is moderate,
             "Low clarity" if the clarity is low,
             "Unable to analyze clarity" if an error occurs during analysis.
    """

    try:
        # Default sample rate
        sample_rate = 44100
        
        if isinstance(audio_data, np.ndarray):
            # Extract MFCC features
            mfcc_features = mfcc(audio_data, samplerate=sample_rate, winlen=0.025, winstep=0.01, numcep=13, nfilt=26, nfft=2048)  # Increased NFFT
            delta_mfcc = delta(mfcc_features, 2)

            # Calculate mean values of MFCC and delta MFCC features
            mean_mfcc = np.mean(mfcc_features, axis=0)
            mean_delta_mfcc = np.mean(delta_mfcc, axis=0)

            # Apply heuristics to determine clarity
            if np.mean(mean_mfcc[:4]) > -20 and np.mean(mean_delta_mfcc[:4]) > -0.5:
                return "High clarity"
            elif np.mean(mean_mfcc[:4]) > -25 and np.mean(mean_delta_mfcc[:4]) > -1.0:
                return "Moderate clarity"
            else:
                return "Low clarity"
        elif isinstance(audio_data, AudioData):
            # Convert AudioData to numpy array
            with io.BytesIO() as wav_file:
                wav_file.write(audio_data.get_wav_data())
                wav_file.seek(0)
                with wave.open(wav_file, 'rb') as wf:
                    n_channels = wf.getnchannels()
                    sample_width = wf.getsampwidth()
                    frame_rate = wf.getframerate()
                    n_frames = wf.getnframes()
                    audio_array = np.frombuffer(wf.readframes(n_frames), dtype=np.int16)

            # Extract MFCC features
            mfcc_features = mfcc(audio_array, samplerate=sample_rate, winlen=0.025, winstep=0.01, numcep=13, nfilt=26, nfft=2048)  # Increased NFFT
            delta_mfcc = delta(mfcc_features, 2)

            # Calculate mean values of MFCC and delta MFCC features
            mean_mfcc = np.mean(mfcc_features, axis=0)
            mean_delta_mfcc = np.mean(delta_mfcc, axis=0)

            # Apply heuristics to determine clarity
            if np.mean(mean_mfcc[:4]) > -20 and np.mean(mean_delta_mfcc[:4]) > -0.5:
                return "High clarity"
            elif np.mean(mean_mfcc[:4]) > -25 and np.mean(mean_delta_mfcc[:4]) > -1.0:
                return "Moderate clarity"
            else:
                return "Low clarity"
        else:
            raise ValueError("Unsupported audio_data type")

    except Exception as e:
        print(f"Error analyzing clarity: {e}")
        return "Unable to analyze clarity"



def analyze_pitch_and_tone(audio_path) -> str:
    """
    Analyzes the pitch and tone variations in the audio using Praat.

    Args:
        audio_path (str): The path to the audio file.

    Returns:
        str: "High variations" if the pitch variation is greater than 50, "Low variations" otherwise.
    """
    sound = parselmouth.Sound(audio_path)
    pitch = sound.to_pitch()
    pitch_values = pitch.selected_array['frequency']
    pitch_variation = np.std(pitch_values)
    if pitch_variation > 50:
        return "High variations"
    else:
        return "Low variations"

def analyze_word_emphasis(text) -> str:
    """
    Analyzes the word emphasis based on the presence of certain keywords related to importance or significance.

    Args:
        text (str): The text transcribed from the audio.

    Returns:
        str: "Effective emphasis" if emphasis keywords are found, "Lacks emphasis" otherwise.
    """
    emphasis_keywords = ["important", "crucial", "significant"]
    return "Effective emphasis" if any(keyword in text.lower() for keyword in emphasis_keywords) else "Lacks emphasis"

def analyze_tone(text) -> str:
    """
    Analyzes the overall tone of the text using sentiment analysis.

    Args:
        text (str): The text transcribed from the audio.

    Returns:
        str: "Positive tone" if the sentiment score is greater than or equal to 0.5,
             "Negative tone" if the sentiment score is less than or equal to -0.5,
             "Neutral tone" otherwise.
    """
    sia = SentimentIntensityAnalyzer()
    scores = sia.polarity_scores(text)
    if scores['compound'] >= 0.5:
        return "Positive tone"
    elif scores['compound'] <= -0.5:
        return "Negative tone"
    else:
        return "Neutral tone"

def analyze_pace(audio_path, text) -> str:
    """
    Analyzes the pace of speech based on the number of words and audio duration.

    Args:
        audio_path (str): The path to the audio file.
        text (str): The text transcribed from the audio.

    Returns:
        str: "Fast pace" if the pace is greater than 2.5 words per second,
             "Slow pace" if the pace is less than 1.5 words per second,
             "Moderate pace" otherwise.
    """
    audio = AudioSegment.from_file(audio_path)
    duration_in_seconds = audio.duration_seconds
    num_words = len(text.split())
    pace = num_words / duration_in_seconds
    if pace > 2.5:
        return "Fast pace"
    elif pace < 1.5:
        return "Slow pace"
    else:
        return "Moderate pace"

def analyze_clarity(audio_data) -> str:
    """
    Analyzes the clarity of speech using Google Speech Recognition confidence scores.

    Args:
        audio_data (AudioData): The audio data from the audio file.

    Returns:
        str: "High clarity" if the confidence score is greater than 0.8,
             "Moderate clarity" if the confidence score is greater than 0.6,
             "Low clarity" if the confidence score is less than or equal to 0.6,
             "Unable to analyze clarity" if an error occurs during analysis.
    """
    recognizer = sr.Recognizer()
    try:
        result = recognizer.recognize_google(audio_data, show_all=True)
        if result:
            clarity_score = result.get("alternative")[0].get("confidence")
            if clarity_score > 0.8:
                return "High clarity"
            elif clarity_score > 0.6:
                return "Moderate clarity"
            else:
                return "Low clarity"
    except Exception as e:
        print(f"Error analyzing clarity: {e}")
        return "Unable to analyze clarity"

def analyze_volume_energy(audio_path) -> str:
    """
    Analyzes the volume and energy of the audio based on the RMS (Root Mean Square) values.

    Args:
        audio_path (str): The path to the audio file.

    Returns:
        str: "High volume and energy" if the average RMS value is greater than -10,
             "Moderate volume and energy" if the average RMS value is greater than -20,
             "Low volume and energy" otherwise.
    """
    audio = AudioSegment.from_file(audio_path, format="wav")
    rms_values = [chunk.rms for chunk in audio[::100]]
    avg_rms = sum(rms_values) / len(rms_values)
    if avg_rms > -10:
        return "High volume and energy"
    elif avg_rms > -20:
        return "Moderate volume and energy"
    else:
        return "Low volume and energy"

def pitch_and_tone_graph(audio_path, save_dir):
    """
    Plots the pitch and tone variations over time.

    Args:
        audio_path (str): The path to the audio file.
    Returns:
        str: Path to the saved PNG file containing the graph.
    """
    sound = parselmouth.Sound(audio_path)
    pitch = sound.to_pitch()
    pitch_values = pitch.selected_array['frequency']
    time_values = pitch.xs()

    # Create plot
    tone_fig = go.Figure()
    tone_fig.add_trace(go.Scatter(x=time_values, y=pitch_values, mode='lines', name='Pitch', line=dict(color='#ba451a')))
    tone_fig.update_layout(title='Pitch Variation Over Time', xaxis_title='Time (s)', yaxis_title='Pitch (Hz)', plot_bgcolor='#ffeed1')

    # Save plot as PNG
    pitch_png_path = f"{save_dir}/pitch_variation.png"
    tone_fig.write_image(pitch_png_path)

    return pitch_png_path

def volume_energy_graph(audio_path, save_dir):
    """
    Plots the volume and energy variations over time.

    Args:
        audio_path (str): The path to the audio file.
    Returns:
        str: Path to the saved PNG file containing the graph.
    """
    audio = AudioSegment.from_file(audio_path, format="wav")
    rms_values = [chunk.rms for chunk in audio[::100]]
    time_values = np.linspace(0, audio.duration_seconds, len(rms_values))

    # Create plot
    volume_fig = go.Figure()
    volume_fig.add_trace(go.Bar(x=time_values, y=rms_values, name='Volume', marker_color='chocolate', opacity=1))
    volume_fig.update_layout(title='Volume Variation', xaxis_title='Time (s)', yaxis_title='Volume (RMS)', plot_bgcolor='#ffeed1')

    # Save plot as PNG
    vol_png_path =  f"{save_dir}/volume_variation.png"
    volume_fig.write_image(vol_png_path)

    return vol_png_path

if __name__ == "__main__":
    # Example usage
    video_path = "praneel.mp4"
    output_audio_path = "output_audio.wav"

    # Extract audio from video
    extract_audio_from_video(video_path, output_audio_path)

    # Analyze audio features
    analyse(output_audio_path)