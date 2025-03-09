class KeyNotFoundError(Exception):
    def __init__(self, message):
        super().__init__(message)
        