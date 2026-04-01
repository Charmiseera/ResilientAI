"""
Supabase Database Client for ResilientAI
Lazy initialization to avoid import-time network calls in serverless.
"""
import os
from supabase import create_client, Client

_client: Client | None = None


def get_db() -> Client | None:
    """Returns the Supabase client, lazily initialized on first call."""
    global _client
    if _client is not None:
        return _client

    url = os.environ.get("SUPABASE_URL", os.environ.get("NEXT_PUBLIC_SUPABASE_URL", ""))
    key = os.environ.get("SUPABASE_SECRET_KEY", os.environ.get("SUPABASE_KEY", os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")))

    if not url or not key:
        return None

    try:
        _client = create_client(url, key)
    except Exception as e:
        print(f"Failed to initialize Supabase client: {e}")
        return None

    return _client
