import cv2
import mediapipe as mp
import numpy as np

# Function to detect hand gestures
def detect_hand_gestures(frame, hands) -> bool:
    results_hands = hands.process(frame)
    gesture_detected = False
    if results_hands.multi_hand_landmarks:
        gesture_detected = True
    return gesture_detected

# Function to detect facial expressions
def detect_facial_expressions(frame, face_detection) -> float:
    results_face = face_detection.process(frame)
    facial_expression_confidence = 0
    if results_face.detections:
        for detection in results_face.detections:
            facial_expression_confidence = detection.score[0]
    return facial_expression_confidence

# Function to assess body posture
def assess_body_posture(facial_expression_percentage) -> str:
    if facial_expression_percentage >= 90:
        posture_rating = "Good"
    elif facial_expression_percentage >= 75:
        posture_rating = "Average"
    else:
        posture_rating = "Bad"
    return posture_rating

# Function to evaluate overall performance
def evaluate_performance(facial_expression_percentage, gesture_rating, posture_rating) -> str:
    if facial_expression_percentage >= 90 and gesture_rating >= 7 and posture_rating == "Good":
        overall_report = "Your overall performance is excellent. Keep up the good work!"
    elif facial_expression_percentage >= 75 and gesture_rating >= 4 and posture_rating != "Bad":
        overall_report = "You are doing well overall. Focus on maintaining consistency."
    elif facial_expression_percentage >= 50 and gesture_rating >= 2 and posture_rating != "Bad":
        overall_report = "You have potential. Work on refining your expressions, gestures, and posture."
    else:
        overall_report = "There are areas for improvement. Focus on enhancing expressions, gestures, and posture."
    return overall_report

# Function to analyze video
def analyse(video_path: str) -> dict:
    print("Starting Video analysis")
    cap = cv2.VideoCapture(video_path)

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    gesture_count = 0
    facial_expression_confidences = []

    # Initialize mediapipe hands and face detection objects
    mp_hands = mp.solutions.hands.Hands(min_detection_confidence=0.8, min_tracking_confidence=0.8)
    mp_face = mp.solutions.face_detection.FaceDetection(min_detection_confidence=0.8)

    with mp_hands as hands, mp_face as face_detection:
        for frame_num in range(total_frames):
            ret, frame = cap.read()
            if not ret:
                break

            # Skip every other frame
            if frame_num % 2 != 0:
                continue

            # Detect hand gestures
            gesture_detected = detect_hand_gestures(frame, hands)
            if gesture_detected:
                gesture_count += 1

            # Detect facial expressions
            facial_expression_confidence = detect_facial_expressions(frame, face_detection)
            facial_expression_confidences.append(facial_expression_confidence)

    avg_facial_expression_confidence = np.mean(facial_expression_confidences)
    facial_expression_percentage = int(avg_facial_expression_confidence * 100)

    # Calculate gesture rating
    gesture_rating = min((gesture_count / (total_frames / 2)) * 10, 10)

    # Assess body posture
    posture_rating = assess_body_posture(facial_expression_percentage)

    # Evaluate overall performance
    overall_report = evaluate_performance(facial_expression_percentage, gesture_rating, posture_rating)

    results_dict = {
        "Facial Expressions (Percentage)": f"{facial_expression_percentage}%",
        "Hand Gesture Rating (out of 10)": gesture_rating,
        "Body Posture Rating": posture_rating,
        "Overall Confidence Report": overall_report
    }

    cap.release()
    print("Finishing video analysis")

    return results_dict

if __name__ == "_main_":
    video_path = "your_video.mp4"  # Provide your video file path here
    analyse(video_path)