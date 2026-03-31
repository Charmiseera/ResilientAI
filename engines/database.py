"""
Supabase Database Client for ResilientAI
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env in case it's not loaded
load_dotenv()

url: str = os.environ.get("SUPABASE_URL", os.environ.get("NEXT_PUBLIC_SUPABASE_URL", ""))
key: str = os.environ.get("SUPABASE_SECRET_KEY", os.environ.get("SUPABASE_KEY", os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")))

if not url or not key:
    print("WARNING: SUPABASE_URL or SUPABASE_KEY is missing from .env")

# Initialize the Supabase client
# Using the service role key or anon key provided in env
try:
    supabase: Client = create_client(url, key)
except Exception as e:
    print(f"Failed to initialize Supabase client: {e}")
    supabase = None

def get_db() -> Client:
    """Returns the initialized Supabase client."""
    return supabase
