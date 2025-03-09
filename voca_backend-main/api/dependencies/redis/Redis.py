import redis

def connect_to_redis(host='localhost', port=6379, db=0):
    """Connect to Redis and return a Redis client."""
    return redis.Redis(host=host, port=port, db=db)

def create(r, key, value):
    """Create a new key-value pair."""
    r.set(key, value)
    print(f"Created: {key} = {value}")

def read(r, key):
    """Read the value of a key."""
    value = r.get(key)
    if value:
        print(f"Read: {key} = {value.decode('utf-8')}")
    else:
        print(f"Key '{key}' not found")
    return value.decode('utf-8') if value else None

def update(r, key, value):
    """Update the value of an existing key."""
    if r.exists(key):
        r.set(key, value)
        print(f"Updated: {key} = {value}")
    else:
        print(f"Key '{key}' not found, update failed")

def delete(r, key):
    """Delete a key-value pair."""
    if r.delete(key):
        print(f"Deleted: {key}")
    else:
        print(f"Key '{key}' not found, deletion failed")

def mread(r, *keys):
    """Read multiple keys at once."""
    values = r.mget(keys)
    decoded_values = [value.decode('utf-8') if value else None for value in values]
    print(f"MRead: {dict(zip(keys, decoded_values))}")
    return decoded_values

def mupdate(r, key_value_dict):
    """Update multiple keys at once."""
    r.mset(key_value_dict)
    print(f"MUpdated: {key_value_dict}")
