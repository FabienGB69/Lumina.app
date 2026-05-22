"""78-card Rider-Waite-Smith Tarot deck data."""

MAJOR_ARCANA = [
    {"id": "00-fool", "name": "The Fool", "arcana": "major", "number": 0,
     "keywords_upright": ["beginnings", "innocence", "spontaneity", "free spirit"],
     "keywords_reversed": ["recklessness", "naivety", "risk-taking"]},
    {"id": "01-magician", "name": "The Magician", "arcana": "major", "number": 1,
     "keywords_upright": ["manifestation", "willpower", "skill", "concentration"],
     "keywords_reversed": ["manipulation", "untapped talents", "poor planning"]},
    {"id": "02-high-priestess", "name": "The High Priestess", "arcana": "major", "number": 2,
     "keywords_upright": ["intuition", "mystery", "subconscious", "inner voice"],
     "keywords_reversed": ["secrets", "disconnection", "withdrawal"]},
    {"id": "03-empress", "name": "The Empress", "arcana": "major", "number": 3,
     "keywords_upright": ["abundance", "fertility", "nurture", "creation"],
     "keywords_reversed": ["dependence", "smothering", "creative block"]},
    {"id": "04-emperor", "name": "The Emperor", "arcana": "major", "number": 4,
     "keywords_upright": ["authority", "structure", "control", "fatherhood"],
     "keywords_reversed": ["tyranny", "rigidity", "domination"]},
    {"id": "05-hierophant", "name": "The Hierophant", "arcana": "major", "number": 5,
     "keywords_upright": ["tradition", "conformity", "spirituality", "institutions"],
     "keywords_reversed": ["rebellion", "subversiveness", "new approaches"]},
    {"id": "06-lovers", "name": "The Lovers", "arcana": "major", "number": 6,
     "keywords_upright": ["union", "partnership", "choices", "alignment"],
     "keywords_reversed": ["disharmony", "imbalance", "misalignment"]},
    {"id": "07-chariot", "name": "The Chariot", "arcana": "major", "number": 7,
     "keywords_upright": ["determination", "control", "willpower", "victory"],
     "keywords_reversed": ["lack of direction", "scattered energy"]},
    {"id": "08-strength", "name": "Strength", "arcana": "major", "number": 8,
     "keywords_upright": ["courage", "patience", "compassion", "inner strength"],
     "keywords_reversed": ["self-doubt", "weakness", "raw emotion"]},
    {"id": "09-hermit", "name": "The Hermit", "arcana": "major", "number": 9,
     "keywords_upright": ["introspection", "solitude", "inner guidance"],
     "keywords_reversed": ["isolation", "loneliness", "withdrawal"]},
    {"id": "10-wheel", "name": "Wheel of Fortune", "arcana": "major", "number": 10,
     "keywords_upright": ["cycles", "change", "fate", "destiny"],
     "keywords_reversed": ["bad luck", "resistance to change", "breaking cycles"]},
    {"id": "11-justice", "name": "Justice", "arcana": "major", "number": 11,
     "keywords_upright": ["fairness", "truth", "cause and effect", "law"],
     "keywords_reversed": ["unfairness", "lack of accountability", "dishonesty"]},
    {"id": "12-hanged-man", "name": "The Hanged Man", "arcana": "major", "number": 12,
     "keywords_upright": ["surrender", "new perspective", "letting go"],
     "keywords_reversed": ["stalling", "indecision", "resistance"]},
    {"id": "13-death", "name": "Death", "arcana": "major", "number": 13,
     "keywords_upright": ["endings", "transformation", "transition"],
     "keywords_reversed": ["resistance to change", "stagnation"]},
    {"id": "14-temperance", "name": "Temperance", "arcana": "major", "number": 14,
     "keywords_upright": ["balance", "moderation", "patience", "purpose"],
     "keywords_reversed": ["imbalance", "excess", "self-healing"]},
    {"id": "15-devil", "name": "The Devil", "arcana": "major", "number": 15,
     "keywords_upright": ["attachment", "addiction", "restriction", "shadow self"],
     "keywords_reversed": ["release", "breaking free", "reclaiming power"]},
    {"id": "16-tower", "name": "The Tower", "arcana": "major", "number": 16,
     "keywords_upright": ["sudden change", "upheaval", "chaos", "revelation"],
     "keywords_reversed": ["averted disaster", "fear of change"]},
    {"id": "17-star", "name": "The Star", "arcana": "major", "number": 17,
     "keywords_upright": ["hope", "faith", "renewal", "spirituality"],
     "keywords_reversed": ["despair", "disconnection", "discouragement"]},
    {"id": "18-moon", "name": "The Moon", "arcana": "major", "number": 18,
     "keywords_upright": ["illusion", "fear", "intuition", "subconscious"],
     "keywords_reversed": ["release of fear", "inner confusion clearing"]},
    {"id": "19-sun", "name": "The Sun", "arcana": "major", "number": 19,
     "keywords_upright": ["joy", "success", "vitality", "celebration"],
     "keywords_reversed": ["temporary depression", "lack of clarity"]},
    {"id": "20-judgement", "name": "Judgement", "arcana": "major", "number": 20,
     "keywords_upright": ["awakening", "reckoning", "absolution", "rebirth"],
     "keywords_reversed": ["self-doubt", "ignoring the call", "lack of self-awareness"]},
    {"id": "21-world", "name": "The World", "arcana": "major", "number": 21,
     "keywords_upright": ["completion", "fulfillment", "wholeness", "achievement"],
     "keywords_reversed": ["incompletion", "shortcuts", "delays"]},
]


def _suit(suit_name, themes_up, themes_rev):
    cards = []
    names = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
             "Page", "Knight", "Queen", "King"]
    for i, n in enumerate(names, start=1):
        cid = f"{suit_name.lower()}-{i:02d}"
        cards.append({
            "id": cid,
            "name": f"{n} of {suit_name}",
            "arcana": "minor",
            "suit": suit_name.lower(),
            "rank": n,
            "number": i,
            "keywords_upright": themes_up,
            "keywords_reversed": themes_rev,
        })
    return cards


MINOR_ARCANA = (
    _suit("Cups", ["emotion", "love", "intuition", "relationships"],
                  ["repressed feelings", "emotional turbulence"])
    + _suit("Pentacles", ["material", "career", "money", "resources"],
                          ["financial loss", "instability", "greed"])
    + _suit("Swords", ["intellect", "communication", "conflict", "truth"],
                       ["confusion", "miscommunication", "cruelty"])
    + _suit("Wands", ["passion", "creativity", "action", "ambition"],
                      ["delay", "lack of direction", "burnout"])
)

DECK = MAJOR_ARCANA + MINOR_ARCANA

CARDS_BY_ID = {c["id"]: c for c in DECK}
