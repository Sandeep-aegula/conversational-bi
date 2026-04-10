import re, sys

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

_OFF_TOPIC_PATTERNS = [
    r"\b(who are you|what are you|tell me about yourself|your name|are you (an? )?ai|are you (a )?robot|are you human)\b",
    r"\b(write (a |some )?(python|javascript|java|c\+\+|c#|html|css|rust|go|ruby) (code|program|script|function|class))\b",
    r"\b(debug|fix (my|this) code|code review|refactor|implement (a |an )?(algorithm|feature|api))\b",
    r"\b(capital (of|city)|who (invented|discovered|wrote|created|is|was)|when (was|did|is)|where (is|was|did))\b",
    r"\b(history of|biography|wikipedia|explain (the concept|quantum|relativity|evolution|economics))\b",
    r"\b(write (me )?(a |an )?(poem|story|essay|joke|song|letter|email)|tell me a (joke|story)|give me a recipe)\b",
    r"\b(what should i (eat|do|watch|read|wear)|recommend (a |an )?(movie|book|show|restaurant|game))\b",
    r"\b(solve (this )?(equation|integral|derivative|math problem)|calculate (pi|fibonacci|factorial|prime))\b",
    r"\b(physics|chemistry|biology|astronomy|medicine|legal advice|financial advice|investment advice)\b",
    r"\b(latest news|current events|what happened (today|yesterday|recently)|stock (price|market) (of|for) \w+)\b",
    r"\b(how to make friends|relationship advice|dating tips|personal problems|mental health)\b",
]

_OFF_TOPIC_RE = re.compile("|".join(_OFF_TOPIC_PATTERNS), re.IGNORECASE)

test_queries = [
    ("PASS", "Show me the top 10 categories by revenue"),
    ("PASS", "Pie chart of sales by region"),
    ("PASS", "What are the monthly trends?"),
    ("PASS", "Bar chart of cost by service"),
    ("PASS", "Show total costs per month"),
    ("PASS", "Which service has the highest cost?"),
    ("PASS", "Compare EC2 vs S3 costs"),
    ("PASS", "Show me where costs are highest"),
    ("PASS", "When did costs peak?"),
    ("PASS", "What is the total revenue?"),
    ("PASS", "Who spent the most?"),
    ("PASS", "What was the average cost in 2024?"),
    ("PASS", "Show distribution of values"),
    ("PASS", "Give me insights on the data"),
    ("PASS", "Generate 8 diverse and high-impact visualizations"),
    ("PASS", "Top 10 EC2-Instances by cost"),
    ("PASS", "What is the history of costs by month?"),
    ("PASS", "Where is the data from?"),
    ("PASS", "Investment by category"),
    ("BLOCK", "Write me a Python script"),
    ("BLOCK", "Who invented electricity"),
    ("BLOCK", "Tell me a joke"),
    ("BLOCK", "What should I eat today"),
    ("BLOCK", "Give me a recipe"),
    ("BLOCK", "What is the capital of France"),
    ("BLOCK", "Latest news about AI"),
    ("BLOCK", "Give me relationship advice"),
]

false_positives = []
false_negatives = []
results = []

for expected, query in test_queries:
    is_blocked = bool(_OFF_TOPIC_RE.search(query))
    actual = "BLOCK" if is_blocked else "PASS"
    correct = actual == expected
    if not correct:
        if expected == "PASS":
            false_positives.append(query)
            for p in _OFF_TOPIC_PATTERNS:
                m = re.search(p, query, re.IGNORECASE)
                if m:
                    results.append(f"FALSE POSITIVE: '{query}'")
                    results.append(f"  Matched: '{m.group()}' in pattern: {p[:80]}")
        else:
            false_negatives.append(query)
            results.append(f"FALSE NEGATIVE: '{query}'")

print("\n".join(results))
print()
print(f"False positives (BI queries wrongly blocked): {len(false_positives)}")
print(f"False negatives (off-topic not blocked): {len(false_negatives)}")
