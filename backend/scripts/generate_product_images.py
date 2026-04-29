"""
Generate authentic Polynesian product images using Gemini Nano Banana.
Saves to /app/frontend/public/products/ and updates product.images in MongoDB.
"""
import asyncio
import os
import base64
import sys
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv()

# Detailed prompts per product (Polynesian authenticity)
PROMPTS = {
    "Collier Perle de Tahiti AAA": (
        "Professional product photography of a luxurious Tahitian black pearl necklace, "
        "single round dark iridescent pearl with green-purple peacock luster, set in 18k gold, "
        "displayed on white silk background, soft studio lighting, ultra detailed, 4k, marketplace product shot"
    ),
    "Monoï de Tahiti pur Tiare": (
        "Professional product photography of a Tahitian Monoi oil bottle, glass bottle with white tiare flowers floating inside, "
        "amber colored oil, fresh tiare gardenia flowers and tropical green leaves around, "
        "soft natural lighting, white background, 4k product shot, AOC label visible"
    ),
    "Paréo traditionnel tahitien": (
        "Professional product photography of a traditional Tahitian pareo cloth, vibrant turquoise blue and orange "
        "with hibiscus and tiare flower patterns, neatly folded on a white background, soft cotton fabric texture visible, "
        "studio lighting, polynesian style, marketplace product shot 4k"
    ),
    "Sculpture Tiki en bois de tou": (
        "Professional product photography of a hand-carved Marquesan Tiki statue in dark tou wood, "
        "traditional Polynesian carving with tribal patterns, 25cm tall, displayed on white background, "
        "warm spotlight highlighting wood grain, museum quality, 4k product shot"
    ),
    "Bracelet en nacre de Tahiti": (
        "Professional product photography of a handmade Tahitian mother-of-pearl bracelet, "
        "iridescent rainbow nacre pieces strung on natural cord, displayed on white silk, "
        "soft studio lighting catching the pearl shimmer, 4k marketplace product shot"
    ),
    "Pareo de fête en tissu tapa": (
        "Professional product photography of a ceremonial Polynesian tapa cloth pareo, "
        "natural beige bark cloth with hand-painted black tribal motifs, traditional patterns, "
        "displayed on white background, soft museum lighting, ethnographic textile, 4k product shot"
    ),
    "Vanille de Tahaa premium": (
        "Professional product photography of premium Tahaa vanilla beans bundle, "
        "long dark brown plump vanilla pods tied with twine, glossy oily appearance, "
        "vanilla flowers in background, white wood surface, soft natural lighting, gourmet product shot 4k"
    ),
    "Huile précieuse de Tamanu": (
        "Professional product photography of pure Tamanu oil bottle, dark glass dropper bottle with golden green oil, "
        "fresh tamanu nuts and green leaves arranged around, natural beauty product, "
        "soft studio lighting on white background, organic skincare 4k product shot"
    ),
}

OUTPUT_DIR = Path("/app/frontend/public/products")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


async def generate_one(title: str, product_id: str) -> str | None:
    """Generate one image, save it, return relative URL."""
    prompt = PROMPTS.get(title)
    if not prompt:
        print(f"  No prompt for: {title}")
        return None

    api_key = os.getenv("EMERGENT_LLM_KEY")
    chat = LlmChat(
        api_key=api_key,
        session_id=f"product-img-{product_id}",
        system_message="You are a professional product photographer."
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(
        modalities=["image", "text"]
    )

    msg = UserMessage(text=prompt)
    try:
        text, images = await chat.send_message_multimodal_response(msg)
    except Exception as e:
        print(f"  ERROR for {title}: {e}")
        return None

    if not images:
        print(f"  No image returned for {title}")
        return None

    img = images[0]
    image_bytes = base64.b64decode(img["data"])
    filename = f"{product_id}.png"
    out_path = OUTPUT_DIR / filename
    out_path.write_bytes(image_bytes)
    print(f"  Saved {out_path} ({len(image_bytes)} bytes)")
    return f"/products/{filename}"


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]

    products = await db.products.find(
        {}, {"_id": 0, "product_id": 1, "title": 1}
    ).to_list(100)

    print(f"Generating images for {len(products)} products...")
    for p in products:
        title = p["title"]
        pid = p["product_id"]
        print(f"\n>>> {title} ({pid})")
        url = await generate_one(title, pid)
        if url:
            await db.products.update_one(
                {"product_id": pid},
                {"$set": {"images": [url], "image_url": url}}
            )
            print(f"  DB updated with {url}")
    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
