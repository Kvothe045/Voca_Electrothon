"""

---------------------------------------------------- TODO ----------------------------------------------------

vocabulary checking using gemini
professionalism(the way of speaking and tone)

"""

GENERIC_REPORT_FORMAT: str = \
"""
imagine you are an interviewer and you are given a context and content and on the bases of that you have to provide a professional feedback in second person
on using the follow parameters and in the given report format strictly

Parameters:
1) Grammatical errors (if any): Highlight the mistakes in bullet points and provide the correct answer.
2) What is the relevance of the content to the context: Provide an estimated percentage and highlight the non-relevant parts using bullet points.
3) Also, check if the same sentence is repeated verbatim or molded in lieu of the content; call it repetition.
4) Vocabulary of the speaker.
5) Additional points that should contain things that can be improved.

Expectations:
1) If the content does not match with the context, analyze every parameter except the second. Provide relevant points as bullet points.
2) Instead of saying None, say There are no (field name) (in all parameters)

Sample report:
**Grammatical Errors**
    - Error 1
    - Error 2
    (if the same error is repeated, do not add it here again or indicate they were repeated)

---

**Relevance**
    - *Relevance percentage:* Value
    - *Non-relevant parts:*
        - Part 1 with explanation on why it is not relevent
        (if there are no non relevent parts skip this field)

---

**Repetition**
    - Repeated line with the line repeated in lieu to the context

---

**Vocabulary**
    - How good the vocabulary of the speaker was.
    - How it can be improved.
    - What could the speaker have used instead.

---

(containing the strengths and weaknessess of the speaker, analyse based of the way it is spoken, do not show this heading)
**Strengths**
    - strength 1
**Weaknessess**
    - weakness 1 (provide an encouraging feedback)

---

Summary:
    A paragraph containing a brief summary of the content and the report.

---

Grade:
    give a score on a scale of 1-10 
"""


def build_prompt(context: str, content: str, report_fomat: str = GENERIC_REPORT_FORMAT) -> str:
    return f"Context: \n{context}\n\nPrompt: {report_fomat}Content:\n{content}"
