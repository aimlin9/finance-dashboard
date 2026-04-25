import re
from datetime import datetime
import pdfplumber


class PDFParser:
    """Parses PDF bank statements for GCB, Ecobank, and MTN MoMo."""

    def __init__(self, bank_name='gcb'):
        self.bank_name = bank_name.lower() if bank_name else 'gcb'

    def extract(self, file_path):
        if 'ecobank' in self.bank_name:
            return self._parse_ecobank(file_path)
        elif 'momo' in self.bank_name or 'mtn' in self.bank_name:
            return self._parse_momo(file_path)
        else:
            return self._parse_gcb(file_path)

    # ── GCB Parser ──────────────────────────────────────────

    def _parse_gcb(self, file_path):
        transactions = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        if not row or len(row) < 5:
                            continue
                        tx = self._parse_gcb_row(row)
                        if tx:
                            transactions.append(tx)
        return transactions

    def _parse_gcb_row(self, row):
        row = [cell.strip() if cell else '' for cell in row]
        date_str = row[0]
        debit_str = row[1]
        credit_str = row[2]
        balance_str = row[3]
        description = row[4]

        if not date_str or date_str.lower() in ('date', 'total'):
            return None

        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return None

        debit_str = debit_str.replace(',', '').replace(' ', '')
        credit_str = credit_str.replace(',', '').replace(' ', '')
        balance_str = balance_str.replace(',', '').replace(' ', '')

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

        try:
            balance = float(balance_str) if balance_str else None
        except ValueError:
            balance = None

        description = ' '.join(description.split())

        return {
            'date': date,
            'description': description,
            'amount': amount,
            'type': tx_type,
            'balance_after': balance,
        }

    # ── Ecobank Parser ──────────────────────────────────────

    def _parse_ecobank(self, file_path):
        transactions = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        if not row or len(row) < 5:
                            continue
                        tx = self._parse_ecobank_row(row)
                        if tx:
                            transactions.append(tx)
        return transactions

    def _parse_ecobank_row(self, row):
        row = [cell.strip() if cell else '' for cell in row]

        # Ecobank columns: Transaction Date | Description | Value Date | Debit | Credit | Balance
        date_str = row[0]
        description = row[1]
        # row[2] is value date, skip
        debit_str = row[3] if len(row) > 3 else ''
        credit_str = row[4] if len(row) > 4 else ''
        balance_str = row[5] if len(row) > 5 else ''

        # Skip headers and special rows
        if not date_str:
            return None
        skip_words = ['transaction', 'date', 'opening balance', 'closing balance']
        if any(w in date_str.lower() for w in skip_words):
            return None
        if any(w in description.lower() for w in ['opening balance', 'closing balance']):
            return None

        # Parse date (DD-Mon-YYYY e.g. 13-Jan-2026)
        date = None
        for fmt in ['%d-%b-%Y', '%d-%B-%Y', '%d/%m/%Y']:
            try:
                date = datetime.strptime(date_str, fmt).date()
                break
            except ValueError:
                continue

        if not date:
            return None

        # Clean amounts
        debit_str = debit_str.replace(',', '').replace(' ', '')
        credit_str = credit_str.replace(',', '').replace(' ', '')
        balance_str = balance_str.replace(',', '').replace(' ', '')

        # Skip rows where both debit and credit are 0.00
        debit_val = 0
        credit_val = 0

        try:
            debit_val = float(debit_str) if debit_str else 0
        except ValueError:
            debit_val = 0

        try:
            credit_val = float(credit_str) if credit_str else 0
        except ValueError:
            credit_val = 0

        if debit_val == 0 and credit_val == 0:
            return None

        if debit_val > 0:
            amount = debit_val
            tx_type = 'debit'
        else:
            amount = credit_val
            tx_type = 'credit'

        try:
            balance = float(balance_str) if balance_str else None
        except ValueError:
            balance = None

        description = ' '.join(description.split())

        return {
            'date': date,
            'description': description,
            'amount': amount,
            'type': tx_type,
            'balance_after': balance,
        }

    # ── MTN MoMo Parser ─────────────────────────────────────

    def _parse_momo(self, file_path):
        transactions = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        if not row or len(row) < 8:
                            continue
                        tx = self._parse_momo_row(row)
                        if tx:
                            transactions.append(tx)
        return transactions

    def _parse_momo_row(self, row):
        row = [cell.strip() if cell else '' for cell in row]

        # MoMo columns: TRANSACTION DATE | FROM ACCT | FROM NAME | FROM NO. | TRANS. TYPE | AMOUNT | FEES | E-LEVY | BAL BEFORE | BAL AFTER | TO NO. | TO NAME | TO ACCT | F_ID | REF | OVA
        date_str = row[0]
        from_name = row[2] if len(row) > 2 else ''
        trans_type = row[4] if len(row) > 4 else ''
        amount_str = row[5] if len(row) > 5 else ''
        bal_before_str = row[8] if len(row) > 8 else ''
        bal_after_str = row[9] if len(row) > 9 else ''
        to_name = row[11] if len(row) > 11 else ''
        ova = row[15] if len(row) > 15 else ''

        # Skip header rows
        if not date_str:
            return None
        skip_words = ['transaction date', 'transaction\ndate', 'time run', 'msisdn', 'from:', 'mobile money']
        if any(w in date_str.lower() for w in skip_words):
            return None
        if 'TRANSACTION DATE' in date_str.upper():
            return None

        # Parse date (DD-Mon-YYYY HH:MM:SS AM/PM)
        date = None
        # Remove extra whitespace and newlines
        date_str = ' '.join(date_str.split())
        for fmt in ['%d-%b-%Y %I:%M:%S %p', '%d-%b-%Y %H:%M:%S %p', '%d-%b-%Y %I:%M:%S%p', '%d-%b-%Y']:
            try:
                date = datetime.strptime(date_str, fmt).date()
                break
            except ValueError:
                continue

        if not date:
            # Try extracting just the date part
            date_match = re.match(r'(\d{2}-\w{3}-\d{4})', date_str)
            if date_match:
                try:
                    date = datetime.strptime(date_match.group(1), '%d-%b-%Y').date()
                except ValueError:
                    return None
            else:
                return None

        # Parse amount
        amount_str = amount_str.replace(',', '').replace(' ', '')
        try:
            amount = float(amount_str)
        except ValueError:
            return None

        if amount == 0:
            return None

        # Determine credit or debit from balance change
        try:
            bal_before = float(bal_before_str.replace(',', '').replace(' ', ''))
            bal_after = float(bal_after_str.replace(',', '').replace(' ', ''))
            if bal_after > bal_before:
                tx_type = 'credit'
            else:
                tx_type = 'debit'
        except (ValueError, TypeError):
            # Fallback: use trans type
            credit_types = ['cash_in', 'refund']
            if trans_type.lower() in credit_types:
                tx_type = 'credit'
            else:
                tx_type = 'debit'

        # Build description from available info
        trans_type_clean = trans_type.replace('\n', ' ').strip()
        from_name_clean = ' '.join(from_name.split())
        to_name_clean = ' '.join(to_name.split())
        ova_clean = ' '.join(ova.split()) if ova else ''

        if tx_type == 'credit':
            description = trans_type_clean + ' from ' + from_name_clean
        else:
            desc_parts = [trans_type_clean]
            if to_name_clean:
                desc_parts.append('to ' + to_name_clean)
            if ova_clean:
                desc_parts.append(ova_clean)
            description = ' '.join(desc_parts)

        description = ' '.join(description.split())
        if not description:
            description = trans_type_clean or 'MoMo Transaction'

        return {
            'date': date,
            'description': description,
            'amount': amount,
            'type': tx_type,
            'balance_after': bal_after if 'bal_after' in dir() else None,
        }