from celery import shared_task
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib.pagesizes import letter
import time
import textwrap
import os
import shutil
import threading
from pathlib import Path
import logging
import json

from api.dependencies.geminiAPI import gemini
from api.dependencies.audio_analysis import audio
from api.dependencies.video_analysis import video
from api.dependencies.respond import main as respond

INPUT_ROOT = Path("data/video_input")
OUTPUT_ROOT = Path("data/video_output")
JSON_LOC = Path("data/json_files")

logging.basicConfig(
    level=logging.INFO,  # Set the logging level
    format='%(asctime)s - %(levelname)s - %(message)s',  # Define the log message format
    filename='logs/app.log',  # Specify the log file
    filemode='a'  # Set the file mode (append)
)

def split_results(results: dict):
    return (
        results.get("video_output"),
        results.get("audio_output"),
        results.get("gemini_output"),
    )  # splits the result dict into video, audio and gemini


def render_markdown(c, markdown_text, x_start, y_start, max_width, font_size):
    lines = markdown_text.split("\n")
    y = y_start
    skip_main_heading = False
    for line in lines:
        line = line.lstrip("*").strip()
        if line.startswith("---"):
            continue
        elif (
            line.startswith("Strengths")
            or line.startswith("Weaknesses")
            or line.startswith("Repetition")
            or line.startswith("Summary")
            or line.startswith("Grammatical Errors")
            or line.startswith("Relevance")
            or line.startswith("Vocabulary")
            or line.startswith("Summary")
            or line.startswith("Grade")
            or line.startswith("Overall Confidence Report")
        ):
            c.setFont("Helvetica-Bold", font_size)
            c.drawString(x_start, y, "• " + line)
            y -= font_size * 1.2
            y -= font_size * 0.3
        else:
            wrapped_lines = textwrap.wrap(line, width=80)
            for wrapped_line in wrapped_lines:
                c.setFont("Helvetica", font_size)
                c.drawString(x_start, y, wrapped_line)
                y -= font_size * 1.2
            y -= font_size * 0.3


@shared_task
def generate_pdf(results: dict, name: str, date: str, activity: str, directory: str, id: str, pitch_tone_location: str, energy_location: str):
    mypath = f"{directory}{id}.pdf"
    c = canvas.Canvas(mypath, pagesize=letter)
    c.translate(inch, inch)

    # Split the results into video, audio, and gemini dictionaries
    video, audio, gemini = split_results(results)

    # ------------------------------------------------------ Page 1 Content ------------------------------------------------------
    # Draw colored box
    c.setFillColor("grey")
    c.setStrokeColor("black")
    c.roundRect(-0.8 * inch, 7.6 * inch, 2 * inch, 0.4 * inch, 5, fill=1)

    # Add heading text
    c.setFillColor("black")
    c.setFont("Helvetica-Bold", 14)
    c.drawString(-0.65 * inch, 7.73 * inch, "Content Analysis :")

    # Main content
    c.setFillColorRGB(89, 89, 87)
    c.setFillColor("black")
    c.setFont("Helvetica", 23)
    c.drawString(1.55 * inch, 8.5 * inch, "Progression Report")
    c.setFillColor("darkblue")
    c.setFont("Helvetica", 12)
    c.drawString(5.45 * inch, 9.6 * inch, f"Name: {name}")
    c.drawString(5.45 * inch, 9.35 * inch, f"Date: {date}")
    c.drawString(5.45 * inch, 9.1 * inch, f"Activity: {activity}")
    c.setStrokeColor("black")
    c.setLineWidth(1.3)
    c.line(-0.55 * inch, 8.35 * inch, 7 * inch, 8.35 * inch)

    # Add Gemini content
    x_start = -0.6 * inch
    y_start = 7 * inch
    max_width = 7 * inch
    font_size = 12
    render_markdown(c, gemini, x_start, y_start, max_width, font_size)

    c.showPage()

    # Additional content on the second page
    c.translate(inch, inch)

    # Draw colored box
    c.setFillColor("grey")
    c.setStrokeColor("black")
    c.roundRect(-0.8 * inch, 7.6 * inch, 2 * inch, 0.4 * inch, 5, fill=1)

    # Add heading text
    c.setFillColor("black")
    c.setFont("Helvetica-Bold", 14)
    c.drawString(-0.65 * inch, 7.73 * inch, "Audio Analysis :")

    # Initialize table data
    table_data = [["Metric", "Value"]]

    # Populate table data and extract overall confidence report for video output
    for key, value in audio.items():
        table_data.append([key, str(value)])

    # Draw table for video output only
    col_width = 3.5 * inch
    row_height = 0.4 * inch
    x_start = -0.4 * inch
    y_start = 4 * inch
    for i, row in enumerate(table_data):
        for j, cell in enumerate(row):
            c.rect(x_start + j * col_width, y_start - i * row_height, col_width, row_height)
            c.drawString(x_start + j * col_width + 5, y_start - i * row_height + 10, cell)

    pitch_graph_path = pitch_tone_location
    c.drawImage(pitch_graph_path, -0.2 * inch, 5 * inch, width=2.55 * inch, height=2.25 * inch)
    c.drawString(0.5 * inch, 4.8 * inch, "Pitch & Tone")
    volume_graph_path = energy_location
    c.drawImage(volume_graph_path, 3.9 * inch, 5 * inch, width=2.55 * inch, height=2.25 * inch)
    c.drawString(4.7 * inch, 4.8 * inch, "Volume & Energy")

    # Add other details
    c.setFillColorRGB(89, 89, 87)
    c.setFillColor("black")
    c.setFont("Helvetica", 23)
    c.drawString(1.55 * inch, 8.5 * inch, "Progression Report")
    c.setFillColor("darkblue")
    c.setFont("Helvetica", 12)
    c.drawString(5.45 * inch, 9.6 * inch, f"Name: {name}")
    c.drawString(5.45 * inch, 9.35 * inch, f"Date: {date}")
    c.drawString(5.45 * inch, 9.1 * inch, f"Activity: {activity}")
    c.setStrokeColor("black")
    c.setLineWidth(1.3)
    c.line(-0.55 * inch, 8.35 * inch, 7 * inch, 8.35 * inch)
    c.drawImage(energy_location, -1 * inch, 9.2 * inch)
    c.setFillColor("black")
    c.setFont("Helvetica", 10)
    c.drawString(2.7 * inch, -0.7 * inch, "Page-2")

    # Additional content on the third page
    c.showPage()
    c.translate(inch, inch)

    c.setFillColor("grey")
    c.setStrokeColor("black")
    c.roundRect(-0.8 * inch, 7.6 * inch, 2 * inch, 0.4 * inch, 5, fill=1)

    # Add heading text
    c.setFillColor("black")
    c.setFont("Helvetica-Bold", 14)
    c.drawString(-0.65 * inch, 7.73 * inch, "Video Analysis :")

    c.setFillColorRGB(89, 89, 87)
    c.setFillColor("black")
    c.setFont("Helvetica", 23)
    c.drawString(1.55 * inch, 8.5 * inch, "Progression Report")
    c.setFillColor("darkblue")
    c.setFont("Helvetica", 12)
    c.drawString(5.45 * inch, 9.6 * inch, f"Name: {name}")
    c.drawString(5.45 * inch, 9.35 * inch, f"Date: {date}")
    c.drawString(5.45 * inch, 9.1 * inch, f"Activity: {activity}")
    c.setStrokeColor("black")
    c.setLineWidth(1.3)
    c.line(-0.55 * inch, 8.35 * inch, 7 * inch, 8.35 * inch)
    c.drawImage(energy_location, -1 * inch, 9.2 * inch)
    c.setFillColor("black")
    c.setFont("Helvetica", 10)
    c.drawString(2.7 * inch, -0.7 * inch, "Page-3")
    c.drawImage(energy_location, 1.3 * inch, -0.4 * inch, width=4 * inch, height=3.8 * inch)

    # Initialize table data
    table_data = [["Metric", "Value"]]

    # Initialize variables for the overall confidence report
    overall_confidence_report = None

    # Populate table data and extract overall confidence report for video output
    for key, value in video.items():
        if key == "Overall Confidence Report":
            overall_confidence_report = value
        else:
            table_data.append([key, str(value)])

    # Draw table for video output only
    col_width = 2.5 * inch
    row_height = 0.4 * inch
    x_start = 1 * inch
    y_start = 6.9 * inch
    for i, row in enumerate(table_data):
        for j, cell in enumerate(row):
            c.rect(x_start + j * col_width, y_start - i * row_height, col_width, row_height)
            c.drawString(x_start + j * col_width + 5, y_start - i * row_height + 10, cell)

    # Add overall confidence report as heading and paragraph for video output
    if overall_confidence_report:
        heading_font_size = 12
        paragraph_font_size = 10
        heading_text = "Overall Confidence Report:"
        paragraph_text = overall_confidence_report

        # Draw heading
        c.setFont("Helvetica-Bold", heading_font_size)
        c.drawString(x_start, y_start - (len(table_data) + 1) * row_height, heading_text)

        # Draw paragraph
        c.setFont("Helvetica", paragraph_font_size)
        text_object = c.beginText(x_start, y_start - (len(table_data) + 1.5) * row_height)
        text_object.textLines(paragraph_text)
        c.drawText(text_object)

    # Save the PDF
    c.save()
    print(mypath)
    return mypath

@shared_task
def process(video_name, context):
    results = {}
    save_dir = str(OUTPUT_ROOT / video_name)  # Construct the directory path
    logging.error(f"save dir is: {save_dir}") # Create the directory
    os.mkdir(save_dir)
    try:
        api_key = gemini.get_key()
        model = gemini.initialize_model(api_key)

        # Use Path objects to handle paths
        video_path = str(INPUT_ROOT / f"{video_name}.mp4")
        audio_output_path = str(OUTPUT_ROOT / video_name / f"{video_name}.wav")
        print(f"Video path: {video_path}")
        print(f"Audio output path: {audio_output_path}")
        
        audio_file = audio.extract_audio_from_video(video_path, audio_output_path)
        print(f"Audio file generated: {audio_file}")
        text = None  # Placeholder for the speech-to-text result

        # Define thread target functions
        def video_worker():
            video_result_path = video.analyse(video_path)
            print(f"Video analysis output path: {video_result_path}")
            results["video_output"] = video_result_path

        def speech_to_text_worker():
            nonlocal text  # Use the nonlocal keyword to modify the outer scope variable
            text = audio.speech_to_text(audio_file)
            print(f"Speech to text result: {text}")

        def audio_and_gemini_worker():
            # Wait until the speech-to-text thread finishes
            speech_to_text_thread.join()

            # Now that we have the text, we can proceed with audio analysis and Gemini report
            audio_result_path = audio.analyse(audio_output_path, text, save_dir)
            print(f"Audio analysis output path: {audio_result_path}")
            gemini_output = gemini.get_report(context, text, model)
            print(f"Gemini report output: {gemini_output}")
            results["audio_output"] = audio_result_path
            results["gemini_output"] = gemini_output

        # Create threads
        video_thread = threading.Thread(target=video_worker)
        speech_to_text_thread = threading.Thread(target=speech_to_text_worker)
        audio_and_gemini_thread = threading.Thread(target=audio_and_gemini_worker)

        # Start video and speech-to-text threads simultaneously
        video_thread.start()
        speech_to_text_thread.start()

        # Wait for the speech-to-text thread to finish before starting audio and Gemini thread
        speech_to_text_thread.join()

        # Start audio and Gemini thread
        audio_and_gemini_thread.start()

        # Wait for all threads to finish
        video_thread.join()
        audio_and_gemini_thread.join()

        print("All threads finished")
        with open(f"{JSON_LOC}/{video_name}.json", 'w') as file:
            file.write(json.dumps(results))

        # loc = generate_pdf(
        #     results=results,
        #     name=videoID,
        #     date=time.time(),
        #     activity="chilling",
        #     directory=JSON_LOC,
        #     id=videoID,
        #     pitch_tone_location=save_dir / "pitch_variation.png",
        #     energy_location=save_dir / "volume_variation.png",
        # )
        # print("pdf made. or not")
        # respond(loc, videoID, context)

    except Exception as e:
        print(f"Exception {e} occurred")

    finally:
        print("removing file")
        os.remove(audio_file)
        os.remove(video_path)
        shutil.rmtree(save_dir)

@shared_task
def main(video_file: str, context: str):
    video_name = video_file.split(".mp4")[0]
    print(f"Working on {video_name} - {video_name}")
    st = time.time()
    print("Started processing")
    process(video_name, context)
    print(f"Processing time: {time.time() - st}")
