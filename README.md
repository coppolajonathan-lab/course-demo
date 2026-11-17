# The Agentic Process in Claude: microlearning demo

A ~15-minute microlearning, built as a standalone web page, on how AI agents plan, act, check and adjust, and how that loop works in Claude. It's the HTML version of an Articulate Rise 360 storyboard.

**Live:** https://coppolajonathan-lab.github.io/course-demo/

## What's inside

| Lesson | Interaction |
|---|---|
| 1. You do the rest | Hook |
| 2. What "agentic" means | Flip cards: chat vs. workflow vs. agent |
| 3. The agentic loop | Step-through process (Goal → Plan → Act → Check → Adjust) |
| 4. How the loop works in Claude | Tabs mapped to loop steps |
| 5. Hands-on lab | Real Claude API responses: prompt comparison and a tool-use agent loop, with an API view |
| 6. Practice (optional) | Two-decision branching scenario |
| 7. Knowledge check | 5 questions: multiple choice, ordering, multi-select |
| 8. Wrap-up | Completion summary and sources |

Progress is saved in the learner's browser (localStorage). It shares the header, footer and Parchment/Leatherbound themes with [coppolajonathan-lab.github.io](https://coppolajonathan-lab.github.io/).

## Files

- `index.html`: lesson content
- `assets/course.css`, `assets/course.js`: styles and interactions (no frameworks)
- `data/lab_data.json`: real responses captured from the Claude API by [`capture_lab_data.py`](https://github.com/coppolajonathan-lab/anthropic_lab_demo)

To refresh the lab, re-run the capture script in `anthropic_lab_demo` and copy its `lab_data.json` into `data/`.
