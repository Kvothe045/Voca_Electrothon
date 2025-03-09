import logging
from typing import Optional, Union

import requests

from django.middleware.csrf import get_token
from django.http.response import JsonResponse

from ..models import vocaUser

logger = logging.getLogger("api")


VIDEO_ROOT = "data/video_input/"

# helper functions
def check_user(verification_hash: str) -> Optional[vocaUser]:
    """
    Checks if the user with the verificatonHash exists in the database

    Args:
        verificatonHash <str>: verificationHash to check in the database

    Returns:
        vocaUser: returns the object if the hash is a hit
        None: if no user with the hash is found
    """
    if not isinstance(verification_hash, str):
        logger.error("verification_hash is not a string")
        return None
    try:
        usr = vocaUser.objects.get(unique_key=verification_hash)
        return usr
    except vocaUser.DoesNotExist:
        logger.error(f"No user found with verification hash: {verification_hash}")
        return None
    except Exception as e:
        logger.error(f"Error checking user: {str(e)}", exc_info=True)
        return None


def download_file(
    link: str, video_id: str, location: str = VIDEO_ROOT
) -> Union[str, bool]:
    """
    A simple function to download a file and save it to local storage

    Args:
        link <str>: The url of the file you want to download
        video_id <str>: The unique id of the file to recognize it
        location <str>: The location where the file will be located. Default is api/dependencies/infile

    Returns:
        bool: True if the file was saved successfully else False
    """
    file_loc = f"{location}/{video_id}.mp4"
    response = requests.get(link)
    if response.status_code == 200:
        with open(file_loc, "wb") as file:
            file.write(response.content)
        return file_loc
    logger.error(f"Error downloading file: {link}")
    return False

def gen_csrf(request):
    return JsonResponse(data={"token": get_token(request)})
