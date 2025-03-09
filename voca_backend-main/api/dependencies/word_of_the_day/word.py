import requests
import yaml
import json

API_KEY_PATH = "api/key.yaml"

class wordOfTheDay:
    def __init__(self) -> None:
        self._api_key = "atf2sdrkre4m4dtbmqx0yegrneajg3og17haxac003ryaiefg"
        self._url_words = "http://api.wordnik.com/v4/words.json/"
        self._url_word = "http://api.wordnik.com/v4/word.json/"
        self._params = {"api_key": self._api_key}

    
    def _get_key(self, api_key_path: str=API_KEY_PATH) -> str:

        if not api_key_path.endswith(".yaml"):
            raise ValueError("Incorrect file type. Please provide a YAML file.")

        try:
            with open(api_key_path, "r") as file:
                data: dict = yaml.load(file, Loader=yaml.SafeLoader)
                api_key: str = data.get("wod_key")
                if not api_key:
                    raise Exception("API key not found")
                return api_key

        except FileNotFoundError:
            raise FileNotFoundError(f"File not found: {api_key_path}")
        except yaml.YAMLError as e:
            raise ValueError(f"Error parsing YAML file: {e}")


    def _build_url(self, base_url: str, endpoint: str, params: dict):
        url = base_url
        if endpoint:
            url = f"{url.rstrip('/')}/{endpoint.lstrip('/')}"
        
        # Use requests.Request.prepare_url()
        prepared_url = requests.Request('GET', url, params=params).prepare().url
        
        return prepared_url
    

    def _apt_endpoint(self, endpoint_needed: str):
        eps = {
                "wod": "wordOfTheDay",
                "rw": "randonWord", 
              }

        return eps.get(endpoint_needed)


    def _parse(self, data: dict):
        word = data.get("word")
        definations = [(i.get("text"), i.get("partOfSpeech")) for i in data.get("definitions")]
        ret_dict = {
                    "word": word, 
                    "definations": definations
                   }
        return ret_dict
        
    def _get(self, endpoint):
        url = self._build_url(self._url_words, endpoint, self._params)
        response  = requests.get(url)
        if response.status_code != 200:
            print("error fetching result")
        
        return response.text
    
    def run(self, endpoint):
        ep = self._apt_endpoint(endpoint)
        wod_json = json.loads(self._get(ep))
        parsed_wod = self._parse(wod_json)
        return parsed_wod


if __name__ == "__main__":
    w = wordOfTheDay()
    print(w.run("wod"))
