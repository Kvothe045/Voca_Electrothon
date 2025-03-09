# dependency imports
import datetime
import json
import logging

# django imports
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import View

# local imports
from ..dependencies.redis import Redis as redisDBRaw
from ..dependencies.word_of_the_day.word import wordOfTheDay
from ..rsa import decrypt_message, load_private_key
from .helper import check_user

redisDB = redisDBRaw.connect_to_redis()


@method_decorator(csrf_exempt, name="dispatch")
class WordOfTheDay(View):
    """
    This view handles requests related to fetching the 'word of the day'. 
    It validates the API key, checks the date, and either retrieves the cached word 
    or generates a new word of the day to return in the response.
    """

    def post(self, request):
        """
        Handles the POST request for the word of the day.
        
        1. Extracts and decrypts the API key from the request.
        2. Verifies the validity of the API key.
        3. Checks if the word of the day has already been cached for today.
        4. If cached, returns the cached word; otherwise, generates a new word of the day.
        
        Args:
            request: The HTTP request object containing the API key and other potential data.

        Returns:
            JsonResponse: A JSON response with either the word of the day or an error message.
        """
        # Parse the API key from the request
        if not (key := self._parse_request_data(request)):
            return JsonResponse({"error": "error parsing data"}, status=400)

        # Decrypt the API key
        key = decrypt_message(key, load_private_key("api/keys/node_private_key.pem"))

        # Check if the API key is valid
        if not check_user(key):
            return JsonResponse({"error": "key not valid"}, status=400)

        today = datetime.date.today()

        # Check if the word of the day is already cached for today
        date_str, wod_str = redisDBRaw.mread(redisDB, "date", "wod")

        if date_str and datetime.date.fromisoformat(date_str) == today:
            # Return the cached word of the day if available
            wod = json.loads(wod_str)
        else:
            # Generate a new word of the day if not cached
            wod = wordOfTheDay().run("wod")
            redisDBRaw.mupdate(redisDB, {"date": str(today), "wod": json.dumps(wod)})

        # Return the word of the day in the response
        return JsonResponse({"word_of_the_day": wod}, status=200)

    def _fetch_date_redis(self, param):
        """
        Fetches and returns the date stored in the Redis database for a given parameter.
        
        Args:
            param (str): The Redis key to fetch the date for.

        Returns:
            datetime.date: The date from Redis, or datetime.date.min if parsing fails.
        """
        try:
            date_str = redisDBRaw.read(redisDB, param)
            return datetime.date.fromisoformat(date_str)
        except (ValueError, TypeError):
            # Return a minimal date value if there's an issue parsing the date
            return datetime.date.min

    def _parse_request_data(self, request):
        """
        Parses the request body to extract the API key.
        
        Args:
            request: The HTTP request object containing the body with JSON data.

        Returns:
            str or False: The extracted API key if parsing is successful, or False if an error occurs.
        """
        try:
            # Attempt to parse the JSON body and extract the 'api-key'
            return json.loads(request.body.decode("utf-8")).get("api-key")
        except (json.JSONDecodeError, IndexError, KeyError):
            # Log error and return False if any issues arise during parsing
            logging.error("Error parsing request data")
            return False

