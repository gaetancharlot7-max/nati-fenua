# Seed data for Fenua Social - Polynesian content
# This module provides automatic population of the feed with Polynesian media and associations

import uuid
from datetime import datetime, timezone, timedelta
import random

# Polynesian Media Accounts
POLYNESIAN_ACCOUNTS = [
    {
        "user_id": "fenua_media_tahiti",
        "email": "contact@tahiti-infos.com",
        "name": "Tahiti Infos",
        "username": "tahiti_infos",
        "picture": "https://ui-avatars.com/api/?name=TI&background=FF6B35&color=fff&bold=true&size=200",
        "bio": "L'actualité de la Polynésie française en continu 🌴📰",
        "is_verified": True,
        "is_official_media": True,
        "followers_count": 45000,
        "following_count": 120
    },
    {
        "user_id": "fenua_media_polynesie",
        "email": "contact@polynesie1ere.fr",
        "name": "Polynésie la 1ère",
        "username": "polynesie1ere",
        "picture": "https://ui-avatars.com/api/?name=P1&background=0066CC&color=fff&bold=true&size=200",
        "bio": "La chaîne de télévision et radio de Polynésie française 📺📻",
        "is_verified": True,
        "is_official_media": True,
        "followers_count": 78000,
        "following_count": 85
    },
    {
        "user_id": "fenua_media_depeche",
        "email": "contact@ladepeche.pf",
        "name": "La Dépêche de Tahiti",
        "username": "ladepeche_tahiti",
        "picture": "https://ui-avatars.com/api/?name=DT&background=1A1A2E&color=fff&bold=true&size=200",
        "bio": "Quotidien d'information de Polynésie française depuis 1964",
        "is_verified": True,
        "is_official_media": True,
        "followers_count": 32000,
        "following_count": 95
    },
    {
        "user_id": "fenua_asso_heiva",
        "email": "contact@heiva.pf",
        "name": "Heiva i Tahiti",
        "username": "heiva_tahiti",
        "picture": "https://ui-avatars.com/api/?name=HT&background=FF1493&color=fff&bold=true&size=200",
        "bio": "Festival culturel polynésien 🌺 Ori Tahiti • Chants • Traditions",
        "is_verified": True,
        "is_association": True,
        "followers_count": 56000,
        "following_count": 200
    },
    {
        "user_id": "fenua_asso_taurumi",
        "email": "contact@taurumi.pf",
        "name": "Taurumi Tahiti",
        "username": "taurumi_tahiti",
        "picture": "https://ui-avatars.com/api/?name=TT&background=00CED1&color=fff&bold=true&size=200",
        "bio": "Association de massage traditionnel polynésien 🙌 Bien-être • Tradition",
        "is_verified": True,
        "is_association": True,
        "followers_count": 12000,
        "following_count": 350
    },
    {
        "user_id": "fenua_asso_vahine",
        "email": "contact@vahine-tahiti.pf",
        "name": "Vahine Tahiti",
        "username": "vahine_tahiti",
        "picture": "https://ui-avatars.com/api/?name=VT&background=9400D3&color=fff&bold=true&size=200",
        "bio": "Promotion de la culture polynésienne et de la danse Ori Tahiti 💃🌺",
        "is_verified": True,
        "is_association": True,
        "followers_count": 28000,
        "following_count": 180
    },
    {
        "user_id": "fenua_tourism",
        "email": "contact@tahiti-tourisme.pf",
        "name": "Tahiti Tourisme",
        "username": "tahiti_tourisme",
        "picture": "https://ui-avatars.com/api/?name=TT&background=FFD700&color=000&bold=true&size=200",
        "bio": "Découvrez les îles de la Polynésie française 🏝️ #TahitiEtSesÎles",
        "is_verified": True,
        "is_official": True,
        "followers_count": 125000,
        "following_count": 50
    },
    {
        "user_id": "fenua_sport_surf",
        "email": "contact@surfingpf.com",
        "name": "Fédération Tahitienne de Surf",
        "username": "surf_tahiti",
        "picture": "https://ui-avatars.com/api/?name=FS&background=00CED1&color=fff&bold=true&size=200",
        "bio": "Surf, bodyboard, longboard en Polynésie 🏄 Teahupo'o • Papara • Taapuna",
        "is_verified": True,
        "is_association": True,
        "followers_count": 45000,
        "following_count": 150
    },
    {
        "user_id": "fenua_music_tahiti",
        "email": "contact@musique-polynesie.pf",
        "name": "Musique Polynésienne",
        "username": "musique_maohi",
        "picture": "https://ui-avatars.com/api/?name=MP&background=FF6B35&color=fff&bold=true&size=200",
        "bio": "Ukulélé • Guitare • Himene • To'ere 🎸🎶 La musique du Fenua",
        "is_verified": True,
        "followers_count": 38000,
        "following_count": 280
    }
]

# Polynesian Posts with real content
POLYNESIAN_POSTS = [
    # Tahiti Infos - News
    {
        "user_id": "fenua_media_tahiti",
        "content_type": "photo",
        "media_url": "https://images.unsplash.com/photo-1589197331516-4d84b72ebde3?w=800",
        "caption": "🌴 Nouvelle journée ensoleillée sur Papeete ! La capitale de la Polynésie française s'éveille sous un ciel magnifique. Bonne journée à tous les Polynésiens ! #Tahiti #Papeete #PolynésieFrançaise",
        "location": "Papeete",
        "coordinates": {"lat": -17.5516, "lng": -149.5585},
        "likes_count": 1234,
        "comments_count": 89
    },
    {
        "user_id": "fenua_media_tahiti",
        "content_type": "link",
        "media_url": "https://img.youtube.com/vi/hTGJfRPLe08/maxresdefault.jpg",
        "external_link": "https://www.youtube.com/watch?v=hTGJfRPLe08",
        "link_type": "youtube",
        "caption": "📺 REPLAY : Les temps forts du Heiva i Tahiti 2024 ! Revivez les plus belles performances de danse et de chant. #Heiva #OriTahiti #Culture",
        "location": "To'atā, Papeete",
        "coordinates": {"lat": -17.5350, "lng": -149.5695},
        "likes_count": 3456,
        "comments_count": 234
    },
    
    # Polynésie la 1ère
    {
        "user_id": "fenua_media_polynesie",
        "content_type": "photo",
        "media_url": "https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=800",
        "caption": "🎬 Ce soir à 19h30 sur Polynésie la 1ère : documentaire exceptionnel sur les Marquises, terre des hommes. Ne manquez pas ce voyage au cœur de Nuku Hiva ! #Marquises #Documentaire #Polynesie1ere",
        "location": "Nuku Hiva",
        "coordinates": {"lat": -8.8667, "lng": -140.1000},
        "likes_count": 2890,
        "comments_count": 156
    },
    {
        "user_id": "fenua_media_polynesie",
        "content_type": "photo",
        "media_url": "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=800",
        "caption": "🌊 Alerte météo : houle australe attendue sur les côtes sud de Tahiti et Moorea. Soyez prudents ! Les hauteurs de vagues pourraient atteindre 3 à 4 mètres. #Météo #Tahiti #Sécurité",
        "location": "Tahiti",
        "coordinates": {"lat": -17.6509, "lng": -149.4260},
        "likes_count": 567,
        "comments_count": 45
    },
    
    # Heiva i Tahiti
    {
        "user_id": "fenua_asso_heiva",
        "content_type": "photo",
        "media_url": "https://images.unsplash.com/photo-1612708437841-085ba65e370b?w=800",
        "caption": "💃 Les inscriptions pour le Heiva i Tahiti 2025 sont ouvertes ! Groupes de danse, chanteurs, artisans... Rejoignez-nous pour célébrer notre culture ! Inscriptions sur heiva.pf #Heiva2025 #OriTahiti #CulturePolynésienne",
        "location": "Papeete",
        "coordinates": {"lat": -17.5350, "lng": -149.5695},
        "likes_count": 4521,
        "comments_count": 312
    },
    {
        "user_id": "fenua_asso_heiva",
        "content_type": "video",
        "media_url": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800",
        "caption": "🔥 Otea de feu ! Regardez cette performance incroyable du groupe Tamariki Poerani. La puissance et la grâce de l'Ori Tahiti à son apogée ! 🌺 #Otea #OriTahiti #Heiva",
        "location": "To'atā",
        "coordinates": {"lat": -17.5350, "lng": -149.5695},
        "likes_count": 6789,
        "comments_count": 456
    },
    
    # Tahiti Tourisme
    {
        "user_id": "fenua_tourism",
        "content_type": "photo",
        "media_url": "https://images.unsplash.com/photo-1589197331516-4d84b72ebde3?w=800",
        "caption": "🏝️ Bora Bora, la perle du Pacifique. Ses eaux turquoise et son lagon mythique vous attendent pour des vacances inoubliables ! Réservez votre séjour sur tahiti-tourisme.pf #BoraBora #Tahiti #Vacances #Paradise",
        "location": "Bora Bora",
        "coordinates": {"lat": -16.5004, "lng": -151.7415},
        "likes_count": 12456,
        "comments_count": 678
    },
    {
        "user_id": "fenua_tourism",
        "content_type": "photo",
        "media_url": "https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=800",
        "caption": "🌅 Lever de soleil sur Moorea, l'île sœur de Tahiti. Un spectacle naturel à couper le souffle chaque matin. Venez vivre cette magie ! #Moorea #Sunrise #TahitiTourisme",
        "location": "Moorea",
        "coordinates": {"lat": -17.5388, "lng": -149.8295},
        "likes_count": 8934,
        "comments_count": 423
    },
    
    # Surf Tahiti
    {
        "user_id": "fenua_sport_surf",
        "content_type": "photo",
        "media_url": "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800",
        "caption": "🏄 Teahupo'o aujourd'hui : conditions épiques avec une houle de 2m50 ! Les surfeurs locaux ont régalé. RDV demain pour la compétition amateur. #Teahupoo #Surf #Tahiti #Waves",
        "location": "Teahupo'o",
        "coordinates": {"lat": -17.8539, "lng": -149.2572},
        "likes_count": 5678,
        "comments_count": 234
    },
    {
        "user_id": "fenua_sport_surf",
        "content_type": "link",
        "media_url": "https://img.youtube.com/vi/MGPWT9TKDSA/maxresdefault.jpg",
        "external_link": "https://www.youtube.com/watch?v=MGPWT9TKDSA",
        "link_type": "youtube",
        "caption": "🌊 Les plus grosses vagues de Teahupo'o en vidéo ! Cette compilation montre pourquoi ce spot est considéré comme le plus dangereux au monde. Respect aux surfeurs ! 🤙 #Teahupoo #BigWaves #Surf",
        "location": "Teahupo'o",
        "coordinates": {"lat": -17.8539, "lng": -149.2572},
        "likes_count": 9876,
        "comments_count": 567
    },
    
    # Musique Polynésienne
    {
        "user_id": "fenua_music_tahiti",
        "content_type": "photo",
        "media_url": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800",
        "caption": "🎸 Concert gratuit ce samedi au Parc Bougainville ! Venez écouter les meilleurs artistes polynésiens : ukulélé, guitare, himene... Ambiance garantie ! 19h-23h #Musique #Concert #Tahiti",
        "location": "Parc Bougainville, Papeete",
        "coordinates": {"lat": -17.5350, "lng": -149.5695},
        "likes_count": 1890,
        "comments_count": 98
    },
    {
        "user_id": "fenua_music_tahiti",
        "content_type": "link",
        "media_url": "https://img.youtube.com/vi/T9PFzLdXnfo/maxresdefault.jpg",
        "external_link": "https://www.youtube.com/watch?v=T9PFzLdXnfo",
        "link_type": "youtube",
        "caption": "🎶 Écoutez 'E Vahine Maohi' - un classique de la musique polynésienne ! Cette chanson célèbre la beauté des femmes de nos îles. Partagez si vous aimez ! ❤️ #Himene #MusiquePolynesienne",
        "location": "Tahiti",
        "coordinates": {"lat": -17.5516, "lng": -149.5585},
        "likes_count": 4567,
        "comments_count": 234
    },
    
    # Vahine Tahiti
    {
        "user_id": "fenua_asso_vahine",
        "content_type": "photo",
        "media_url": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800",
        "caption": "🌺 Cours de Ori Tahiti tous les mercredis et samedis ! Débutants bienvenus. Apprenez les bases de la danse traditionnelle polynésienne avec nos professeures expérimentées. Inscriptions ouvertes ! #OriTahiti #Danse #Tahiti",
        "location": "Papeete",
        "coordinates": {"lat": -17.5516, "lng": -149.5585},
        "likes_count": 2678,
        "comments_count": 145
    },
    
    # Taurumi Tahiti
    {
        "user_id": "fenua_asso_taurumi",
        "content_type": "photo",
        "media_url": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800",
        "caption": "🙌 Découvrez le Taurumi, le massage traditionnel polynésien. Nos praticiens vous accueillent pour un moment de détente et de bien-être ancestral. Réservations : taurumi-tahiti.pf #Taurumi #Massage #BienEtre #Tahiti",
        "location": "Papeete",
        "coordinates": {"lat": -17.5516, "lng": -149.5585},
        "likes_count": 1567,
        "comments_count": 78
    }
]

# Function to generate post_id
def generate_post_id():
    return f"post_{uuid.uuid4().hex[:12]}"

# Function to get random time in past days
def get_random_past_time(days_ago_max=30):
    days = random.randint(0, days_ago_max)
    hours = random.randint(0, 23)
    minutes = random.randint(0, 59)
    return datetime.now(timezone.utc) - timedelta(days=days, hours=hours, minutes=minutes)

# Build complete posts with all fields
def build_seed_posts():
    posts = []
    for post_data in POLYNESIAN_POSTS:
        post = {
            "post_id": generate_post_id(),
            "user_id": post_data["user_id"],
            "content_type": post_data["content_type"],
            "media_url": post_data["media_url"],
            "thumbnail_url": post_data.get("thumbnail_url"),
            "caption": post_data["caption"],
            "location": post_data.get("location"),
            "coordinates": post_data.get("coordinates"),
            "external_link": post_data.get("external_link"),
            "link_type": post_data.get("link_type"),
            "likes_count": post_data.get("likes_count", random.randint(100, 5000)),
            "comments_count": 0,  # always start at 0 — sync with real comments collection
            "shares_count": random.randint(5, 100),
            "views_count": random.randint(500, 10000),
            "reactions": {
                "like": random.randint(50, 2000),
                "love": random.randint(20, 500),
                "haha": random.randint(5, 100),
                "wow": random.randint(10, 200),
                "fire": random.randint(30, 800)
            },
            "is_ad": False,
            "is_featured": random.random() > 0.7,
            "moderation_status": "approved",
            "created_at": get_random_past_time().isoformat()
        }
        posts.append(post)
    
    # Sort by created_at (newest first)
    posts.sort(key=lambda x: x["created_at"], reverse=True)
    return posts

def build_seed_accounts():
    accounts = []
    for account in POLYNESIAN_ACCOUNTS:
        user = {
            **account,
            "password_hash": "seeded_account_no_login",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=random.randint(100, 365))).isoformat(),
            "posts_count": random.randint(50, 500),
            "is_seeded": True
        }
        accounts.append(user)
    return accounts


# ====== Demo products for the Polynesian marketplace ======
# These are showcase products so the marketplace is not empty in production.
# Vendors can replace them with their own listings later.
SEED_PRODUCTS = [
    {
        "title": "Collier Perle de Tahiti AAA",
        "description": "Magnifique collier en or 18k orné d'une perle noire de Tahiti grade AAA. Provenance Rangiroa.",
        "price": 45000, "currency": "XPF", "category": "perles",
        "image_url": "/products/prod_seed_00.png",
        "location": "Papeete, Tahiti", "stock": 5,
    },
    {
        "title": "Monoï de Tahiti pur Tiare",
        "description": "Monoï de Tahiti AOC 100% naturel parfumé à la fleur de Tiare. 100ml.",
        "price": 1800, "currency": "XPF", "category": "monoi",
        "image_url": "/products/prod_seed_01.png",
        "location": "Moorea", "stock": 50,
    },
    {
        "title": "Paréo traditionnel tahitien",
        "description": "Paréo en coton imprimé motifs polynésiens. Tissu doux, idéal plage et lagon.",
        "price": 2500, "currency": "XPF", "category": "vetements",
        "image_url": "/products/prod_seed_02.png",
        "location": "Bora Bora", "stock": 30,
    },
    {
        "title": "Sculpture Tiki en bois de tou",
        "description": "Tiki sculpté à la main par un artisan des îles Marquises. Bois de tou, 25cm.",
        "price": 12000, "currency": "XPF", "category": "artisanat",
        "image_url": "/products/prod_seed_03.png",
        "location": "Hiva Oa, Marquises", "stock": 8,
    },
    {
        "title": "Bracelet en nacre de Tahiti",
        "description": "Bracelet artisanal serti de nacre polynésienne. Cordon ajustable.",
        "price": 6500, "currency": "XPF", "category": "bijoux",
        "image_url": "/products/prod_seed_04.png",
        "location": "Tahaa", "stock": 15,
    },
    {
        "title": "Pareo de fête en tissu tapa",
        "description": "Pièce d'exception en tapa, peinte main avec motifs polynésiens traditionnels.",
        "price": 18000, "currency": "XPF", "category": "vetements",
        "image_url": "/products/prod_seed_05.png",
        "location": "Tahiti", "stock": 4,
    },
    {
        "title": "Vanille de Tahaa premium",
        "description": "Gousses de vanille de Tahaa AOC, séchées au soleil. Sachet de 5 gousses.",
        "price": 3500, "currency": "XPF", "category": "artisanat",
        "image_url": "/products/prod_seed_06.png",
        "location": "Tahaa", "stock": 25,
    },
    {
        "title": "Huile précieuse de Tamanu",
        "description": "Huile de Tamanu pure, vertus cicatrisantes. Issue d'arbres centenaires.",
        "price": 2200, "currency": "XPF", "category": "monoi",
        "image_url": "/products/prod_seed_07.png",
        "location": "Raiatea", "stock": 40,
    },
    {
        "title": "Couronne de fleurs tiare",
        "description": "Couronne traditionnelle tressée à la main avec des fleurs de tiare fraîches et feuilles tropicales. Parfaite pour cérémonies et fêtes.",
        "price": 3500, "currency": "XPF", "category": "artisanat",
        "image_url": "/products/prod_seed_08.png",
        "location": "Papeete, Tahiti", "stock": 12,
    },
    {
        "title": "Sel de Tahiti Tumu",
        "description": "Sel de mer naturel récolté artisanalement sur les îles de Tahiti. Riche en minéraux, parfait pour la cuisine polynésienne.",
        "price": 1500, "currency": "XPF", "category": "artisanat",
        "image_url": "/products/prod_seed_09.png",
        "location": "Tumu, Tahiti", "stock": 60,
    },
    {
        "title": "Huile de coco vierge bio",
        "description": "Huile de coco vierge pressée à froid, 100% bio. Idéale pour cuisine, soin des cheveux et de la peau. 250ml.",
        "price": 2800, "currency": "XPF", "category": "monoi",
        "image_url": "/products/prod_seed_10.png",
        "location": "Moorea", "stock": 45,
    },
    {
        "title": "Bijoux en coquillage cauri",
        "description": "Parure artisanale en coquillages cauri polis, assemblés sur cordon naturel. Collier + bracelet assortis.",
        "price": 5500, "currency": "XPF", "category": "bijoux",
        "image_url": "/products/prod_seed_11.png",
        "location": "Bora Bora", "stock": 18,
    },
    {
        "title": "T-shirt Manu oiseau polynésien",
        "description": "T-shirt en coton bio imprimé motif Manu (oiseau sacré polynésien). Tailles S à XXL. Made in Tahiti.",
        "price": 3200, "currency": "XPF", "category": "vetements",
        "image_url": "/products/prod_seed_12.png",
        "location": "Papeete, Tahiti", "stock": 35,
    },
    {
        "title": "Savon au monoï de Tahiti",
        "description": "Savon artisanal saponifié à froid, enrichi au monoï de Tahiti et à la fleur de tiare. Peau douce et parfumée. 100g.",
        "price": 1200, "currency": "XPF", "category": "monoi",
        "image_url": "/products/prod_seed_13.png",
        "location": "Tahiti", "stock": 80,
    },
    {
        "title": "Panier tressé en pandanus",
        "description": "Panier traditionnel tressé à la main en feuilles de pandanus séchées. Solide, naturel et décoratif. 30x25cm.",
        "price": 4800, "currency": "XPF", "category": "artisanat",
        "image_url": "/products/prod_seed_14.png",
        "location": "Huahine", "stock": 20,
    },
    {
        "title": "Ukulélé tahitien 8 cordes",
        "description": "Ukulélé traditionnel tahitien en bois de tou, 8 cordes en nylon. Son brillant et chaleureux. Fabriqué main.",
        "price": 15000, "currency": "XPF", "category": "artisanat",
        "image_url": "/products/prod_seed_15.png",
        "location": "Tahiti", "stock": 6,
    },
    {
        "title": "Hei mata'i - bijou hameçon",
        "description": "Pendentif traditionnel hei mata'i sculpté à la main en os, symbole de chance et de prospérité. Cordon en cuir.",
        "price": 7500, "currency": "XPF", "category": "bijoux",
        "image_url": "/products/prod_seed_16.png",
        "location": "Marquises", "stock": 10,
    },
    {
        "title": "Café de Taravao premium",
        "description": "Grains de café 100% arabica cultivés sur les plateaux de Taravao. Torréfaction artisanale, notes chocolatées. Paquet 250g.",
        "price": 2400, "currency": "XPF", "category": "artisanat",
        "image_url": "/products/prod_seed_17.png",
        "location": "Taravao, Tahiti", "stock": 30,
    },
]


def build_seed_products():
    """Build a list of seed products for the marketplace.
    Uses deterministic product_ids so AI-generated images in
    /app/frontend/public/products/prod_seed_NN.png stay matched after redeploy."""
    products = []
    for i, p in enumerate(SEED_PRODUCTS):
        # Build images list from the deterministic image_url
        img_url = p.get("image_url")
        products.append({
            "product_id": f"prod_seed_{i:02d}",
            "vendor_id": "fenua_artisans",
            "is_available": True,
            "is_seeded": True,
            "tags": [p["category"], "tahiti", "polynesie"],
            "views_count": random.randint(50, 500),
            "created_at": get_random_past_time().isoformat(),
            "images": [img_url] if img_url else [],
            **p,
        })
    return products

