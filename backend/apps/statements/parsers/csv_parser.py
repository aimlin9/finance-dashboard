import csv
import io
from datetime import datetime


class CSVParser:
    """Parses GCB-format CSV bank statements."""

    def __init__(self, bank_name='gcb'):
        self.bank_name = bank_name

    def extract(self, file_content):
        """
        Takes raw file content (bytes or string), returns a list of transactions.
        Each transaction is a dict with: date, description, amount, type, balance_after
        """
        # If bytes, decode to string
        if isinstance(file_content, bytes):
            file_content = file_content.decode('utf-8')

        reader = csv.DictReader(io.StringIO(file_content))
        transactions = []

        for row in reader:
            # Skip empty rows or total rows
            date_str = row.get('Date', '').strip()
            if not date_str or date_str.lower() == 'total':
                continue

            # Parse the date
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                continue  # Skip rows with invalid dates

            # Determine if debit or credit
            debit = row.get('Debit', '').strip().replace(',', '')
            credit = row.get('Credit', '').strip().replace(',', '')

            if debit:
                amount = float(debit)
                tx_type = 'debit'
            elif credit:
                amount = float(credit)
                tx_type = 'credit'
            else:
                continue  # Skip rows with no amount

            # Get balance and description
            balance_str = row.get('Balance', '').strip().replace(',', '')
            balance = float(balance_str) if balance_str else None
            description = row.get('Remarks', '').strip()

            transactions.append({
                'date': date,
                'description': description,
                'amount': amount,
                'type': tx_type,
                'balance_after': balance,
            })

        return transactions