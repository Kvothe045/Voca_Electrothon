# dependency imports
import json
import logging

from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import View

from ..dependencies.redis import Redis as redisDBRaw
from ..rsa import decrypt_message, load_private_key
from ..tasks import main as report_main

# local imports
from .helper import check_user, download_file

redisDB = redisDBRaw.connect_to_redis()

VIDEO_ROOT = "data/video_input/"


@method_decorator(csrf_exempt, name="dispatch")
class VideoAnalysis(View):
    def post(self, request) -> JsonResponse:
        """
        Handles HTTP POST requests for video analysis.

        This method decrypts the verification hash, checks user validity,
        and processes the received data.

        This endpoint expects a JSON in this format
        {
            "verificationHash": <str>,
            "reportID": <str>,
            "activityName": <str>,
            "videoID": <str>,
            "videoLink": <str>
        }

        Args:
            request: The HTTP request object containing the request data.

        Returns:
            A JSON response indicating success or failure.
        """
        try:
            json_data: dict = json.loads(request.body)
            verificationHash: str = json_data.get("verificationHash", None)

            if verificationHash is None:
                logging.error("No verification hash provided")
                return JsonResponse(
                    data={"error": "no verificationHash provided"}, status=400
                )

            verificationHash = decrypt_message(verificationHash, load_private_key("api/keys/node_private_key.pem"))

            if check_user(verificationHash):
                report_id: str = json_data.get("reportID")
                activity_name: str = json_data.get("activityName")
                video_id: str = json_data.get("videoID")
                video_link: str = json_data.get("videoLink")

                if not all([report_id, activity_name, video_id, video_link]):
                    logging.error("Incomplete data provided")
                    return JsonResponse(data={"error": "incomplete data"}, status=400)

                if download_file(video_link, video_id):
                    report_main.delay(video_id, activity_name)
                    return JsonResponse({"success": "received"})

                # If the video can not be downloaded
                logging.error(f"Unable to download video: {video_link}")
                return JsonResponse(
                    data={"error": "unable to download video"}, status=400
                )

            # If user verification fails
            logging.error(f"Incorrect verification hash: {verificationHash}")
            return JsonResponse(data={"error": "incorrect hash"}, status=400)

        except json.JSONDecodeError:
            # If request body is not valid JSON
            logging.error("Invalid JSON data provided")
            return JsonResponse(data={"error": "no json data provided"}, status=400)

        except Exception as e:
            # If any other exception occurs, log it
            logging.error(f"Error processing request: {str(e)}", exc_info=True)
            return JsonResponse(data={"error": "Could not process request"}, status=500)
