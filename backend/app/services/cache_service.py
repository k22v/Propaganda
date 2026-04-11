import os
import json
import logging
from functools import wraps
from typing import Optional, Callable, Any

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
USE_CACHE = os.getenv("USE_CACHE", "false").lower() == "true"

_redis_client = None


def get_redis_client():
    global _redis_client
    if _redis_client is None and USE_CACHE:
        try:
            import redis.asyncio as redis
            _redis_client = redis.from_url(REDIS_URL, decode_responses=True)
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Caching disabled.")
    return _redis_client


def cache_key(prefix: str, **kwargs) -> str:
    parts = [prefix]
    for k, v in sorted(kwargs.items()):
        if v is not None:
            parts.append(f"{k}:{v}")
    return ":".join(parts)


async def cache_get(key: str) -> Optional[Any]:
    if not USE_CACHE:
        return None
    try:
        client = get_redis_client()
        if client:
            data = await client.get(key)
            if data:
                return json.loads(data)
    except Exception as e:
        logger.error(f"Cache get error: {e}")
    return None


async def cache_set(key: str, value: Any, ttl: int = 300) -> bool:
    if not USE_CACHE:
        return False
    try:
        client = get_redis_client()
        if client:
            await client.setex(key, ttl, json.dumps(value))
            return True
    except Exception as e:
        logger.error(f"Cache set error: {e}")
    return False


async def cache_delete(key: str) -> bool:
    if not USE_CACHE:
        return False
    try:
        client = get_redis_client()
        if client:
            await client.delete(key)
            return True
    except Exception as e:
        logger.error(f"Cache delete error: {e}")
    return False


async def cache_clear_pattern(pattern: str) -> int:
    if not USE_CACHE:
        return 0
    try:
        client = get_redis_client()
        if client:
            keys = []
            async for key in client.scan_iter(match=pattern):
                keys.append(key)
            if keys:
                return await client.delete(*keys)
    except Exception as e:
        logger.error(f"Cache clear error: {e}")
    return 0


def cached(prefix: str, ttl: int = 300):
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if not USE_CACHE:
                return await func(*args, **kwargs)
            
            key_parts = [prefix]
            for arg in args:
                if arg is not None:
                    key_parts.append(str(arg))
            for k, v in kwargs.items():
                if v is not None:
                    key_parts.append(f"{k}:{v}")
            cache_key_str = ":".join(key_parts)
            
            cached_value = await cache_get(cache_key_str)
            if cached_value is not None:
                logger.debug(f"Cache hit: {cache_key_str}")
                return cached_value
            
            result = await func(*args, **kwargs)
            await cache_set(cache_key_str, result, ttl)
            logger.debug(f"Cache miss: {cache_key_str}")
            
            return result
        return wrapper
    return decorator


def invalidate_on_change(prefix: str):
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)
            await cache_clear_pattern(f"{prefix}:*")
            logger.debug(f"Cache invalidated for prefix: {prefix}")
            return result
        return wrapper
    return decorator
