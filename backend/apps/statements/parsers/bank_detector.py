class BankDetector:
    """Identifies which bank a statement belongs to from filename and content."""

    BANK_SIGNATURES = {
        'gcb': {
            'keywords': ['gcb', 'ghana commercial bank', 'gcb bank'],
        },
        'ecobank': {
            'keywords': ['ecobank', 'pan african bank', 'egh ecobank'],
        },
        'mtn_momo': {
            'keywords': ['mtn', 'mobile money', 'momo', 'mtngh', 'msisdn', 'mobile money transaction history', 'momostatement'],
        },
        'absa': {
            'keywords': ['absa', 'barclays'],
        },
        'fidelity': {
            'keywords': ['fidelity'],
        },
    }

    @classmethod
    def detect(cls, filename, content_preview=''):
        combined = (filename + ' ' + content_preview).lower()

        for bank, signatures in cls.BANK_SIGNATURES.items():
            for keyword in signatures['keywords']:
                if keyword in combined:
                    return bank

        return 'unknown'