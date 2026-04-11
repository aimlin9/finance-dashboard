class BankDetector:
    """Identifies which bank a statement belongs to from filename and content."""

    BANK_SIGNATURES = {
        'gcb': {
            'keywords': ['gcb', 'ghana commercial bank', 'gcb bank'],
            'columns': ['Date', 'Debit', 'Credit', 'Balance', 'Remarks'],
        },
        'ecobank': {
            'keywords': ['ecobank'],
            'columns': ['Transaction Date', 'Value Date', 'Description', 'Debit', 'Credit'],
        },
        'mtn_momo': {
            'keywords': ['mtn', 'mobile money', 'momo'],
            'columns': ['Date', 'Transaction', 'Amount', 'Balance'],
        },
        'absa': {
            'keywords': ['absa', 'barclays'],
            'columns': ['Date', 'Description', 'Amount', 'Balance'],
        },
        'fidelity': {
            'keywords': ['fidelity'],
            'columns': ['Date', 'Narration', 'Debit', 'Credit', 'Balance'],
        },
    }

    @classmethod
    def detect(cls, filename, content_preview=''):
        """
        Identify bank from filename and first chunk of file content.
        Returns bank name string like 'gcb', 'ecobank', etc.
        """
        combined = (filename + ' ' + content_preview).lower()

        for bank, signatures in cls.BANK_SIGNATURES.items():
            for keyword in signatures['keywords']:
                if keyword in combined:
                    return bank

        return 'unknown'