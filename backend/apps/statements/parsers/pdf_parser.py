import re
from datetime import datetime
import pdfplumber


class PDFParser:
    """Parses GCB-format PDF bank statements."""

    def __init__(self, bank_name='gcb'):
        self.bank_name = bank_name

    def extract(self, file_path):
        """
        Takes a file path to a PDF, returns a list of transaction dicts.
        Each dict has: date, description, amount, type, balance_after
        """
        transactions = []

        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()

                for table in tables:
                    for row in table:
                        if not row or len(row) < 5:
                            continue

                        tx = self._parse_row(row)
                        if tx:
                            transactions.append(tx)

        return transactions

    def _parse_row(self, row):
        """Parse a single table row into a transaction dict."""
        # Clean up None values and whitespace
        row = [cell.strip() if cell else '' for cell in row]

        date_str = row[0]
        debit_str = row[1]
        credit_str = row[2]
        balance_str = row[3]
        description = row[4]

        # Skip header rows, total rows, empty rows
        if not date_str or date_str.lower() in ('date', 'total'):
            return None

        # Parse date (GCB uses YYYY-MM-DD)
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return None

        # Clean amounts — remove commas and spaces
        debit_str = debit_str.replace(',', '').replace(' ', '')
        credit_str = credit_str.replace(',', '').replace(' ', '')
        balance_str = balance_str.replace(',', '').replace(' ', '')

        # Determine type and amount
        if debit_str:
            try:
                amount = float(debit_str)
                tx_type = 'debit'
            except ValueError:
                return None
        elif credit_str:
            try:
                amount = float(credit_str)
                tx_type = 'credit'
            except ValueError:
                return None
        else:
            return None

        # Parse balance
        try:
            balance = float(balance_str) if balance_str else None
        except ValueError:
            balance = None

        # Clean up description — replace newlines with spaces
        description = ' '.join(description.split())

        return {
            'date': date,
            'description': description,
            'amount': amount,
            'type': tx_type,
            'balance_after': balance,
        }