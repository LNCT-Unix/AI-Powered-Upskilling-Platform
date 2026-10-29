# Octobyte LLM

A small fine-tuned language model that acts as a **backend-development interview assistant**. It grades candidate answers against a rubric, writes interview questions, gives personalised feedback, finds skill gaps, and reviews or debugs code. Every reply is **one JSON object**, so it plugs straight into an application.

- **Base model:** Qwen3-1.7B
- **Method:** QLoRA fine-tuning with [Unsloth](https://github.com/unslothai/unsloth), merged into 16-bit weights
- **Output:** a single valid JSON object, nothing else
- **Size:** about 3.4 GB in 16-bit, runs on a single consumer GPU
- **Weights:** [`anni04/EPAM_LLM`](https://huggingface.co/anni04/EPAM_LLM) on Hugging Face (`LLM_Files_Epam.zip`)
- **License:** Apache-2.0

---

## What it does

| Task | You give it | You get back |
|---|---|---|
| `evaluate` | A question, the rubric key points and a candidate answer | `score_pct`, `covered_points`, `missed_points`, `misconceptions`, `justification` |
| `generate` | A specification (topic, concept, difficulty, questions to avoid) | `topic`, `concept`, `difficulty`, `question`, `key_points` |
| `feedback` | Learner level, concept, question and an evaluation result | `summary`, `strengths`, `improvements`, `corrections`, `study_tip`, `encouragement` |
| `skillgap` | A concept graph with prerequisites and the learner's scores | `gaps`, `study_order`, `summary` |
| `review` | Backend code with line numbers | `verdict`, `issues` (line, type, severity, explanation, fix), `summary` |
| `debug` | Code and a reported symptom | `root_cause`, `line`, `fix`, `other_problems`, `corrected_code` |

**The adaptive logic is not in the model.** Deciding the next question (harder, easier or a new topic) lives in plain code in [`policy.py`](policy.py): difficulty goes up at a score of 75 or more and down below 40. Change the thresholds without retraining.

---

## Quickstart

### 1. Get the weights

```bash
pip install -U huggingface_hub
python -c "from huggingface_hub import hf_hub_download; import zipfile; \
p = hf_hub_download('anni04/EPAM_LLM', 'LLM_Files_Epam.zip'); \
zipfile.ZipFile(p).extractall('.')"
```

This gives you the `qwen3_backend_merged/` folder (the full model) and `lora_qwen3_1p7b_v1/` (the adapter on its own).

### 2. Install

```bash
pip install torch transformers accelerate
```

### 3. Run it

The model was trained on exact prompt formats (see below), so use the matching system prompt for each task.

```python
import json, torch
from transformers import AutoTokenizer, AutoModelForCausalLM

path = "qwen3_backend_merged"
tok = AutoTokenizer.from_pretrained(path)
dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
model = AutoModelForCausalLM.from_pretrained(path, dtype=dtype, device_map="auto")

JSON_ONLY = " Reply with one valid JSON object and nothing else."
SYSTEM = {
    "evaluate": "You are a strict but fair grader of backend development interview answers. Judge only what the answer actually says, compare it with the rubric key points, and flag wrong claims." + JSON_ONLY,
    "generate": "You write backend development interview questions, each with grading key points, following the given specification." + JSON_ONLY,
    "feedback": "You are a supportive backend mentor. Turn an evaluation result into specific, actionable feedback." + JSON_ONLY,
    "skillgap": "You analyse a learner's backend skill gaps using the prerequisite graph. A gap is a score below 50." + JSON_ONLY,
    "review":   "You are a senior backend engineer doing code review. Report real problems only; if the code is fine, say so." + JSON_ONLY,
    "debug":    "You are a senior backend engineer debugging a submitted program. Find the root cause of the reported symptom." + JSON_ONLY,
}

def run(task, user_prompt, max_new_tokens=640):
    messages = [{"role": "system", "content": SYSTEM[task]},
                {"role": "user", "content": user_prompt}]
    inputs = tok.apply_chat_template(
        messages, add_generation_prompt=True, enable_thinking=False,
        tokenize=True, return_dict=True, return_tensors="pt",
    ).to(model.device)
    out = model.generate(**inputs, max_new_tokens=max_new_tokens, do_sample=False)
    text = tok.decode(out[0][inputs["input_ids"].shape[-1]:], skip_special_tokens=True)
    return json.loads(text)   # validate, and retry on failure in a real application
```

Notes:
- Keep thinking off (`enable_thinking=False`). The model was trained that way.
- Use greedy decoding (`do_sample=False`) for repeatable answers.
- Run it in **16-bit**. Loading in 4-bit or 8-bit noticeably damages the JSON structure of the answers.
- The 16-bit model needs about 3.4 GB of GPU memory. On a smaller GPU it spills onto the CPU and gets slow.

---

## Prompt formats

### `evaluate`

```text
Question:
What are liveness and readiness probes and how are they used?

Rubric (key points):
- Liveness shows whether the process is alive and should be restarted if not
- Readiness shows whether the instance can accept traffic
- Orchestrators and load balancers use them to restart instances or route traffic

Candidate answer:
"""
In my understanding, A readiness probe restarts the container whenever it fails. Liveness checks if the app is stuck and needs a restart.
"""

Evaluate the answer against the rubric.
```

Expected output format:

```json
{"score_pct": 18,
 "covered_points": ["Liveness shows whether the process is alive and should be restarted if not"],
 "missed_points": ["Readiness shows whether the instance can accept traffic",
                   "Orchestrators and load balancers use them to restart instances or route traffic"],
 "misconceptions": [{"claim": "A readiness probe restarts the container whenever it fails.",
                     "correction": "A failing readiness probe stops traffic to the instance; liveness probes trigger restarts."}],
 "justification": "The answer clearly explains 1 of 3 key points. Missing: ... A misconception was found, so 15 points were deducted."}
```

### `generate`

```text
Write one backend interview question for this specification:
{"topic": "caching", "concept": "Cache stampede", "difficulty": "hard", "avoid_questions": []}
```

### `feedback`

```text
Learner level: beginner
Concept: <concept name>
Question: <question>
Evaluation result:
<the JSON returned by the evaluate task>

Write personalized feedback for the learner.
```

Learner level is one of `beginner`, `intermediate`, `advanced`.

### `skillgap`

```text
Concept graph (id | name | difficulty | prerequisites):
- sql_index_basics | Database indexes | easy | prerequisites: none
- sql_composite | Composite indexes | medium | prerequisites: sql_index_basics

Candidate results (score out of 100, only these concepts were tested):
- sql_composite: 30

Analyse the skill gaps.
```

### `review`

Number the lines of the code as `1: ...`, `2: ...`:

```text
Review this python code from a backend service. Report problems with line numbers.

1: def get_user(conn, email):
2:     query = "SELECT * FROM users WHERE email = '" + email + "'"
3:     return conn.execute(query).fetchone()
```

### `debug`

```text
This python code (user lookup) has a problem. Symptom: <what users see>

1: <numbered code>

Find the root cause and fix it.
```

---

## Training

| Item | Value |
|---|---|
| Base model | `unsloth/Qwen3-1.7B-unsloth-bnb-4bit` |
| Method | QLoRA with Unsloth, merged to 16-bit afterwards |
| LoRA | rank 16, alpha 16, dropout 0, on q/k/v/o/gate/up/down projections |
| Trainable parameters | 17,432,576 of 1,738,007,552 (1.00%) |
| Data | 987 training rows |
| Schedule | 2 epochs, 124 steps, batch 2 x 8 accumulation = 16, learning rate 2e-4, `adamw_8bit`, linear decay, warmup 5% |
| Context length | 1536 tokens |
| Loss | On the assistant answer only (`train_on_responses_only`) |
| Hardware | One laptop GPU, NVIDIA RTX 3050 6GB |

To retrain:

1. Build the dataset: `python generate_dataset.py` (writes `train.jsonl`, `val.jsonl` and a held-out split).
2. Open the training notebook in this repo and run it. The file name still says `Qwen3 (14B)`, but it trains Qwen3-1.7B on `train.jsonl`.
3. Save the adapter, then merge it into 16-bit weights (the last cell of the notebook).

---

## Training data

The data is synthetic and built from code, so it is easy to extend:

- [`bank.py`](bank.py): a hand-written bank of **60 questions across 10 topics** (REST APIs, SQL indexing, auth and security, caching, concurrency and async, message queues, transactions, system design, deployment and Docker, testing and error handling), each with key points, a common misconception and a study tip.
- [`snippets.py`](snippets.py): short code snippets with known issues (and clean ones), used for the `review` and `debug` tasks.
- [`generate_dataset.py`](generate_dataset.py): turns the bank and snippets into chat-format JSONL rows. Student answers are generated from the key points, with partial coverage, vague answers and deliberate misconceptions.
- [`expand_bank.py`](expand_bank.py): optional helper that asks a hosted LLM for more questions. It writes `bank_expanded.jsonl` with `"approved": false`, and only entries you review and approve are used.

Splits are made **by question ID and by code group**, so a question never appears in more than one split.

| Task | Training rows |
|---|---|
| evaluate | 534 |
| feedback | 153 |
| skillgap | 150 |
| generate | 101 |
| review | 33 |
| debug | 16 |
| **Total** | **987** |

---

## Repository layout

```text
.
├── qwen3_backend_merged/        merged 16-bit model (config, tokenizer, model.safetensors)
├── lora_qwen3_1p7b_v1/          LoRA adapter only
├── bank.py                      question bank
├── snippets.py                  code snippets for review and debug
├── generate_dataset.py          builds the JSONL data
├── expand_bank.py               optional: grow the bank with a hosted LLM
├── policy.py                    adaptive next-question logic (plain code)
├── train.jsonl / val.jsonl      generated data
└── Qwen3_(14B)-Alpaca.ipynb     Unsloth training notebook
```

---

## Limitations

- **Fixed prompt formats.** It is not a general chat model. Prompts must follow the formats above.
- **Always validate the output.** Check that the reply is valid JSON with the required keys, and retry once if it is not.
- **Scores are approximate.** The numeric `score_pct` can disagree with the points it lists. For reliable grading, compute the score in code from the validated `covered_points`.
- **Skill gaps are a rule.** A gap is any score below 50, so compute the gap list in code and use the model for the diagnosis text.
- **Code review and debugging are experimental.** They were trained on a small set of snippets, so review verdicts and root causes can be wrong. Do not rely on them without a human check.
- **Small model, narrow domain.** Its knowledge of backend topics comes from the question bank.
- **Not for high-stakes use.** Keep a human in the loop for any decision that affects a real learner or candidate.

---

## License and credits

Released under the Apache-2.0 license, as shown on the Hugging Face repo.

Built on [Qwen3](https://huggingface.co/Qwen) by the Qwen team, trained with [Unsloth](https://github.com/unslothai/unsloth), and using Hugging Face Transformers, PEFT and TRL.
