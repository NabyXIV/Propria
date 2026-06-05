import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

async def upload_file(bucket: str, file_path: str, file_data: bytes, content_type: str = "application/octet-stream") -> str:
    try:
        supabase.storage.from_(bucket).upload(
            file_path,
            file_data,
            {"content-type": content_type}
        )
        # Retourne l'URL publique du fichier
        url = supabase.storage.from_(bucket).get_public_url(file_path)
        return url
    except Exception as e:
        raise Exception(f"Erreur upload: {str(e)}")

async def delete_file(bucket: str, file_path: str) -> bool:
    try:
        supabase.storage.from_(bucket).remove([file_path])
        return True
    except Exception as e:
        raise Exception(f"Erreur suppression: {str(e)}")

async def get_file_url(bucket: str, file_path: str) -> str:
    return supabase.storage.from_(bucket).get_public_url(file_path)