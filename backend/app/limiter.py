# Simple pass-through limiter for development
from functools import wraps

class SimpleLimiter:
    def __init__(self, key_func=None):
        pass
    
    def limit(self, *args, **kwargs):
        def decorator(func):
            return func
        return decorator

limiter = SimpleLimiter()