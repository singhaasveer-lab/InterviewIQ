"""Instant aptitude questions with no AI call.

Quantitative and most Logical questions are generated from templates, with the
answer computed in code, so the answer key is correct by construction.
Verbal and a few Logical items come from a small hand-written bank.
"""
import random
from typing import Callable, Dict, List, Optional

LEVEL = {"Easy": 0, "Medium": 1, "Hard": 2}
SCALE = [1, 2, 5]  # number magnitude by difficulty

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def _fmt(value: float) -> str:
    if abs(value - round(value)) < 1e-9:
        return f"{int(round(value)):,}".replace(",", "")
    return f"{value:.2f}".rstrip("0").rstrip(".")


def _options(correct: float, step: float, *, minimum: Optional[float] = 0, suffix: str = "", prefix: str = "") -> tuple:
    """Return (options, correct_index) with 3 distinct plausible distractors."""
    step = max(step, 1)
    candidates: List[float] = []
    for k in (1, -1, 2, -2, 3, -3, 4):
        value = correct + k * step
        if minimum is not None and value < minimum:
            continue
        if abs(value - correct) < 1e-9:
            continue
        candidates.append(value)
    random.shuffle(candidates)
    picked = [correct] + candidates[:3]
    random.shuffle(picked)
    labels = [f"{prefix}{_fmt(v)}{suffix}" for v in picked]
    return labels, picked.index(correct)


def _q(section, topic, question, options, correct_index, explanation, shortcut=""):
    return {
        "section": section,
        "topic": topic,
        "question": question,
        "options": options,
        "correct_index": correct_index,
        "explanation": explanation,
        "shortcut": shortcut,
    }


# ---------------------------------------------------------------- Quantitative


def _percentage(d):
    s = SCALE[d]
    p = random.choice([10, 15, 20, 25, 30, 40, 60, 75])
    n = random.choice(range(40, 401, 20)) * s
    ans = n * p / 100
    opts, idx = _options(ans, max(ans * 0.1, 2))
    return _q("Quantitative", "Percentages", f"What is {p}% of {n}?", opts, idx,
              f"{p}% of {n} = {p}/100 x {n} = {_fmt(ans)}.",
              "Find 10% by moving the decimal point, then build the percentage from it.")


def _percent_change(d):
    s = SCALE[d]
    old = random.choice(range(40, 401, 20)) * s
    pct = random.choice([10, 20, 25, 30, 40, 50])
    up = random.random() < 0.5
    new = old * (1 + pct / 100) if up else old * (1 - pct / 100)
    word = "increase" if up else "decrease"
    opts, idx = _options(pct, 5, minimum=1, suffix="%")
    return _q("Quantitative", "Percentage Change",
              f"A price changes from {_fmt(old)} to {_fmt(new)}. What is the percentage {word}?", opts, idx,
              f"Change = {_fmt(abs(new - old))}. Percentage = change / original x 100 = "
              f"{_fmt(abs(new - old))}/{_fmt(old)} x 100 = {pct}%.",
              "Always divide the change by the ORIGINAL value.")


def _ratio(d):
    a, b = random.choice([(1, 2), (2, 3), (3, 4), (3, 5), (4, 5), (2, 5), (3, 7)])
    k = random.randint(4, 30) * SCALE[d]
    total = (a + b) * k
    ans = b * k
    opts, idx = _options(ans, max(k, 2))
    return _q("Quantitative", "Ratios",
              f"{total} is divided in the ratio {a}:{b}. What is the larger share?", opts, idx,
              f"Total parts = {a}+{b} = {a + b}. One part = {total}/{a + b} = {k}. "
              f"Larger share = {b} x {k} = {ans}.",
              "Divide by the sum of the ratio parts first.")


def _average(d):
    avg = random.randint(20, 60) * SCALE[d]
    for _ in range(50):
        nums = [random.randint(max(5, avg - 15), avg + 15) for _ in range(4)]
        fifth = 5 * avg - sum(nums)
        if fifth > 0 and fifth not in nums:
            break
    else:
        return _average(d)
    opts, idx = _options(fifth, max(round(avg * 0.15), 2), minimum=1)
    return _q("Quantitative", "Averages",
              f"The average of five numbers is {avg}. Four of them are {', '.join(map(str, nums))}. "
              f"What is the fifth number?", opts, idx,
              f"Total of five = 5 x {avg} = {5 * avg}. Sum of four = {sum(nums)}. "
              f"Fifth = {5 * avg} - {sum(nums)} = {fifth}.",
              "Average x count gives the total.")


def _speed(d):
    v = random.choice(range(30, 91, 10)) * (1 if d < 2 else 2)
    t = random.choice([2, 3, 4, 5, 6])
    if random.random() < 0.5:
        ans = v * t
        opts, idx = _options(ans, v // 2 or 5, suffix=" km")
        return _q("Quantitative", "Speed & Distance",
                  f"A car travels at {v} km/h for {t} hours. How far does it go?", opts, idx,
                  f"Distance = speed x time = {v} x {t} = {ans} km.", "Distance = Speed x Time.")
    dist = v * t
    opts, idx = _options(t, 1, minimum=1, suffix=" hours")
    return _q("Quantitative", "Speed & Distance",
              f"How many hours does it take to cover {dist} km at {v} km/h?", opts, idx,
              f"Time = distance / speed = {dist} / {v} = {t} hours.", "Time = Distance / Speed.")


def _simple_interest(d):
    P = random.choice(range(1, 21)) * 1000 * SCALE[d]
    R = random.choice([5, 6, 8, 10, 12])
    T = random.choice([2, 3, 4, 5])
    ans = P * R * T // 100
    opts, idx = _options(ans, max(ans // 8, 10))
    return _q("Quantitative", "Simple Interest",
              f"What is the simple interest on {P} at {R}% per year for {T} years?", opts, idx,
              f"SI = P x R x T / 100 = {P} x {R} x {T} / 100 = {ans}.", "SI = PRT/100.")


def _profit_loss(d):
    cp = random.choice(range(2, 21)) * 100 * SCALE[d]
    p = random.choice([10, 20, 25, 30, 40])
    sp = cp * (100 + p) // 100
    if random.random() < 0.5:
        opts, idx = _options(sp, max(cp // 10, 10))
        return _q("Quantitative", "Profit & Loss",
                  f"An article costing {cp} is sold at a {p}% profit. What is the selling price?", opts, idx,
                  f"SP = CP x (100 + {p})/100 = {cp} x {100 + p}/100 = {sp}.", "SP = CP x (1 + profit%).")
    opts, idx = _options(cp, max(cp // 10, 10))
    return _q("Quantitative", "Profit & Loss",
              f"An article sold for {sp} gives a {p}% profit. What was its cost price?", opts, idx,
              f"CP = SP x 100/(100 + {p}) = {sp} x 100/{100 + p} = {cp}.", "CP = SP / (1 + profit%).")


def _time_work(d):
    x, y, together = random.choice([(12, 24, 8), (10, 15, 6), (20, 30, 12), (6, 3, 2), (12, 6, 4),
                                    (18, 9, 6), (30, 20, 12), (15, 10, 6), (60, 30, 20), (24, 8, 6)])
    opts, idx = _options(together, 1, minimum=1, suffix=" days")
    return _q("Quantitative", "Time & Work",
              f"A can finish a job in {x} days and B in {y} days. Working together, in how many days will they finish it?",
              opts, idx,
              f"Combined rate = 1/{x} + 1/{y} = {x + y}/{x * y} per day. "
              f"Time = {x * y}/{x + y} = {together} days.",
              "Together time = (x * y) / (x + y).")


# --------------------------------------------------------------------- Logical


def _series(d):
    kinds = [["arith"], ["arith", "geo", "square"], ["geo", "square", "second", "alt"]][d]
    kind = random.choice(kinds)
    if kind == "arith":
        a, diff = random.randint(1, 30), random.choice([2, 3, 4, 5, 6, 7, 9, 11, -2, -3])
        seq = [a + diff * i for i in range(6)]
        why = f"The series changes by {diff:+d} each time."
    elif kind == "geo":
        a, r = random.randint(1, 5), random.choice([2, 3])
        seq = [a * r ** i for i in range(6)]
        why = f"Each term is multiplied by {r}."
    elif kind == "square":
        c = random.randint(0, 5)
        seq = [(i + 1) ** 2 + c for i in range(6)]
        why = f"The terms are squares of 1, 2, 3, ... {'plus ' + str(c) if c else ''}".strip()
    elif kind == "second":
        a, k, s = random.randint(1, 10), random.randint(1, 4), random.randint(1, 3)
        seq, diff = [a], k
        for _ in range(5):
            seq.append(seq[-1] + diff)
            diff += s
        why = f"The differences themselves grow by {s} each step."
    else:  # alternating: two interleaved arithmetic series
        a, da, b, db = random.randint(1, 20), random.randint(2, 6), random.randint(30, 60), random.randint(2, 7)
        seq = []
        for i in range(3):
            seq += [a + da * i, b - db * i]
        why = f"Two series alternate: +{da} on odd places and -{db} on even places."
    shown, ans = seq[:5], seq[5]
    opts, idx = _options(ans, max(abs(ans) // 10, 2), minimum=None)
    return _q("Logical", "Number Series",
              f"What comes next? {', '.join(map(str, shown))}, ?", opts, idx,
              f"{why} So the next term is {ans}.",
              "Check differences first, then ratios, then squares.")


def _coding(d):
    word = random.choice(["BOX", "PEN", "SUN", "MAP", "CAT", "DOG", "FAN", "TEN", "KEY", "CUP"])
    target = random.choice(["MAP", "SKY", "LION", "FISH", "WORD", "TREE"])
    k = random.randint(1, 3)
    enc = lambda w: "".join(chr((ord(c) - 65 + k) % 26 + 65) for c in w)
    ans = enc(target)
    wrong = {enc(target[:-1]) + chr((ord(target[-1]) - 65 + k + 1) % 26 + 65),
             "".join(chr((ord(c) - 65 - k) % 26 + 65) for c in target),
             "".join(chr((ord(c) - 65 + k + 1) % 26 + 65) for c in target)}
    wrong.discard(ans)
    options = [ans] + list(wrong)[:3]
    while len(options) < 4:
        options.append("".join(random.sample(ans, len(ans))) + "X")
    random.shuffle(options)
    return _q("Logical", "Coding-Decoding",
              f"In a code, every letter is replaced by the letter {k} place{'s' if k > 1 else ''} ahead in the "
              f"alphabet, so {word} becomes {enc(word)}. How is {target} written in this code?",
              options, options.index(ans),
              f"Shift every letter of {target} forward by {k}: {target} -> {ans}.",
              "Write the alphabet position of each letter and add the shift.")


def _direction(d):
    a, b, h = random.choice([(3, 4, 5), (6, 8, 10), (5, 12, 13), (9, 12, 15), (8, 15, 17), (12, 16, 20)])
    first, second = random.choice([("north", "east"), ("south", "west"), ("north", "west"), ("south", "east")])
    opts, idx = _options(h, 1, minimum=1, suffix=" km")
    return _q("Logical", "Direction Sense",
              f"Riya walks {a} km {first}, then turns and walks {b} km {second}. "
              f"How far is she from her starting point in a straight line?", opts, idx,
              f"The two legs are at right angles, so distance = sqrt({a}^2 + {b}^2) = sqrt({a * a + b * b}) = {h} km.",
              "Learn the triples 3-4-5, 5-12-13, 8-15-17.")


def _calendar(d):
    start = random.randrange(7)
    n = random.randint(10, 100) * SCALE[d]
    ans = DAYS[(start + n) % 7]
    wrong = [x for x in DAYS if x != ans]
    random.shuffle(wrong)
    options = [ans] + wrong[:3]
    random.shuffle(options)
    return _q("Logical", "Calendar",
              f"Today is {DAYS[start]}. What day of the week will it be after {n} days?", options, options.index(ans),
              f"{n} = 7 x {n // 7} + {n % 7}. Only the remainder {n % 7} matters, so count {n % 7} days forward "
              f"from {DAYS[start]}: {ans}.",
              "Divide the number of days by 7 and use the remainder.")


def _ranking(d):
    total = random.randint(15, 45) * SCALE[d]
    p = random.randint(4, total - 4)
    q = total + 1 - p
    opts, idx = _options(total, 1, minimum=2)
    return _q("Logical", "Ranking",
              f"In a row, Arun is {p}th from the left and {q}th from the right. How many people are in the row?",
              opts, idx,
              f"Total = {p} + {q} - 1 = {total}, because Arun is counted from both ends.",
              "Total = left rank + right rank - 1.")


LOGICAL_STATIC = [
    ("Blood Relations", "Pointing to a man, a woman says, 'He is the son of my mother's only brother.' How is the man related to the woman?",
     ["Cousin", "Brother", "Nephew", "Uncle"], 0, "Her mother's brother is her maternal uncle, and his son is her cousin."),
    ("Blood Relations", "A is the brother of B. B is the sister of C. C is the father of D. How is A related to D?",
     ["Father", "Uncle", "Brother", "Grandfather"], 1, "A is C's brother, and C is D's father, so A is D's uncle."),
    ("Blood Relations", "A's mother is B's sister. How is B related to A?",
     ["Mother", "Paternal aunt", "Maternal aunt", "Cousin"], 2, "B is the sister of A's mother, which makes B A's maternal aunt."),
    ("Syllogisms", "All cats are animals. All animals are living beings. Conclusion: All cats are living beings.",
     ["Definitely true", "Definitely false", "Cannot be determined", "Partly true"], 0, "Cats fall inside animals, which fall inside living beings."),
    ("Syllogisms", "Some doctors are teachers. All teachers are kind. Conclusion: Some doctors are kind.",
     ["Definitely false", "Cannot be determined", "Definitely true", "Only if all doctors are teachers"], 2,
     "The doctors who are teachers are all kind, so some doctors are kind."),
    ("Syllogisms", "All pens are books. Some books are bags. Conclusion: Some pens are bags.",
     ["Definitely true", "Cannot be determined", "Definitely false", "All pens are bags"], 1,
     "The books that are bags may or may not be the books that are pens."),
    ("Syllogisms", "No fish is a bird. All sparrows are birds. Conclusion: No sparrow is a fish.",
     ["Cannot be determined", "Definitely false", "Some sparrows are fish", "Definitely true"], 3,
     "Sparrows are birds, and no bird is a fish."),
]

# ---------------------------------------------------------------------- Verbal

VERBAL_STATIC = [
    ("Synonyms", "Choose the word closest in meaning to ABUNDANT.", ["Scarce", "Plentiful", "Tiny", "Rigid"], 1, "Abundant means existing in large quantities, i.e. plentiful."),
    ("Synonyms", "Choose the word closest in meaning to CANDID.", ["Deceitful", "Shy", "Frank", "Rude"], 2, "Candid means open and honest, i.e. frank."),
    ("Synonyms", "Choose the word closest in meaning to DILIGENT.", ["Lazy", "Careless", "Slow", "Hardworking"], 3, "Diligent means showing steady effort, i.e. hardworking."),
    ("Synonyms", "Choose the word closest in meaning to OBSOLETE.", ["Modern", "Outdated", "Useful", "Rare"], 1, "Obsolete means no longer in use, i.e. outdated."),
    ("Synonyms", "Choose the word closest in meaning to BENEVOLENT.", ["Cruel", "Greedy", "Angry", "Kind"], 3, "Benevolent means well-meaning and kind."),
    ("Synonyms", "Choose the word closest in meaning to METICULOUS.", ["Careless", "Careful", "Quick", "Loud"], 1, "Meticulous means showing great attention to detail."),
    ("Synonyms", "Choose the word closest in meaning to FRUGAL.", ["Wasteful", "Generous", "Thrifty", "Wealthy"], 2, "Frugal means careful with money, i.e. thrifty."),
    ("Synonyms", "Choose the word closest in meaning to AMBIGUOUS.", ["Clear", "Certain", "Simple", "Unclear"], 3, "Ambiguous means open to more than one interpretation, i.e. unclear."),
    ("Antonyms", "Choose the word opposite in meaning to EXPAND.", ["Enlarge", "Contract", "Stretch", "Grow"], 1, "Expand means to grow bigger; its opposite is contract."),
    ("Antonyms", "Choose the word opposite in meaning to GENEROUS.", ["Kind", "Rich", "Gentle", "Stingy"], 3, "Generous means giving freely; its opposite is stingy."),
    ("Antonyms", "Choose the word opposite in meaning to VICTORY.", ["Win", "Defeat", "Peace", "Battle"], 1, "The opposite of victory is defeat."),
    ("Antonyms", "Choose the word opposite in meaning to TRANSPARENT.", ["Clear", "Thin", "Opaque", "Bright"], 2, "Transparent means see-through; opaque means not see-through."),
    ("Antonyms", "Choose the word opposite in meaning to ANCIENT.", ["Old", "Antique", "Historic", "Modern"], 3, "Ancient means very old; its opposite is modern."),
    ("Antonyms", "Choose the word opposite in meaning to OPTIMISTIC.", ["Hopeful", "Cheerful", "Pessimistic", "Realistic"], 2, "An optimist expects good outcomes; a pessimist expects bad ones."),
    ("Antonyms", "Choose the word opposite in meaning to SCARCE.", ["Rare", "Plentiful", "Costly", "Little"], 1, "Scarce means in short supply; its opposite is plentiful."),
    ("Grammar", "Choose the correct option: Neither of the students ___ present.", ["were", "are", "was", "have been"], 2, "'Neither of' takes a singular verb, so 'was'."),
    ("Grammar", "Choose the correct option: She ___ to the market yesterday.", ["go", "goes", "gone", "went"], 3, "'Yesterday' needs the simple past: went."),
    ("Grammar", "Choose the correct option: He is good ___ mathematics.", ["in", "at", "on", "with"], 1, "The fixed phrase is 'good at'."),
    ("Grammar", "Choose the correct option: If I ___ you, I would apologise.", ["am", "was", "were", "be"], 2, "Hypothetical conditionals use 'were'."),
    ("Grammar", "Choose the correct option: I have been working here ___ 2019.", ["for", "since", "from", "during"], 1, "'Since' goes with a starting point in time."),
    ("Grammar", "Choose the correct option: Each of the players ___ a medal.", ["have received", "are receiving", "has received", "were receiving"], 2, "'Each' is singular, so 'has received'."),
    ("Grammar", "Choose the correct option: The news ___ good.", ["are", "were", "have", "is"], 3, "'News' is an uncountable noun and takes 'is'."),
    ("Grammar", "Choose the correct option: She is senior ___ me.", ["than", "to", "from", "with"], 1, "'Senior' is followed by 'to', not 'than'."),
    ("Grammar", "Choose the correct option: He prefers tea ___ coffee.", ["than", "to", "from", "over"], 1, "'Prefer' is followed by 'to'."),
    ("Idioms", "What does the idiom 'break the ice' mean?", ["Start a conversation in an awkward setting", "Damage something", "Cool a drink", "End a meeting"], 0, "It means to ease tension and start talking."),
    ("Idioms", "What does the idiom 'once in a blue moon' mean?", ["Every night", "Very rarely", "At midnight", "Every month"], 1, "It means something that happens very rarely."),
    ("Idioms", "What does the idiom 'a piece of cake' mean?", ["A dessert", "A gift", "Very easy", "A small portion"], 2, "It describes something that is very easy to do."),
    ("Idioms", "What does the idiom 'spill the beans' mean?", ["Waste food", "Make a mess", "Cook dinner", "Reveal a secret"], 3, "It means to let a secret out."),
    ("Idioms", "What does the idiom 'under the weather' mean?", ["Feeling unwell", "Standing outside", "Very cold", "Hiding"], 0, "It means feeling slightly ill."),
    ("Spelling", "Choose the correctly spelled word.", ["Accomodate", "Accommodate", "Acommodate", "Acomodate"], 1, "Accommodate has double c and double m."),
    ("Spelling", "Choose the correctly spelled word.", ["Neccessary", "Necesary", "Necessary", "Neccesary"], 2, "Necessary has one c and two s's."),
    ("Spelling", "Choose the correctly spelled word.", ["Occurence", "Occurrance", "Ocurrence", "Occurrence"], 3, "Occurrence has double c and double r."),
    ("Spelling", "Choose the correctly spelled word.", ["Definately", "Definitely", "Definitly", "Defenitely"], 1, "Definitely is built on 'finite'."),
]

QUANT_TEMPLATES: List[Callable] = [_percentage, _percent_change, _ratio, _average, _speed,
                                   _simple_interest, _profit_loss, _time_work]
LOGICAL_TEMPLATES: List[Callable] = [_series, _coding, _direction, _calendar, _ranking]


def _topic_matches(topic: str, focus: List[str]) -> bool:
    t = topic.lower()
    return any(f.lower() in t or t in f.lower() for f in focus)


def _static_pool(section: str):
    if section == "Verbal":
        return VERBAL_STATIC
    return LOGICAL_STATIC


def _questions_for(section: str, count: int, difficulty: str, focus: List[str]) -> List[Dict]:
    d = LEVEL.get(difficulty, 1)
    result: List[Dict] = []
    seen = set()

    def add(item):
        if item["question"] not in seen:
            seen.add(item["question"])
            result.append(item)

    # Static items (Verbal, plus Blood Relations / Syllogisms for Logical)
    static_pool = []
    for topic, question, options, idx, explanation in _static_pool(section):
        # shuffle options so the answer position varies between sessions
        correct = options[idx]
        shuffled = options[:]
        random.shuffle(shuffled)
        static_pool.append(_q(section, topic, question, shuffled, shuffled.index(correct), explanation))
    random.shuffle(static_pool)

    templates = QUANT_TEMPLATES if section == "Quantitative" else LOGICAL_TEMPLATES if section == "Logical" else []

    if focus:
        static_pool.sort(key=lambda it: not _topic_matches(it["topic"], focus))

    if section == "Verbal":
        for item in static_pool:
            if len(result) >= count:
                break
            add(item)
        return result

    # Mix: template questions for variety, with static items for Logical
    order: List = list(templates)
    random.shuffle(order)
    if focus:
        order.sort(key=lambda fn: not _topic_matches(fn(d)["topic"], focus))

    # Roughly one static Logical question for every three template ones
    static_quota = count // 4 if section == "Logical" else 0
    for item in static_pool[:static_quota]:
        add(item)

    attempts = 0
    i = 0
    while len(result) < count and attempts < count * 20:
        attempts += 1
        add(order[i % len(order)](d))
        i += 1
    return result


def generate_bank_questions(sections: List[str], difficulty: str, question_count: int,
                            focus_topics: Optional[List[str]] = None) -> List[Dict]:
    focus = [f for f in (focus_topics or []) if f.strip()]
    base, extra = divmod(question_count, len(sections))
    out: List[Dict] = []
    for index, section in enumerate(sections):
        want = base + (1 if index < extra else 0)
        out.extend(_questions_for(section, want, difficulty, focus))
    for n, q in enumerate(out, start=1):
        q["id"] = n
    return out
