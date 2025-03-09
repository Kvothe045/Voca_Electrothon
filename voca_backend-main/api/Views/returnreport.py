# dependency imports
import json
import logging
import os
from typing import Union

# django imports
from django.http import FileResponse, JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import View

# local imports
from . helper import check_user
from ..models import Report
from ..rsa import decrypt_message, load_private_key


@method_decorator(csrf_exempt, name="dispatch")
class ReturnReport(View):
    def post(self, request) -> Union[FileResponse, JsonResponse]:
        """
        Handle POST requests to retrieve a report file or return an error response.

        Expects JSON data with the following structure:
        {
            "reportID": <str>,               # The ID of the report to retrieve
            "verificationHash": <str>       # Verification hash associated with the user
        }

        Returns:
            FileResponse: If the report file is found and can be served.
            JsonResponse: If any errors occur during processing or if the requested resources are not found.

        Possible JSON error responses:
            - {"error": "Invalid reportID"}: If the provided reportID does not correspond to any existing report.
            - {"error": "Unable to verify user"}: If the provided verification hash does not correspond to any user.
            - {"error": "Report does not exist"}: If the requested report does not exist.
            - {"error": "Could not process request"}: If an unexpected error occurs during processing.
        """
        try:
            json_data: dict = json.loads(request.body.decode("utf-8"))
            verification_hash: str = decrypt_message(
                json_data.get("verificationHash"), load_private_key("api/keys/node_private_key.pem") 
            )
            reportID: str = json_data.get("reportID")

            if check_user(verification_hash):
                if report := self.check_report(reportID):
                    filePath = report.reportFile.path
                    if os.path.exists(filePath):
                        file = open(filePath, "rb")
                        response = FileResponse(file)
                        return response
                logging.error(f"Invalid reportID: {reportID}")
                return JsonResponse({"error": "Invalid reportID"})
            logging.error(f"Unable to verify user with hash: {verification_hash}")
            return JsonResponse({"error": "Unable to verify user"})

        except Report.DoesNotExist:
            logging.error(f"Report with ID {reportID} does not exist")
            return JsonResponse({"error": "Report does not exist"})

        except Exception as e:
            logging.error(f"Error processing request: {str(e)}", exc_info=True)
            return JsonResponse(data={"error": "Could not process request"}, status=500)

    def check_report(self, reportID: str) -> Union[Report, None]:
        """
        Checking if a report with the given reportID exists

        Args:
            reportID <str>: the reportID to check in the database

        Returns:
            Report: the report object if the reportID is a hit
            None: report with the reportID does not exist
        """
        try:
            report = Report.objects.get(reportID=reportID)
            return report
        except Report.DoesNotExist:
            logging.error(f"Report with ID {reportID} does not exist")
            return None
        except Exception as e:
            logging.error(f"Error checking report: {str(e)}", exc_info=True)
            return None
