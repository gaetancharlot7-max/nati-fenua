"""
Dictionnaire de traduction Français ↔ Tahitien
===============================================
Dictionnaire intégré pour la traduction des mots et expressions courants.
"""

# Dictionnaire Français → Tahitien
FR_TO_TAH = {
    # Salutations
    "bonjour": "ia ora na",
    "bonsoir": "ia ora na",
    "salut": "ia ora na",
    "au revoir": "nana",
    "à bientôt": "a faahou mai",
    "bienvenue": "maeva",
    "merci": "mauruuru",
    "merci beaucoup": "mauruuru roa",
    "s'il vous plaît": "fa'aitoito",
    "de rien": "aita pe'ape'a",
    "excusez-moi": "arofa mai",
    "pardon": "arofa mai",
    
    # Expressions courantes
    "comment allez-vous": "e aha te huru",
    "comment ça va": "e aha te huru",
    "ça va bien": "maita'i",
    "très bien": "maita'i roa",
    "je vais bien": "maita'i vau",
    "oui": "e",
    "non": "aita",
    "peut-être": "penei'a",
    "d'accord": "e",
    "c'est bon": "maita'i",
    "c'est beau": "nehenehe",
    "c'est délicieux": "mea ma'a maita'i",
    
    # Famille
    "famille": "fetii",
    "père": "metua tane",
    "mère": "metua vahine",
    "frère": "taea'e",
    "sœur": "tuahine",
    "enfant": "tamarii",
    "enfants": "tamarii",
    "bébé": "aiú",
    "ami": "hoa",
    "amie": "hoa",
    "amis": "mau hoa",
    "amour": "here",
    "je t'aime": "ua here au ia oe",
    
    # Nature
    "mer": "moana",
    "océan": "moana",
    "plage": "tahatai",
    "île": "motu",
    "montagne": "mou'a",
    "soleil": "ra'a",
    "lune": "avae",
    "étoile": "feti'a",
    "ciel": "ra'i",
    "nuage": "ata",
    "pluie": "ua",
    "vent": "mata'i",
    "fleur": "tiare",
    "arbre": "ra'au",
    "cocotier": "tumu ha'ari",
    "noix de coco": "ha'ari",
    "poisson": "i'a",
    "requin": "ma'o",
    "tortue": "honu",
    "dauphin": "ou'a",
    "baleine": "tohora",
    "oiseau": "manu",
    "eau": "pape",
    "feu": "ahi",
    "terre": "fenua",
    
    # Nourriture
    "manger": "amu",
    "boire": "inu",
    "nourriture": "ma'a",
    "fruit": "mau mā'a",
    "banane": "mei'a",
    "ananas": "painapo",
    "mangue": "vi",
    "papaye": "i'ita",
    "pain": "faraoa",
    "riz": "raiti",
    "poulet": "moa",
    "porc": "pua'a",
    "poisson cru": "i'a ota",
    "lait de coco": "miti ha'ari",
    
    # Corps
    "tête": "upo'o",
    "yeux": "mata",
    "oreilles": "tari'a",
    "nez": "ihu",
    "bouche": "vaha",
    "main": "rima",
    "pied": "avae",
    "cœur": "aau",
    
    # Couleurs
    "blanc": "te'a",
    "noir": "ere'ere",
    "rouge": "ute ute",
    "bleu": "ninamu",
    "vert": "matie",
    "jaune": "rearea",
    
    # Nombres
    "un": "ho'e",
    "deux": "piti",
    "trois": "toru",
    "quatre": "maha",
    "cinq": "pae",
    "six": "ono",
    "sept": "hitu",
    "huit": "va'u",
    "neuf": "iva",
    "dix": "ahuru",
    
    # Temps
    "aujourd'hui": "i teie nei mahana",
    "demain": "ananahi",
    "hier": "inanahi",
    "jour": "mahana",
    "nuit": "po",
    "matin": "po'ipo'i",
    "soir": "ahiahi",
    "semaine": "hepetoma",
    "mois": "avae",
    "année": "matahiti",
    
    # Lieux
    "maison": "fare",
    "village": "oire",
    "route": "purumu",
    "magasin": "fare toa",
    "marché": "fare toa",
    "église": "fare pure",
    "école": "fare ha'api'ira'a",
    "hôpital": "fare ma'i",
    "aéroport": "taura'a manureva",
    
    # Actions
    "aller": "haere",
    "venir": "haere mai",
    "partir": "haere",
    "arriver": "tae",
    "voir": "hi'o",
    "regarder": "hi'o",
    "écouter": "fa'aro'o",
    "parler": "parau",
    "dormir": "ta'oto",
    "danser": "ori",
    "chanter": "himene",
    "nager": "aau",
    "pêcher": "tautai",
    "travailler": "ohipa",
    "jouer": "ha'uti",
    
    # Adjectifs
    "grand": "rahi",
    "petit": "iti",
    "beau": "nehenehe",
    "belle": "nehenehe",
    "bon": "maita'i",
    "mauvais": "ino",
    "nouveau": "api",
    "vieux": "tahito",
    "chaud": "mahana",
    "froid": "to'eto'e",
    "rapide": "vitiviti",
    "lent": "taere",
    
    # Questions
    "quoi": "e aha",
    "qui": "o vai",
    "où": "i hea",
    "quand": "a fea",
    "pourquoi": "no te aha",
    "comment": "na hea",
    "combien": "e hia",
    
    # Expressions Hui Fenua
    "roulotte": "roulotte",
    "food truck": "roulotte",
    "surf": "hoe",
    "pirogue": "va'a",
    "tatouage": "tatau",
    "danse": "ori tahiti",
    "musique": "himene",
    "fête": "arearea",
    "mariage": "fa'aipoipora'a",
    "anniversaire": "mahana fanau",
}

# Dictionnaire Tahitien → Français (inversé)
TAH_TO_FR = {v: k for k, v in FR_TO_TAH.items()}

# Ajouts spécifiques tahitien → français
TAH_TO_FR.update({
    "ia ora na": "bonjour",
    "mauruuru": "merci",
    "maeva": "bienvenue",
    "nana": "au revoir",
    "maita'i": "bien / bon",
    "nehenehe": "beau / belle",
    "fenua": "terre / pays",
    "motu": "île / îlot",
    "moana": "océan / mer",
    "tiare": "fleur (gardénia)",
    "vahine": "femme",
    "tane": "homme",
    "tamariki": "enfants",
    "fare": "maison",
    "himene": "chant / musique",
    "ori": "danse",
    "tatau": "tatouage",
    "va'a": "pirogue",
    "poe": "perle",
    "monoi": "huile parfumée",
    "pareo": "paréo",
    "ukulele": "ukulélé",
    "mana": "pouvoir spirituel",
    "tapu": "sacré / interdit",
    "noa": "libre / ordinaire",
    "rahui": "interdiction temporaire",
    "marae": "temple ancien",
    "tiki": "statue sacrée",
    "pahu": "tambour",
    "toere": "tambour à fente",
})


def translate_word(word: str, direction: str = "fr_to_tah") -> str:
    """
    Traduit un mot simple.
    
    Args:
        word: Mot à traduire
        direction: "fr_to_tah" ou "tah_to_fr"
    
    Returns:
        Traduction ou mot original si non trouvé
    """
    word_lower = word.lower().strip()
    
    if direction == "fr_to_tah":
        return FR_TO_TAH.get(word_lower, word)
    else:
        return TAH_TO_FR.get(word_lower, word)


def translate_text(text: str, direction: str = "fr_to_tah") -> dict:
    """
    Traduit un texte en utilisant le dictionnaire.
    Remplace les mots/expressions connus, garde les autres intacts.
    
    Args:
        text: Texte à traduire
        direction: "fr_to_tah" ou "tah_to_fr"
    
    Returns:
        dict avec texte traduit et statistiques
    """
    if not text:
        return {"translated": "", "words_translated": 0, "total_words": 0}
    
    dictionary = FR_TO_TAH if direction == "fr_to_tah" else TAH_TO_FR
    
    # Trier les expressions par longueur (plus longues d'abord)
    sorted_phrases = sorted(dictionary.keys(), key=len, reverse=True)
    
    translated = text
    words_translated = 0
    
    # D'abord, remplacer les expressions multi-mots
    for phrase in sorted_phrases:
        if ' ' in phrase:  # Expression multi-mots
            if phrase.lower() in translated.lower():
                # Préserver la casse du premier caractère
                replacement = dictionary[phrase]
                # Remplacer de manière insensible à la casse
                import re
                pattern = re.compile(re.escape(phrase), re.IGNORECASE)
                if pattern.search(translated):
                    translated = pattern.sub(replacement, translated)
                    words_translated += 1
    
    # Ensuite, remplacer les mots simples
    words = translated.split()
    result_words = []
    
    for word in words:
        # Extraire la ponctuation
        prefix = ""
        suffix = ""
        clean_word = word
        
        while clean_word and not clean_word[0].isalnum():
            prefix += clean_word[0]
            clean_word = clean_word[1:]
        
        while clean_word and not clean_word[-1].isalnum():
            suffix = clean_word[-1] + suffix
            clean_word = clean_word[:-1]
        
        # Chercher la traduction
        word_lower = clean_word.lower()
        if word_lower in dictionary:
            translation = dictionary[word_lower]
            # Préserver la casse
            if clean_word[0].isupper() if clean_word else False:
                translation = translation.capitalize()
            result_words.append(prefix + translation + suffix)
            words_translated += 1
        else:
            result_words.append(word)
    
    final_text = ' '.join(result_words)
    
    return {
        "original": text,
        "translated": final_text,
        "direction": direction,
        "words_translated": words_translated,
        "total_words": len(words),
        "translation_coverage": round(words_translated / len(words) * 100, 1) if words else 0
    }


def get_dictionary_stats() -> dict:
    """Retourne les statistiques du dictionnaire"""
    return {
        "french_words": len(FR_TO_TAH),
        "tahitian_words": len(TAH_TO_FR),
        "categories": [
            "Salutations", "Expressions", "Famille", "Nature",
            "Nourriture", "Corps", "Couleurs", "Nombres",
            "Temps", "Lieux", "Actions", "Adjectifs", "Questions"
        ]
    }


def get_common_phrases() -> list:
    """Retourne les phrases courantes pour l'apprentissage"""
    return [
        {"french": "Bonjour", "tahitian": "Ia ora na", "context": "Salutation"},
        {"french": "Merci beaucoup", "tahitian": "Mauruuru roa", "context": "Remerciement"},
        {"french": "Bienvenue", "tahitian": "Maeva", "context": "Accueil"},
        {"french": "Au revoir", "tahitian": "Nana", "context": "Départ"},
        {"french": "Je t'aime", "tahitian": "Ua here au ia oe", "context": "Amour"},
        {"french": "C'est beau", "tahitian": "Nehenehe", "context": "Compliment"},
        {"french": "Comment ça va ?", "tahitian": "E aha te huru?", "context": "Question"},
        {"french": "Très bien", "tahitian": "Maita'i roa", "context": "Réponse"},
        {"french": "La terre", "tahitian": "Te Fenua", "context": "Nature"},
        {"french": "L'océan", "tahitian": "Te Moana", "context": "Nature"},
    ]
