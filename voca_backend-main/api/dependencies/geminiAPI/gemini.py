from api.dependencies.geminiAPI.gemini_exceptions import KeyNotFoundError
from api.dependencies.geminiAPI.gemini_prompt import build_prompt

import yaml
import google.api_core.exceptions as googleexceptions
import google.generativeai as genai

# constants
API_KEY_PATH: str = "api/key.yaml"


def get_key(api_key_path: str = API_KEY_PATH) -> str:
    """
    Retrieves the value for the API key from the YAML file.

    Args:
        api_key_path: Path to the YAML file containing the API key.

    Returns:
        The API key value found in the YAML file.

    Raises:
        KeyError: If the key does not exist.
        FileNotFoundError: If the specified file does not exist.
        KeyNotFoundError: If the key is not found in the file.
    """

    if not api_key_path.endswith(".yaml"):
        raise ValueError("Incorrect file type. Please provide a YAML file.")

    try:
        with open(api_key_path, "r") as file:
            data: dict = yaml.load(file, Loader=yaml.SafeLoader)
            api_key: str = data.get("key")
            if not api_key:
                raise KeyNotFoundError("API key not found")
            return api_key

    except FileNotFoundError:
        raise FileNotFoundError(f"File not found: {api_key_path}")
    except yaml.YAMLError as e:
        raise ValueError(f"Error parsing YAML file: {e}")


def initialize_model(api_key: str) -> genai.GenerativeModel:
    """
    Initializes the Generative AI model and returns the model object.

    Args:
        api_key: The API key obtained from the YAML file.

    Returns:
        The initialized Generative AI model object.
    """

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.0-flash')
    return model


def get_report(context: str, content: str, model: genai.GenerativeModel) -> str:
    """
    Generates a report based on the provided context and content using the model.

    Args:
        context: The context information to be used for report generation.
        content: The main content to be analyzed in the report.
        model: The initialized Generative AI model object.
    Returns:
        dict: 
    """

    try:
        prompt: str = build_prompt(context, content)
        response = model.generate_content(prompt)

        answer: str = response.text
        if answer:
            return answer
        else:
            return "Can not generate report"
    except googleexceptions.InternalServerError:
        return f"Can not generate report for context {context}"
    except Exception as e:
        print(f"Error occured: {e}")
