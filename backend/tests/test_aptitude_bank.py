"""The instant question bank computes its own answers, so we re-derive them
independently from the question text and make sure the answer key agrees."""
import math
import re

import pytest

from backend.app.services import aptitude_bank as bank

ROUNDS = 40  # x 3 difficulties x 30 questions


def _number(text):
    return float(re.sub(r"[^\d.\-]", "", text))


def _check_answer(q):
    topic, text = q["topic"], q["question"]
    answer = q["options"][q["correct_index"]]

    if topic == "Percentages":
        p, n = map(float, re.match(r"What is (\d+)% of (\d+)\?", text).groups())
        assert _number(answer) == pytest.approx(p * n / 100)
    elif topic == "Ratios":
        total, a, b = map(int, re.match(r"(\d+) is divided in the ratio (\d+):(\d+)", text).groups())
        assert _number(answer) == pytest.approx(total * max(a, b) / (a + b))
    elif topic == "Time & Work":
        x, y = map(int, re.findall(r"in (\d+) days", text)[:2])
        assert _number(answer) == pytest.approx(x * y / (x + y))
    elif topic == "Simple Interest":
        p, r, t = map(int, re.match(r"What is the simple interest on (\d+) at (\d+)% per year for (\d+) years", text).groups())
        assert _number(answer) == pytest.approx(p * r * t / 100)
    elif topic == "Averages":
        avg = int(re.match(r"The average of five numbers is (\d+)", text).group(1))
        four = list(map(int, re.search(r"Four of them are ([\d, ]+)\.", text).group(1).split(", ")))
        assert _number(answer) == 5 * avg - sum(four)
    elif topic == "Ranking":
        p, q2 = map(int, re.findall(r"(\d+)th", text))
        assert _number(answer) == p + q2 - 1
    elif topic == "Direction Sense":
        a, b = map(int, re.findall(r"walks (\d+) km \w+, then turns and walks (\d+) km", text)[0])
        assert _number(answer) == pytest.approx(math.hypot(a, b))
    elif topic == "Calendar":
        day, n = re.match(r"Today is (\w+)\. .* after (\d+) days", text).groups()
        assert answer == bank.DAYS[(bank.DAYS.index(day) + int(n)) % 7]
    elif topic == "Speed & Distance":
        m = re.match(r"A car travels at (\d+) km/h for (\d+) hours", text)
        if m:
            assert _number(answer) == int(m.group(1)) * int(m.group(2))
        else:
            dist, speed = map(int, re.match(r"How many hours does it take to cover (\d+) km at (\d+) km/h", text).groups())
            assert _number(answer) == dist / speed
    elif topic == "Coding-Decoding":
        shift = int(re.search(r"letter (\d) place", text).group(1))
        target = re.search(r"How is (\w+) written", text).group(1)
        assert answer == "".join(chr((ord(c) - 65 + shift) % 26 + 65) for c in target)


@pytest.mark.parametrize("difficulty", ["Easy", "Medium", "Hard"])
def test_every_generated_question_is_well_formed_and_correct(difficulty):
    for _ in range(ROUNDS):
        for q in bank.generate_bank_questions(["Quantitative", "Logical", "Verbal"], difficulty, 30):
            assert len(q["options"]) == 4 and len(set(q["options"])) == 4, q
            assert 0 <= q["correct_index"] < 4, q
            assert q["explanation"], q
            _check_answer(q)


@pytest.mark.parametrize("section", ["Quantitative", "Logical", "Verbal"])
def test_each_section_returns_the_requested_count_without_duplicates(section):
    qs = bank.generate_bank_questions([section], "Medium", 12)
    assert len(qs) == 12
    assert len({q["question"] for q in qs}) == 12
    assert {q["section"] for q in qs} == {section}


def test_questions_are_numbered_in_order():
    qs = bank.generate_bank_questions(["Quantitative", "Verbal"], "Easy", 10)
    assert [q["id"] for q in qs] == list(range(1, 11))
