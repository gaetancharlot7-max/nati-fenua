"""
Script de creation des index MongoDB pour l'Agent IA V2
Executer UNE FOIS : python backend/setup_agent_indexes.py
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def setup():
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DB_NAME", "nati_fenua")
    
    print(f"Connexion a MongoDB: {db_name}")
    db = AsyncIOMotorClient(mongo_url)[db_name]
    
    # Index pour ai_conversations
    await db.ai_conversations.create_index("session_id")
    await db.ai_conversations.create_index("created_at")
    await db.ai_conversations.create_index([("session_id", 1), ("created_at", 1)])
    print("Index ai_conversations crees")
    
    # Index pour ai_long_term_memory
    await db.ai_long_term_memory.create_index("category")
    await db.ai_long_term_memory.create_index("created_at")
    try:
        await db.ai_long_term_memory.create_index([("content", "text")], name="content_fulltext")
    except Exception as e:
        print(f"Index fulltext deja existant ou erreur: {e}")
    print("Index ai_long_term_memory crees")
    
    # Index pour ai_session_summaries
    await db.ai_session_summaries.create_index("session_id")
    print("Index ai_session_summaries crees")
    
    # Index pour ai_plans
    await db.ai_plans.create_index([("session_id", 1), ("status", 1)])
    print("Index ai_plans crees")
    
    print("\n✅ Tous les index ont ete crees avec succes!")

if __name__ == "__main__":
    asyncio.run(setup())
