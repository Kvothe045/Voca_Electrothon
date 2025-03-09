import requests

PDF_ENDPOINT = "http://localhost:8000/api/v1/video/getReport"

def main(file_location: str, report_id: str, activity_name: str, endpoint=PDF_ENDPOINT):
    headers = {
        "reportID": report_id,
        "activityName": activity_name
    }

    files = {
        'file': (file_location, open(file_location, 'rb'), 'application/pdf')
    }
    print(files)

    r = requests.post(endpoint, headers=headers, files=files)
    print(r.text)

if __name__ == "__main__":
    print("running")
    main("outfile/1.pdf", "1", "chilling")
