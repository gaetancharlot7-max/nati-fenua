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
    "Couronne de fleurs tiare": (
        "Professional product photography of a traditional Polynesian flower crown, "
        "fresh white tiare gardenia flowers woven with tropical green leaves and fern fronds, "
        "displayed on a light wood surface, soft warm natural lighting, festive Tahitian hei, 4k product shot"
    ),
    "Sel de Tahiti Tumu": (
        "Professional product photography of artisanal Tahitian sea salt, "
        "coarse white crystals in a small wooden bowl, natural sea salt with mineral sparkle, "
        "bamboo spoon, volcanic black sand accents, white linen background, soft lighting, gourmet 4k product shot"
    ),
    "Huile de coco vierge bio": (
        "Professional product photography of virgin coconut oil bottle, clear glass bottle with "
        "translucent oil and coconut pieces around, halved fresh coconut with white flesh, "
        "green palm leaves, organic bio label, white background, soft natural lighting, 4k product shot"
    ),
    "Bijoux en coquillage cauri": (
        "Professional product photography of handmade Polynesian cauri shell jewelry set, "
        "polished white cowrie shells on natural brown cord, matching necklace and bracelet, "
        "displayed on white sand with tropical leaves, soft beach lighting, 4k product shot"
    ),
    "T-shirt Manu oiseau polynésien": (
        "Professional product photography of an organic cotton t-shirt, flat lay, white color with "
        "bold black Polynesian Manu bird tribal tattoo design printed on the front, "
        "tropical green leaves accent, white background, soft studio lighting, fashion 4k product shot"
    ),
    "Savon au monoï de Tahiti": (
        "Professional product photography of an artisanal handmade soap bar, creamy white color with "
        "embedded white tiare flower petals, Monoi de Tahiti label, displayed on light wood slab with fresh tiare "
        "gardenia flowers around, soft natural lighting, spa aesthetic, 4k product shot"
    ),
    "Panier tressé en pandanus": (
        "Professional product photography of a traditional Polynesian pandanus woven basket, "
        "natural beige color with geometric weaving pattern, rectangular shape with sturdy handles, "
        "displayed on white linen with tropical leaves, soft natural lighting, artisanal craft 4k product shot"
    ),
    "Ukulélé tahitien 8 cordes": (
        "Professional product photography of a traditional Tahitian 8-string ukulele, "
        "dark tou wood body with warm grain, polished finish, 8 nylon strings, "
        "displayed on white background with subtle shadow, soft studio lighting highlighting wood texture, 4k product shot"
    ),
    "Hei mata'i - bijou hameçon": (
        "Professional product photography of a traditional Polynesian hei matau fish hook pendant, "
        "carved from polished ivory bone, intricate traditional curves, on a brown leather cord, "
        "displayed on dark wood surface, soft dramatic lighting, museum quality Maori style, 4k product shot"
    ),
    "Café de Taravao premium": (
        "Professional product photography of premium arabica coffee beans, "
        "dark roasted glossy beans spilling from a brown burlap sack, wooden spoon, "
        "'Café de Taravao' burlap label, displayed on dark wood surface with coffee flowers, "
        "warm moody lighting, gourmet 4k product shot"
    ),
    "Villa vue lagon - Moorea": (
        "Professional real estate photography of a modern tropical villa in Moorea, "
        "exterior view with white walls, wooden details, private pool, palm trees, "
        "overwater deck with lagoon view, golden hour lighting, azure turquoise lagoon in background, "
        "lush green mountains, drone-style composition, luxury property listing 4k"
    ),
    "Appartement T2 centre Papeete": (
        "Professional real estate photography of a renovated modern apartment interior in Papeete, "
        "bright living room with white walls, parquet floor, light furniture, balcony with tropical view, "
        "natural daylight through large windows, minimalist Scandinavian-Polynesian style, 4k property listing"
    ),
    "Terrain constructible Paea": (
        "Professional aerial photography of a flat constructible land parcel in Paea Tahiti, "
        "green grass terrain with coconut palm trees, ocean view in background, blue sky, "
        "clean cleared plot ready to build, drone shot, sunny tropical lighting, real estate 4k"
    ),
    "Terrain agricole Taravao": (
        "Professional landscape photography of fertile agricultural farmland on Taravao plateau Tahiti, "
        "rolling green pastures with mountain backdrop, small water stream, tropical cloud, "
        "organic farm ready for cultivation, vibrant colors, 4k real estate listing"
    ),
    "Toyota Hilux 4x4 double cabine": (
        "Professional automotive photography of a Toyota Hilux double cab 4x4 pickup truck, "
        "white color, well maintained, parked on a tropical Tahitian road with palm trees, "
        "side-front three quarter view, clean showroom quality, bright daylight, 4k marketplace shot"
    ),
    "Bateau polyester 6m avec moteur": (
        "Professional marine photography of a 6m polyester motorboat with Yamaha 90hp outboard engine, "
        "white hull, parked on trailer near Tahitian lagoon, blue ocean in background, "
        "clean sunny day, ready for fishing or lagoon excursions, 4k marketplace shot"
    ),
    "Scooter Yamaha XMAX 125cc": (
        "Professional product photography of a Yamaha XMAX 125cc scooter motorcycle, "
        "black and silver color, with top case, shown three quarter side view, "
        "parked on a clean driveway with palm trees in the background, bright daylight, "
        "showroom quality 4k marketplace shot"
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

    # First make sure DB has all seed products (re-seed if needed)
    import sys
    sys.path.insert(0, "/app/backend")
    from seed_data import build_seed_products
    seed_products = build_seed_products()
    existing_ids = {
        p["product_id"]
        for p in await db.products.find({}, {"product_id": 1, "_id": 0}).to_list(1000)
    }
    missing = [p for p in seed_products if p["product_id"] not in existing_ids]
    if missing:
        await db.products.insert_many(missing)
        print(f"Inserted {len(missing)} new seed products into DB")

    products = await db.products.find(
        {}, {"_id": 0, "product_id": 1, "title": 1}
    ).to_list(100)

    print(f"Checking images for {len(products)} products...")
    for p in products:
        title = p["title"]
        pid = p["product_id"]
        out_path = OUTPUT_DIR / f"{pid}.png"
        if out_path.exists() and out_path.stat().st_size > 10_000:
            print(f"  SKIP {pid} (image already exists, {out_path.stat().st_size} bytes)")
            continue
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
