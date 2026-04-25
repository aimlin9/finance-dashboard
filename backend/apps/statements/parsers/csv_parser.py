import csv
import io
import re
from datetime import datetime


class CSVParser:
    """Parses CSV bank statements for GCB, Ecobank, and MTN MoMo."""

    def __init__(self, bank_name='gcb'):
        self.bank_name = bank_name.lower() if bank_name else 'gcb'

    def extract(self, file_content):
        if isinstance(file_content, bytes):
            file_content = file_content.decode('utf-8')

        # Auto-detect format from headers
        first_line = file_content.split('\n')[0].lower()

        if 'transaction date' in first_line and 'trans. type' in first_line:
            return self._parse_momo(file_content)
        elif 'transaction date' in first_line or ('value date' in first_line and 'debit' in first_line):
            return self._parse_ecobank(file_content)
        elif 'ecobank' in self.bank_name:
            return self._parse_ecobank(file_content)
        elif 'momo' in self.bank_name or 'mtn' in self.bank_name:
            return self._parse_momo(file_content)
        else:
            return self._parse_gcb(file_content)

    # ── GCB Parser ──────────────────────────────────────────

    def _parse_gcb(self, file_content):
        reader = csv.DictReader(io.StringIO(file_content))
        transactions = []

        for row in reader:
            date_str = row.get('Date', '').strip()
            if not date_str or date_str.lower() == 'total':
                continue

            try:
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                continue

            debit = row.get('Debit', '').strip().replace(',', '')
            credit = row.get('Credit', '').strip().replace(',', '')

            if debit:
                amount = float(debit)
                tx_type = 'debit'
            elif credit:
                amount = float(credit)
                tx_type = 'credit'
            else:
                continue

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

    # ── Ecobank Parser ──────────────────────────────────────

    def _parse_ecobank(self, file_content):
        reader = csv.DictReader(io.StringIO(file_content))
        transactions = []

        # Normalize headers
        if reader.fieldnames:
            reader.fieldnames = [h.strip() for h in reader.fieldnames]

        for row in reader:
            # Try multiple possible column names
            date_str = (row.get('Transaction Date', '') or row.get('Trans Date', '') or row.get('Date', '')).strip()

            if not date_str:
                continue

            skip_words = ['transaction', 'date', 'opening balance', 'closing balance']
            if any(w in date_str.lower() for w in skip_words):
                continue

            # Parse date
            date = None
            for fmt in ['%d-%b-%Y', '%d-%B-%Y', '%d/%m/%Y', '%Y-%m-%d']:
                try:
                    date = datetime.strptime(date_str, fmt).date()
                    break
                except ValueError:
                    continue

            if not date:
                continue

            description = (row.get('Description', '') or row.get('Narration', '') or row.get('Remarks', '')).strip()

            debit_str = (row.get('Debit', '') or row.get('Debit Amount', '')).strip().replace(',', '')
            credit_str = (row.get('Credit', '') or row.get('Credit Amount', '')).strip().replace(',', '')
            balance_str = (row.get('Balance', '') or row.get('Running Balance', '')).strip().replace(',', '')

            try:
                debit_val = float(debit_str) if debit_str else 0
            except ValueError:
                debit_val = 0

            try:
                credit_val = float(credit_str) if credit_str else 0
            except ValueError:
                credit_val = 0

            if debit_val == 0 and credit_val == 0:
                continue

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

            transactions.append({
                'date': date,
                'description': description,
                'amount': amount,
                'type': tx_type,
                'balance_after': balance,
            })

        return transactions

    # ── MTN MoMo Parser ─────────────────────────────────────

    def _parse_momo(self, file_content):
        reader = csv.DictReader(io.StringIO(file_content))
        transactions = []

        if reader.fieldnames:
            reader.fieldnames = [h.strip() for h in reader.fieldnames]

        for row in reader:
            date_str = (row.get('TRANSACTION DATE', '') or row.get('Transaction Date', '') or row.get('Date', '')).strip()

            if not date_str:
                continue

            skip_words = ['transaction date', 'time run', 'msisdn', 'from:', 'mobile money']
            if any(w in date_str.lower() for w in skip_words):
                continue

            # Parse date
            date = None
            date_str = ' '.join(date_str.split())
            for fmt in ['%d-%b-%Y %I:%M:%S %p', '%d-%b-%Y %H:%M:%S %p', '%d-%b-%Y %I:%M:%S%p', '%d-%b-%Y']:
                try:
                    date = datetime.strptime(date_str, fmt).date()
                    break
                except ValueError:
                    continue

            if not date:
                date_match = re.match(r'(\d{2}-\w{3}-\d{4})', date_str)
                if date_match:
                    try:
                        date = datetime.strptime(date_match.group(1), '%d-%b-%Y').date()
                    except ValueError:
                        continue
                else:
                    continue

            amount_str = (row.get('AMOUNT', '') or row.get('Amount', '')).strip().replace(',', '')
            try:
                amount = float(amount_str)
            except ValueError:
                continue

            if amount == 0:
                continue

            # Determine type from balance change
            bal_before_str = (row.get('BAL BEFORE', '') or row.get('Bal Before', '')).strip().replace(',', '')
            bal_after_str = (row.get('BAL AFTER', '') or row.get('Bal After', '')).strip().replace(',', '')

            bal_after = None
            try:
                bal_before = float(bal_before_str) if bal_before_str else 0
                bal_after = float(bal_after_str) if bal_after_str else 0
                if bal_after > bal_before:
                    tx_type = 'credit'
                else:
                    tx_type = 'debit'
            except (ValueError, TypeError):
                trans_type = (row.get('TRANS. TYPE', '') or row.get('Trans Type', '')).strip().lower()
                if trans_type in ['cash_in', 'refund']:
                    tx_type = 'credit'
                else:
                    tx_type = 'debit'

            # Build description
            trans_type = (row.get('TRANS. TYPE', '') or row.get('Trans Type', '')).strip()
            from_name = (row.get('FROM NAME', '') or row.get('From Name', '')).strip()
            to_name = (row.get('TO NAME', '') or row.get('To Name', '')).strip()
            ova = (row.get('OVA', '') or '').strip()

            from_name = ' '.join(from_name.split())
            to_name = ' '.join(to_name.split())
            ova = ' '.join(ova.split())

            if tx_type == 'credit':
                description = trans_type + ' from ' + from_name
            else:
                desc_parts = [trans_type]
                if to_name:
                    desc_parts.append('to ' + to_name)
                if ova:
                    desc_parts.append(ova)
                description = ' '.join(desc_parts)

            description = ' '.join(description.split())
            if not description:
                description = trans_type or 'MoMo Transaction'

            transactions.append({
                'date': date,
                'description': description,
                'amount': amount,
                'type': tx_type,
                'balance_after': bal_after,
            })

        return transactions