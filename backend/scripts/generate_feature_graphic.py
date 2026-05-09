"""Generate the Google Play Store feature graphic (1024x500) for Nati Fenua
using Gemini Nano Banana via Emergent LLM key.

Run: python3 /app/backend/scripts/generate_feature_graphic.py
Output: /app/frontend/public/store-assets/feature-graphic.png
"""
import asyncio
import os
import base64
import sys
from pathlib import Path
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv("/app/backend/.env")

OUTPUT_DIR = Path("/app/frontend/public/store-assets")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

PROMPT = (
    "Professional Google Play Store feature graphic banner, horizontal landscape 1024x500 px, "
    "vibrant Polynesian beach scene at golden hour, turquoise lagoon water, "
    "distant volcanic island silhouette evoking Bora Bora, "
    "tropical hibiscus flowers and tiare gardenia in the foreground left side, "
    "on the right side a modern smartphone mockup floating with a colorful social feed visible on screen, "
    "bold modern typography 'Nati Fenua' centered with orange to pink gradient (#FF6B35 to #FF1493), "
    "subtitle 'Le Fenua connecté' in white below, "
    "warm cinematic lighting, high detail, mobile app marketing banner style, "
    "no people faces, no text other than the title and subtitle, premium quality"
)


async def main():
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        print("❌ EMERGENT_LLM_KEY missing in /app/backend/.env")
        sys.exit(1)

    print("🎨 Generating Nati Fenua feature graphic...")
    chat = LlmChat(
        api_key=api_key,
        session_id="nati-fenua-feature-graphic",
        system_message="You are a professional mobile app marketing designer."
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(
        modalities=["image", "text"]
    )

    try:
        text, images = await chat.send_message_multimodal_response(UserMessage(text=PROMPT))
    except Exception as e:
        print(f"❌ Generation error: {e}")
        sys.exit(1)

    if not images:
        print("❌ No image returned by Gemini")
        sys.exit(1)

    image_bytes = base64.b64decode(images[0]["data"])
    out_path = OUTPUT_DIR / "feature-graphic.png"
    out_path.write_bytes(image_bytes)
    print(f"✅ Feature graphic saved: {out_path} ({len(image_bytes):,} bytes)")
    print(f"   URL: https://nati-fenua.com/store-assets/feature-graphic.png")
    print()
    print("⚠️  Note: Gemini may not output exactly 1024x500. If aspect ratio is off,")
    print("   crop with: convert feature-graphic.png -resize 1024x500^ -gravity center -extent 1024x500 feature-graphic-cropped.png")


if __name__ == "__main__":
    asyncio.run(main())
