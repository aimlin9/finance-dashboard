"""
Train a spaCy text categorizer on transaction descriptions.

Run with: python manage.py shell < apps/transactions/train_model.py
Or:       python -c "from apps.transactions.train_model import train; train()"
"""
import os
import random
import spacy
from spacy.training import Example


def train(output_dir='models/categorizer', n_iter=30):
    """Train the text categorizer and save the model."""
    from apps.transactions.training_data import TRAIN_DATA, CATEGORIES

    # Start with blank English model
    nlp = spacy.blank('en')

    # Add the text categorizer to the pipeline
    textcat = nlp.add_pipe('textcat_multilabel')

    # Add all category labels
    for cat in CATEGORIES:
        textcat.add_label(cat)

    # Convert training data to spaCy format
    train_examples = []
    for text, cats in TRAIN_DATA:
        doc = nlp.make_doc(text)
        example = Example.from_dict(doc, {'cats': cats})
        train_examples.append(example)

    # Train the model
    print(f"Training on {len(train_examples)} examples for {n_iter} iterations...")
    print(f"Categories: {CATEGORIES}")
    print()

    optimizer = nlp.begin_training()

    for i in range(n_iter):
        random.shuffle(train_examples)
        losses = {}
        batches = spacy.util.minibatch(train_examples, size=8)

        for batch in batches:
            nlp.update(batch, sgd=optimizer, losses=losses)

        if (i + 1) % 5 == 0:
            print(f"  Iteration {i+1}/{n_iter} — Loss: {losses['textcat_multilabel']:.3f}")

    # Save the trained model
    os.makedirs(output_dir, exist_ok=True)
    nlp.to_disk(output_dir)
    print(f"\nModel saved to {output_dir}/")

    # Quick test
    print("\n--- Quick Test ---")
    test_descriptions = [
        "PAPAYE CHICKEN AND RICE",
        "GOIL PETROL PURCHASE",
        "ECG ELECTRICITY TOKEN",
        "NETFLIX SUBSCRIPTION",
        "KORLE BU HOSPITAL VISIT",
        "300304****** UNKNOWN REF",
    ]

    # Load the saved model to verify it works
    nlp_loaded = spacy.load(output_dir)

    for desc in test_descriptions:
        doc = nlp_loaded(desc)
        cats = doc.cats
        best = max(cats, key=cats.get)
        score = cats[best]
        print(f"  {desc[:40]:<40} → {best} ({score:.2f})")


if __name__ == '__main__':
    train()