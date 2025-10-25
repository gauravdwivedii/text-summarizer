from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from nltk.probability import FreqDist
from string import punctuation
import nltk
import heapq
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
import numpy as np
import pandas as pd


# Download NLTK resources
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')
    nltk.download('punkt_tab')

def summarize_text(text):
    try:
        sentences = sent_tokenize(text)
        if not sentences:
            return "No sentences found in the text."

        total_sentences = len(sentences)

        # Reject repetitive input (like: "good bad good bad good bad...")
        unique_words = set(word_tokenize(text.lower()))
        if len(unique_words) < 5:
            return "Text is too repetitive or lacks meaningful content for summarization."

        # Determine summary length
        if total_sentences <= 5:
            num_sentences = 2
        elif total_sentences <= 10:
            num_sentences = 5
        elif total_sentences <= 30:
            num_sentences = max(10, int(total_sentences * 0.15))
        elif total_sentences <= 100:
            num_sentences = max(40, int(total_sentences * 0.2))
        else:
            num_sentences = max(65, int(total_sentences * 0.25))
        num_sentences = min(num_sentences, 25)

        # TF-IDF scoring
        tfidf = TfidfVectorizer(stop_words='english')
        tfidf_matrix = tfidf.fit_transform(sentences)
        scores = np.sum(tfidf_matrix.toarray(), axis=1)

        # Position weighting
        position_weights = [1 + (1 / (i + 1)) + (1 / (total_sentences - i + 1)) for i in range(total_sentences)]
        enhanced_scores = [score * position_weights[i] for i, score in enumerate(scores)]

        # Select top sentences
        top_indices = np.argsort(enhanced_scores)[-num_sentences:]
        top_indices = sorted(top_indices)

        summary = ' '.join([sentences[i] for i in top_indices])
        return summary

    except Exception as e:
        return f"Error generating summary: {str(e)}"

